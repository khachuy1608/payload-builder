'use client'

import { FileText, Link2, Loader2, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useEditor } from './store'

interface LinkItem {
  label: string
  href: string
  sub?: string
}
interface LinkGroup {
  key: string
  label: string
  items: LinkItem[]
}

/**
 * Nút chọn liên kết nội bộ đặt cạnh ô URL: tìm trang, bài viết, sự kiện, sản phẩm… (mọi collection có trang mẫu động)
 * và điền đường dẫn theo ngôn ngữ đang sửa. Đường dẫn ngoài vẫn gõ tay như cũ.
 */
export function LinkPicker({ onPick }: { onPick: (href: string) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [groups, setGroups] = useState<LinkGroup[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const locale = useEditor((s) => s.locale)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      setError(null)
      fetch(`/api/builder/links?q=${encodeURIComponent(q)}&locale=${encodeURIComponent(locale)}`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Lỗi ${r.status}`))))
        .then((b: { groups: LinkGroup[] }) => setGroups(b.groups))
        .catch((e) => setError((e as Error).message))
    }, 200)
    return () => clearTimeout(timer)
  }, [open, q, locale])

  // bấm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <span className="ed-bind" ref={ref}>
      <button type="button" className="ed-bind-btn ed-link-btn" title="Chọn liên kết nội bộ (trang, bài viết, sự kiện…)" aria-label="Chọn liên kết nội bộ" data-action="link-picker" onClick={(e) => (e.preventDefault(), setOpen((o) => !o))}>
        <Link2 size={12} />
      </button>
      {open && (
        <span className="ed-popover ed-link-pop" onClick={(e) => e.preventDefault()}>
          <span className="ed-search" style={{ margin: 0 }}>
            <Search size={13} />
            <input autoFocus placeholder="Tìm trang, bài viết, sự kiện…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setOpen(false))} />
          </span>
          {!groups && !error && <Loader2 size={14} className="ed-spin" />}
          {error && <span className="ed-error">{error}</span>}
          {groups && !groups.length && <span className="ed-hint">Không có kết quả. Collection cần có “trang mẫu động” để liên kết tới từng bản ghi.</span>}
          {groups?.map((g) => (
            <span key={g.key} className="ed-link-group" data-group={g.key}>
              <span className="ed-label">{g.label}</span>
              {g.items.map((it) => (
                <button
                  key={it.href}
                  type="button"
                  className="ed-link-item"
                  data-href={it.href}
                  onClick={() => {
                    onPick(it.href)
                    setOpen(false)
                  }}
                >
                  <FileText size={13} />
                  <span className="ed-link-text">
                    <b>{it.label}</b>
                    {it.sub && <small>{it.sub}</small>}
                  </span>
                </button>
              ))}
            </span>
          ))}
        </span>
      )}
    </span>
  )
}
