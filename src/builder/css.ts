/**
 * Biên dịch `styles` của từng node thành CSS có scope theo class `.n-<id>`.
 * Desktop-first: desktop là gốc, tablet/mobile ghi đè qua media query, hover dùng :hover.
 */
import { ID_PATTERN } from './schema'
import type { AdvancedProps, BuilderNode, StyleMap } from './types'

export const BREAKPOINTS = { tablet: 1024, mobile: 767 } as const

/** Thuộc tính nhận số không đơn vị – không tự thêm "px" */
const UNITLESS = new Set([
  'fontWeight',
  'lineHeight',
  'opacity',
  'zIndex',
  'flexGrow',
  'flexShrink',
  'order',
  'aspectRatio',
])

/** Chỉ cho phép thuộc tính dạng chữ cái camelCase để tránh chèn selector */
const PROP_PATTERN = /^[a-zA-Z]{1,40}$/

export function toKebab(prop: string): string {
  return prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

/** Loại bỏ ký tự có thể phá vỡ khối CSS hoặc thẻ <style> */
export function sanitizeCssValue(value: string): string {
  return value
    .replace(/[{}<>;\\]/g, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 500)
}

export function normalizeValue(prop: string, raw: string): string {
  const value = sanitizeCssValue(String(raw))
  if (value === '') return ''
  if (/^-?\d+(\.\d+)?$/.test(value) && !UNITLESS.has(prop) && value !== '0') return value + 'px'
  return value
}

/** Thuộc tính viết tắt phải đứng trước thuộc tính chi tiết (padding trước paddingTop) */
const SHORTHANDS = new Set(['margin', 'padding', 'border', 'borderWidth', 'borderStyle', 'borderColor', 'borderRadius', 'background', 'flex', 'inset', 'font', 'overflow'])

export function declarations(map: StyleMap | undefined): string {
  if (!map) return ''
  const out: string[] = []
  const entries = Object.entries(map).sort(([a], [b]) => Number(SHORTHANDS.has(b)) - Number(SHORTHANDS.has(a)))
  for (const [prop, raw] of entries) {
    if (!PROP_PATTERN.test(prop) || raw == null) continue
    const value = normalizeValue(prop, raw)
    if (value) out.push(`${toKebab(prop)}:${value}`)
  }
  return out.join(';')
}

export function compileTreeCss(root: BuilderNode): string {
  const base: string[] = []
  const hover: string[] = []
  const tablet: string[] = []
  const mobile: string[] = []
  const hideDesktop: string[] = []
  const hideTablet: string[] = []
  const hideMobile: string[] = []

  const visit = (node: BuilderNode) => {
    if (ID_PATTERN.test(node.id)) {
      const sel = `.n-${node.id}`
      const s = node.styles ?? {}
      const d = declarations(s.desktop)
      if (d) base.push(`${sel}{${d}}`)
      const h = declarations(s.hover)
      if (h) hover.push(`${sel}:hover{${h}}`)
      const t = declarations(s.tablet)
      if (t) tablet.push(`${sel}{${t}}`)
      const m = declarations(s.mobile)
      if (m) mobile.push(`${sel}{${m}}`)
      const hide = (node.props as AdvancedProps)?.hide
      if (hide?.desktop) hideDesktop.push(sel)
      if (hide?.tablet) hideTablet.push(sel)
      if (hide?.mobile) hideMobile.push(sel)
    }
    node.children?.forEach(visit)
  }
  visit(root)

  const parts = [base.join(''), hover.join('')]
  if (tablet.length) parts.push(`@media (max-width:${BREAKPOINTS.tablet}px){${tablet.join('')}}`)
  if (mobile.length) parts.push(`@media (max-width:${BREAKPOINTS.mobile}px){${mobile.join('')}}`)
  const hidden = (sels: string[]) => `${sels.join(',')}{display:none!important}`
  if (hideDesktop.length)
    parts.push(`@media (min-width:${BREAKPOINTS.tablet + 1}px){${hidden(hideDesktop)}}`)
  if (hideTablet.length)
    parts.push(
      `@media (min-width:${BREAKPOINTS.mobile + 1}px) and (max-width:${BREAKPOINTS.tablet}px){${hidden(hideTablet)}}`,
    )
  if (hideMobile.length) parts.push(`@media (max-width:${BREAKPOINTS.mobile}px){${hidden(hideMobile)}}`)
  return parts.filter(Boolean).join('\n')
}
