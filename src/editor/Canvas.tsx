'use client'

/**
 * Canvas: một <iframe> cùng origin, nội dung được render bằng React portal với CHÍNH renderer của front-end.
 * - iframe cách ly CSS của editor và giúp media query chạy đúng theo bề rộng thiết bị.
 * - Sự kiện chuột/kéo thả/phím được nghe trực tiếp trên document của iframe.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { compileTreeCss } from '@/builder/css'
import { resolveData } from '@/builder/data'
import { resolveRefs } from '@/builder/refs'
import { getBlock } from '@/builder/registry'
import { sanitizeRichText } from '@/builder/sanitize'
import { BuilderRuntime } from '@/builder/blocks/Runtime'
import { RenderNode } from '@/builder/Renderer'
import { BASE_CSS, themeToCss } from '@/builder/theme'
import { sitePartOf, withSiteParts } from '@/builder/siteParts'
import { findNode, getAncestors } from '@/builder/tree'
import { applyViewStates, viewStateInfo } from '@/builder/viewState'
import { computeDrop } from './dnd'
import { CommentPopover } from './CommentPopover'
import { Overlay } from './Overlay'
import { handleShortcut } from './shortcuts'
import { blockLookup, effectiveTheme, useEditor } from './store'

const CANVAS_CSS = `
body{user-select:none;-webkit-user-select:none}
[data-node-id]{cursor:default}
[data-empty]{min-height:72px;outline:1px dashed #c7d2fe;outline-offset:-1px;position:relative}
[data-empty]::after{content:'Kéo phần tử vào đây';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#818cf8;font:13px/1.4 system-ui,sans-serif;pointer-events:none}
.bld-root[data-empty]{outline:none}
.bld-root[data-empty]::after{content:'Kéo phần tử từ panel bên trái vào đây, hoặc bấm vào một phần tử để thêm';}
body.bld-commenting,body.bld-commenting *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M4 3h20a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H11l-6 5v-5H4a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z' fill='%234f46e5' stroke='white' stroke-width='1.5'/%3E%3Cpath d='M14 7v8M10 11h8' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 5 26,crosshair!important}
.bld-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:120px;background:#f1f5f9;color:#64748b;font:13px/1.4 system-ui,sans-serif;border:1px dashed #cbd5e1;border-radius:6px;text-align:center;padding:12px}
[data-node-id] iframe{pointer-events:none}
[contenteditable]{outline:none;cursor:text;user-select:text;-webkit-user-select:text}
[contenteditable] a{pointer-events:none}
body.is-dragging,body.is-dragging *{cursor:grabbing!important}
a[data-node-id]{cursor:default}
[data-linked]{cursor:default}
[data-cond-hidden]{opacity:.35;outline:1px dashed #f59e0b;outline-offset:-1px}
[data-linked] [contenteditable]{cursor:default}
`

/** Bề rộng khung theo thiết bị. Desktop là bề rộng tối thiểu (trên breakpoint tablet 1024px) */
const DEVICE_PX = { desktop: 1280, tablet: 768, mobile: 375 } as const

