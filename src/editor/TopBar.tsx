'use client'

import { ArrowLeft, ExternalLink, Loader2, Monitor, Redo2, Smartphone, Tablet, Undo2 } from 'lucide-react'
import type { Device } from '@/builder/types'
import { savePage } from './api'
import { useEditor } from './store'

const DEVICES: { id: Device; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'tablet', label: 'Tablet (768px)', icon: Tablet },
  { id: 'mobile', label: 'Mobile (375px)', icon: Smartphone },
]

export function TopBar() {
  const title = useEditor((s) => s.title)
  const slug = useEditor((s) => s.slug)
  const pageId = useEditor((s) => s.pageId)
  const status = useEditor((s) => s.status)
  const dirty = useEditor((s) => s.dirty)
  const saving = useEditor((s) => s.saving)
  const device = useEditor((s) => s.device)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)

  const badge = dirty ? { text: 'Chưa lưu', cls: 'warn' } : status === 'published' ? { text: 'Đã xuất bản', cls: 'ok' } : { text: 'Bản nháp', cls: 'muted' }

  const preview = async () => {
    // mở tab trước để không bị chặn popup, rồi điều hướng sau khi lưu nháp
    const win = window.open('about:blank', '_blank')
    if (useEditor.getState().dirty) {
      const ok = await savePage(false)
      if (!ok) {
        win?.close()
        return
      }
    }
    const url = `/preview?slug=${encodeURIComponent(useEditor.getState().slug)}`
    if (win) win.location.href = url
    else window.open(url, '_blank')
  }

  return (
    <header className="ed-top">
      <div className="ed-top-left">
        <a className="ed-icon-btn" href={`/admin/collections/pages/${pageId}`} title="Về trang quản trị">
          <ArrowLeft size={18} />
        </a>
        <div className="ed-page-meta">
          <strong>{title || 'Chưa đặt tên'}</strong>
          <span>/{slug === 'home' ? '' : slug}</span>
        </div>
        <span className={`ed-badge ed-badge--${badge.cls}`}>{badge.text}</span>
      </div>

      <div className="ed-seg ed-seg--lg" role="group" aria-label="Thiết bị">
        {DEVICES.map((d) => (
          <button key={d.id} title={d.label} className={device === d.id ? 'is-active' : ''} onClick={() => useEditor.getState().setDevice(d.id)}>
            <d.icon size={16} />
          </button>
        ))}
      </div>

      <div className="ed-top-right">
        <button className="ed-icon-btn" title="Hoàn tác (Ctrl+Z)" disabled={!canUndo} onClick={() => useEditor.getState().undo()}>
          <Undo2 size={17} />
        </button>
        <button className="ed-icon-btn" title="Làm lại (Ctrl+Shift+Z)" disabled={!canRedo} onClick={() => useEditor.getState().redo()}>
          <Redo2 size={17} />
        </button>
        <button className="ed-btn" onClick={preview} disabled={saving}>
          <ExternalLink size={15} /> Xem trước
        </button>
        <button className="ed-btn" onClick={() => savePage(false)} disabled={saving}>
          {saving && <Loader2 size={15} className="ed-spin" />} Lưu nháp
        </button>
        <button className="ed-btn ed-btn--primary" onClick={() => savePage(true)} disabled={saving}>
          Xuất bản
        </button>
      </div>
    </header>
  )
}
