'use client'
/** Ảnh đại diện người bình luận: ảnh từ hồ sơ, không có thì chữ cái đầu trên nền màu riêng của từng người */
import type { CommentDoc } from './api'

const COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#10b981', '#ec4899', '#6366f1', '#14b8a6']

function colorFor(id: string | undefined): string {
  let h = 0
  for (const ch of id ?? '') h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function CommentAvatar({ author, size = 28 }: { author: CommentDoc['author']; size?: number }) {
  const name = author?.name || 'Ẩn danh'
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) }
  if (author?.avatar)
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="ed-cav" src={author.avatar} alt={name} title={name} style={style} />
  return (
    <span className="ed-cav" title={name} aria-label={name} style={{ ...style, background: colorFor(author?.id) }}>
      {initialsOf(name)}
    </span>
  )
}

/** Người bình luận (không trùng), mới nhất trước */
export function commentAuthors(list: CommentDoc[]): NonNullable<CommentDoc['author']>[] {
  const seen = new Set<string>()
  const out: NonNullable<CommentDoc['author']>[] = []
  for (const c of [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))) {
    const a = c.author ?? { id: 'anon', name: 'Ẩn danh', avatar: null }
    if (seen.has(a.id)) continue
    seen.add(a.id)
    out.push(a)
  }
  return out
}
