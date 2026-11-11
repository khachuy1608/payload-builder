import type { CollectionConfig, Field, Payload } from 'payload'
import { buildWhere, collectDataNodes, type DataMap, type DataRecord, type DataSource, pageFromParams, type SourceInfo, type UrlParams } from '../builder/data'
import type { BuilderNode } from '../builder/types'
import { DEFAULT_LOCALE } from './locale'
import { lexicalToHtml } from './richtext'

/** Giới hạn tối đa của ?take= (tải thêm) */
export const MAX_TAKE = 100
/** Nguồn ảo: tìm kiếm toàn site */
export const SEARCH_SOURCE = 'search'
export const SEARCH_FIELDS: SourceInfo['fields'] = [
  { name: 'id', label: 'ID', type: 'text' },
  { name: 'title', label: 'Tiêu đề', type: 'text' },
  { name: 'excerpt', label: 'Tóm tắt', type: 'textarea' },
  { name: 'image', label: 'Ảnh', type: 'upload' },
  { name: 'href', label: 'Đường dẫn', type: 'text' },
  { name: 'collection', label: 'Collection', type: 'text' },
  { name: 'collectionLabel', label: 'Loại', type: 'text' },
]

/**
 * Cấu hình "nguồn dữ liệu" của một collection, khai báo trong `custom.builder` của CollectionConfig:
 *   custom: { builder: { label: 'Thành viên', expose: ['name', 'title', 'avatar'] } }
 * `expose` = các trường được phép đưa ra trang công khai (không bao giờ lộ email, mật khẩu…).
 * Thêm collection mới cho web khác chỉ cần thêm khai báo này.
 */
export interface BuilderSourceConfig {
  label?: string
  expose: string[]
  /** Độ sâu populate quan hệ/upload (mặc định 1) */
  depth?: number
  /** Tham gia tìm kiếm toàn site (nguồn ảo `search`): trường tiêu đề/tóm tắt/ảnh và các trường để tìm */
  search?: { title: string; excerpt?: string; image?: string; fields: string[] }
  /** Trường quan hệ tới người đăng nhập (users/customers) – nguồn có `ownerOnly` chỉ trả bản ghi của người đó */
  ownerField?: string
}

/** Các trường của media được đưa ra trang công khai */
const MEDIA_FIELDS = ['id', 'url', 'alt', 'width', 'height', 'mimeType', 'filename', 'sizes']

export function sourceConfigOf(payload: Payload, slug: string): BuilderSourceConfig | null {
  const col = payload.config.collections.find((c) => c.slug === slug)
  return col ? sourceConfig(col) : null
}

/**
 * Chiếu một doc ra bản ghi công khai theo `expose` của collection:
 * - quan hệ đã populate -> chiếu đệ quy theo expose của collection đích (collection không khai báo builder chỉ còn id/title/name/slug)
 * - upload -> các trường media; richText (Lexical) -> HTML đã làm sạch
 */
export function projectDoc(payload: Payload, slug: string, doc: Record<string, unknown>, depth = 2): DataRecord {
  const col = payload.config.collections.find((c) => c.slug === slug)
  const cfg = col ? sourceConfig(col) : null
  const expose = cfg?.expose ?? ['title', 'name', 'slug']
  const out: DataRecord = { id: doc.id }
  const fieldOf = (name: string): Field | undefined => col?.fields.find((f) => 'name' in f && f.name === name)
  const project = (field: Field | undefined, value: unknown): unknown => {
    if (value == null) return value
    if (field && field.type === 'richText') return lexicalToHtml(value)
    if (field && field.type === 'upload') {
      const pick = (v: unknown) => (v && typeof v === 'object' ? Object.fromEntries(MEDIA_FIELDS.filter((k) => k in (v as object)).map((k) => [k, (v as Record<string, unknown>)[k]])) : v)
      return Array.isArray(value) ? value.map(pick) : pick(value)
    }
    if (field && field.type === 'relationship') {
      const rel = Array.isArray(field.relationTo) ? null : field.relationTo
      const one = (v: unknown) => {
        if (!v || typeof v !== 'object') return v
        const r = v as Record<string, unknown>
        // quan hệ đa collection: { relationTo, value }
        if ('relationTo' in r && 'value' in r) return typeof r.value === 'object' && r.value ? projectDoc(payload, String(r.relationTo), r.value as Record<string, unknown>, depth - 1) : r.value
        return rel && depth > 0 ? projectDoc(payload, rel, r, depth - 1) : r.id
      }
      return Array.isArray(value) ? value.map(one) : one(value)
    }
    if (field && field.type === 'array' && Array.isArray(value) && 'fields' in field) {
      return value.map((row) => {
        if (!row || typeof row !== 'object') return row
        const o: Record<string, unknown> = {}
        for (const f of field.fields) if ('name' in f && f.name && f.name in (row as object)) o[f.name] = project(f, (row as Record<string, unknown>)[f.name])
        return o
      })
    }
    if (field && field.type === 'group' && value && typeof value === 'object' && 'fields' in field) {
      const o: Record<string, unknown> = {}
      for (const f of field.fields) if ('name' in f && f.name && f.name in (value as object)) o[f.name] = project(f, (value as Record<string, unknown>)[f.name])
      return o
    }
    return value
  }
  for (const key of expose) if (key in doc) out[key] = project(fieldOf(key), doc[key])
  return out
}

