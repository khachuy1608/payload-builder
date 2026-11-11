'use client'

/**
 * Preview thu nhỏ của một cây block: iframe nhỏ dùng CHÍNH renderer + theme của trang thật,
 * tự tính tỉ lệ để cả block lọt vào khung. Chỉ dựng iframe khi tile lọt vào vùng nhìn thấy.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { compileTreeCss } from '@/builder/css'
import { resolveData } from '@/builder/data'
import { resolveRefs } from '@/builder/refs'
import { BuilderRuntime } from '@/builder/blocks/Runtime'
import { RenderNode } from '@/builder/Renderer'
import { BASE_CSS, themeToCss } from '@/builder/theme'
import type { BuilderNode } from '@/builder/types'
import { blockLookup, effectiveTheme, useEditor } from './store'

const PREVIEW_DOC = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>${BASE_CSS}html,body{overflow:hidden;background:transparent;pointer-events:none}#m{position:absolute;left:0;top:0;width:1280px;transform-origin:0 0;visibility:hidden}#m.ready{visibility:visible}.bld-root{min-height:0}</style></head><body><div id="m"></div></body></html>`

export function BlockPreview({ tree, height = 96 }: { tree: BuilderNode; height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [visible, setVisible] = useState(false)
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const blocks = useEditor((s) => s.blocks)
  const theme = useEditor(effectiveTheme)
  const dataCache = useEditor((s) => s.dataCache)
  const resolved = resolveData(resolveRefs(tree, blockLookup(blocks)), (id) => dataCache[id])
  const css = compileTreeCss(resolved)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || visible) return
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  const attach = () => {
    const doc = iframeRef.current?.contentDocument
    const m = doc?.getElementById('m')
    if (m && doc?.readyState === 'complete') setMount(m)
  }
  useEffect(() => {
    if (visible && !mount) attach()
  }, [visible, mount])

  // tính tỉ lệ sau mỗi lần nội dung đổi kích thước
  useEffect(() => {
    if (!mount) return
    const fit = () => {
      const wrap = wrapRef.current
      // bỏ qua thẻ <style> đứng đầu, lấy phần tử gốc của block
      const first = mount.querySelector<HTMLElement>(':scope > :not(style)')
      if (!wrap || !first) return
      const w = Math.max(first.offsetWidth, 1)
      const h = Math.max(first.offsetHeight, 1)
      const boxW = wrap.clientWidth
      const scale = Math.min(boxW / w, height / h, 1)
      // bù phần tử gốc không nằm sát mép (margin: auto, inline-block…)
      const x = (boxW - w * scale) / 2 - first.offsetLeft * scale
      const y = (height - h * scale) / 2 - first.offsetTop * scale
      mount.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
      mount.classList.add('ready')
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(mount)
    return () => ro.disconnect()
  }, [mount, height, resolved])

  return (
    <div ref={wrapRef} className="ed-block-preview" style={{ height }}>
      {visible && <iframe ref={iframeRef} title="Preview" srcDoc={PREVIEW_DOC} tabIndex={-1} aria-hidden onLoad={attach} />}
      {mount &&
        createPortal(
          <>
            {theme.fontUrl && <link rel="stylesheet" href={theme.fontUrl} />}
            <style dangerouslySetInnerHTML={{ __html: themeToCss(theme) + css }} />
            <RenderNode node={resolved} mode="live" />
            <BuilderRuntime mode="live" />
          </>,
          mount,
        )}
    </div>
  )
}
