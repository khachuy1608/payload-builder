/**
 * Ràng buộc dữ liệu (data binding) – thuần dữ liệu, dùng chung cho server, front-end và editor.
 *
 * - Một block chứa có thể khai báo NGUỒN DỮ LIỆU trong `props.data` (collection, danh sách/một bản ghi, lọc, sắp xếp, giới hạn).
 * - Giá trị chữ/link/ảnh của block con có thể chứa `{{duong.dan.truong}}` – được thay bằng dữ liệu của bản ghi đang áp dụng.
 * - Block `dataList` lặp phần tử mẫu (các con) cho từng bản ghi; `{{index}}`, `{{count}}` có sẵn.
 * - `resolveData()` chạy sau `resolveRefs()`: thay node tĩnh bằng node đã gắn dữ liệu. Bản sao thứ 2 trở đi nhận cờ
 *   `linked: 'inner'` nên trong editor chỉ phần tử mẫu (bản đầu) chọn/sửa được.
 */
import type { BuilderNode } from './types'

export type DataMode = 'list' | 'one'
export type FilterOp = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'in'

export interface DataFilter {
  field: string
  op: FilterOp
  value: string
}

export interface DataSource {
  collection: string
  mode: DataMode
  /** Số bản ghi (list) */
  limit?: number
  /** Trường sắp xếp, tiền tố '-' = giảm dần */
  sort?: string
  filters?: DataFilter[]
  /** mode = one: id hoặc giá trị của trường `byField` */
  byField?: string
  byValue?: string
  /** Nhận tham số URL: ?page=N, ?q=... (tìm trên searchFields), ?<trường>=<giá trị> (bằng) */
  urlParams?: boolean
  searchFields?: string[]
}

/** Bản ghi đã lọc trường công khai */
export type DataRecord = Record<string, unknown>
/** Kết quả nạp cho một node có nguồn (kèm phân trang) */
export interface DataResult {
  records: DataRecord[]
  total: number
  page: number
  totalPages: number
  limit: number
}
/** Kết quả theo id node có nguồn dữ liệu */
export type DataMap = Record<string, DataResult>
export type DataLookup = (nodeId: string) => DataResult | undefined
/** Tham số URL (chỉ chuỗi) của request hiện tại */
export type UrlParams = Record<string, string>

export const dataResult = (records: DataRecord[], page = 1, total = records.length, limit = records.length || 1): DataResult => ({ records, page, total, limit, totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))) })

/** Giữ lại tham số URL hợp lệ (tên chữ/số, giá trị <= 200 ký tự) */
export function normalizeParams(input: Record<string, string | string[] | undefined> | undefined): UrlParams {
  const out: UrlParams = {}
  for (const [k, v] of Object.entries(input ?? {})) {
    const value = Array.isArray(v) ? v[0] : v
    if (/^[A-Za-z_][A-Za-z0-9_.-]{0,40}$/.test(k) && typeof value === 'string' && value.length <= 200) out[k] = value
  }
  return out
}

/** Số trang từ ?page= */
export function pageFromParams(params: UrlParams | undefined): number {
  const n = parseInt(params?.page ?? '1', 10)
  return isFinite(n) && n > 0 ? Math.min(n, 10000) : 1
}

/** Link giữ nguyên tham số hiện tại (bỏ ?page), thay/bỏ một tham số */
export function withParam(params: UrlParams | undefined, key: string, value: string | null): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) if (k !== key && k !== 'page') q.set(k, v)
  if (value !== null && value !== '') q.set(key, value)
  const str = q.toString()
  return str ? `?${str}` : '?'
}

/** Mẫu link phân trang giữ tham số hiện tại: "?q=x&page={n}" ({n} không bị mã hoá) */
export function pageHrefPattern(params: UrlParams | undefined): string {
  const base = withParam(params, 'page', null)
  return base === '?' ? '?page={n}' : `${base}&page={n}`
}

