'use client'

import { Keyboard, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { SHORTCUT_GROUPS } from './shortcutsList'
import { useEditor } from './store'

/** Hộp phím tắt (phím ? hoặc nút ⌨ trên thanh trên) */
export function ShortcutsDialog() {
  const close = () => useEditor.getState().openShortcuts(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return (
    <div className="ed-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="ed-modal" role="dialog" aria-label="Phím tắt" style={{ width: 'min(680px, 100%)' }}>
        <header className="ed-modal-head">
          <Keyboard size={18} />
          <strong>Phím tắt</strong>
          <button className="ed-btn" style={{ marginLeft: 'auto' }} onClick={() => (close(), useEditor.getState().startTour())}>
            Xem lại hướng dẫn
          </button>
          <button className="ed-icon-btn" onClick={close} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        <div className="ed-kbd-list">
          {SHORTCUT_GROUPS.map((g) => (
            <div key={g.title}>
              <strong style={{ display: 'block', margin: '6px 0' }}>{g.title}</strong>
              {g.items.map((it) => (
                <div key={it.label} className="ed-kbd-row">
                  <span>{it.label}</span>
                  <kbd>{it.keys}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TOUR_STEPS: { target: string; title: string; text: string }[] = [
  { target: '.ed-left', title: 'Phần tử, My Blocks, Cấu trúc', text: 'Kéo block từ tab Phần tử vào trang. My Blocks là phần đã dựng để dùng lại; Cấu trúc là cây các phần tử; 💬 là bình luận.' },
  { target: '.ed-canvas', title: 'Canvas', text: 'Bấm để chọn, nhấp đúp để sửa chữ, nhấn giữ và kéo để di chuyển. Tay cầm cam/tím chỉnh lề trong và kích thước. Chuột phải mở menu.' },
  { target: '.ed-right', title: 'Thuộc tính', text: 'Nội dung, Kiểu (theo thiết bị, hover), Nâng cao và ✦ Gợi ý kiểu cho phần tử đang chọn. Nút ⚡ gắn trường dữ liệu từ CMS.' },
  { target: '.ed-seg--lg', title: 'Thiết bị', text: 'Chuyển Desktop / Tablet / Mobile để chỉnh kiểu riêng cho từng màn hình (ô trống kế thừa từ màn hình lớn hơn).' },
  { target: '.ed-top-right', title: 'Mẫu trang, lịch sử, ngôn ngữ và xuất bản', text: 'Lưu nháp thoải mái, Xem trước, rồi Xuất bản. Mũi tên cạnh Xuất bản có ghi chú phiên bản và lên lịch. Nhấn ? để xem phím tắt.' },
]

/** Tour hướng dẫn lần đầu (và khi gọi lại từ hộp phím tắt) */
export function TourOverlay() {
  const step = useEditor((s) => s.tour)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const cur = step == null ? null : TOUR_STEPS[step]
  useLayoutEffect(() => {
    if (!cur) return
    const el = document.querySelector(cur.target)
    const update = () => setRect(el?.getBoundingClientRect() ?? null)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [cur])
  useEffect(() => {
    if (step == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        useEditor.getState().endTour()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step])
  if (step == null || !cur) return null
  const s = useEditor.getState()
  const pad = 6
  const spot = rect ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : { left: 0, top: 0, width: 0, height: 0 }
  // thẻ đặt bên phải vùng sáng, không đủ chỗ thì bên trái, cuối cùng là bên dưới
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const cardW = 320
  let left = spot.left + spot.width + 12
  if (left + cardW > vw - 8) left = spot.left - cardW - 12
  if (left < 8) left = Math.max(8, Math.min(vw - cardW - 8, spot.left))
  const top = Math.min(Math.max(8, spot.top + 8), (typeof window !== 'undefined' ? window.innerHeight : 800) - 200)
  const last = step === TOUR_STEPS.length - 1
  return (
    <>
      <div className="ed-tour-dim" />
      <div className="ed-tour-spot" style={spot} />
      <div className="ed-tour-card" style={{ left, top }} role="dialog" aria-label="Hướng dẫn" data-tour-step={step}>
        <h4>{cur.title}</h4>
        <p>{cur.text}</p>
        <div className="ed-tour-foot">
          <span className="ed-help">
            {step + 1} / {TOUR_STEPS.length}
          </span>
          <button className="ed-btn" onClick={() => s.endTour()}>
            Bỏ qua
          </button>
          {step > 0 && (
            <button className="ed-btn" onClick={() => s.setTour(step - 1)}>
              Trước
            </button>
          )}
          <button className="ed-btn ed-btn--primary" onClick={() => (last ? s.endTour() : s.setTour(step + 1))}>
            {last ? 'Xong' : 'Tiếp'}
          </button>
        </div>
      </div>
    </>
  )
}

export const TOUR_STEP_COUNT = TOUR_STEPS.length
