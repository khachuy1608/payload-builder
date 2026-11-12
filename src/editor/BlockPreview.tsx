'use client'

/**
 * Preview thu nhỏ của một cây block: iframe nhỏ dùng CHÍNH renderer + theme của trang thật.
 * - fit="contain" (mặc định): thu cả block lọt vào khung
 * - fit="width": vừa chiều rộng, ghim đầu trang (như ảnh chụp màn hình) – dùng cho mẫu trang;
 *   `scrollOnHover` rê chuột thì cuộn dần xuống cuối trang
 * Chỉ dựng iframe khi tile lọt vào vùng nhìn thấy. Hiệu ứng xuất hiện (reveal) luôn hiện sẵn trong preview.
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

const PREVIEW_DOC = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>${BASE_CSS}html,body{overflow:hidden;background:transparent;pointer-events:none}#m{position:absolute;left:0;top:0;width:1280px;visibility:hidden}#m.ready{visibility:visible}.bld-root{min-height:0}[data-fx-reveal]{opacity:1!important;animation:none!important;transform:none!important}</style></head><body><div id="m"></div></body></html>`

/** Bề rộng khung nhìn của iframe: luôn là desktop để media query tablet/mobile không kích hoạt trong ô nhỏ */
const VIEW_W = 1280

export function BlockPreview({ tree, height = 96, fit: fitMode = 'contain', scrollOnHover = false }: { tree: BuilderNode; height?: number; fit?: 'contain' | 'width'; scrollOnHover?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [visible, setVisible] = useState(false)
  const [mount, setMount] = useState<HTMLElement | null>(null)
  /** vị trí nghỉ + phần nội dung thừa phía dưới (fit = width) để cuộn khi rê chuột */
  const restRef = useRef({ y: 0, overflow: 0, scale: 1 })
  const blocks = useEditor((s) => s.blocks)
  const theme = useEditor(effectiveTheme)
  const dataCache = useEditor((s) => s.dataCache)
  const currentUser = useEditor((s) => s.currentUser)
  const resolved = resolveData(resolveRefs(tree, blockLookup(blocks)), (id) => dataCache[id], { user: currentUser })
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
      const frame = iframeRef.current
      // bỏ qua <style>/<link> (font của theme)/runtime đứng đầu, lấy phần tử gốc của block
      const first = mount.querySelector<HTMLElement>(':scope > :not(style, link, script, [data-builder-runtime])')
      if (!wrap || !frame || !first || !first.offsetWidth) return
      const w = first.offsetWidth
      const h = Math.max(first.offsetHeight, 1)
      const boxW = wrap.clientWidth
      // iframe rộng VIEW_W (bố cục desktop) rồi thu nhỏ cả iframe; vw/vh tính theo vùng nhìn thấy
      const scale = fitMode === 'width' ? Math.min(boxW / w, 1) : Math.min(boxW / w, height / h, 1)
      const viewH = height / scale
      const visW = Math.min(boxW / scale, VIEW_W)
      const outerX = Math.max(0, (boxW - VIEW_W * scale) / 2)
      frame.style.width = `${VIEW_W}px`
      frame.style.height = `${viewH}px`
      frame.style.transformOrigin = '0 0'
      frame.style.transform = `translateX(${outerX}px) scale(${scale})`
      // canh giữa phần tử gốc trong vùng nhìn thấy (bù margin: auto, inline-block…); fit = width: ghim đầu trang
      const x = (visW - w) / 2 - first.offsetLeft
      const y = fitMode === 'width' ? -first.offsetTop : (viewH - h) / 2 - first.offsetTop
      restRef.current = { y, overflow: fitMode === 'width' ? Math.max(0, h - viewH) : 0, scale }
      mount.style.left = `${x}px`
      if (!wrap.matches(':hover') || !scrollOnHover) mount.style.transform = `translateY(${y}px)`
      mount.classList.add('ready')
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(mount)
    return () => ro.disconnect()
  }, [mount, height, resolved, fitMode, scrollOnHover])

  const hover = (on: boolean) => {
    if (!scrollOnHover || !mount) return
    const { y, overflow, scale } = restRef.current
    if (!overflow) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // tốc độ đều ~ 120px (trên màn hình) mỗi giây, 1.5–8 giây; trở về nhanh
    mount.style.transition = reduced ? 'none' : on ? `transform ${Math.min(8, Math.max(1.5, (overflow * scale) / 120)).toFixed(2)}s linear` : 'transform .5s ease'
    mount.style.transform = `translateY(${on ? y - overflow : y}px)`
  }

  return (
    <div ref={wrapRef} className="ed-block-preview" style={{ height }} onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
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
