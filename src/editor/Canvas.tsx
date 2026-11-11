'use client'

/**
 * Canvas: một <iframe> cùng origin, nội dung được render bằng React portal với CHÍNH renderer của front-end.
 * - iframe cách ly CSS của editor và giúp media query chạy đúng theo bề rộng thiết bị.
 * - Sự kiện chuột/kéo thả/phím được nghe trực tiếp trên document của iframe.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { compileTreeCss } from '@/builder/css'
import { resolveRefs } from '@/builder/refs'
import { getBlock } from '@/builder/registry'
import { RenderNode } from '@/builder/Renderer'
import { BASE_CSS, themeToCss } from '@/builder/theme'
import { findNode, getAncestors } from '@/builder/tree'
import { computeDrop } from './dnd'
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
.bld-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:120px;background:#f1f5f9;color:#64748b;font:13px/1.4 system-ui,sans-serif;border:1px dashed #cbd5e1;border-radius:6px;text-align:center;padding:12px}
[data-node-id] iframe{pointer-events:none}
[contenteditable]{outline:none;cursor:text;user-select:text;-webkit-user-select:text}
a[data-node-id]{cursor:default}
[data-linked]{cursor:default}
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
function startInlineEdit(doc: Document, el: HTMLElement, nodeId: string) {
  const s = useEditor.getState()
  const node = findNode(s.root, nodeId)
  const def = node ? getBlock(node.type) : undefined
  if (!node || !def?.inlineEdit || s.editingId) return
  const { prop, multiline } = def.inlineEdit
  const original = String(node.props[prop] ?? '')

  s.select(nodeId)
  s.setEditing(nodeId)
  el.setAttribute('contenteditable', 'plaintext-only')
  if (!el.isContentEditable) el.setAttribute('contenteditable', 'true')
  el.focus()
  const range = doc.createRange()
  range.selectNodeContents(el)
  const sel = doc.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)

  let cancelled = false
  const onKey = (e: KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      cancelled = true
      el.blur()
    } else if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      el.blur()
    }
  }
  const finish = () => {
    el.removeEventListener('keydown', onKey)
    el.removeAttribute('contenteditable')
    doc.getSelection()?.removeAllRanges()
    const value = (el.innerText ?? '').replace(/\n$/, '')
    useEditor.getState().setEditing(null)
    if (cancelled) {
      el.textContent = original
      return
    }
    const next = multiline ? value : value.replace(/\s*\n\s*/g, ' ')
    if (next !== original) useEditor.getState().updateProps(nodeId, { [prop]: next })
  }
  el.addEventListener('keydown', onKey)
  el.addEventListener('blur', finish, { once: true })
}

function CanvasContent() {
  const root = useEditor((s) => s.root)
  const blocks = useEditor((s) => s.blocks)
  // triển khai My Block liên kết trước khi biên dịch CSS và render (structural sharing: nhánh khác không render lại)
  const resolved = useMemo(() => resolveRefs(root, blockLookup(blocks)), [root, blocks])
  const css = useMemo(() => compileTreeCss(resolved), [resolved])
  const theme = useEditor(effectiveTheme)
  return (
    <>
      {theme.fontUrl && <link rel="stylesheet" href={theme.fontUrl} />}
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <RenderNode node={resolved} mode="editor" />
    </>
  )
}

export function Canvas() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const device = useEditor((s) => s.device)
  const selectedId = useEditor((s) => s.selectedId)

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

    const onMove = (e: MouseEvent) => {
      if (store().drag || store().editingId) return
      store().hover(nodeElement(e.target)?.dataset.nodeId ?? null)
    }
    const onLeave = () => store().hover(null)
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.isContentEditable) return
      e.preventDefault() // chặn điều hướng của link/nút trong canvas
      const el = nodeElement(t)
      if (el) store().select(el.dataset.nodeId!)
    }
    const onDblClick = (e: MouseEvent) => {
      const el = nodeElement(e.target)
      if (el) startInlineEdit(doc, el, el.dataset.nodeId!)
    }
    const onDragOver = (e: DragEvent) => {
      const drag = store().drag
      if (!drag) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = drag.kind === 'new' ? 'copy' : 'move'
      lastPoint = { x: e.clientX, y: e.clientY }
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const s = store()
        if (!s.drag || !lastPoint) return
        s.setDrop(computeDrop(doc, s.root, s.drag, lastPoint.x, lastPoint.y))
      })
    }
    const onDrop = (e: DragEvent) => {
      if (!store().drag) return
      e.preventDefault()
      store().commitDrop()
    }
    const onDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) store().setDrop(null)
    }
    const onSubmit = (e: Event) => e.preventDefault()

    doc.addEventListener('mousemove', onMove)
    doc.addEventListener('mouseleave', onLeave)
    doc.addEventListener('click', onClick, true)
    doc.addEventListener('dblclick', onDblClick)
    doc.addEventListener('dragover', onDragOver)
    doc.addEventListener('drop', onDrop)
    doc.addEventListener('dragleave', onDragLeave)
    doc.addEventListener('keydown', handleShortcut)
    doc.addEventListener('submit', onSubmit, true)
    return () => {
      cancelAnimationFrame(raf)
      doc.removeEventListener('mousemove', onMove)
      doc.removeEventListener('mouseleave', onLeave)
      doc.removeEventListener('click', onClick, true)
      doc.removeEventListener('dblclick', onDblClick)
      doc.removeEventListener('dragover', onDragOver)
      doc.removeEventListener('drop', onDrop)
      doc.removeEventListener('dragleave', onDragLeave)
      doc.removeEventListener('keydown', handleShortcut)
      doc.removeEventListener('submit', onSubmit, true)
    }
  }, [doc])

  // ----- chọn phần tử nằm trong tab đang ẩn -> tự chuyển tab; cuộn tới phần tử -----
  useEffect(() => {
    if (!doc || !selectedId) return
    const root = useEditor.getState().root
    const path = [...getAncestors(root, selectedId), findNode(root, selectedId)].filter(Boolean)
    path.forEach((n, i) => {
      if (n!.type !== 'tabs') return
      const child = path[i + 1]
      const idx = n!.children?.findIndex((c) => c.id === child?.id) ?? -1
      if (idx < 0) return
      const btn = doc.querySelector<HTMLElement>(`[data-node-id="${n!.id}"] > .b-tabs-nav > [data-tab-index="${idx}"]`)
      if (btn && btn.getAttribute('aria-selected') !== 'true') btn.click()
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
    <div className="ed-canvas" ref={canvasRef} onDragOver={(e) => e.preventDefault()}>
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
      {doc && createPortal(<CanvasContent />, doc.getElementById('bld-mount')!)}
    </div>
  )
}
