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
}

/** Bản ghi đã lọc trường công khai */
export type DataRecord = Record<string, unknown>
/** Kết quả theo id node có nguồn dữ liệu */
export type DataMap = Record<string, DataRecord[]>
export type DataLookup = (nodeId: string) => DataRecord[] | undefined

export const DATA_LIST_TYPE = 'dataList'
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
  return out
}

/** Điều kiện `where` của Payload từ nguồn dữ liệu */
export function buildWhere(source: DataSource): Record<string, unknown> | undefined {
  const and: Record<string, unknown>[] = []
  for (const f of source.filters ?? []) {
    if (f.op === 'exists') and.push({ [f.field]: { exists: f.value !== 'false' && f.value !== '0' } })
    else if (f.op === 'in') and.push({ [f.field]: { in: f.value.split(',').map((v) => v.trim()).filter(Boolean) } })
    else and.push({ [f.field]: { [f.op]: f.value } })
  }
  if (source.mode === 'one' && source.byValue) and.push({ [source.byField || 'id']: { equals: source.byValue } })
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
    if (path in extra) return toText(extra[path])
    return toText(getPath(record, path))
  })
}

/** Giá trị prop sau khi gắn dữ liệu: chuỗi được thay thế; prop media dạng "{{truong}}" trỏ tới object upload sẽ thành MediaValue */
function bindValue(value: unknown, record: DataRecord, extra: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    const m = value.match(/^\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}$/)
    if (m) {
      const raw = m[1] in extra ? extra[m[1]] : getPath(record, m[1])
      if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as { url?: unknown }).url === 'string') {
        const u = raw as Record<string, unknown>
        return { id: u.id, url: u.url, alt: u.alt ?? '', width: u.width, height: u.height, mimeType: u.mimeType }
      }
    }
    return bindString(value, record, extra)
  }
  if (Array.isArray(value)) return value.map((v) => bindValue(v, record, extra))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = k === 'data' || k === 'fx' ? v : bindValue(v, record, extra)
    return out
  }
  return value
}

/** Gắn một bản ghi vào cây con: props chứa {{...}} được thay; id giữ nguyên (bản mẫu) hoặc thêm hậu tố */
export function bindSubtree(node: BuilderNode, record: DataRecord, extra: Record<string, unknown>, suffix: string, inner: boolean): BuilderNode {
  const out: BuilderNode = {
    id: suffix ? `${node.id}${suffix}` : node.id,
    type: node.type,
    props: bindValue(node.props, record, extra) as Record<string, unknown>,
    styles: node.styles,
    ...(node.children ? { children: node.children.map((c) => bindSubtree(c, record, extra, suffix, inner)) } : {}),
  }
  if (inner) out.linked = 'inner'
  else if (node.linked) out.linked = node.linked
  return out
}

/**
 * Áp dụng dữ liệu cho toàn cây. `lookup(nodeId)` trả về bản ghi đã nạp cho node có nguồn.
 * - dataList: lặp các con cho từng bản ghi (bản đầu giữ id gốc để editor chọn được).
 * - block chứa khác có nguồn: gắn bản ghi đầu tiên vào cây con.
 * Nhánh không có nguồn dữ liệu được trả về đúng object cũ (structural sharing).
 */
export function resolveData(root: BuilderNode, lookup: DataLookup): BuilderNode {
  const visit = (node: BuilderNode): BuilderNode => {
    const source = dataSourceOf(node)
    if (source) {
      const records = lookup(node.id) ?? []
      if (node.type === DATA_LIST_TYPE) {
        const template = node.children ?? []
        const children: BuilderNode[] = []
        records.forEach((rec, i) => {
          const extra = { index: i + 1, count: records.length }
          for (const child of template) children.push(bindSubtree(child, rec, extra, i === 0 ? '' : `_${i}`, i > 0))
        })
        return { ...node, children: children.map(visit) }
      }
      const rec = records[0]
      if (!rec) return visitChildren(node)
      const bound = bindSubtree(node, rec, { index: 1, count: records.length }, '', false)
      return visitChildren(bound)
    }
    return visitChildren(node)
  }
  const visitChildren = (node: BuilderNode): BuilderNode => {
    if (!node.children?.length) return node
    let changed = false
    const children = node.children.map((c) => {
      const next = visit(c)
      if (next !== c) changed = true
      return next
    })
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
