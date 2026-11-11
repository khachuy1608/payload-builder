'use client'

import { LayoutTemplate, Loader2, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPageTemplates, type PageTemplate } from '@/builder/templates'
import type { BuilderNode } from '@/builder/types'
import { createMyBlock, deleteMyBlock } from './api'
import { BlockPreview } from './BlockPreview'
import { type BlockScope, useEditor } from './store'

/**
 * Mẫu trang: có sẵn (templates.ts) và của tôi/dùng chung (my-blocks kind = page).
 * Áp dụng = thay toàn bộ nội dung trang (hoàn tác được). Lưu trang hiện tại làm mẫu mới.
 */
export function TemplateDialog() {
  const close = () => useEditor.getState().openTemplateDialog(false)
  const blocks = useEditor((s) => s.blocks)
  const userId = useEditor((s) => s.userId)
  const root = useEditor((s) => s.root)
  const [tab, setTab] = useState<'builtin' | 'mine'>('builtin')
  const [name, setName] = useState('')
  const [scope, setScope] = useState<BlockScope>('shared')
  const [busy, setBusy] = useState(false)
  const builtin = getPageTemplates()
  const mine = Object.values(blocks)
    .filter((b) => b.kind === 'page' && (b.scope === 'shared' || b.owner === null || b.owner === userId))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const apply = (tree: BuilderNode, label: string) => {
    const s = useEditor.getState()
    if (s.root.children?.length && !confirm(`Thay toàn bộ nội dung trang bằng mẫu “${label}”? (Ctrl+Z để hoàn tác)`)) return
    s.applyPageTemplate(tree)
    s.toast('success', `Đã áp dụng mẫu “${label}”.`)
    close()
  }

  const saveAsTemplate = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      const block = await createMyBlock({ name: name.trim(), scope, kind: 'page', tree: root })
      useEditor.getState().upsertBlock(block)
      useEditor.getState().toast('success', `Đã lưu mẫu trang “${block.name}”.`)
      setName('')
      setTab('mine')
    } catch (err) {
      useEditor.getState().toast('error', `Không lưu được mẫu: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string, label: string) => {
    if (!confirm(`Xoá mẫu “${label}”?`)) return
    try {
      await deleteMyBlock(id)
      useEditor.getState().removeBlock(id)
    } catch (err) {
      useEditor.getState().toast('error', `Không xoá được: ${(err as Error).message}`)
    }
  }

  const tile = (key: string, label: string, description: string, tree: BuilderNode, onDelete?: () => void) => (
    <div key={key} className="ed-tpl" data-template={key}>
      <div className="ed-tpl-preview">{tree.children?.length ? <BlockPreview tree={tree} height={150} /> : <span className="ed-hint">Trống</span>}</div>
      <div className="ed-tpl-meta">
        <strong>{label}</strong>
        <span className="ed-help">{description}</span>
      </div>
      <div className="ed-row">
        <button className="ed-btn ed-btn--primary" onClick={() => apply(tree, label)}>
          Dùng mẫu này
        </button>
        {onDelete && (
          <button className="ed-icon-btn" title="Xoá mẫu" onClick={onDelete}>
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="ed-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="ed-modal ed-modal--lg" role="dialog" aria-label="Mẫu trang">
        <header className="ed-modal-head">
          <LayoutTemplate size={18} />
          <strong>Mẫu trang</strong>
          <div className="ed-tabs ed-tabs--small" style={{ marginLeft: 16 }}>
            <button className={tab === 'builtin' ? 'is-active' : ''} onClick={() => setTab('builtin')}>
              Có sẵn ({builtin.length})
            </button>
            <button className={tab === 'mine' ? 'is-active' : ''} onClick={() => setTab('mine')}>
              Của tôi & dùng chung ({mine.length})
            </button>
          </div>
          <button className="ed-icon-btn" onClick={close} aria-label="Đóng" style={{ marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        </header>
        <div className="ed-tpl-grid">
          {tab === 'builtin' && builtin.map((t: PageTemplate) => tile(t.id, t.name, t.description, t.root))}
          {tab === 'mine' && mine.map((b) => tile(b.id, b.name, b.scope === 'shared' ? 'Dùng chung' : 'Riêng tôi', b.tree, b.owner === null || b.owner === userId ? () => void remove(b.id, b.name) : undefined))}
          {tab === 'mine' && !mine.length && <p className="ed-hint">Chưa có mẫu nào. Dựng trang xong rồi lưu làm mẫu ở ô bên dưới.</p>}
        </div>
        <footer className="ed-modal-foot ed-row">
          <Save size={15} />
          <input className="ed-input" placeholder="Lưu trang hiện tại làm mẫu: đặt tên…" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} disabled={!root.children?.length} />
          <select className="ed-input" value={scope} onChange={(e) => setScope(e.target.value as BlockScope)} style={{ width: 150 }}>
            <option value="shared">Dùng chung</option>
            <option value="private">Riêng tôi</option>
          </select>
          <button className="ed-btn" disabled={busy || !name.trim() || !root.children?.length} onClick={() => void saveAsTemplate()}>
            {busy ? <Loader2 size={14} className="ed-spin" /> : null} Lưu làm mẫu
          </button>
        </footer>
      </div>
    </div>
  )
}
