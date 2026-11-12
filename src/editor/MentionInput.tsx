'use client'

/**
 * Ô viết bình luận có @nhắc tên: gõ "@" + chữ -> danh sách người dùng (avatar + tên), ↑/↓ chọn, Enter/Tab chèn,
 * Esc đóng gợi ý. Người được chọn chỉ tính là "được nhắc" nếu "@Tên" còn nằm trong nội dung lúc gửi.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { listMentionUsers, type MentionUser } from './api'
import { CommentAvatar } from './CommentAvatar'

let usersCache: Promise<MentionUser[]> | null = null
const loadUsers = () => (usersCache ??= listMentionUsers().catch(() => ((usersCache = null), [])))

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export interface MentionInputHandle {
  focus(): void
  /** id người được nhắc còn có "@Tên" trong nội dung */
  mentionIds(text: string): string[]
}

export const MentionInput = forwardRef<
  MentionInputHandle,
  { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled?: boolean; rows?: number; placeholder?: string; className?: string }
>(function MentionInput({ value, onChange, onSubmit, disabled, rows = 2, placeholder, className }, ref) {
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [users, setUsers] = useState<MentionUser[]>([])
  const [picked, setPicked] = useState<MentionUser[]>([])
  const [query, setQuery] = useState<{ text: string; start: number } | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    void loadUsers().then(setUsers)
  }, [])
  // gửi xong (nội dung trống) -> quên danh sách đã chọn
  useEffect(() => {
    if (!value) setPicked([])
  }, [value])

  useImperativeHandle(ref, () => ({
    focus: () => areaRef.current?.focus(),
    mentionIds: (text) => [...new Set(picked.filter((u) => text.includes(`@${u.name}`)).map((u) => u.id))],
  }))

  const matches = query ? users.filter((u) => fold(u.name).includes(fold(query.text)) || fold(u.email).includes(fold(query.text))).slice(0, 6) : []

  const detect = (text: string, caret: number) => {
    // "@" ở đầu hoặc sau khoảng trắng, theo sau tối đa 30 ký tự không xuống dòng
    const m = /(^|\s)@([^\s@]{0,30})$/.exec(text.slice(0, caret))
    if (m) {
      setQuery({ text: m[2], start: caret - m[2].length - 1 })
      setActive(0)
    } else setQuery(null)
  }

  const insert = (u: MentionUser) => {
    const el = areaRef.current
    if (!el || !query) return
    const caret = el.selectionStart ?? value.length
    const next = `${value.slice(0, query.start)}@${u.name} ${value.slice(caret)}`
    onChange(next)
    setPicked((p) => (p.some((x) => x.id === u.id) ? p : [...p, u]))
    setQuery(null)
    const pos = query.start + u.name.length + 2
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="ed-mention">
      <textarea
        ref={areaRef}
        className={className ?? 'ed-input'}
        rows={rows}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-autocomplete="list"
        aria-expanded={!!matches.length}
        onChange={(e) => {
          onChange(e.target.value)
          detect(e.target.value, e.target.selectionStart ?? e.target.value.length)
        }}
        onKeyDown={(e) => {
          if (matches.length) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length)
              return
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault()
              insert(matches[active])
              return
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              setQuery(null)
              return
            }
          }
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            onSubmit()
          }
        }}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
      />
      {matches.length > 0 && (
        <div className="ed-mention-list" role="listbox" aria-label="Nhắc tới">
          {matches.map((u, i) => (
            <button
              key={u.id}
              type="button"
              role="option"
              aria-selected={i === active}
              data-mention-user={u.id}
              className={`ed-mention-item${i === active ? ' is-active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(u)}
            >
              <CommentAvatar author={{ id: u.id, name: u.name, avatar: u.avatar }} size={22} />
              <span>
                <b>{u.name}</b>
                <small>{u.email}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

/** Tô màu "@Tên" của người được nhắc trong nội dung bình luận */
export function MentionText({ text, mentions }: { text: string; mentions: { id: string; name: string }[] }) {
  const names = mentions.map((m) => m.name).filter(Boolean).sort((a, b) => b.length - a.length)
  if (!names.length) return <>{text}</>
  const re = new RegExp(`@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  const out: React.ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index))
    out.push(
      <span key={m.index} className="ed-mention-tag">
        {m[0]}
      </span>,
    )
    last = m.index! + m[0].length
  }
  out.push(text.slice(last))
  return <>{out}</>
}
