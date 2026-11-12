'use client'

import { Check, Loader2, MessageSquare, RotateCcw, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { findNode } from '@/builder/tree'
import { addComment, formatCommentTime, removeComment, setCommentResolved } from './commentActions'
import { nodeLabel } from './labels'
import { useEditor } from './store'

const fmt = formatCommentTime

/** Tab Bình luận: thêm bình luận cho phần tử đang chọn, danh sách mở / đã giải quyết, nhảy tới phần tử */
export function CommentsPanel() {
  const comments = useEditor((s) => s.comments)
  const selectedId = useEditor((s) => s.selectedId)
  const root = useEditor((s) => s.root)
  const userId = useEditor((s) => s.userId)
  const role = useEditor((s) => s.role)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const target = selectedId ? findNode(root, selectedId) : null
  const list = comments.filter((c) => showResolved || !c.resolved)

  const add = async () => {
    if (!text.trim() || !target) return
    setBusy(true)
    if (await addComment(target.id, text)) setText('')
    setBusy(false)
  }
  const resolve = (id: string, resolved: boolean) => setCommentResolved(id, resolved)
  const remove = (id: string) => removeComment(id)

  return (
    <div className="ed-comments">
      <div className="ed-fields">
        <span className="ed-label">
          <MessageSquare size={13} style={{ verticalAlign: '-2px' }} /> {target ? `Bình luận cho: ${target.type === 'root' ? 'cả trang' : nodeLabel(target)}` : 'Chọn một phần tử để bình luận'}
        </span>
        <textarea className="ed-input" rows={3} placeholder="Viết bình luận…" value={text} disabled={!target || busy} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && void add()} />
        <button className="ed-btn ed-btn--primary" disabled={!target || !text.trim() || busy} onClick={() => void add()}>
          {busy ? <Loader2 size={14} className="ed-spin" /> : <Send size={14} />} Gửi (Ctrl+Enter)
        </button>
        <label className="ed-toggle">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          <span className="ed-toggle-ui" />
          <span>Hiện cả bình luận đã giải quyết</span>
        </label>
      </div>
      <div className="ed-comment-list">
        {!list.length && <p className="ed-hint">{comments.length ? 'Mọi bình luận đã được giải quyết.' : 'Chưa có bình luận nào.'}</p>}
        {list.map((c) => {
          const node = findNode(root, c.nodeId)
          const mine = c.author?.id === userId
          return (
            <div key={c.id} className={`ed-comment${c.resolved ? ' is-resolved' : ''}`} data-comment={c.id}>
              <div className="ed-comment-head">
                <strong>{c.author?.name || 'Ẩn danh'}</strong>
                <span className="ed-help">{fmt(c.createdAt)}</span>
              </div>
              <button className="ed-link ed-comment-target" onClick={() => node && useEditor.getState().select(node.id)} disabled={!node} title={node ? 'Chọn phần tử' : 'Phần tử không còn tồn tại'}>
                {node ? (node.type === 'root' ? 'Cả trang' : nodeLabel(node)) : 'Phần tử đã xoá'}
              </button>
              <p>{c.text}</p>
              <div className="ed-row">
                <button className="ed-btn ed-btn--sm" onClick={() => void resolve(c.id, !c.resolved)} title={c.resolved ? 'Mở lại' : 'Đánh dấu đã giải quyết'}>
                  {c.resolved ? <RotateCcw size={13} /> : <Check size={13} />} {c.resolved ? 'Mở lại' : 'Đã xong'}
                </button>
                {(mine || role === 'admin') && (
                  <button className="ed-icon-btn" onClick={() => void remove(c.id)} title="Xoá">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