export const DATA_LIST_TYPE = 'dataList'

/** Điều kiện hiển thị (props.show) – đánh giá lúc render với bản ghi bao quanh và người đang đăng nhập */
export type ShowOp = 'exists' | 'not_exists' | 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
export interface ShowCondition {
  /** any = mọi người, user = chỉ đã đăng nhập, guest = chỉ khách */
  auth?: 'any' | 'user' | 'guest'
  /** đường dẫn trường (vd title, avatar, user.name) */
  field?: string
  op?: ShowOp
  value?: string
}
export const SHOW_OPS: { value: ShowOp; label: string }[] = [
  { value: 'exists', label: 'có giá trị' },
  { value: 'not_exists', label: 'trống' },
  { value: 'equals', label: 'bằng' },
  { value: 'not_equals', label: 'khác' },
  { value: 'contains', label: 'chứa' },
  { value: 'greater_than', label: 'lớn hơn' },
  { value: 'less_than', label: 'nhỏ hơn' },
]

export function normalizeShow(input: unknown): ShowCondition | undefined {
  if (!input || typeof input !== 'object') return undefined
  const src = input as Record<string, unknown>
  const out: ShowCondition = {}
  if (src.auth === 'user' || src.auth === 'guest') out.auth = src.auth
  if (typeof src.field === 'string' && /^[A-Za-z_][A-Za-z0-9_.-]{0,80}$/.test(src.field)) {
    out.field = src.field
    out.op = SHOW_OPS.some((o) => o.value === src.op) ? (src.op as ShowOp) : 'exists'
    if (typeof src.value === 'string' && src.value !== '') out.value = src.value.slice(0, 300)
  }
  return Object.keys(out).length ? out : undefined
}

function isEmpty(v: unknown): boolean {
  return v == null || v === '' || v === false || (Array.isArray(v) && v.length === 0)
}

/** Node có được hiển thị không, với bản ghi bao quanh (có thể rỗng), các giá trị phụ (user, index…) */
export function shouldShow(show: ShowCondition | undefined, record: DataRecord, extra: Record<string, unknown>): boolean {
  if (!show) return true
  const user = extra.user
  if (show.auth === 'user' && !user) return false
  if (show.auth === 'guest' && user) return false
  if (!show.field) return true
  const first = show.field.split('.')[0]
  const v = first in extra ? getPath(extra, show.field) : getPath(record, show.field)
  const str = toText(v)
  const want = show.value ?? ''
  switch (show.op ?? 'exists') {
    case 'exists':
      return !isEmpty(v)
    case 'not_exists':
      return isEmpty(v)
    case 'equals':
      return str === want || (typeof v === 'boolean' && String(v) === want)
    case 'not_equals':
      return str !== want
    case 'contains':
      return str.toLowerCase().includes(want.toLowerCase())
    case 'greater_than':
      return Number(str) > Number(want)
    case 'less_than':
      return Number(str) < Number(want)
  }
  return true
}

export function showOf(node: BuilderNode): ShowCondition | undefined {
  return normalizeShow((node.props as { show?: unknown }).show)
}
export const FIELD_PATTERN = /^[A-Za-z_][A-Za-z0-9_.-]{0,80}$/
export const FILTER_OPS: { value: FilterOp; label: string }[] = [
  { value: 'equals', label: 'bằng' },
  { value: 'not_equals', label: 'khác' },
  { value: 'contains', label: 'chứa' },
  { value: 'greater_than', label: 'lớn hơn' },
  { value: 'less_than', label: 'nhỏ hơn' },
  { value: 'exists', label: 'có giá trị' },
  { value: 'in', label: 'thuộc (a,b,c)' },
]

const SLUG_PATTERN = /^[a-z0-9-]{1,60}$/

