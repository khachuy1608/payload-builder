/**
 * So sánh hai cây node (phiên bản cũ ↔ đang sửa) theo id node: phần tử thêm, xoá, đổi nội dung/kiểu, đổi vị trí.
 * Thuần dữ liệu, dùng cho dialog Lịch sử phiên bản.
 */
import { walk } from './tree'
import type { BuilderNode } from './types'

export type DiffKind = 'added' | 'removed' | 'changed' | 'moved'
export interface DiffEntry {
  kind: DiffKind
  id: string
  type: string
  /** Khoá props/styles đã đổi (với kind = changed) */
  changes?: string[]
}

interface Info {
  node: BuilderNode
  parentId: string | null
  index: number
}

function index(root: BuilderNode): Map<string, Info> {
  const map = new Map<string, Info>()
  const visit = (node: BuilderNode, parentId: string | null, idx: number) => {
    map.set(node.id, { node, parentId, index: idx })
    node.children?.forEach((c, i) => visit(c, node.id, i))
  }
  visit(root, null, 0)
  return map
}

const stable = (v: unknown): string => JSON.stringify(v, (_k, val) => (val && typeof val === 'object' && !Array.isArray(val) ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))) : val))

function changedKeys(a: BuilderNode, b: BuilderNode): string[] {
  const out: string[] = []
  const keys = new Set([...Object.keys(a.props ?? {}), ...Object.keys(b.props ?? {})])
  for (const k of keys) if (stable(a.props?.[k]) !== stable(b.props?.[k])) out.push(k)
  const buckets = new Set([...Object.keys(a.styles ?? {}), ...Object.keys(b.styles ?? {})])
  for (const bk of buckets) {
    const sa = (a.styles as Record<string, Record<string, string>> | undefined)?.[bk] ?? {}
    const sb = (b.styles as Record<string, Record<string, string>> | undefined)?.[bk] ?? {}
    for (const k of new Set([...Object.keys(sa), ...Object.keys(sb)])) if (sa[k] !== sb[k]) out.push(`${bk}.${k}`)
  }
  return out
}

/** Danh sách khác biệt từ `before` sang `after` (thứ tự: xoá, thêm, đổi, di chuyển) */
export function diffTrees(before: BuilderNode, after: BuilderNode): DiffEntry[] {
  const a = index(before)
  const b = index(after)
  const out: DiffEntry[] = []
  for (const [id, info] of a) if (!b.has(id)) out.push({ kind: 'removed', id, type: info.node.type })
  for (const [id, info] of b) if (!a.has(id)) out.push({ kind: 'added', id, type: info.node.type })
  for (const [id, nb] of b) {
    const na = a.get(id)
    if (!na) continue
    const changes = changedKeys(na.node, nb.node)
    if (changes.length) out.push({ kind: 'changed', id, type: nb.node.type, changes })
    // đổi cha, hoặc đổi thứ tự trong cùng cha (bỏ qua lệch do anh em bị thêm/xoá: so theo thứ tự tương đối giữa các id còn tồn tại)
    if (na.parentId !== nb.parentId) out.push({ kind: 'moved', id, type: nb.node.type })
    else if (na.parentId) {
      const siblingsA = (a.get(na.parentId)!.node.children ?? []).map((c) => c.id).filter((x) => b.has(x))
      const siblingsB = (b.get(nb.parentId!)!.node.children ?? []).map((c) => c.id).filter((x) => a.has(x))
      if (siblingsA.indexOf(id) !== siblingsB.indexOf(id)) out.push({ kind: 'moved', id, type: nb.node.type })
    }
  }
  return out
}

/** Tóm tắt số lượng theo loại */
export function summarizeDiff(entries: DiffEntry[]): Record<DiffKind, number> {
  const s: Record<DiffKind, number> = { added: 0, removed: 0, changed: 0, moved: 0 }
  for (const e of entries) s[e.kind]++
  return s
}

export function countNodes(root: BuilderNode): number {
  let n = 0
  walk(root, () => n++)
  return n
}
