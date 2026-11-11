'use client'

import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BLOCK_REF_TYPE } from '@/builder/refs'
import { getBlock } from '@/builder/registry'
import { richToPlain } from '@/builder/sanitize'
import { findNode, genId } from '@/builder/tree'
import { createMyBlock } from './api'
import { BlockPreview } from './BlockPreview'
import { type BlockScope, useEditor } from './store'

/** Hộp thoại "Lưu thành My Block" cho phần tử đang chọn */
export function SaveBlockDialog({ nodeId }: { nodeId: string }) {
  const root = useEditor((s) => s.root)
  const node = findNode(root, nodeId)
  const def = node ? getBlock(node.type) : undefined
  const suggested = node ? suggestName(node.type, node.props) : ''
  const [name, setName] = useState(suggested)
  const [scope, setScope] = useState<BlockScope>('private')
  const [replace, setReplace] = useState(false)
  const [saving, setSaving] = useState(false)
  const close = () => useEditor.getState().openSaveBlock(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  if (!node) return null

  const save = async () => {
    const s = useEditor.getState()
    const finalName = name.trim()
    if (!finalName) return s.toast('error', 'Hãy đặt tên cho block.')
    setSaving(true)
    try {
      const block = await createMyBlock({ name: finalName, scope, tree: structuredClone(node) })
      s.upsertBlock(block)
      if (replace) {
        s.replaceNode(node.id, { id: genId(), type: BLOCK_REF_TYPE, props: { blockId: block.id, name: block.name }, styles: {} })
      }
      s.toast('success', `Đã lưu block “${block.name}”. Xem ở tab My Blocks.`)
      s.setLeftTab('blocks')
      close()
    } catch (err) {
      s.toast('error', `Lưu block thất bại: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ed-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="ed-modal ed-modal--sm" role="dialog" aria-label="Lưu thành My Block">
        <header className="ed-modal-head">
          <strong>Lưu thành My Block</strong>
          <button className="ed-icon-btn" onClick={close} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        <div className="ed-modal-body">
          <BlockPreview tree={node} height={140} />
          <p className="ed-help">
            Phần tử: <b>{def?.label ?? node.type}</b>
            {node.children?.length ? ` (chứa ${node.children.length} phần tử con)` : ''}
          </p>
          <label className="ed-field">
            <span className="ed-label">Tên block</span>
            <input className="ed-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
          </label>
          <label className="ed-field">
            <span className="ed-label">Phạm vi</span>
            <select className="ed-input" value={scope} onChange={(e) => setScope(e.target.value as BlockScope)}>
              <option value="private">Riêng tôi</option>
              <option value="shared">Dùng chung (mọi editor đều thấy)</option>
            </select>
          </label>
          <label className="ed-toggle">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            <span className="ed-toggle-ui" />
            Thay phần tử này bằng liên kết tới block vừa lưu
          </label>
          <span className="ed-help">Bật nếu muốn chỗ này tự cập nhật khi sửa bản gốc. Tắt thì phần tử trên trang giữ nguyên, chỉ lưu thêm bản sao vào thư viện.</span>
        </div>
        <footer className="ed-modal-foot ed-modal-foot--right">
          <button className="ed-btn" onClick={close} disabled={saving}>
            Huỷ
          </button>
          <button className="ed-btn ed-btn--primary" onClick={save} disabled={saving}>
            {saving && <Loader2 size={15} className="ed-spin" />} Lưu block
          </button>
        </footer>
      </div>
    </div>
  )
}

function suggestName(type: string, props: Record<string, unknown>): string {
  const label = getBlock(type)?.label ?? type
  const txt = typeof props.text === 'string' ? richToPlain(props.text).trim().slice(0, 40) : ''
  return txt ? `${label}: ${txt}` : label
}
