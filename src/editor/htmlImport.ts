'use client'

/**
 * Chuyển HTML + CSS người dùng dán vào thành cây block của builder (chạy trong trình duyệt, dùng DOMParser).
 * - CSS (thẻ <style> trong HTML và ô CSS riêng) được gán vào từng phần tử bằng element.matches(selector):
 *   luật thường -> desktop, :hover -> hover, @media max-width -> tablet/mobile; thuộc tính style="" ghi đè cuối.
 * - Ánh xạ thẻ: h1–h6 -> Heading, p/blockquote/khối chỉ có chữ -> Paragraph (giữ đậm/nghiêng/link/danh sách),
 *   ul/ol -> Paragraph, img -> Image, nút/link dạng nút -> Button, a bọc khối -> Div + "Khi bấm: mở liên kết",
 *   hr -> Divider, svg -> SVG, iframe YouTube -> YouTube, iframe https -> Nhúng iframe, video -> Video,
 *   còn lại (div, section, header, nav, article…) -> Div chứa các phần tử con.
 * - Script, style, form/input và thẻ lạ bị bỏ (đếm vào cảnh báo).
 */
import { type Bucket, parseDeclarations, parseStylesheet } from '@/builder/cssImport'
import { parseYouTubeId } from '@/builder/blocks/helpers'
import { sanitizeRichText } from '@/builder/sanitize'
import { genId } from '@/builder/tree'
import type { BuilderNode, NodeStyles, StyleMap } from '@/builder/types'
import { validateBlockTree } from '@/builder/validate'

export interface HtmlImportResult {
  node: BuilderNode | null
  count: number
  warnings: string[]
}

const INLINE = new Set(['A', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'SPAN', 'SMALL', 'CODE', 'BR', 'MARK', 'SUB', 'SUP', 'LABEL', 'ABBR', 'TIME', 'Q', 'CITE'])
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'META', 'LINK', 'HEAD', 'TITLE', 'FORM', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'CANVAS', 'OBJECT', 'EMBED'])
const BUTTONISH = /(^|[\s_-])(btn|button|cta)([\s_-]|$)/i

const node = (type: string, props: Record<string, unknown>, styles: NodeStyles = {}, children?: BuilderNode[]): BuilderNode => ({ id: genId(), type, props, styles, ...(children ? { children } : {}) })

/** Phần tử chỉ chứa chữ và thẻ inline (in đậm, link…) */
const inlineOnly = (el: Element): boolean =>
  [...el.childNodes].every((c) => {
    if (c.nodeType === 3) return true
    if (c.nodeType !== 1) return true
    const e = c as Element
    // link dạng nút (class btn/button) được tách thành block Button riêng
    if (e.tagName === 'A' && (BUTTONISH.test(e.className) || e.getAttribute('role') === 'button')) return false
    return INLINE.has(e.tagName) && inlineOnly(e)
  })
const textOf = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()