const SRC_DOC = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${BASE_CSS}${CANVAS_CSS}</style></head><body><div id="bld-mount"></div></body></html>`

function nodeElement(target: EventTarget | null): HTMLElement | null {
  const el = target as Element | null
  return (el?.closest?.('[data-node-id]') as HTMLElement) ?? null
}

/** Nhấp đúp vào Heading/Paragraph/Button để sửa chữ ngay trên canvas */
function startInlineEdit(doc: Document, outer: HTMLElement, nodeId: string) {
  const s = useEditor.getState()
  const node = findNode(s.root, nodeId)
  const def = node ? getBlock(node.type) : undefined
  if (!node || !def?.inlineEdit || s.editingId) return
  // block có icon (Button): chỉ sửa phần chữ
  const el = (outer.querySelector(':scope > .b-button-text') as HTMLElement | null) ?? outer
  const { prop, multiline, rich } = def.inlineEdit
  const original = String(node.props[prop] ?? '')

  s.select(nodeId)
  s.setEditing(nodeId)
  el.setAttribute('contenteditable', rich ? 'true' : 'plaintext-only')
  if (!el.isContentEditable) el.setAttribute('contenteditable', 'true')
  el.focus()
  const range = doc.createRange()
  range.selectNodeContents(el)
  const sel = doc.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)

  let cancelled = false
  const RICH_KEYS: Record<string, string> = { b: 'bold', i: 'italic', u: 'underline' }
  const onKey = (e: KeyboardEvent) => {
    e.stopPropagation()
    const mod = e.metaKey || e.ctrlKey
    if (e.key === 'Escape') {
      cancelled = true
      el.blur()
    } else if (e.key === 'Enter' && (!multiline || mod)) {
      e.preventDefault()
      el.blur()
    } else if (e.key === 'Enter' && rich) {
      // trong mục danh sách: để trình duyệt tạo mục mới; ngoài ra xuống dòng bằng <br> thay vì <div>
      const anchor = doc.getSelection()?.anchorNode
      const inList = !!(anchor && (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement)?.closest('li'))
      if (inList) return
      e.preventDefault()
      doc.execCommand('insertLineBreak')
    } else if (rich && mod && RICH_KEYS[e.key.toLowerCase()]) {
      e.preventDefault()
      doc.execCommand(RICH_KEYS[e.key.toLowerCase()])
    }
  }
  const finish = () => {
    el.removeEventListener('keydown', onKey)
    el.removeAttribute('contenteditable')
    doc.getSelection()?.removeAllRanges()
    useEditor.getState().setEditing(null)
    if (cancelled) {
      if (rich) el.innerHTML = sanitizeRichText(original)
      else el.textContent = original
      return
    }
    const next = rich ? sanitizeRichText(el.innerHTML) : multiline ? (el.innerText ?? '').replace(/\n$/, '') : (el.innerText ?? '').replace(/\s*\n\s*/g, ' ')
    if (next !== original) useEditor.getState().updateProps(nodeId, { [prop]: next })
  }
  el.addEventListener('keydown', onKey)
  el.addEventListener('blur', finish, { once: true })
}

function CanvasContent() {
  const root = useEditor((s) => s.root)
  const blocks = useEditor((s) => s.blocks)
  const dataCache = useEditor((s) => s.dataCache)
  const currentUser = useEditor((s) => s.currentUser)
  const previewAsGuest = useEditor((s) => s.previewAsGuest)
  const siteParts = useEditor((s) => s.siteParts)
  const layout = useEditor((s) => s.layout)
  const kind = useEditor((s) => s.kind)
  // header/footer toàn site chèn vào cây hiển thị (không nằm trong root của store nên không lưu, không kéo được)
  const display = useMemo(() => (kind === 'page' ? withSiteParts(root, siteParts, layout) : root), [root, siteParts, layout, kind])
  // triển khai My Block liên kết rồi gắn dữ liệu thật (và người đang đăng nhập) trước khi biên dịch CSS và render;
  // phần tử bị điều kiện ẩn vẫn giữ lại để chọn/sửa (đánh dấu data-cond-hidden)
  // trạng thái xem Đóng/Mở của block tương tác: ghim trong store, còn lại mở khi đang chọn nó/phần tử bên trong.
  // pathKey chỉ đổi khi tập block tương tác trên đường chọn đổi -> chọn phần tử thường không biên dịch lại CSS
  const selectedId = useEditor((s) => s.selectedId)
  const viewStates = useEditor((s) => s.viewStates)
  // chế độ chuột "Xem": render y như trang thật (mode live, runtime đầy đủ) để bấm nút, mở dialog, chuyển tab…
  const viewing = useEditor((s) => s.pointerMode === 'view')
  const mode = viewing ? 'live' : 'editor'
  const pathKey = useMemo(() => {
    if (!selectedId) return ''
    const self = findNode(display, selectedId)
    return [...getAncestors(display, selectedId), ...(self ? [self] : [])]
      .filter((n) => viewStateInfo(n))
      .map((n) => n.id)
      .join(',')
  }, [display, selectedId])
  const resolved = useMemo(
    () =>
      resolveData(
        viewing ? resolveRefs(display, blockLookup(blocks)) : applyViewStates(resolveRefs(display, blockLookup(blocks)), viewStates, new Set(pathKey ? pathKey.split(',') : [])),
        (id) => dataCache[id],
        { user: previewAsGuest ? null : currentUser, keepHidden: !viewing },
      ),
    [display, blocks, dataCache, currentUser, previewAsGuest, viewStates, pathKey, viewing],
  )
  const css = useMemo(() => compileTreeCss(resolved), [resolved])
  const theme = useEditor(effectiveTheme)
  return (
    <>
      {theme.fontUrl && <link rel="stylesheet" href={theme.fontUrl} />}
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* key theo chế độ: đổi chế độ thì dựng lại sạch (dialog/accordion đang mở do tương tác không lẫn sang chế độ kia) */}
      <RenderNode key={mode} node={resolved} mode={mode} />
      <BuilderRuntime key={'rt-' + mode} mode={mode} />
    </>
  )
}

export function Canvas() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const device = useEditor((s) => s.device)
  const selectedId = useEditor((s) => s.selectedId)
  const viewing = useEditor((s) => s.pointerMode === 'view')
  const commentMode = useEditor((s) => s.pointerMode === 'comment')
  // con trỏ bình luận trong iframe
  useEffect(() => {
    doc?.body.classList.toggle('bld-commenting', commentMode)
  }, [doc, commentMode])

  const attach = useCallback(() => {
    const d = iframeRef.current?.contentDocument
    if (d && d.readyState === 'complete' && d.getElementById('bld-mount')) setDoc(d)
  }, [])

  useEffect(() => {
    attach()
  }, [attach])

  // ----- lắng nghe sự kiện trong iframe -----
  useEffect(() => {
    if (!doc) return
    const store = useEditor.getState
    let raf = 0
    let lastPoint: { x: number; y: number } | null = null
    /** Tính vị trí thả theo rAF cho cả kéo HTML5 (từ panel) lẫn kéo bằng chuột trên canvas */
    const scheduleDrop = (x: number, y: number) => {
      lastPoint = { x, y }
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const s = store()
        if (!s.drag || !lastPoint) return
        s.setDrop(computeDrop(doc, s.root, s.drag, lastPoint.x, lastPoint.y))
      })
    }

    // ----- kéo thả trực tiếp: nhấn giữ một phần tử rồi kéo quá 6px -----
    let press: { id: string; x: number; y: number } | null = null
    let pointerDrag = false
    const endPointerDrag = (commit: boolean) => {
      if (!pointerDrag) return
      pointerDrag = false
      doc.body.classList.remove('is-dragging')
      if (commit) store().commitDrop()
      else store().endDrag()
    }
    const viewing = () => store().pointerMode === 'view'
    const commenting = () => store().pointerMode === 'comment'
    /** toạ độ trong iframe -> toạ độ cửa sổ editor (iframe có thể bị thu nhỏ) */
    const toWindow = (x: number, y: number) => {
      const frame = iframeRef.current?.getBoundingClientRect()
      const scale = frame ? frame.width / (doc.documentElement.clientWidth || 1) : 1
      return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale }
    }
    /** Chế độ xem: cho trang tự xử lý mọi tương tác, chỉ chặn việc rời canvas (link sang trang khác, đăng xuất) */
    // không lặp cùng một thông báo liên tục khi bấm nhiều lần
    const lastToast = new Map<string, number>()
    const blockInView = (e: Event, message: string) => {
      e.preventDefault()
      e.stopPropagation()
      if (Date.now() - (lastToast.get(message) ?? 0) > 1500) {
        lastToast.set(message, Date.now())
        store().toast('info', message)
      }
    }
    const guardViewClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const a = t.closest<HTMLAnchorElement>('a[href]')
      const host = a ? null : t.closest<HTMLElement>('[data-click="link"]')
      const href = a ? a.getAttribute('href') : (host?.dataset.clickHref ?? null)
      if (href == null) return
      if (href === '#logout') return blockInView(e, 'Đăng xuất không chạy trong chế độ xem.')
      if (href.startsWith('#')) {
        // cuộn tới phần trong trang vẫn chạy; '#' trống thì không làm gì
        if (href.length < 2 || !doc.getElementById(decodeURIComponent(href.slice(1)))) e.preventDefault()
        return
      }
      blockInView(e, `Link “${href.length > 60 ? href.slice(0, 57) + '…' : href}” – chế độ xem không mở trang khác.`)
    }
    const onMouseDown = (e: MouseEvent) => {
      press = null
      if (viewing() || commenting()) return
      if (e.button !== 0 || store().editingId || (e.target as HTMLElement).isContentEditable) return
      const id = nodeElement(e.target)?.dataset.nodeId
      if (id && id !== 'root' && !sitePartOf(id)) press = { id, x: e.clientX, y: e.clientY }
    }
    const onMouseUp = () => {
      press = null
      endPointerDrag(true)
    }

    const onMove = (e: MouseEvent) => {
      if (press && !store().drag && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) {
        store().select(press.id)
        store().startDrag({ kind: 'move', nodeId: press.id })
        pointerDrag = true
        doc.body.classList.add('is-dragging')
        press = null
      }
      if (store().drag) {
        if (pointerDrag) scheduleDrop(e.clientX, e.clientY)
        return
      }
      if (store().editingId || viewing()) return
      store().hover(nodeElement(e.target)?.dataset.nodeId ?? null)
    }
    const onLeave = () => store().hover(null)
    const onClick = (e: MouseEvent) => {
      if (viewing()) return guardViewClick(e)
      if (commenting()) {
        // chế độ bình luận: bấm phần tử -> mở khung bình luận tại chỗ bấm (không chọn, không điều hướng)
        e.preventDefault()
        e.stopPropagation()
        const el = nodeElement(e.target as HTMLElement)
        const id = el?.dataset.nodeId ?? 'root'
        // vị trí bấm theo tỉ lệ trong khung phần tử -> huy hiệu neo đúng chỗ dù đổi thiết bị / co giãn
        const r = (el ?? doc.querySelector('[data-node-id="root"]'))?.getBoundingClientRect()
        const anchor = r && r.width > 0 && r.height > 0 ? { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) } : null
        store().openCommentPop({ nodeId: id, ...toWindow(e.clientX, e.clientY), anchor })
        return
      }
      const t = e.target as HTMLElement
      if (t.closest('a')) e.preventDefault() // không bao giờ điều hướng trong canvas
      if (t.isContentEditable) return
      e.preventDefault() // chặn điều hướng của link/nút trong canvas
      const el = nodeElement(t)
      if (el) store().select(el.dataset.nodeId!)
    }
    const onContextMenu = (e: MouseEvent) => {
      if (viewing() || commenting() || (e.target as HTMLElement).isContentEditable) return
      e.preventDefault()
      const id = nodeElement(e.target)?.dataset.nodeId ?? 'root'
      store().select(id)
      // toạ độ trong iframe -> toạ độ cửa sổ editor (iframe có thể bị thu nhỏ)
      const frame = iframeRef.current?.getBoundingClientRect()
      const scale = frame ? frame.width / (doc.documentElement.clientWidth || 1) : 1
      store().openContextMenu({ x: (frame?.left ?? 0) + e.clientX * scale, y: (frame?.top ?? 0) + e.clientY * scale, nodeId: id })
    }
    const onKeyCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pointerDrag) {
        e.stopPropagation()
        endPointerDrag(false)
      }
    }
    const onWindowUp = () => endPointerDrag(false)
    const onDblClick = (e: MouseEvent) => {
      if (viewing() || commenting()) return
      const el = nodeElement(e.target)
      if (el) startInlineEdit(doc, el, el.dataset.nodeId!)
    }
    const onDragOver = (e: DragEvent) => {
      const drag = store().drag
      if (!drag) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = drag.kind === 'move' ? 'move' : 'copy'
      scheduleDrop(e.clientX, e.clientY)
    }
    const onDrop = (e: DragEvent) => {
      if (!store().drag) return
      e.preventDefault()
      store().commitDrop()
    }
    const onDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) store().setDrop(null)
    }
    const onSubmit = (e: Event) => {
      // chế độ chỉnh sửa: chặn im lặng; chế độ xem: form đã qua kiểm tra hợp lệ của trình duyệt nhưng không gửi đi
      if (viewing()) return blockInView(e, 'Form hợp lệ – chế độ xem không gửi dữ liệu thật.')
      e.preventDefault()
    }
    const onChange = (e: Event) => {
      if (viewing() && (e.target as HTMLElement).matches?.('[data-lang-switch]')) blockInView(e, 'Đổi ngôn ngữ: dùng ô ngôn ngữ trên thanh trên của builder.')
    }

    doc.addEventListener('mousedown', onMouseDown)
    doc.addEventListener('mouseup', onMouseUp)
    doc.addEventListener('contextmenu', onContextMenu)
    doc.addEventListener('keydown', onKeyCapture, true)
    window.addEventListener('mouseup', onWindowUp)
    doc.addEventListener('mousemove', onMove)
    doc.addEventListener('mouseleave', onLeave)
    doc.addEventListener('click', onClick, true)
    doc.addEventListener('dblclick', onDblClick)
    doc.addEventListener('dragover', onDragOver)
    doc.addEventListener('drop', onDrop)
    doc.addEventListener('dragleave', onDragLeave)
    doc.addEventListener('keydown', handleShortcut)
    doc.addEventListener('submit', onSubmit, true)
    doc.addEventListener('change', onChange, true)
    return () => {
      cancelAnimationFrame(raf)
      doc.removeEventListener('mousedown', onMouseDown)
      doc.removeEventListener('mouseup', onMouseUp)
      doc.removeEventListener('contextmenu', onContextMenu)
      doc.removeEventListener('keydown', onKeyCapture, true)
      window.removeEventListener('mouseup', onWindowUp)
      doc.removeEventListener('mousemove', onMove)
      doc.removeEventListener('mouseleave', onLeave)
      doc.removeEventListener('click', onClick, true)
      doc.removeEventListener('dblclick', onDblClick)
      doc.removeEventListener('dragover', onDragOver)
      doc.removeEventListener('drop', onDrop)
      doc.removeEventListener('dragleave', onDragLeave)
      doc.removeEventListener('keydown', handleShortcut)
      doc.removeEventListener('change', onChange, true)
      doc.removeEventListener('submit', onSubmit, true)
    }
  }, [doc])

  // ----- chọn phần tử nằm trong tab đang ẩn -> tự chuyển tab; cuộn tới phần tử -----
  useEffect(() => {
    if (!doc || !selectedId) return
    const root = useEditor.getState().root
    const path = [...getAncestors(root, selectedId), findNode(root, selectedId)].filter(Boolean)
    path.forEach((n, i) => {
      const child = path[i + 1]
      if (n!.type === 'tabs' || n!.type === 'carousel') {
        const idx = n!.children?.findIndex((c) => c.id === child?.id) ?? -1
        if (idx < 0) return
        const btn = doc.querySelector<HTMLElement>(`[data-node-id="${n!.id}"] [data-tab-index="${idx}"]`)
        if (btn && btn.getAttribute('aria-selected') !== 'true' && !btn.classList.contains('is-active')) btn.click()
      }
      // mục accordion đang đóng: mở ra để thấy phần tử con
      if (n!.type === 'accordionItem') {
        const details = doc.querySelector<HTMLDetailsElement>(`details[data-node-id="${n!.id}"]`)
        if (details && !details.open) details.open = true
      }
    })
    const el = doc.querySelector(`[data-node-id="${selectedId}"]`)
    const r = el?.getBoundingClientRect()
    const vh = doc.defaultView?.innerHeight ?? 0
    if (el && r && (r.bottom < 0 || r.top > vh)) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [doc, selectedId])

  // ----- kích thước khung: desktop tối thiểu 1280px (thu nhỏ nếu màn hình hẹp) để media query luôn đúng thiết bị -----
  const canvasRef = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setAvail({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const target = DEVICE_PX[device]
  const frameW = device === 'desktop' ? Math.max(avail.w, target) : target
  const scale = avail.w > 0 ? Math.min(1, avail.w / frameW) : 1
  const frameH = scale > 0 ? avail.h / scale : avail.h

  return (
    <div className={`ed-canvas${viewing ? ' is-view' : ''}${commentMode ? ' is-comment' : ''}`} ref={canvasRef} onDragOver={(e) => e.preventDefault()}>
      <div className="ed-sizer" style={{ width: frameW * scale, height: avail.h }}>
        <div
          className={`ed-frame ed-frame--${device}`}
          style={{ width: frameW, height: frameH, transform: scale < 1 ? `scale(${scale})` : undefined }}
        >
          <iframe ref={iframeRef} title="Canvas" srcDoc={SRC_DOC} onLoad={attach} className="ed-iframe" />
          {doc && <Overlay doc={doc} />}
        </div>
      </div>
      {scale < 1 && <span className="ed-zoom">{Math.round(scale * 100)}%</span>}
      {commentMode && (
        <div className="ed-view-badge" role="status" data-comment-badge="">
          <span>
            Chế độ bình luận – bấm vào phần tử để bình luận · <kbd>E</kbd> để sửa
          </span>
          <button type="button" onClick={() => useEditor.getState().setPointerMode('edit')}>
            Xong
          </button>
        </div>
      )}
      {commentMode && <CommentPopover />}
      {viewing && (
        <div className="ed-view-badge" role="status" data-view-badge="">
          <span>
            Chế độ xem – bấm thử như trang thật · <kbd>E</kbd> để sửa
          </span>
          <button type="button" onClick={() => useEditor.getState().setPointerMode('edit')}>
            Quay lại chỉnh sửa
          </button>
        </div>
      )}
      {doc && createPortal(<CanvasContent />, doc.getElementById('bld-mount')!)}
    </div>
  )
}
