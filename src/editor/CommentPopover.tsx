'use client'

/**
 * Khung bình luận nổi trên canvas (chế độ chuột Bình luận): mở tại chỗ bấm vào phần tử,
 * hiện luồng bình luận của phần tử đó + ô viết bình luận mới. Esc / bấm ra ngoài để đóng.
 */
import { Check, ChevronDown, Loader2, MessageSquare, RotateCcw, Send, Trash2, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { findNode } from '@/builder/tree'
import { CommentAvatar } from './CommentAvatar'
import { addComment, formatCommentTime, removeComment, setCommentResolved } from './commentActions'
import { nodeLabel } from './labels'
import { useEditor } from './store'

const W = 340

export function CommentPopover() {
  const pop = useEditor((s) => s.commentPop)
  const comments = useEditor((s) => s.comments)
  const root = useEditor((s) => s.root)
  const userId = useEditor((s) => s.userId)
  const role = useEditor((s) => s.role)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const nodeId = pop?.nodeId
  // đổi phần tử: xoá chữ đang gõ dở, thu gọn mục đã giải quyết, focus ô nhập
  useEffect(() => {
    setText('')
    setShowResolved(false)
    if (nodeId) setTimeout(() => inputRef.current?.focus(), 0)
  }, [nodeId, pop?.x, pop?.y])

  // đặt khung cạnh chỗ bấm, luôn nằm trong cửa sổ (lật sang trái / lên trên khi thiếu chỗ)
  useLayoutEffect(() => {
    if (!pop) return setPos(null)
    const h = boxRef.current?.offsetHeight ?? 320
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = pop.x + 14
    if (left + W > vw - 8) left = Math.max(8, pop.x - W - 14)
    let top = pop.y - 20
    if (top + h > vh - 8) top = Math.max(8, vh - h - 8)
    setPos({ left, top })
  }, [pop, comments.length, showResolved])

  useEffect(() => {
    if (!pop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        useEditor.getState().openCommentPop(null)
      }
    }
    const onDown = (e: MouseEvent) => {
      if (boxRef.current?.contains(e.target as Node)) return
      // bấm vào huy hiệu bình luận khác: để huy hiệu tự mở khung mới
      if ((e.target as HTMLElement).closest?.('[data-comment-pin]')) return
      useEditor.getState().openCommentPop(null)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousedown', onDown, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousedown', onDown, true)
    }
  }, [pop])

  if (!pop) return null
  const node = findNode(root, pop.nodeId)
  const label = !node ? 'Phần tử' : node.type === 'root' ? 'Cả trang' : nodeLabel(node)
  const thread = comments.filter((c) => c.nodeId === pop.nodeId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
  const open = thread.filter((c) => !c.resolved)
  const resolved = thread.filter((c) => c.resolved)
  const shown = showResolved ? thread : open

  const send = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    if (await addComment(pop.nodeId, text)) setText('')
    setBusy(false)
    inputRef.current?.focus()
  }

  return createPortal(
    <div
      ref={boxRef}
      className="ed-cpop"
      role="dialog"
      aria-label={`Bình luận cho ${label}`}
      data-comment-pop={pop.nodeId}
      style={{ width: W, left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
    >
      <header className="ed-cpop-head">
        <MessageSquare size={15} />
        <span className="ed-cpop-title">
          <b>{label}</b>
          <small>{open.length ? `${open.length} bình luận đang mở` : 'Chưa có bình luận đang mở'}</small>
        </span>
        <button type="button" className="ed-icon-btn" onClick={() => useEditor.getState().openCommentPop(null)} aria-label="Đóng">
          <X size={16} />
        </button>
      </header>
      <div className="ed-cpop-list">
        {!shown.length && <p className="ed-hint">{resolved.length ? 'Mọi bình luận của phần tử này đã được giải quyết.' : 'Hãy là người đầu tiên bình luận về phần tử này.'}</p>}
        {shown.map((c) => {
          const mine = c.author?.id === userId
          const name = c.author?.name || 'Ẩn danh'
          return (
            <div key={c.id} className={`ed-cpop-item${c.resolved ? ' is-resolved' : ''}`} data-comment={c.id}>
              <CommentAvatar author={c.author} size={28} />
              <div className="ed-cpop-body">
                <div className="ed-cpop-meta">
                  <b>{name}</b>
                  <span>{formatCommentTime(c.createdAt)}</span>
                  {c.resolved && <em>Đã giải quyết</em>}
                </div>
                <p>{c.text}</p>
                <div className="ed-cpop-actions">
                  <button type="button" className="ed-linkbtn" onClick={() => void setCommentResolved(c.id, !c.resolved)}>
                    {c.resolved ? <RotateCcw size={12} /> : <Check size={12} />} {c.resolved ? 'Mở lại' : 'Đã xong'}
                  </button>
                  {(mine || role === 'admin') && (
                    <button type="button" className="ed-linkbtn ed-linkbtn--danger" onClick={() => void removeComment(c.id)}>
                      <Trash2 size={12} /> Xoá
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {resolved.length > 0 && (
          <button type="button" className="ed-cpop-more" onClick={() => setShowResolved((v) => !v)}>
            <ChevronDown size={13} style={{ transform: showResolved ? 'rotate(180deg)' : undefined }} />
            {showResolved ? 'Ẩn bình luận đã giải quyết' : `Hiện ${resolved.length} bình luận đã giải quyết`}
          </button>
        )}
      </div>
      <div className="ed-cpop-compose">
        <textarea
          ref={inputRef}
          className="ed-input"
          rows={2}
          placeholder="Viết bình luận… (Ctrl+Enter để gửi)"
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              void send()
            }
          }}
        />
        <button type="button" className="ed-btn ed-btn--primary" disabled={!text.trim() || busy} onClick={() => void send()} aria-label="Gửi bình luận">
          {busy ? <Loader2 size={14} className="ed-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>,
    document.body,
  )
}
