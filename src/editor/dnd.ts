/**
 * Tính vị trí thả khi kéo trên canvas.
 * Đầu vào: toạ độ con trỏ (theo viewport của iframe), cây node và thứ đang kéo.
 * Thuật toán: lấy phần tử dưới con trỏ, thử "chèn vào trong" (nếu là vùng chứa và con trỏ không sát mép)
 * hoặc "chèn trước/sau" (theo trục bố cục của cha); nếu không hợp lệ thì leo dần lên tổ tiên.
 */
import { getSchema } from '@/builder/schema'
import { findNode, findParent } from '@/builder/tree'
import type { BuilderNode } from '@/builder/types'
import { canDropAt, type DragPayload, type DropIndicator, type Rect } from './store'

const EDGE = 10 // px sát mép được coi là "trước/sau" thay vì "vào trong"
const LINE = 3

type Axis = 'x' | 'y'

function axisOf(el: Element | null, win: Window): Axis {
  if (!el) return 'y'
  const cs = win.getComputedStyle(el)
  if ((cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexDirection.startsWith('row')) return 'x'
  if (cs.display === 'grid') return 'x'
  return 'y'
}

function toRect(r: DOMRect): Rect {
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

/** Phần tử DOM chứa trực tiếp các con của node (Tabs đặt con trong panel nên khác node) */
function childElements(doc: Document, node: BuilderNode): Element[] {
  return (node.children ?? [])
    .map((c) => doc.querySelector(`[data-node-id="${c.id}"]`))
    .filter((el): el is Element => !!el && (el as HTMLElement).offsetParent !== null)
}

function lineBetween(axis: Axis, container: DOMRect, before: DOMRect | null, after: DOMRect | null): Rect {
  if (axis === 'y') {
    const y = before && after ? (before.bottom + after.top) / 2 : before ? before.bottom : after ? after.top : container.top
    const ref = before ?? after ?? container
    return { x: ref.left, y: y - LINE / 2, w: ref.width, h: LINE }
  }
  const x = before && after ? (before.right + after.left) / 2 : before ? before.right : after ? after.left : container.left
  const ref = before ?? after ?? container
  return { x: x - LINE / 2, y: ref.top, w: LINE, h: ref.height }
}

/** Chèn vào trong vùng chứa `node` tại vị trí gần con trỏ nhất */
function insideTarget(doc: Document, node: BuilderNode, el: Element, px: number, py: number): DropIndicator {
  const win = doc.defaultView!
  const kids = childElements(doc, node)
  const containerRect = el.getBoundingClientRect()
  if (!kids.length) {
    return { parentId: node.id, index: node.children?.length ?? 0, rect: toRect(containerRect), variant: 'box' }
  }
  const axis = axisOf(kids[0].parentElement, win)
  const rects = kids.map((k) => k.getBoundingClientRect())
  let index = rects.findIndex((r) => (axis === 'y' ? py < r.top + r.height / 2 : px < r.left + r.width / 2))
  if (index === -1) index = rects.length
  // map index theo phần tử hiển thị sang index thật trong children
  const realIndex = index < kids.length ? node.children!.findIndex((c) => c.id === (kids[index] as HTMLElement).dataset.nodeId) : node.children!.length
  return {
    parentId: node.id,
    index: realIndex,
    rect: lineBetween(axis, containerRect, rects[index - 1] ?? null, rects[index] ?? null),
    variant: 'line',
  }
}

/** Chèn ngay trước hoặc sau `node` trong cha của nó */
function siblingTarget(doc: Document, root: BuilderNode, node: BuilderNode, el: Element, px: number, py: number): DropIndicator | null {
  const loc = findParent(root, node.id)
  if (!loc) return null
  const win = doc.defaultView!
  const axis = axisOf(el.parentElement, win)
  const r = el.getBoundingClientRect()
  const after = axis === 'y' ? py > r.top + r.height / 2 : px > r.left + r.width / 2
  const index = loc.index + (after ? 1 : 0)
  const siblings = loc.parent.children ?? []
  const neighbourId = siblings[after ? loc.index + 1 : loc.index - 1]?.id
  const neighbour = neighbourId ? doc.querySelector(`[data-node-id="${neighbourId}"]`)?.getBoundingClientRect() ?? null : null
  const rect = after ? lineBetween(axis, r, r, neighbour) : lineBetween(axis, r, neighbour, r)
  return { parentId: loc.parent.id, index, rect, variant: 'line' }
}

export function computeDrop(doc: Document, root: BuilderNode, drag: DragPayload, px: number, py: number): DropIndicator | null {
  let el: Element | null = doc.elementFromPoint(px, py)?.closest('[data-node-id]') ?? null
  if (!el) el = doc.querySelector(`[data-node-id="${root.id}"]`)

  while (el) {
    const id = (el as HTMLElement).dataset.nodeId!
    const node = findNode(root, id)
    if (node) {
      const schema = getSchema(node.type)
      const r = el.getBoundingClientRect()
      const nearEdge =
        node.id !== root.id &&
        (py - r.top < EDGE || r.bottom - py < EDGE || px - r.left < EDGE || r.right - px < EDGE)

      const options: (DropIndicator | null)[] = []
      if (schema?.isContainer && !nearEdge) options.push(insideTarget(doc, node, el, px, py))
      if (node.id !== root.id) options.push(siblingTarget(doc, root, node, el, px, py))
      if (schema?.isContainer && nearEdge) options.push(insideTarget(doc, node, el, px, py))

      for (const opt of options) if (opt && canDropAt(root, opt, drag)) return opt
    }
    el = el.parentElement?.closest('[data-node-id]') ?? null
  }
  return null
}
