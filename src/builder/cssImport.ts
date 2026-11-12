/**
 * Đọc CSS người dùng dán vào (thuần chuỗi, chạy cả server lẫn trình duyệt):
 * - parseDeclarations("padding: 16px; color: red") -> { padding: '16px', color: 'red' }
 * - parseStylesheet(".card{…} .card:hover{…} @media (max-width:767px){ .card{…} }") -> danh sách luật kèm bucket
 *   (desktop / hover / tablet / mobile) để gán vào styles của node.
 * Bỏ: biến CSS (--x), !important, @import/@font-face/@keyframes, pseudo-element (::before…), giá trị nguy hiểm.
 */
import { BREAKPOINTS, sanitizeCssValue } from './css'
import type { NodeStyles, StyleMap } from './types'

export type Bucket = 'desktop' | 'hover' | 'tablet' | 'mobile'

export interface CssRule {
  /** Selector đã bỏ :hover (chuỗi rỗng nếu là khai báo không selector) */
  selector: string
  bucket: Bucket
  decls: StyleMap
}

const PROP = /^-?[a-z][a-z-]{0,60}$/

export const toCamel = (prop: string) => prop.replace(/^-(webkit|moz|ms|o)-/, (_m, v: string) => v + '-').replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Tách theo ';' nhưng không cắt trong ngoặc / chuỗi (url(data:…;base64), "a;b") */
function splitTop(text: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let cur = ''
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    else if (ch === sep && depth === 0) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out
}

/** "padding: 16px; color: red" -> { padding: '16px', color: 'red' } (tên thuộc tính camelCase) */
export function parseDeclarations(text: string): StyleMap {
  const out: StyleMap = {}
  for (const part of splitTop(stripComments(text), ';')) {
    const i = part.indexOf(':')
    if (i < 0) continue
    const prop = part.slice(0, i).trim().toLowerCase()
    if (!PROP.test(prop) || prop.startsWith('--')) continue
    const value = sanitizeCssValue(part.slice(i + 1).replace(/!\s*important/gi, '').trim())
    if (!value) continue
    out[toCamel(prop)] = value
  }
  return out
}

/** max-width trong @media -> bucket; min-width / điều kiện khác -> null (bỏ qua) */
function mediaBucket(query: string): Bucket | null {
  const m = query.match(/max-width\s*:\s*(\d+(?:\.\d+)?)\s*(px|em|rem)?/i)
  if (!m || /min-width/i.test(query)) return null
  const px = parseFloat(m[1]) * (m[2] && m[2] !== 'px' ? 16 : 1)
  return px <= BREAKPOINTS.mobile + 40 ? 'mobile' : px <= BREAKPOINTS.tablet + 80 ? 'tablet' : null
}

/** Tìm khối {...} khớp ngoặc bắt đầu tại vị trí `open` (ký tự '{') */
function blockEnd(css: string, open: number): number {
  let depth = 0
  let quote = ''
  for (let i = open; i < css.length; i++) {
    const ch = css[i]
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return css.length
}

function parseRules(css: string, bucket: Bucket | null, out: CssRule[]) {
  let i = 0
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open < 0) break
    const head = css.slice(i, open).trim()
    const end = blockEnd(css, open)
    const body = css.slice(open + 1, end)
    i = end + 1
    if (head.startsWith('@')) {
      if (/^@media/i.test(head)) {
        const b = mediaBucket(head)
        if (b) parseRules(body, b, out)
      }
      continue // @import, @font-face, @keyframes, @supports…: bỏ qua
    }
    const decls = parseDeclarations(body)
    if (!Object.keys(decls).length) continue
    for (const raw of splitTop(head, ',')) {
      const sel = raw.trim()
      if (!sel || sel.includes('::')) continue
      const hover = /:hover\b/.test(sel)
      out.push({ selector: sel.replace(/:hover\b/g, '').trim(), bucket: bucket ?? (hover ? 'hover' : 'desktop'), decls })
    }
  }
}

/** Đọc cả stylesheet thành luật theo thứ tự xuất hiện */
export function parseStylesheet(css: string): CssRule[] {
  const out: CssRule[] = []
  parseRules(stripComments(css).slice(0, 200_000), null, out)
  return out
}

/**
 * CSS dán vào cho MỘT phần tử: chỉ khai báo -> bucket mặc định (thiết bị / trạng thái đang sửa);
 * có selector -> mọi luật áp vào phần tử, :hover -> hover, @media max-width -> tablet/mobile.
 */
export function cssToStyles(text: string, fallback: Bucket = 'desktop'): NodeStyles {
  const styles: NodeStyles = {}
  const add = (bucket: Bucket, decls: StyleMap) => {
    if (!Object.keys(decls).length) return
    styles[bucket] = { ...(styles[bucket] ?? {}), ...decls }
  }
  const clean = stripComments(text)
  if (!clean.includes('{')) add(fallback, parseDeclarations(clean))
  else for (const r of parseStylesheet(clean)) add(r.bucket, r.decls)
  return styles
}