/** Làm sạch khai báo nguồn dữ liệu; undefined nếu không hợp lệ */
export function normalizeDataSource(input: unknown): DataSource | undefined {
  if (!input || typeof input !== 'object') return undefined
  const src = input as Record<string, unknown>
  const collection = typeof src.collection === 'string' ? src.collection.trim() : ''
  if (!SLUG_PATTERN.test(collection)) return undefined
  const out: DataSource = { collection, mode: src.mode === 'one' ? 'one' : 'list' }
  if (typeof src.limit === 'number' && isFinite(src.limit)) out.limit = Math.max(1, Math.min(100, Math.round(src.limit)))
  if (typeof src.sort === 'string' && /^-?[A-Za-z_][A-Za-z0-9_.]{0,60}$/.test(src.sort)) out.sort = src.sort
  if (Array.isArray(src.filters)) {
    const filters = src.filters
      .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
      .map((f) => ({ field: String(f.field ?? ''), op: String(f.op ?? 'equals') as FilterOp, value: String(f.value ?? '').slice(0, 300) }))
      .filter((f) => FIELD_PATTERN.test(f.field) && FILTER_OPS.some((o) => o.value === f.op))
      .slice(0, 10)
    if (filters.length) out.filters = filters
  }
  if (typeof src.byField === 'string' && FIELD_PATTERN.test(src.byField)) out.byField = src.byField
  if (typeof src.byValue === 'string' && src.byValue.trim()) out.byValue = src.byValue.trim().slice(0, 300)
  if (src.urlParams === true) out.urlParams = true
  if (Array.isArray(src.searchFields)) {
    const fields = src.searchFields.filter((f): f is string => typeof f === 'string' && FIELD_PATTERN.test(f)).slice(0, 10)
    if (fields.length) out.searchFields = fields
  }
  return out
}

/**
 * Điều kiện `where` của Payload từ nguồn dữ liệu, cộng tham số URL khi `urlParams` bật:
 * ?q= tìm (like) trên searchFields, ?<trường>=<giá trị> bằng (chỉ trường trong `allowedFields` nếu có).
 */
export function buildWhere(source: DataSource, params?: UrlParams, allowedFields?: string[]): Record<string, unknown> | undefined {
  const and: Record<string, unknown>[] = []
  for (const f of source.filters ?? []) {
    if (f.op === 'exists') and.push({ [f.field]: { exists: f.value !== 'false' && f.value !== '0' } })
    else if (f.op === 'in') and.push({ [f.field]: { in: f.value.split(',').map((v) => v.trim()).filter(Boolean) } })
    else and.push({ [f.field]: { [f.op]: f.value } })
  }
  if (source.mode === 'one' && source.byValue) and.push({ [source.byField || 'id']: { equals: source.byValue } })
  if (source.urlParams && params) {
    const q = (params.q ?? '').trim()
    if (q && source.searchFields?.length) and.push({ or: source.searchFields.map((f) => ({ [f]: { like: q } })) })
    for (const [k, v] of Object.entries(params)) {
      if (k === 'q' || k === 'page' || !v || !FIELD_PATTERN.test(k)) continue
      if (allowedFields && !allowedFields.includes(k.split('.')[0])) continue
      and.push({ [k]: { equals: v } })
    }
  }
  return and.length ? { and } : undefined
}

/** Nguồn dữ liệu của node (nếu có) */
export function dataSourceOf(node: BuilderNode): DataSource | undefined {
  return normalizeDataSource((node.props as { data?: unknown }).data)
}

/** Các node có nguồn dữ liệu trong cây (kể cả lồng nhau) */
export function collectDataNodes(root: BuilderNode, into: { id: string; source: DataSource }[] = []): { id: string; source: DataSource }[] {
  const source = dataSourceOf(root)
  if (source) into.push({ id: root.id, source })
  for (const child of root.children ?? []) collectDataNodes(child, into)
  return into
}

