'use client'

import { GitCompare, History, Loader2, RotateCcw, X } from 'lucide-react'
import { diffTrees, summarizeDiff } from '@/builder/diff'
import { getBlock } from '@/builder/registry'
import { findNode } from '@/builder/tree'
import { nodeLabel } from './labels'
import { useEffect, useState } from 'react'
import { listVersions, type PageVersion } from './api'
import { BlockPreview } from './BlockPreview'
import type { BuilderNode } from '@/builder/types'
import { useEditor } from './store'

/** Lịch sử phiên bản của trang: xem trước và khôi phục vào editor (chưa lưu cho tới khi bấm Lưu/Xuất bản) */
export function HistoryDialog() {
  const pageId = useEditor((s) => s.pageId)
  const [versions, setVersions] = useState<PageVersion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PageVersion | null>(null)
  const [compare, setCompare] = useState(false)
  const root = useEditor((s) => s.root)
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
                {v.note && <span className="ed-version-note">“{v.note}”</span>}
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
                  <span className="ed-row">
                    <button className={`ed-btn${compare ? ' is-active' : ''}`} onClick={() => setCompare((c) => !c)} title="Liệt kê phần tử khác nhau giữa phiên bản này và nội dung đang sửa">
                      <GitCompare size={14} /> So sánh với bản đang sửa
                    </button>
                    <button className="ed-btn ed-btn--primary" onClick={restore}>
                      <RotateCcw size={14} /> Khôi phục vào editor
                    </button>
                  </span>
                </div>
                {selected.note && <p className="ed-hint" style={{ margin: 0 }}>Ghi chú: {selected.note}</p>}
                {compare ? <DiffView before={selected.content.root} after={root} /> : <BlockPreview key={selected.id} tree={selected.content.root} height={420} />}
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

const KIND_LABEL = { added: 'Thêm', removed: 'Xoá', changed: 'Đổi', moved: 'Dời' } as const
const KIND_CLS = { added: 'ok', removed: 'danger', changed: 'warn', moved: 'muted' } as const

/** Danh sách khác biệt phiên bản cũ -> nội dung đang sửa */
function DiffView({ before, after }: { before: BuilderNode; after: BuilderNode }) {
  const entries = diffTrees(before, after)
  const sum = summarizeDiff(entries)
  if (!entries.length) return <p className="ed-hint">Không có khác biệt với nội dung đang sửa.</p>
  return (
    <div className="ed-fields">
      <span className="ed-help">
        {sum.added} thêm · {sum.removed} xoá · {sum.changed} đổi · {sum.moved} dời chỗ (so với nội dung đang sửa)
      </span>
      <div className="ed-diff">
        {entries.map((e) => {
          const node = findNode(e.kind === 'removed' ? before : after, e.id)
          return (
            <div key={e.kind + e.id} className="ed-diff-row">
              <span className={`ed-badge ed-badge--${KIND_CLS[e.kind]}`}>{KIND_LABEL[e.kind]}</span>
              <span>{node ? nodeLabel(node) : getBlock(e.type)?.label ?? e.type}</span>
              {e.changes && <code>{e.changes.join(', ')}</code>}
              {e.kind !== 'removed' && (
                <button className="ed-link" onClick={() => useEditor.getState().select(e.id)}>
                  chọn
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function fmt(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}
