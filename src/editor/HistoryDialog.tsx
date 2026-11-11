'use client'

import { History, Loader2, RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listVersions, type PageVersion } from './api'
import { BlockPreview } from './BlockPreview'
import { useEditor } from './store'

/** Lịch sử phiên bản của trang: xem trước và khôi phục vào editor (chưa lưu cho tới khi bấm Lưu/Xuất bản) */
export function HistoryDialog() {
  const pageId = useEditor((s) => s.pageId)
  const [versions, setVersions] = useState<PageVersion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PageVersion | null>(null)
  const close = () => useEditor.getState().openHistory(false)

  useEffect(() => {
    listVersions(pageId)
      .then((list) => {
        setVersions(list)
        setSelected(list[0] ?? null)
      })
      .catch((e) => setError((e as Error).message))
  }, [pageId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const restore = () => {
    if (!selected) return
    const s = useEditor.getState()
    if (s.dirty && !confirm('Khôi phục sẽ thay nội dung đang sửa (có thể Ctrl+Z để hoàn tác). Tiếp tục?')) return
    s.restoreVersion({ root: selected.content.root, title: selected.title, slug: selected.slug })
    s.toast('success', `Đã khôi phục bản ${fmt(selected.updatedAt)} vào editor. Bấm Lưu nháp hoặc Xuất bản để giữ lại.`)
    close()
  }

  return (
    <div className="ed-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="ed-modal ed-modal--lg" role="dialog" aria-label="Lịch sử phiên bản">
        <header className="ed-modal-head">
          <History size={18} />
          <strong>Lịch sử phiên bản</strong>
          <button className="ed-icon-btn" onClick={close} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        <div className="ed-theme-layout">
          <aside className="ed-theme-list">
            {!versions && !error && <Loader2 size={16} className="ed-spin" />}
            {error && <p className="ed-error">{error}</p>}
            {versions?.map((v) => (
              <button key={v.id} className={`ed-theme-row ed-version-row${selected?.id === v.id ? ' is-active' : ''}`} onClick={() => setSelected(v)}>
                <span className="ed-theme-name">
                  {fmt(v.updatedAt)}
                  <span className={`ed-badge ed-badge--${v.status === 'published' ? 'ok' : 'muted'}`}>{v.status === 'published' ? 'Xuất bản' : 'Nháp'}</span>
                </span>
              </button>
            ))}
            {versions && !versions.length && <p className="ed-hint">Chưa có phiên bản nào. Mỗi lần Lưu nháp / Xuất bản tạo một bản.</p>}
          </aside>
          <section className="ed-theme-editor">
            {selected ? (
              <>
                <div className="ed-row" style={{ justifyContent: 'space-between' }}>
                  <span className="ed-help">
                    <b>{selected.title}</b> · /{selected.slug === 'home' ? '' : selected.slug} · {fmt(selected.updatedAt)}
                  </span>
                  <button className="ed-btn ed-btn--primary" onClick={restore}>
                    <RotateCcw size={14} /> Khôi phục vào editor
                  </button>
                </div>
                <BlockPreview key={selected.id} tree={selected.content.root} height={420} />
                <p className="ed-hint" style={{ margin: 0 }}>
                  Khôi phục chỉ đưa nội dung vào editor như một bước chỉnh sửa (Ctrl+Z hoàn tác được); trang chỉ đổi khi bạn Lưu nháp hoặc Xuất bản.
                </p>
              </>
            ) : (
              <p className="ed-hint">Chọn một phiên bản để xem trước.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function fmt(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}
