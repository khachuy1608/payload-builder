'use client'

/**
 * Popup nổi dùng chung cho editor (gắn trường ⚡, liên kết 🔗, màu, icon…):
 * - render qua portal vào <body> nên không bị panel có thanh cuộn cắt mất
 * - định vị theo nút neo (position: fixed), canh mép phải/trái, tự lật lên trên khi thiếu chỗ, luôn nằm trong màn hình
 * - bấm ra ngoài / Esc / cuộn panel / đổi kích thước cửa sổ: cập nhật vị trí hoặc đóng
 * - mỗi lúc chỉ mở một popup (mở cái mới thì cái cũ tự đóng)
 */
import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

let closeCurrent: (() => void) | null = null

const GAP = 6
const MARGIN = 8

export function Floating({
  anchor,
  onClose,
  width = 280,
  align = 'end',
  className = '',
  children,
}: {
  anchor: RefObject<HTMLElement | null>
  onClose: () => void
  /** Bề rộng (px) hoặc 'anchor' = bằng bề rộng nút neo */
  width?: number | 'anchor'
  /** Canh theo mép phải (end) hay trái (start) của nút neo */
  align?: 'start' | 'end'
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // chỉ một popup mở tại một thời điểm
  useEffect(() => {
    const me = () => closeRef.current()
    if (closeCurrent && closeCurrent !== me) closeCurrent()
    closeCurrent = me
    return () => {
      if (closeCurrent === me) closeCurrent = null
    }
  }, [])

  const place = () => {
    const a = anchor.current?.getBoundingClientRect()
    const el = ref.current
    if (!a || !el) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = Math.min(width === 'anchor' ? a.width : width, vw - MARGIN * 2)
    let left = align === 'end' ? a.right - w : a.left
    left = Math.max(MARGIN, Math.min(left, vw - w - MARGIN))
    const natural = el.scrollHeight
    const below = vh - a.bottom - GAP - MARGIN
    const above = a.top - GAP - MARGIN
    // lật lên trên khi bên dưới không đủ chỗ và bên trên rộng hơn
    const up = natural > below && above > below
    const maxHeight = Math.max(120, up ? above : below)
    const h = Math.min(natural, maxHeight)
    const top = up ? a.top - GAP - h : a.bottom + GAP
    setPos((p) => (p && p.left === left && p.top === top && p.width === w && p.maxHeight === maxHeight ? p : { left, top, width: w, maxHeight }))
  }

  useLayoutEffect(() => {
    place()
    // nội dung đổi chiều cao (kết quả tìm kiếm về) -> đặt lại vị trí
    const ro = new ResizeObserver(() => place())
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchor.current?.contains(t)) return
      closeRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      closeRef.current()
    }
    const onMove = () => place()
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', onMove)
    // cuộn panel chứa nút neo: popup đi theo; nút neo ra khỏi màn hình thì đóng
    const onScroll = (e: Event) => {
      if (ref.current?.contains(e.target as Node)) return
      const a = anchor.current?.getBoundingClientRect()
      if (!a || a.bottom < 0 || a.top > window.innerHeight) closeRef.current()
      else place()
    }
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onScroll, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      ref={ref}
      className={`ed-popover ed-floating ${className}`}
      role="dialog"
      style={pos ? { left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxHeight } : { left: -9999, top: 0, width: typeof width === 'number' ? width : 280, visibility: 'hidden' }}
    >
      {children}
    </div>,
    document.body,
  )
}
