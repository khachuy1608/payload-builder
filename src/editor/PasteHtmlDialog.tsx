'use client'

import { ClipboardPaste, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BlockPreview } from './BlockPreview'
import { htmlToBlocks } from './htmlImport'
import { defaultTarget, useEditor } from './store'

const SAMPLE_HTML = `<div class="card">
  <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800" alt="Phong cảnh">
  <h3>Tiêu đề thẻ</h3>
  <p>Mô tả ngắn với <b>chữ đậm</b> và <a href="/lien-he">liên kết</a>.</p>
  <a class="btn" href="/dang-ky">Đăng ký ngay</a>
</div>`
const SAMPLE_CSS = `.card { padding: 24px; border-radius: 16px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.08); display: flex; flex-direction: column; gap: 12px; max-width: 360px }
.card img { border-radius: 12px; width: 100% }
.card h3 { font-size: 22px; margin: 0 }
.card p { color: #475569 }
.btn { background: #4f46e5; color: #fff; padding: 10px 18px; border-radius: 999px; align-self: flex-start }
.btn:hover { background: #4338ca }
@media (max-width: 767px) { .card { padding: 16px } }`

/** “Dán HTML / CSS”: chuyển đoạn HTML + CSS thành block (xem trước rồi chèn vào trang) */
export function PasteHtmlDialog() {
  const close = () => useEditor.getState().openPasteHtml(false)
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const result = useMemo(() => (html.trim() ? htmlToBlocks(html, css) : null), [html, css])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const insert = () => {
    if (!result?.node) return
    const s = useEditor.getState()
    const target = defaultTarget(s.root, s.selectedId, result.node.type)
    if (!target || !s.insertNode(result.node, target)) {
      s.toast('error', 'Không chèn được ở vị trí này – hãy chọn một vùng chứa khác.')
      return
    }
    s.select(result.node.id)
    s.toast('success', `Đã tạo ${result.count} phần tử từ HTML/CSS. Có thể “Lưu thành My Block” trên thanh công cụ để dùng lại.`)
    close()
  }

  return (
    <div className="ed-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="ed-modal ed-modal--lg" role="dialog" aria-label="Dán HTML / CSS">
        <header className="ed-modal-head">
          <ClipboardPaste size={18} />
          <strong>Dán HTML / CSS để tạo block</strong>
          <button className="ed-btn" style={{ marginLeft: 'auto' }} onClick={() => (setHtml(SAMPLE_HTML), setCss(SAMPLE_CSS))}>
            Dùng ví dụ
          </button>
          <button className="ed-icon-btn" onClick={close} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        <div className="ed-paste-layout">
          <div className="ed-fields">
            <label className="ed-field">
              <span className="ed-label">HTML (có thể kèm thẻ &lt;style&gt;)</span>
              <textarea className="ed-input ed-textarea ed-code" rows={11} spellCheck={false} data-field="pasteHtml" placeholder={'<div class="card">…</div>'} value={html} onChange={(e) => setHtml(e.target.value)} />
            </label>
            <label className="ed-field">
              <span className="ed-label">CSS (tuỳ chọn)</span>
              <textarea className="ed-input ed-textarea ed-code" rows={8} spellCheck={false} data-field="pasteCss" placeholder=".card { padding: 24px }  .card:hover { … }  @media (max-width: 767px) { … }" value={css} onChange={(e) => setCss(e.target.value)} />
            </label>
            <span className="ed-help">
              Thẻ được đổi sang block tương ứng: tiêu đề → Heading, đoạn văn/danh sách → Paragraph, ảnh → Image, link class “btn/button” → Button, link bọc khối → Div có “Khi bấm”, video/iframe → Video/Nhúng. Luật CSS gán theo selector; :hover → Hover; @media max-width → Tablet/Mobile. Script, form và biến CSS bị bỏ.
            </span>
          </div>
          <div className="ed-fields">
            <span className="ed-label">Xem trước</span>
            <div className="ed-paste-preview">{result?.node ? <BlockPreview key={JSON.stringify(result.node).length + html.length + css.length} tree={result.node} height={300} /> : <span className="ed-hint">Dán HTML để xem trước.</span>}</div>
            {result && (
              <span className="ed-help" data-paste-summary="">
                {result.node ? `Sẽ tạo ${result.count} phần tử.` : ''} {result.warnings.join(' ')}
              </span>
            )}
          </div>
        </div>
        <footer className="ed-modal-foot ed-row" style={{ justifyContent: 'flex-end' }}>
          <button className="ed-btn" onClick={close}>
            Huỷ
          </button>
          <button className="ed-btn ed-btn--primary" disabled={!result?.node} onClick={insert}>
            Chèn vào trang
          </button>
        </footer>
      </div>
    </div>
  )
}