export function htmlToBlocks(html: string, extraCss = ''): HtmlImportResult {
  const warnings: string[] = []
  const doc = new DOMParser().parseFromString(`<!doctype html><html><head></head><body>${html}</body></html>`, 'text/html')
  const css = [...doc.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n') + '\n' + extraCss
  const rules = parseStylesheet(css)
  let skipped = 0
  let count = 0

  const stylesFor = (el: Element): NodeStyles => {
    const styles: NodeStyles = {}
    const add = (bucket: Bucket, decls: StyleMap) => {
      styles[bucket] = { ...(styles[bucket] ?? {}), ...decls }
    }
    for (const r of rules) {
      if (!r.selector) continue
      try {
        if (el.matches(r.selector)) add(r.bucket, r.decls)
      } catch {
        /* selector không hợp lệ với DOM (ví dụ :is lạ) */
      }
    }
    const inline = el.getAttribute('style')
    if (inline) add('desktop', parseDeclarations(inline))
    return styles
  }

  const convert = (el: Element): BuilderNode | null => {
    const tag = el.tagName
    if (SKIP.has(tag)) {
      skipped++
      return null
    }
    const styles = stylesFor(el)
    const cssId = el.id && /^[A-Za-z_-][A-Za-z0-9_-]*$/.test(el.id) ? { cssId: el.id } : {}
    const done = (n: BuilderNode | null) => {
      if (n) count++
      return n
    }
    if (/^H[1-6]$/.test(tag)) return done(node('heading', { text: textOf(el), tag: tag.toLowerCase(), ...cssId }, styles))
    if (tag === 'IMG') {
      const src = el.getAttribute('src') ?? ''
      if (!/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
        skipped++
        return null
      }
      const alt = el.getAttribute('alt') ?? ''
      return done(node('image', { media: { id: 'external', url: src.startsWith('//') ? 'https:' + src : src, alt }, alt, ...cssId }, styles))
    }
    if (tag === 'HR') return done(node('divider', { ...cssId }, styles))
    if (tag === 'SVG' || tag === 'svg') return done(node('svg', { code: el.outerHTML, ...cssId }, styles))
    if (tag === 'IFRAME') {
      const src = el.getAttribute('src') ?? ''
      const yt = parseYouTubeId(src)
      if (yt) return done(node('youtube', { url: `https://www.youtube.com/watch?v=${yt}`, ...cssId }, styles))
      if (/^https:\/\//.test(src)) return done(node('embed', { url: src, height: el.getAttribute('height') || '400', title: el.getAttribute('title') || 'Nội dung nhúng', ...cssId }, styles))
      skipped++
      return null
    }
    if (tag === 'VIDEO') {
      const src = el.getAttribute('src') || el.querySelector('source')?.getAttribute('src') || ''
      if (!/^https:\/\//.test(src)) {
        skipped++
        return null
      }
      return done(node('video', { url: src, controls: el.hasAttribute('controls'), autoplay: el.hasAttribute('autoplay'), loop: el.hasAttribute('loop'), muted: el.hasAttribute('muted'), aspect: 'auto', ...cssId }, styles))
    }
    const href = el.getAttribute('href') ?? ''
    const isButton = tag === 'BUTTON' || (tag === 'A' && (BUTTONISH.test(el.className) || el.getAttribute('role') === 'button'))
    if (isButton && inlineOnly(el)) return done(node('button', { text: textOf(el) || 'Nút', href: tag === 'A' ? href : '#', newTab: el.getAttribute('target') === '_blank', ...cssId }, styles))
    // danh sách, hoặc khối chỉ có chữ/thẻ inline (p, li, div chỉ chứa chữ…) -> Paragraph giữ định dạng
    if (tag === 'UL' || tag === 'OL' || (tag !== 'A' && inlineOnly(el))) {
      const inner = tag === 'UL' || tag === 'OL' ? el.outerHTML : el.innerHTML
      const text = sanitizeRichText(inner.trim())
      if (!text) return el.children.length || tag === 'DIV' ? done(node('div', { ...cssId }, styles, [])) : null
      return done(node('paragraph', { text, ...cssId }, styles))
    }
    // link chỉ có chữ -> đoạn văn chứa link; link bọc khối -> Div bấm được
    if (tag === 'A' && inlineOnly(el)) return done(node('paragraph', { text: sanitizeRichText(el.outerHTML), ...cssId }, styles))
    const children: BuilderNode[] = []
    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        const t = (child.textContent ?? '').trim()
        if (t) {
          children.push(node('paragraph', { text: sanitizeRichText(t) }))
          count++
        }
      } else if (child.nodeType === 1) {
        const c = convert(child as Element)
        if (c) children.push(c)
      }
    }
    const click = tag === 'A' && href ? { click: { action: 'link', href, ...(el.getAttribute('target') === '_blank' ? { newTab: true } : {}) } } : {}
    return done(node('div', { ...cssId, ...click }, styles, children))
  }

  const tops: BuilderNode[] = []
  for (const child of doc.body.childNodes) {
    if (child.nodeType === 3) {
      const t = (child.textContent ?? '').trim()
      if (t) {
        tops.push(node('paragraph', { text: sanitizeRichText(t) }))
        count++
      }
    } else if (child.nodeType === 1) {
      const c = convert(child as Element)
      if (c) tops.push(c)
    }
  }
  if (skipped) warnings.push(`Bỏ qua ${skipped} phần tử không hỗ trợ (script, form, ảnh/iframe không phải https…).`)
  if (!tops.length) return { node: null, count: 0, warnings: warnings.length ? warnings : ['Không tìm thấy nội dung để chuyển.'] }
  const root = tops.length === 1 ? tops[0] : node('div', {}, {}, tops)
  try {
    // làm sạch lần cuối theo đúng quy tắc khi lưu (prop, style, cấu trúc)
    return { node: validateBlockTree(root), count, warnings }
  } catch (err) {
    return { node: null, count: 0, warnings: [...warnings, (err as Error).message] }
  }
}
