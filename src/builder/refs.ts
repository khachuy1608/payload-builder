/**
 * My Blocks dạng LIÊN KẾT (node `blockRef`).
 * Trang chỉ lưu `{ type: 'blockRef', props: { blockId } }`; lúc render, `resolveRefs()` thay node đó bằng
 * bản sao cây gốc của block. Mọi hàm ở đây thuần dữ liệu, dùng chung cho server, front-end và editor.
 *
 * Quy ước cây đã triển khai:
 * - Phần tử gốc của block nhận id = id node blockRef (nên CSS `.n-<id>` và lựa chọn trong editor trỏ về node blockRef).
 * - Phần tử bên trong nhận id `<refId>_<n>` (duy nhất, ổn định giữa các lần render) và cờ `linked: 'inner'`.
 * - Node blockRef có thể ghi đè style (margin, kích thước…) và thuộc tính Nâng cao của phần tử gốc.
 */
import type { BuilderNode, NodeStyles } from './types'

export const BLOCK_REF_TYPE = 'blockRef'
/** Số cấp block lồng nhau tối đa (block A chứa liên kết tới B, B tới C…) */
export const MAX_REF_DEPTH = 5
export const BLOCK_ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/

/** Tra cứu cây gốc của block theo id. Trả về null/undefined nếu chưa tải hoặc không tồn tại. */
export type BlockLookup = (blockId: string) => BuilderNode | null | undefined

export function isBlockRef(node: BuilderNode): boolean {
  return node.type === BLOCK_REF_TYPE
}

/** blockId đã chuẩn hoá của một node blockRef, hoặc null nếu không hợp lệ */
export function refBlockId(node: BuilderNode): string | null {
  if (!isBlockRef(node)) return null
  const raw = node.props?.blockId
  const id = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : ''
  return BLOCK_ID_PATTERN.test(id) ? id : null
}

/** Tập blockId được tham chiếu trực tiếp trong cây */
export function collectRefIds(node: BuilderNode, into: Set<string> = new Set()): Set<string> {
  const id = refBlockId(node)
  if (id) into.add(id)
  for (const child of node.children ?? []) collectRefIds(child, into)
  return into
}

export function mergeStyles(base: NodeStyles | undefined, override: NodeStyles | undefined): NodeStyles {
  const out: NodeStyles = {}
  for (const bucket of ['desktop', 'tablet', 'mobile', 'hover'] as const) {
    const merged = { ...(base?.[bucket] ?? {}), ...(override?.[bucket] ?? {}) }
    if (Object.keys(merged).length) out[bucket] = merged
  }
  return out
}

/** Thuộc tính "Nâng cao" của node blockRef được giữ lại trên phần tử gốc đã triển khai */
const KEEP_REF_PROPS = ['cssId', 'cssClass', 'hide'] as const

/** Tiền tố id cho phần tử con: cắt bớt để id lồng nhiều cấp không vượt quá 40 ký tự */
function innerPrefix(refId: string): string {
  return refId.length > 30 ? refId.slice(0, 30) : refId
}

/**
 * Triển khai MỘT cấp: tạo cây thật từ node blockRef và cây gốc của block.
 * Không sao chép sâu props/styles của phần tử con (chúng chỉ được đọc), nên rẻ.
 */
export function expandRef(ref: BuilderNode, tree: BuilderNode): BuilderNode {
  let n = 0
  const prefix = innerPrefix(ref.id)
  const remap = (node: BuilderNode): BuilderNode => ({
    id: `${prefix}_${++n}`,
    type: node.type,
    props: node.props,
    styles: node.styles,
    ...(node.children ? { children: node.children.map(remap) } : {}),
    linked: 'inner',
  })
  const props: Record<string, unknown> = { ...tree.props }
  for (const key of KEEP_REF_PROPS) if (ref.props?.[key] !== undefined) props[key] = ref.props[key]
  return {
    id: ref.id,
    type: tree.type,
    props,
    styles: mergeStyles(tree.styles, ref.styles),
    ...(tree.children ? { children: tree.children.map(remap) } : {}),
    linked: 'root',
  }
}

export type RefError = 'missing' | 'cycle' | 'depth'

/** Node blockRef không triển khai được: giữ nguyên node và ghi lý do vào props.refError (chỉ trong cây render) */
function failedRef(node: BuilderNode, error: RefError): BuilderNode {
  if (node.props.refError === error) return node
  return { ...node, props: { ...node.props, refError: error } }
}

