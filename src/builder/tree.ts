/**
 * Tiện ích thao tác cây node. Các hàm "mutate" sửa trực tiếp object truyền vào,
 * được thiết kế để chạy bên trong draft của immer.
 */
import type { BuilderNode, DropTarget, PageContent } from './types'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function genId(length = 8): string {
  let id = ''
  const bytes =
    typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? crypto.getRandomValues(new Uint8Array(length))
      : Uint8Array.from({ length }, () => Math.floor(Math.random() * 256))
  for (let i = 0; i < length; i++) id += ALPHABET[bytes[i] % ALPHABET.length]
  // id CSS không được bắt đầu bằng số
  return /^[0-9]/.test(id) ? 'n' + id.slice(1) : id
}

export function createRoot(): BuilderNode {
  return { id: 'root', type: 'root', props: {}, styles: {}, children: [] }
}

export function createEmptyContent(): PageContent {
  return { version: 1, root: createRoot() }
}

export function findNode(root: BuilderNode, id: string): BuilderNode | null {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function findParent(
  root: BuilderNode,
  id: string,
): { parent: BuilderNode; index: number } | null {
  const children = root.children ?? []
  for (let i = 0; i < children.length; i++) {
    if (children[i].id === id) return { parent: root, index: i }
    const found = findParent(children[i], id)
    if (found) return found
  }
  return null
}

/** Danh sách tổ tiên từ root tới cha trực tiếp của node */
export function getAncestors(root: BuilderNode, id: string): BuilderNode[] {
  const path: BuilderNode[] = []
  const visit = (node: BuilderNode): boolean => {
    if (node.id === id) return true
    path.push(node)
    for (const child of node.children ?? []) if (visit(child)) return true
    path.pop()
    return false
  }
  return visit(root) ? path : []
}

/** `id` có nằm trong cây con của `ancestorId` (hoặc chính nó) không */
export function isInSubtree(root: BuilderNode, ancestorId: string, id: string): boolean {
  const ancestor = findNode(root, ancestorId)
  return ancestor ? findNode(ancestor, id) !== null : false
}

export function walk(node: BuilderNode, fn: (n: BuilderNode, depth: number) => void, depth = 0) {
  fn(node, depth)
  for (const child of node.children ?? []) walk(child, fn, depth + 1)
}

export function countNodes(node: BuilderNode): number {
  let n = 0
  walk(node, () => n++)
  return n
}

/** Sao chép sâu và gán id mới cho toàn bộ cây con (dùng cho duplicate / paste) */
export function cloneWithNewIds(node: BuilderNode): BuilderNode {
  return {
    id: genId(),
    type: node.type,
    props: structuredClone(node.props),
    styles: structuredClone(node.styles),
    ...(node.children ? { children: node.children.map(cloneWithNewIds) } : {}),
  }
}

// ---------- Các thao tác sửa cây (mutate) ----------

export function insertNode(root: BuilderNode, target: DropTarget, node: BuilderNode): boolean {
  const parent = findNode(root, target.parentId)
  if (!parent) return false
  parent.children ??= []
  const index = Math.max(0, Math.min(target.index, parent.children.length))
  parent.children.splice(index, 0, node)
  return true
}

export function removeNode(root: BuilderNode, id: string): BuilderNode | null {
  const loc = findParent(root, id)
  if (!loc) return null
  const [removed] = loc.parent.children!.splice(loc.index, 1)
  return removed
}

/**
 * Di chuyển node tới vị trí mới. `target.index` tính theo danh sách con TRƯỚC khi gỡ node ra
 * (đúng với cách drop indicator hiển thị), nên cần bù trừ khi cùng cha.
 */
export function moveNode(root: BuilderNode, id: string, target: DropTarget): boolean {
  if (id === root.id) return false
  if (isInSubtree(root, id, target.parentId)) return false
  const loc = findParent(root, id)
  if (!loc) return false
  let index = target.index
  if (loc.parent.id === target.parentId && loc.index < index) index -= 1
  if (loc.parent.id === target.parentId && loc.index === index) return false
  const node = removeNode(root, id)
  if (!node) return false
  return insertNode(root, { parentId: target.parentId, index }, node)
}
