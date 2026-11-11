'use client'

import { ArrowLeft, ChevronDown, ExternalLink, History, LayoutTemplate, Loader2, Monitor, Redo2, Smartphone, Tablet, Undo2 } from 'lucide-react'
import { PublishMenu } from './PublishMenu'
import type { Device } from '@/builder/types'
import { saveBlock, savePage } from './api'
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
  const kind = useEditor((s) => s.kind)
  const lockedByOther = useEditor((s) => s.lock.state === 'locked')
  const readOnly = useEditor((s) => s.readOnly) || lockedByOther
  const publishMenu = useEditor((s) => s.publishMenu)
  const versionNote = useEditor((s) => s.versionNote)

  if (kind === 'block') {
    const badge = readOnly ? { text: 'Chỉ xem – block của người khác', cls: 'muted' } : dirty ? { text: 'Chưa lưu', cls: 'warn' } : { text: 'Đã lưu', cls: 'ok' }
    return (
      <header className="ed-top">
        <div className="ed-top-left">
          <a className="ed-icon-btn" href={`/admin/collections/my-blocks/${pageId}`} title="Về trang quản trị">
            <ArrowLeft size={18} />
          </a>
          <div className="ed-page-meta">
            <strong>
              <LayoutTemplate size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              {title || 'Block chưa đặt tên'}
            </strong>
            <span>Bản gốc My Block – các trang dùng liên kết sẽ tự cập nhật</span>
          </div>
          <span className={`ed-badge ed-badge--${badge.cls}`}>{badge.text}</span>
        </div>
        <DeviceSwitch device={device} />
        <div className="ed-top-right">
          <UndoRedo canUndo={canUndo} canRedo={canRedo} />
          <button className="ed-btn ed-btn--primary" onClick={() => saveBlock()} disabled={saving || readOnly} title={readOnly ? 'Chỉ chủ sở hữu mới lưu được' : 'Ctrl+S'}>
            {saving && <Loader2 size={15} className="ed-spin" />} Lưu block
          </button>
        </div>
      </header>
    )
  }

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

      <DeviceSwitch device={device} />

      <div className="ed-top-right">
        <UndoRedo canUndo={canUndo} canRedo={canRedo} />
        <button className="ed-icon-btn" title="Mẫu trang" onClick={() => useEditor.getState().openTemplateDialog(true)}>
          <LayoutTemplate size={17} />
        </button>
        <button className="ed-icon-btn" title="Lịch sử phiên bản" onClick={() => useEditor.getState().openHistory(true)}>
          <History size={17} />
        </button>
        <button className="ed-btn" onClick={preview} disabled={saving}>
          <ExternalLink size={15} /> Xem trước
        </button>
        <button className="ed-btn" onClick={() => savePage(false)} disabled={saving || lockedByOther} title={lockedByOther ? 'Trang đang được người khác sửa' : 'Ctrl+S'}>
          {saving && <Loader2 size={15} className="ed-spin" />} Lưu nháp
        </button>
        <div className="ed-split">
          <button className="ed-btn ed-btn--primary" onClick={() => savePage(true)} disabled={saving || lockedByOther} title={lockedByOther ? 'Trang đang được người khác sửa' : undefined}>
            Xuất bản
          </button>
          <button className={`ed-btn ed-btn--primary ed-split-caret${versionNote ? ' has-dot' : ''}`} title="Ghi chú phiên bản, lên lịch xuất bản" aria-label="Tuỳ chọn xuất bản" onClick={() => useEditor.getState().openPublishMenu(!publishMenu)}>
            <ChevronDown size={15} />
          </button>
          {publishMenu && <PublishMenu />}
        </div>
      </div>
    </header>
  )
}

function DeviceSwitch({ device }: { device: Device }) {
  return (
    <div className="ed-seg ed-seg--lg" role="group" aria-label="Thiết bị">
      {DEVICES.map((d) => (
        <button key={d.id} title={d.label} className={device === d.id ? 'is-active' : ''} onClick={() => useEditor.getState().setDevice(d.id)}>
          <d.icon size={16} />
        </button>
      ))}
    </div>
  )
}

function UndoRedo({ canUndo, canRedo }: { canUndo: boolean; canRedo: boolean }) {
  return (
    <>
      <button className="ed-icon-btn" title="Hoàn tác (Ctrl+Z)" disabled={!canUndo} onClick={() => useEditor.getState().undo()}>
        <Undo2 size={17} />
      </button>
      <button className="ed-icon-btn" title="Làm lại (Ctrl+Shift+Z)" disabled={!canRedo} onClick={() => useEditor.getState().redo()}>
        <Redo2 size={17} />
      </button>
    </>
  )
}