function sourceConfig(config: CollectionConfig): BuilderSourceConfig | null {
  const c = (config.custom as { builder?: BuilderSourceConfig } | undefined)?.builder
  return c && Array.isArray(c.expose) && c.expose.length ? c : null
}

function fieldInfo(field: Field, expose: string[] | null): SourceInfo['fields'][number] | null {
  if (!('name' in field) || !field.name) return null
  if (expose && !expose.includes(field.name)) return null
  const label = typeof field.label === 'string' ? field.label : field.name
  if (field.type === 'group' && 'fields' in field)
    return { name: field.name, label, type: 'group', fields: field.fields.map((f) => fieldInfo(f, null)).filter((f): f is NonNullable<typeof f> => !!f) }
  return { name: field.name, label, type: field.type }
}

/** Danh sách nguồn dữ liệu và trường công khai – cho bộ chọn ⚡ trong editor */
export function getSources(payload: Payload): SourceInfo[] {
  const out: SourceInfo[] = []
  for (const col of payload.config.collections) {
    const cfg = sourceConfig(col)
    if (!cfg) continue
    const fields = col.fields.map((f) => fieldInfo(f, cfg.expose)).filter((f): f is NonNullable<typeof f> => !!f)
    out.push({ slug: col.slug, label: cfg.label ?? (typeof col.labels?.plural === 'string' ? col.labels.plural : col.slug), fields: [{ name: 'id', label: 'ID', type: 'text' }, ...fields], ownerField: cfg.ownerField })
  }
  if (out.some((s) => payload.config.collections.find((c) => c.slug === s.slug && sourceConfig(c)?.search))) out.push({ slug: SEARCH_SOURCE, label: 'Tìm kiếm toàn site (?q=)', fields: SEARCH_FIELDS })
  return out
}

/** Trang mẫu động phục vụ từng collection: slug trang + trường khớp URL (để sinh href cho kết quả tìm kiếm) */
async function templatePages(payload: Payload): Promise<Map<string, { slug: string; field: string }>> {
  const res = await payload.find({ collection: 'pages', where: { and: [{ templateCollection: { exists: true } }, { _status: { equals: 'published' } }] }, limit: 100, depth: 0, pagination: false, overrideAccess: true }).catch(() => ({ docs: [] as { slug: string; templateCollection?: string | null; templateField?: string | null }[] }))
  const map = new Map<string, { slug: string; field: string }>()
  for (const d of res.docs as { slug: string; templateCollection?: string | null; templateField?: string | null }[]) if (d.templateCollection && !map.has(d.templateCollection)) map.set(d.templateCollection, { slug: d.slug, field: d.templateField || 'id' })
  return map
}

const getPath = (o: unknown, path: string): unknown => path.split('.').reduce<unknown>((cur, k) => (cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[k] : undefined), o)

/** Tìm kiếm toàn site trên các collection có `custom.builder.search` */
export async function siteSearch(payload: Payload, q: string, limit = 20, locale?: string): Promise<{ records: DataRecord[]; total: number }> {
  const query = q.trim().slice(0, 100)
  if (!query) return { records: [], total: 0 }
  const pages = await templatePages(payload)
  const records: DataRecord[] = []
  let total = 0
  const find = payload.find as unknown as (args: Record<string, unknown>) => Promise<{ docs: Record<string, unknown>[]; totalDocs: number }>
  for (const col of payload.config.collections) {
    const cfg = sourceConfig(col)
    if (!cfg?.search) continue
    const where: Record<string, unknown> = { or: cfg.search.fields.map((f) => ({ [f]: { like: query } })) }
    if (col.fields.some((f) => 'name' in f && f.name === 'published')) where.and = [{ published: { equals: true } }]
    const res = await find({ collection: col.slug, where, limit, depth: 1, overrideAccess: true, ...(locale ? { locale, fallbackLocale: DEFAULT_LOCALE } : {}) }).catch(() => ({ docs: [], totalDocs: 0 }))
    total += res.totalDocs
    const page = pages.get(col.slug)
    for (const doc of res.docs) {
      const projected = projectDoc(payload, col.slug, doc)
      const key = page ? String(doc[page.field] ?? doc.id) : ''
      records.push({
        id: `${col.slug}-${doc.id}`,
        title: String(getPath(doc, cfg.search.title) ?? ''),
        excerpt: cfg.search.excerpt ? String(getPath(projected, cfg.search.excerpt) ?? getPath(doc, cfg.search.excerpt) ?? '').replace(/<[^>]+>/g, '').slice(0, 200) : '',
        image: cfg.search.image ? getPath(projected, cfg.search.image) ?? null : null,
        href: page ? `/${page.slug}/${encodeURIComponent(key)}` : '',
        collection: col.slug,
        collectionLabel: cfg.label ?? col.slug,
      })
    }
  }
  return { records: records.slice(0, limit), total }
}

