/**
 * Xuất toàn bộ nội dung site ra một thư mục để nhân bản sang site khác (repo gốc):
 *   npm run export -- ./backup
 * Gồm: pages, my-blocks, themes, style-presets, redirects, site-settings, media (metadata + file).
 */
import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const out = path.resolve(process.argv[2] ?? './export')
mkdirSync(path.join(out, 'media'), { recursive: true })
const payload = await getPayload({ config })
const all = async (collection: string) => (await (payload.find as unknown as (a: Record<string, unknown>) => Promise<{ docs: Record<string, unknown>[] }>)({ collection, limit: 10000, depth: 0, pagination: false, overrideAccess: true, draft: collection === 'pages' })).docs
const data: Record<string, unknown> = {
  exportedAt: new Date().toISOString(),
  pages: await all('pages'),
  'my-blocks': await all('my-blocks'),
  themes: await all('themes'),
  'style-presets': await all('style-presets'),
  redirects: await all('redirects'),
  media: await all('media'),
  'site-settings': await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }),
}
let copied = 0
for (const m of data.media as { filename?: string }[]) {
  if (!m.filename) continue
  const src = path.join(process.cwd(), 'media', m.filename)
  if (existsSync(src)) {
    copyFileSync(src, path.join(out, 'media', m.filename))
    copied++
  }
}
writeFileSync(path.join(out, 'site.json'), JSON.stringify(data, null, 2))
console.log(`Đã xuất ra ${out}: ${(data.pages as unknown[]).length} trang, ${(data['my-blocks'] as unknown[]).length} block, ${(data.themes as unknown[]).length} theme, ${copied} file media.`)
process.exit(0)