/** Giữ lại các trường được phép (expose) của một doc; luôn có id */
export function projectRecord(doc: Record<string, unknown>, expose: string[]): DataRecord {
  const out: DataRecord = { id: doc.id }
  for (const key of expose) if (key in doc) out[key] = doc[key]
  return out
}

/** Đọc `a.b.c` trong bản ghi */
export function getPath(record: unknown, path: string): unknown {
  let cur: unknown = record
  for (const part of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

const TEMPLATE = /\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}/g

export function hasBinding(value: unknown): boolean {
  return typeof value === 'string' && TEMPLATE.test(value) && ((TEMPLATE.lastIndex = 0), true)
}

function toText(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(', ')
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    // upload/relationship: ưu tiên tên hiển thị
    for (const k of ['title', 'name', 'label', 'filename', 'alt', 'url', 'id']) if (typeof o[k] === 'string' || typeof o[k] === 'number') return String(o[k])
  }
  return ''
}

/** Thay `{{...}}` trong chuỗi bằng dữ liệu; ngữ cảnh có thêm index (1-based) và count */
export function bindString(template: string, record: DataRecord, extra: Record<string, unknown> = {}): string {
  return template.replace(TEMPLATE, (_, path: string) => {
    const first = path.split('.')[0]
    if (first in extra) return toText(getPath(extra, path))
    return toText(getPath(record, path))
  })
}

/** Chuỗi/props có dùng {{user...}} không (để bind cả ngoài nguồn dữ liệu) */
export function usesUser(value: unknown): boolean {
  return typeof value === 'string' ? /\{\{\s*user(\.|\s*\}\})/.test(value) : Array.isArray(value) ? value.some(usesUser) : !!value && typeof value === 'object' ? Object.values(value as Record<string, unknown>).some(usesUser) : false
}

/** Giá trị prop sau khi gắn dữ liệu: chuỗi được thay thế; prop media dạng "{{truong}}" trỏ tới object upload sẽ thành MediaValue */
function bindValue(value: unknown, record: DataRecord, extra: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    const m = value.match(/^\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}$/)
    if (m) {
      const raw = m[1].split('.')[0] in extra ? getPath(extra, m[1]) : getPath(record, m[1])
      if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as { url?: unknown }).url === 'string') {
        const u = raw as Record<string, unknown>
        return { id: u.id, url: u.url, alt: u.alt ?? '', width: u.width, height: u.height, mimeType: u.mimeType, ...(u.sizes ? { sizes: u.sizes } : {}) }
      }
    }
    return bindString(value, record, extra)
  }
  if (Array.isArray(value)) return value.map((v) => bindValue(v, record, extra))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = k === 'data' || k === 'fx' || k === 'show' ? v : bindValue(v, record, extra)
    return out
  }
  return value
}

/** Gắn một bản ghi vào cây con: props chứa {{...}} được thay; id giữ nguyên (bản mẫu) hoặc thêm hậu tố */
export function bindSubtree(node: BuilderNode, record: DataRecord, extra: Record<string, unknown>, suffix: string, inner: boolean, keepHidden = false): BuilderNode {
  // điều kiện hiển thị đã được đánh giá ở cha (applyShow) -> bỏ `show` để các lượt duyệt sau không đánh giá lại với ngữ cảnh rỗng
  const { show: _show, ...rest } = node.props
  void _show
  const out: BuilderNode = {
    id: suffix ? `${node.id}${suffix}` : node.id,
    type: node.type,
    props: bindValue(rest, record, extra) as Record<string, unknown>,
    styles: node.styles,
    ...(node.children ? { children: applyShow(node.children, record, extra, keepHidden).map((c) => bindSubtree(c, record, extra, suffix, inner, keepHidden)) } : {}),
  }
  if (inner) out.linked = 'inner'
  else if (node.linked) out.linked = node.linked
  return out
}

