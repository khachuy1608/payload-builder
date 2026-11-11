/**
 * Nhập nội dung đã xuất (scripts/export.ts) vào site hiện tại:
 *   npm run import -- ./backup
 * Ghi đè theo khoá tự nhiên: pages theo slug, my-blocks/themes/style-presets theo tên, redirects theo from, media theo filename.
 * Quan hệ (theme của trang, ảnh OG, avatar trong block…) được ánh xạ lại theo id mới.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const dir = path.resolve(process.argv[2] ?? './export')
const data = JSON.parse(readFileSync(path.join(dir, 'site.json'), 'utf8')) as Record<string, Record<string, unknown>[]> & { 'site-settings': Record<string, unknown> }
const payload = await getPayload({ config })
type Doc = Record<string, unknown>
const api = payload as unknown as {
  find: (a: Doc) => Promise<{ docs: Doc[] }>
  create: (a: Doc) => Promise<Doc>
  update: (a: Doc) => Promise<Doc>
  updateGlobal: (a: Doc) => Promise<Doc>
}
const idMap: Record<string, Record<string, unknown>> = { media: {}, themes: {}, 'my-blocks': {}, pages: {} }
const strip = (d: Doc) => {
  const { id, createdAt, updatedAt, ...rest } = d
  void id
  void createdAt
  void updatedAt
  return rest
}
const remapMedia = (v: unknown): unknown => (v && typeof v === 'object' && 'id' in (v as Doc) ? (idMap.media[String((v as Doc).id)] ?? null) : typeof v === 'number' || typeof v === 'string' ? (idMap.media[String(v)] ?? null) : v)

async function upsert(collection: string, where: Doc, doc: Doc): Promise<Doc> {
  const found = await api.find({ collection, where, limit: 1, depth: 0, overrideAccess: true })
  if (found.docs[0]) return api.update({ collection, id: found.docs[0].id, data: doc, depth: 0, overrideAccess: true })
  return api.create({ collection, data: doc, depth: 0, overrideAccess: true })
}

// 1. media (file + metadata)
for (const m of data.media ?? []) {
  const filename = String(m.filename ?? '')
  const file = path.join(dir, 'media', filename)
  const found = await api.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0, overrideAccess: true })
  let doc = found.docs[0]
  if (!doc && existsSync(file)) doc = await api.create({ collection: 'media', data: { alt: m.alt ?? '' }, filePath: file, depth: 0, overrideAccess: true })
  if (doc) idMap.media[String(m.id)] = doc.id
}
// 2. themes
for (const t of data.themes ?? []) {
  const doc = await upsert('themes', { name: { equals: t.name } }, strip(t))
  idMap.themes[String(t.id)] = doc.id
}
// 3. my-blocks (ảnh trong tree giữ url cũ – media đã copy cùng tên nên url vẫn đúng)
for (const b of data['my-blocks'] ?? []) {
  const { owner, thumbnail, ...rest } = strip(b)
  void owner
  const doc = await upsert('my-blocks', { name: { equals: b.name } }, { ...rest, thumbnail: remapMedia(thumbnail) })
  idMap['my-blocks'][String(b.id)] = doc.id
}
// 4. style-presets, redirects
for (const p of data['style-presets'] ?? []) {
  const { owner, ...rest } = strip(p)
  void owner
  await upsert('style-presets', { and: [{ name: { equals: p.name } }, { blockType: { equals: p.blockType } }] }, rest)
}
for (const r of data.redirects ?? []) await upsert('redirects', { from: { equals: r.from } }, strip(r))
// 5. pages (ánh xạ theme, ảnh OG, blockRef id)
const blockIdText = JSON.stringify(idMap['my-blocks'])
for (const p of data.pages ?? []) {
  const rest = strip(p) as Doc
  const seo = (rest.seo as Doc | undefined) ?? {}
  let content = JSON.stringify(rest.content ?? null)
  for (const [oldId, newId] of Object.entries(idMap['my-blocks'])) content = content.split(`"blockId":"${oldId}"`).join(`"blockId":"${String(newId)}"`)
  void blockIdText
  const status = p._status === 'published' ? 'published' : 'draft'
  await upsert('pages', { slug: { equals: p.slug } }, { ...rest, content: JSON.parse(content), theme: rest.theme ? (idMap.themes[String(typeof rest.theme === 'object' ? (rest.theme as Doc).id : rest.theme)] ?? null) : null, seo: { ...seo, ogImage: remapMedia(seo.ogImage) }, _status: status })
}
// 6. site-settings
const ss = data['site-settings'] ?? {}
await api.updateGlobal({
  slug: 'site-settings',
  data: {
    siteName: ss.siteName, siteDescription: ss.siteDescription, maintenance: ss.maintenance, maintenanceMessage: ss.maintenanceMessage, notifyEmail: ss.notifyEmail,
    logo: remapMedia(ss.logo), favicon: remapMedia(ss.favicon), defaultOgImage: remapMedia(ss.defaultOgImage),
    theme: ss.theme ? (idMap.themes[String(typeof ss.theme === 'object' ? (ss.theme as Doc).id : ss.theme)] ?? null) : null,
  },
  overrideAccess: true,
})
console.log(`Đã nhập từ ${dir}: ${(data.pages ?? []).length} trang, ${(data['my-blocks'] ?? []).length} block, ${(data.themes ?? []).length} theme, ${Object.keys(idMap.media).length} media.`)
process.exit(0)
