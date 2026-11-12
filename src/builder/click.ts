/**
 * Hành động "Khi bấm" của một phần tử (tab Nâng cao): mở liên kết, cuộn tới phần tử, mở hộp thoại, hiện thông báo.
 * Lưu ở props.click; Renderer phát data-click-* và role/tabindex; Runtime xử lý bấm chuột + bàn phím (Enter/Space).
 * Liên kết gắn được {{trường}} (bind như mọi prop) nên dùng được trong phần tử mẫu của Danh sách dữ liệu.
 */
import { getSchema } from './schema'

export type ClickAction = 'link' | 'scroll' | 'dialog' | 'toast'

export interface ClickProps {
  action: ClickAction
  /** link: URL nội bộ (/…), neo (#…) hoặc http(s)/mailto/tel; có thể chứa {{trường}} */
  href?: string
  newTab?: boolean
  /** scroll / dialog / toast: CSS ID của phần tử đích */
  target?: string
  /** Nhãn cho trình đọc màn hình (aria-label) */
  label?: string
}

export const CLICK_ACTIONS: { value: ClickAction; label: string }[] = [
  { value: 'link', label: 'Mở liên kết' },
  { value: 'scroll', label: 'Cuộn tới phần tử' },
  { value: 'dialog', label: 'Mở hộp thoại (Dialog)' },
  { value: 'toast', label: 'Hiện thông báo (Toast)' },
]

const ID = /^[A-Za-z_-][A-Za-z0-9_-]{0,60}$/
const TEMPLATE = /\{\{\s*[A-Za-z_][A-Za-z0-9_.-]*\s*\}\}/

/** Các block bấm được toàn bộ: vùng chứa (trừ block có tương tác riêng) và vài block hiển thị */
const EXCLUDED = new Set(['root', 'form', 'formField', 'dialog', 'popover', 'tabs', 'tab', 'accordion', 'accordionItem', 'carousel', 'slide', 'blockRef'])
const EXTRA = new Set(['image', 'heading', 'paragraph', 'avatar', 'svg', 'badge', 'chatBubble', 'statusDot'])

export function canHaveClick(type: string): boolean {
  if (EXCLUDED.has(type)) return false
  return !!getSchema(type)?.isContainer || EXTRA.has(type)
}

/** Href an toàn (giữ nguyên nếu còn {{…}} chưa bind): /, #, http(s), mailto, tel */
export function safeClickHref(v: unknown): string | null {
  const href = typeof v === 'string' ? v.trim().slice(0, 500) : ''
  if (!href) return null
  if (TEMPLATE.test(href)) return href
  if (/^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) return /[\s"'<>]/.test(href.replace(/ /g, '%20')) ? null : href.replace(/ /g, '%20')
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(href)) return 'https://' + href
  return null
}

/** Làm sạch props.click khi lưu; trả về undefined nếu không hợp lệ */
export function normalizeClick(input: unknown): ClickProps | undefined {
  if (!input || typeof input !== 'object') return undefined
  const src = input as Record<string, unknown>
  const action = CLICK_ACTIONS.some((a) => a.value === src.action) ? (src.action as ClickAction) : undefined
  if (!action) return undefined
  const label = typeof src.label === 'string' && src.label.trim() ? src.label.trim().slice(0, 120) : undefined
  if (action === 'link') {
    const href = safeClickHref(src.href)
    if (!href) return undefined
    return { action, href, ...(src.newTab === true ? { newTab: true } : {}), ...(label ? { label } : {}) }
  }
  const target = typeof src.target === 'string' ? src.target.trim().replace(/^#/, '') : ''
  if (!ID.test(target)) return undefined
  return { action, target, ...(label ? { label } : {}) }
}

/** Thuộc tính HTML cho phần tử có hành động bấm (đã bind dữ liệu) */
export function clickAttrs(input: unknown): Record<string, string | number> | null {
  const click = normalizeClick(input)
  if (!click) return null
  // link còn {{…}} chưa bind (ví dụ xem trong My Block không có dữ liệu): bỏ qua
  if (click.action === 'link' && TEMPLATE.test(click.href ?? '')) return null
  const attrs: Record<string, string | number> = {
    'data-click': click.action,
    role: click.action === 'link' ? 'link' : 'button',
    tabIndex: 0,
  }
  if (click.action === 'link') {
    attrs['data-click-href'] = click.href!
    if (click.newTab) attrs['data-click-newtab'] = ''
  } else attrs['data-click-target'] = click.target!
  if (click.label) attrs['aria-label'] = click.label
  return attrs
}