/** Lọc (live) hoặc đánh dấu (editor: props.condHidden) các con bị điều kiện hiển thị ẩn */
function applyShow(children: BuilderNode[], record: DataRecord, extra: Record<string, unknown>, keepHidden: boolean): BuilderNode[] {
  const out: BuilderNode[] = []
  for (const c of children) {
    const show = showOf(c)
    if (!show || shouldShow(show, record, extra)) out.push(c)
    else if (keepHidden) out.push({ ...c, props: { ...c.props, condHidden: true } })
  }
  return out
}

export interface ResolveContext {
  params?: UrlParams
  /** Người đang đăng nhập (đã lọc trường công khai) hoặc null */
  user?: DataRecord | null
  /** editor: giữ phần tử bị điều kiện ẩn (đánh dấu) thay vì bỏ */
  keepHidden?: boolean
}

/**
 * Áp dụng dữ liệu cho toàn cây. `lookup(nodeId)` trả về kết quả đã nạp cho node có nguồn.
 * - dataList: lặp các con cho từng bản ghi (bản đầu giữ id gốc để editor chọn được).
 * - block chứa khác có nguồn: gắn bản ghi đầu tiên vào cây con.
 * - Pagination `auto`, Ô tìm kiếm, Toggle Group có `param`: nhận trạng thái từ nguồn chính (nguồn đầu tiên bật urlParams) và URL.
 * Nhánh không có nguồn dữ liệu được trả về đúng object cũ (structural sharing).
 */
export function resolveData(root: BuilderNode, lookup: DataLookup, ctx: ResolveContext = {}): BuilderNode {
  const params = ctx.params ?? {}
  const user = ctx.user ?? null
  const keepHidden = !!ctx.keepHidden
  const base = { user }
  const primaryId = collectDataNodes(root).find((n) => n.source.urlParams)?.id
  const primary = primaryId ? lookup(primaryId) : undefined
  // nguồn nằm trong bản sao của danh sách (id có hậu tố _n) dùng chung dữ liệu với bản mẫu
  const find = (id: string): DataResult | undefined => lookup(id) ?? (/_\d+$/.test(id) ? find(id.replace(/_\d+$/, '')) : undefined)
  const visit = (node: BuilderNode): BuilderNode => {
    const source = dataSourceOf(node)
    if (source) {
      const result = find(node.id)
      const records = result?.records ?? []
      const pageExtra = { ...base, total: result?.total ?? records.length, page: result?.page ?? 1, totalPages: result?.totalPages ?? 1 }
      if (node.type === DATA_LIST_TYPE) {
        const template = node.children ?? []
        const children: BuilderNode[] = []
        records.forEach((rec, i) => {
          const extra = { index: i + 1, count: records.length, ...pageExtra }
          for (const child of applyShow(template, rec, extra, keepHidden)) children.push(bindSubtree(child, rec, extra, i === 0 ? '' : `_${i}`, i > 0, keepHidden))
        })
        return { ...node, children: children.map(visit) }
      }
      const rec = records[0]
      if (!rec) return visitChildren(node)
      const bound = bindSubtree(node, rec, { index: 1, count: records.length, ...pageExtra }, '', false, keepHidden)
      return visitChildren(bound)
    }
    // ngoài nguồn dữ liệu: vẫn bind {{user.*}}
    if (usesUser(node.props)) return visitChildren({ ...node, props: bindValue(node.props, {}, base) as Record<string, unknown> })
    // block điều khiển theo URL
    if (node.type === 'pagination' && node.props.auto === true) {
      return { ...node, props: { ...node.props, pages: String(primary?.totalPages ?? 1), current: String(primary?.page ?? pageFromParams(params)), hrefPattern: pageHrefPattern(params) } }
    }
    if (node.type === 'searchBox') return { ...node, props: { ...node.props, value: params.q ?? '', total: primary ? String(primary.total) : '' } }
    if (node.type === 'toggleGroup' && typeof node.props.param === 'string' && node.props.param) {
      const key = node.props.param
      return { ...node, props: { ...node.props, currentValue: params[key] ?? '', baseQuery: withParam(params, key, null) } }
    }
    return visitChildren(node)
  }
  const visitChildren = (node: BuilderNode): BuilderNode => {
    if (!node.children?.length) return node
    let changed = false
    const children = applyShow(node.children, {}, base, keepHidden).map((c) => {
      const next = visit(c)
      if (next !== c) changed = true
      return next
    })
    if (children.length !== node.children.length || children.some((c, i) => c !== node.children![i])) changed = true
    return changed ? { ...node, children } : node
  }
  return visit(root)
}