/**
 * Cache theo node blockRef: kết quả triển khai (kể cả block lồng bên trong) cùng danh sách phụ thuộc
 * (blockId -> cây gốc đã dùng). immer giữ nguyên object node không đổi nên khi sửa chỗ khác trên trang,
 * block liên kết trả về đúng object cũ và renderer (memo) không render lại.
 */
interface ResolveEntry {
  out: BuilderNode
  deps: [string, BuilderNode | null | undefined][]
  maxDepth: number
}
const resolveCache = new WeakMap<BuilderNode, ResolveEntry>()

/**
 * Triển khai toàn bộ blockRef trong cây (kể cả block lồng nhau), chặn vòng lặp và giới hạn độ sâu.
 * Nhánh không chứa blockRef được trả về đúng object cũ (structural sharing) để `memo` của renderer vẫn hiệu quả.
 */
export function resolveRefs(root: BuilderNode, lookup: BlockLookup, maxDepth = MAX_REF_DEPTH): BuilderNode {
  const visit = (node: BuilderNode, chain: string[], deps: ResolveEntry['deps']): BuilderNode => {
    if (isBlockRef(node)) {
      const blockId = refBlockId(node)
      if (!blockId) return failedRef(node, 'missing')
      const hit = resolveCache.get(node)
      if (hit && hit.maxDepth === maxDepth && hit.deps.every(([id, tree]) => lookup(id) === tree)) {
        deps.push(...hit.deps)
        return hit.out
      }
      const own: ResolveEntry['deps'] = []
      const tree = lookup(blockId)
      own.push([blockId, tree])
      let out: BuilderNode
      if (!tree) out = failedRef(node, 'missing')
      else if (chain.includes(blockId)) out = failedRef(node, 'cycle')
      else if (chain.length >= maxDepth) out = failedRef(node, 'depth')
      else out = visitChildren(expandRef(node, tree), [...chain, blockId], own)
      resolveCache.set(node, { out, deps: own, maxDepth })
      deps.push(...own)
      return out
    }
    return visitChildren(node, chain, deps)
  }
  const visitChildren = (node: BuilderNode, chain: string[], deps: ResolveEntry['deps']): BuilderNode => {
    if (!node.children?.length) return node
    let changed = false
    const children = node.children.map((child) => {
      const next = visit(child, chain, deps)
      if (next !== child) changed = true
      return next
    })
    return changed ? { ...node, children } : node
  }
  const hit = resolveCache.get(root)
  if (hit && hit.maxDepth === maxDepth && hit.deps.every(([id, tree]) => lookup(id) === tree)) return hit.out
  const deps: ResolveEntry['deps'] = []
  const out = visit(root, [], deps)
  resolveCache.set(root, { out, deps, maxDepth })
  return out
}

/**
 * Cây `tree` có dẫn tới block `targetId` không (trực tiếp hoặc qua các block lồng nhau).
 * Dùng để chặn vòng lặp: lưu block X với cây chứa liên kết tới X, hoặc chèn vào X một block đang tham chiếu X.
 */
export function reachesBlock(tree: BuilderNode, targetId: string, lookup: BlockLookup): boolean {
  const seen = new Set<string>()
  const queue = [...collectRefIds(tree)]
  while (queue.length) {
    const id = queue.shift()!
    if (id === targetId) return true
    if (seen.has(id)) continue
    seen.add(id)
    const next = lookup(id)
    if (next) queue.push(...collectRefIds(next))
  }
  return false
}

/**
 * Nạp dần các block được tham chiếu, kể cả block lồng nhau, bằng hàm `fetchTrees` (ví dụ gọi DB).
 * Trả về map blockId -> cây gốc; id không tồn tại sẽ không có trong map.
 */
export async function loadRefTrees(
  startIds: Iterable<string>,
  fetchTrees: (ids: string[]) => Promise<{ id: string; tree: BuilderNode }[]>,
  maxDepth = MAX_REF_DEPTH,
): Promise<Map<string, BuilderNode>> {
  const trees = new Map<string, BuilderNode>()
  const tried = new Set<string>()
  let pending = [...new Set(startIds)]
  for (let depth = 0; pending.length && depth <= maxDepth; depth++) {
    pending.forEach((id) => tried.add(id))
    const docs = await fetchTrees(pending)
    const next = new Set<string>()
    for (const doc of docs) {
      trees.set(String(doc.id), doc.tree)
      for (const id of collectRefIds(doc.tree)) if (!tried.has(id)) next.add(id)
    }
    pending = [...next]
  }
  return trees
}