export interface LoadDataOptions {
  /** Người đang đăng nhập (users hoặc customers) – cho nguồn `ownerOnly` */
  user?: { id: string | number; collection?: string } | null
  /** Chỉ nạp nguồn ownerOnly (render theo người dùng) */
  onlyOwned?: boolean
  /** Bỏ qua nguồn ownerOnly (phần cache dùng chung) */
  skipOwned?: boolean
  locale?: string
}

/** Nguồn chỉ trả bản ghi của người đăng nhập? */
export function isOwnedSource(source: DataSource, cfg: BuilderSourceConfig | null | undefined): boolean {
  return !!(source.ownerOnly && cfg?.ownerField)
}

/** Số bản ghi hiệu lực: ?take= (tải thêm) ghi đè limit của nguồn, tối đa MAX_TAKE */
export function effectiveLimit(source: DataSource, params: UrlParams | undefined): number {
  if (source.mode === 'one') return 1
  const base = source.limit ?? 12
  const take = source.urlParams ? parseInt(params?.take ?? '', 10) : NaN
  return Number.isFinite(take) && take > base ? Math.min(take, MAX_TAKE) : base
}

/** Nạp dữ liệu cho mọi node có nguồn trong cây (gọi sau resolveRefs). Chỉ trả về trường được expose. */
export async function loadDataForTree(payload: Payload, root: BuilderNode, params: UrlParams = {}, opts: LoadDataOptions = {}): Promise<DataMap> {
  const nodes = collectDataNodes(root)
  const map: DataMap = {}
  const configs = new Map<string, BuilderSourceConfig | null>(payload.config.collections.map((c) => [c.slug as string, sourceConfig(c)]))
  await Promise.all(
    nodes.map(async ({ id, source }) => {
      if (source.collection === SEARCH_SOURCE) {
        if (opts.onlyOwned) return
        const limit = effectiveLimit(source, params)
        const r = await siteSearch(payload, source.urlParams ? (params.q ?? '') : '', limit, opts.locale)
        map[id] = { records: r.records, total: r.total, page: 1, totalPages: 1, limit }
        return
      }
      const cfg = configs.get(source.collection)
      if (!cfg) return
      const owned = isOwnedSource(source, cfg)
      if ((opts.onlyOwned && !owned) || (opts.skipOwned && owned)) return
      if (owned && !opts.user) {
        map[id] = { records: [], total: 0, page: 1, totalPages: 1, limit: 1 }
        return
      }
      try {
        const find = payload.find as unknown as (args: Record<string, unknown>) => Promise<{ docs: Record<string, unknown>[]; totalDocs: number; page?: number; totalPages?: number }>
        const limit = effectiveLimit(source, params)
        const page = source.urlParams ? pageFromParams(params) : 1
        const where = buildWhere(source, source.urlParams ? params : undefined, cfg.expose) ?? { and: [] }
        if (owned && opts.user) (where as { and: Record<string, unknown>[] }).and = [...((where as { and?: Record<string, unknown>[] }).and ?? []), { [cfg.ownerField!]: { equals: opts.user.id } }]
        const res = await find({
          collection: source.collection,
          where: (where as { and: unknown[] }).and?.length ? where : undefined,
          sort: source.sort,
          limit,
          page,
          depth: cfg.depth ?? 1,
          overrideAccess: true,
          ...(opts.locale ? { locale: opts.locale, fallbackLocale: DEFAULT_LOCALE } : {}),
        })
        map[id] = { records: res.docs.map((d) => projectDoc(payload, source.collection, d)), total: res.totalDocs, page: res.page ?? page, totalPages: Math.max(1, res.totalPages ?? 1), limit }
      } catch (err) {
        payload.logger.warn({ err, collection: source.collection }, 'Không nạp được nguồn dữ liệu cho builder')
        map[id] = { records: [], total: 0, page: 1, totalPages: 1, limit: 1 }
      }
    }),
  )
  return map
}

/** Cây có nguồn chỉ của người đăng nhập không (để render phần đó ngoài cache) */
export function hasOwnedSources(payload: Payload, root: BuilderNode): boolean {
  return collectDataNodes(root).some(({ source }) => isOwnedSource(source, sourceConfigOf(payload, source.collection)))
}

export type { DataRecord }