/** Mô tả nguồn (trả về từ /api/builder/sources) để editor dựng bộ chọn trường */
export interface SourceInfo {
  slug: string
  label: string
  fields: { name: string; label: string; type: string; fields?: { name: string; label: string; type: string }[] }[]
}

/** Đường dẫn trường gợi ý cho bộ chọn ⚡ (vd: name, avatar.url, address.city) */
export function fieldPaths(info: SourceInfo): { path: string; label: string }[] {
  const out: { path: string; label: string }[] = []
  for (const f of info.fields) {
    if (f.type === 'upload') {
      out.push({ path: f.name, label: `${f.label} (ảnh)` }, { path: `${f.name}.url`, label: `${f.label} – URL` })
    } else if (f.type === 'group' && f.fields) {
      for (const sub of f.fields) out.push({ path: `${f.name}.${sub.name}`, label: `${f.label} › ${sub.label}` })
    } else if (f.type === 'relationship') {
      out.push({ path: f.name, label: `${f.label} (tên)` }, { path: `${f.name}.id`, label: `${f.label} – id` })
    } else out.push({ path: f.name, label: f.label })
  }
  return out
}

/**
 * Gắn trường tự động cho một cây mẫu (dùng khi "Lặp theo dữ liệu" / chọn phần tử mẫu):
 * heading đầu -> {{name}}, các paragraph -> {{title}}, {{bio}}…, avatar/image/card media -> {{avatar}},
 * avatar.name -> {{name}}. Chỉ dùng trường có trong `fields`.
 */
export function autoBind(node: BuilderNode, fields: string[]): BuilderNode {
  const textFields = ['name', 'title', 'label', 'heading'].filter((f) => fields.includes(f))
  const paraFields = ['title', 'bio', 'description', 'excerpt', 'summary', 'text', 'content'].filter((f) => fields.includes(f))
  const mediaField = ['avatar', 'image', 'media', 'photo', 'cover', 'thumbnail'].find((f) => fields.includes(f))
  let headingUsed = false
  let para = 0
  const visit = (n: BuilderNode): BuilderNode => {
    const props = { ...n.props }
    if (n.type === 'heading' && !headingUsed && textFields[0]) {
      props.text = `{{${textFields[0]}}}`
      headingUsed = true
    } else if (n.type === 'paragraph' && paraFields[para]) {
      props.text = `{{${paraFields[para]}}}`
      para++
    } else if ((n.type === 'image' || n.type === 'card' || n.type === 'avatar') && mediaField) {
      props.media = `{{${mediaField}}}`
      if (n.type === 'avatar' && textFields[0]) props.name = `{{${textFields[0]}}}`
    } else if (n.type === 'badge' && fields.includes('title')) props.text = '{{title}}'
    else if (n.type === 'chatBubble') {
      if (paraFields[0]) props.text = `{{${paraFields[0]}}}`
      if (textFields[0]) props.name = `{{${textFields[0]}}}`
    } else if (n.type === 'statusDot' && textFields[0]) props.label = `{{${textFields[0]}}}`
    else if (n.type === 'button' && fields.includes('id') && typeof props.href === 'string' && !props.href.includes('{{')) props.href = `${props.href === '#' || !props.href ? '' : props.href}` || '#'
    return { ...n, props, ...(n.children ? { children: n.children.map(visit) } : {}) }
  }
  return visit(node)
}
