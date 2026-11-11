'use client'

import { Copy, ExternalLink, Link2, Loader2, RefreshCw, Search, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { BLOCK_REF_TYPE } from '@/builder/refs'
import { deleteMyBlock, refreshBlockLibrary } from './api'
import { BlockPreview } from './BlockPreview'
import { type MyBlock, useEditor } from './store'

/** Tab "My Blocks" ở panel trái: thư viện block đã lưu, kéo thả hoặc bấm để chèn */
export function MyBlocksPanel() {
  const blocks = useEditor((s) => s.blocks)
  const status = useEditor((s) => s.blocksStatus)
  const userId = useEditor((s) => s.userId)
  const insertMode = useEditor((s) => s.insertMode)
  const kind = useEditor((s) => s.kind)
  const editingBlockId = useEditor((s) => s.pageId)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const isMine = (b: MyBlock) => b.owner === null || b.owner === userId
  const list = Object.values(blocks)
    .filter((b) => b.scope === 'shared' || isMine(b))
    .filter((b) => !q || b.name.toLowerCase().includes(q))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  return (
    <div className="ed-blocks">
      <div className="ed-row">
        <label className="ed-search" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={14} />
          <input placeholder="Tìm block..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button className="ed-icon-btn" title="Tải lại thư viện" onClick={() => refreshBlockLibrary()} disabled={status === 'loading'}>
          {status === 'loading' ? <Loader2 size={16} className="ed-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      <div className="ed-field">
        <span className="ed-label">Chèn dạng</span>
        <div className="ed-seg ed-seg--full">
          <button className={insertMode === 'copy' ? 'is-active' : ''} onClick={() => useEditor.getState().setInsertMode('copy')} title="Bản sao độc lập, sửa thoải mái">
            <Copy size={13} /> Bản sao
          </button>
          <button className={insertMode === 'linked' ? 'is-active' : ''} onClick={() => useEditor.getState().setInsertMode('linked')} title="Liên kết tới bản gốc: sửa gốc thì mọi trang cập nhật">
            <Link2 size={13} /> Liên kết
          </button>
        </div>
        <span className="ed-help">
          {insertMode === 'copy'
            ? 'Bản sao độc lập với bản gốc, có thể sửa từng phần tử.'
            : 'Phần tử liên kết chỉ đọc; sửa bản gốc thì mọi trang dùng nó cùng cập nhật. Có thể “Tách” bất cứ lúc nào.'}
        </span>
      </div>

      {status === 'error' && (
        <p className="ed-hint">
          Không tải được thư viện.{' '}
          <button className="ed-link" onClick={() => refreshBlockLibrary()}>
            Thử lại
          </button>
        </p>
      )}
      {status === 'ready' && !list.length && (
        <p className="ed-hint">
          {q ? 'Không có block nào khớp.' : 'Chưa có block nào. Chọn một phần tử trên trang rồi bấm nút “Lưu thành My Block” trên thanh công cụ của nó.'}
        </p>
      )}

      <div className="ed-block-list">
        {list.map((b) => (
          <BlockTile key={b.id} block={b} mine={isMine(b)} linked={insertMode === 'linked'} disabled={kind === 'block' && b.id === editingBlockId} />
        ))}
      </div>
    </div>
  )
}

function BlockTile({ block, mine, linked, disabled }: { block: MyBlock; mine: boolean; linked: boolean; disabled: boolean }) {
  const [busy, setBusy] = useState(false)
  const s = useEditor.getState

  const remove = async () => {
    if (!confirm(`Xoá block “${block.name}”? Trang đang dùng dạng liên kết sẽ hiện ô trống; bản sao không bị ảnh hưởng.`)) return
    setBusy(true)
    try {
      await deleteMyBlock(block.id)
      s().removeBlock(block.id)
      s().toast('success', 'Đã xoá block.')
    } catch (err) {
      s().toast('error', `Xoá thất bại: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`ed-block-tile${disabled ? ' is-disabled' : ''}`}
      draggable={!disabled}
      title={disabled ? 'Đây là block đang sửa' : linked ? 'Kéo vào trang để chèn liên kết, hoặc bấm để thêm' : 'Kéo vào trang để chèn bản sao, hoặc bấm để thêm'}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', `block:${block.id}`)
        e.dataTransfer.effectAllowed = 'copy'
        s().startDrag({ kind: 'block', blockId: block.id, linked, blockType: linked ? BLOCK_REF_TYPE : block.tree.type })
      }}
      onDragEnd={() => s().endDrag()}
      onClick={() => !disabled && s().insertMyBlock(block.id, linked)}
    >
      {block.thumbnail?.url ? (
        <div className="ed-block-preview" style={{ height: 96 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.thumbnail.url} alt="" />
        </div>
      ) : (
        <BlockPreview tree={block.tree} />
      )}
      <div className="ed-block-meta">
        <strong className="ed-block-name">{block.name}</strong>
        <span className="ed-block-tags">
          {block.scope === 'shared' && (
            <span className="ed-chip" title="Mọi editor đều thấy">
              <Users size={11} /> Chung
            </span>
          )}
          {!mine && <span className="ed-chip">Của người khác</span>}
        </span>
      </div>
      <div className="ed-block-actions" onClick={(e) => e.stopPropagation()} onDragStart={(e) => e.stopPropagation()}>
        <a className="ed-icon-btn" href={`/builder/block/${block.id}`} target="_blank" rel="noreferrer" title={mine ? 'Sửa bản gốc (tab mới)' : 'Xem bản gốc (tab mới)'}>
          <ExternalLink size={14} />
        </a>
        {mine && (
          <button className="ed-icon-btn" title="Xoá block" disabled={busy} onClick={remove}>
            {busy ? <Loader2 size={14} className="ed-spin" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}
