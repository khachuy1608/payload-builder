/** Tiện ích dùng chung cho định nghĩa block (không hook, chạy được ở server) */
import type { ComponentType } from 'react'
import type { BlockDefinition, RenderProps } from './types'

export const text = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
export const num = (v: unknown, fallback = 0) => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && isFinite(Number(v)) ? Number(v) : fallback)
export const bool = (v: unknown, fallback = false) => (typeof v === 'boolean' ? v : fallback)

/** Danh sách mục (control 'list') đã chuẩn hoá thành object */
export function items<T extends Record<string, unknown> = Record<string, unknown>>(v: unknown): T[] {
  return Array.isArray(v) ? (v.filter((it) => it && typeof it === 'object') as T[]) : []
}

export function safeHref(v: unknown): string | undefined {
  const href = text(v).trim()
  if (!href) return undefined
  if (/^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('/') || href.startsWith('#')) return href
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(href)) return 'https://' + href
  return undefined
}

export function parseYouTubeId(v: unknown): string | null {
  const s = text(v).trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s
  const m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

/** Chỉ nhận id/anchor an toàn cho thuộc tính id, href="#..." */
export function safeId(v: unknown): string {
  return text(v).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60)
}

/** Màu an toàn để nhúng vào style inline */
export function safeColor(v: unknown, fallback = ''): string {
  const s = text(v).trim()
  return /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|var\(--[a-zA-Z0-9-]+\))$/.test(s) ? s : fallback
}

/** srcset từ các cỡ ảnh tối ưu của media (nếu có) */
export function srcSetOf(media: { url?: string; width?: number | null; sizes?: Record<string, { url?: string | null; width?: number | null }> } | null | undefined): string | undefined {
  if (!media?.sizes) return undefined
  const all = Object.values(media.sizes).filter((s) => s?.url && s.width) as { url: string; width: number }[]
  if (media.url && media.width) all.push({ url: media.url, width: media.width })
  const parts = all.sort((a, b) => a.width - b.width).map((s) => `${s.url} ${s.width}w`)
  return parts.length > 1 ? parts.join(', ') : undefined
}

export function Placeholder({ attrs, label, icon: Icon }: { attrs: RenderProps['attrs']; label: string; icon: BlockDefinition['icon'] }) {
  return (
    <div {...attrs} className={attrs.className + ' bld-ph'}>
      <Icon size={28} strokeWidth={1.5} />
      <span>{label}</span>
    </div>
  )
}

/** Nhãn "chỉ hiện trong editor" bao quanh nội dung bị ẩn ở trang thật (modal, popover…) */
export function EditorOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bld-editor-only">
      <span className="bld-editor-only-tag">{label}</span>
      {children}
    </div>
  )
}

export const ContainerRender: ComponentType<RenderProps> = ({ attrs, children }) => <div {...attrs}>{children}</div>

/** Icon SVG nhỏ dùng trong block (không phụ thuộc lucide ở runtime trang thật) */
export const ICONS: Record<string, string> = {
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  warning: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3M12 9v4M12 17h.01"/>',
  error: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  success: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  dots: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  dotsV: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  grid: '<circle cx="5" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-7A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1z"/>',
  inboxEmpty: '<path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 7l2-4h12l2 4M9 12h6"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  sparkles: '<path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
}

/** Icon dùng được trong Button, Empty State… (tên hiển thị tiếng Việt) */
export const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Không có icon' },
  ...Object.entries({
    arrowRight: 'Mũi tên phải', arrowLeft: 'Mũi tên trái', arrowUpRight: 'Mũi tên chéo', chevronRight: 'Chevron phải', chevronDown: 'Chevron xuống', external: 'Mở ngoài', download: 'Tải xuống', upload: 'Tải lên', play: 'Phát', send: 'Gửi',
    cart: 'Giỏ hàng', heart: 'Trái tim', star: 'Ngôi sao', mail: 'Thư', phone: 'Điện thoại', calendar: 'Lịch', lock: 'Khoá', sparkles: 'Lấp lánh', zap: 'Tia sét', gift: 'Quà', globe: 'Quả cầu', share: 'Chia sẻ',
    search: 'Tìm kiếm', plus: 'Cộng', check: 'Dấu tick', user: 'Người dùng', chat: 'Chat', edit: 'Sửa', trash: 'Xoá', menu: 'Menu', close: 'Đóng', info: 'Thông tin',
  }).map(([value, label]) => ({ value, label })),
]

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? ICONS.info }}
    />
  )
}
