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
}

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
