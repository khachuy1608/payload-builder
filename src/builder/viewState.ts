/**
 * Trạng thái xem Đóng / Mở của block tương tác trong editor (dialog, popover, dropdown, toast, accordion,
 * menu, command palette, select…). Chỉ dùng trong canvas: Canvas gắn props.__view cho từng block rồi
 * Render vẽ đúng trạng thái; không lưu vào nội dung trang, trang thật luôn bắt đầu ở trạng thái ban đầu.
 */
import type { BuilderNode } from './types'

export type ViewState = 'open' | 'closed'
export const VIEW_PROP = '__view'

export interface ViewStateInfo {
  closed: string
  open: string
  /** Gợi ý thêm (vd: chỉ thấy ở Tablet/Mobile) */
  hint?: string
}

const OPEN_CLOSE: ViewStateInfo = { closed: 'Đóng', open: 'Mở' }
const SHOW_HIDE: ViewStateInfo = { closed: 'Ẩn', open: 'Đang hiện' }

/** Block có hai trạng thái xem được; null = không áp dụng */
export function viewStateInfo(node: Pick<BuilderNode, 'type' | 'props'>): ViewStateInfo | null {
  const p = node.props ?? {}
  switch (node.type) {
    case 'dialog':
    case 'commandPalette':
    case 'cascadingMenu':
    case 'waffleMenu':
    case 'overflowMenu':
    case 'lightbox':
      return OPEN_CLOSE
    case 'popover':
      return p.variant === 'tooltip' || p.variant === 'hovercard' ? { ...SHOW_HIDE, hint: 'Trên trang thật hiện khi rê chuột hoặc focus.' } : OPEN_CLOSE
    case 'toast':
      return SHOW_HIDE
    case 'accordionItem':
      return { closed: 'Thu gọn', open: 'Mở rộng', hint: 'Trạng thái ban đầu trên trang thật đặt ở “Mở sẵn”.' }
    case 'header':
      return { closed: 'Menu đóng', open: 'Menu mở', hint: 'Menu ngăn kéo chỉ có ở Tablet / Mobile – đổi thiết bị trên thanh trên để xem.' }
    case 'formField':
      return p.type === 'select' || p.type === 'combobox' ? { closed: 'Đóng', open: 'Mở danh sách' } : null
    default:
      return null
  }
}

/** Trạng thái ban đầu trên trang thật (dùng khi không ghim và không chọn) */
export function initialViewState(node: Pick<BuilderNode, 'type' | 'props'>): ViewState {
  if (node.type === 'accordionItem') return node.props?.open === true ? 'open' : 'closed'
  return 'closed'
}

/**
 * Gắn props.__view cho mọi block có trạng thái: ghim (`pinned`) > đang chọn chính nó hoặc phần tử bên trong (mở) > ban đầu.
 * Trả lại đúng object cũ ở nhánh không đổi.
 */
export function applyViewStates(root: BuilderNode, pinned: Record<string, ViewState>, selectedPath: ReadonlySet<string>): BuilderNode {
  const visit = (n: BuilderNode): BuilderNode => {
    let next = n
    if (n.children?.length) {
      const children = n.children.map(visit)
      if (children.some((c, i) => c !== n.children![i])) next = { ...n, children }
    }
    if (viewStateInfo(n)) {
      const v: ViewState = pinned[n.id] ?? (selectedPath.has(n.id) ? 'open' : initialViewState(n))
      if (n.props[VIEW_PROP] !== v) next = { ...next, props: { ...next.props, [VIEW_PROP]: v } }
    }
    return next
  }
  return visit(root)
}

/** Block đang ở trạng thái mở trong editor (mặc định mở nếu chưa gắn – vd. preview trong editor) */
export function isViewOpen(node: Pick<BuilderNode, 'props'>, mode: 'editor' | 'live'): boolean {
  return mode === 'editor' && node.props?.[VIEW_PROP] !== 'closed'
}
