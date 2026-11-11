/**
 * Biên dịch `styles` của từng node thành CSS có scope theo class `.n-<id>`.
 * Desktop-first: desktop là gốc, tablet/mobile ghi đè qua media query, hover dùng :hover.
 */
import { fxCss, normalizeFx, resolveEasing } from './effects'
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

/** Các "thuộc tính ảo" của editor được biên dịch thành nhiều khai báo CSS */
const VIRTUAL_PROPS = new Set(['lineClamp', 'overlayColor', 'focusRing'])

export function declarations(map: StyleMap | undefined): string {
  if (!map) return ''
  const out: string[] = []
  const entries = Object.entries(map).sort(([a], [b]) => Number(SHORTHANDS.has(b)) - Number(SHORTHANDS.has(a)))
  const overlay = map.overlayColor ? sanitizeCssValue(String(map.overlayColor)) : ''
  for (const [prop, raw] of entries) {
    if (!PROP_PATTERN.test(prop) || raw == null || VIRTUAL_PROPS.has(prop)) continue
    let value = normalizeValue(prop, raw)
    if (!value) continue
    // Scrim/overlay: lớp phủ màu đè lên ảnh nền
    if (prop === 'backgroundImage' && overlay) value = `linear-gradient(${overlay},${overlay}),${value}`
    if ((prop === 'transitionTimingFunction' || prop === 'animationTimingFunction') && value === 'spring') value = resolveEasing('spring')
    out.push(`${toKebab(prop)}:${value}`)
  }
  if (overlay && !map.backgroundImage) out.push(`background-image:linear-gradient(${overlay},${overlay})`)
  // Truncation: 1 dòng = ellipsis, nhiều dòng = line-clamp
  const clamp = parseInt(String(map.lineClamp ?? ''), 10)
  if (clamp === 1) out.push('white-space:nowrap;overflow:hidden;text-overflow:ellipsis')
  else if (clamp > 1) out.push(`display:-webkit-box;-webkit-line-clamp:${clamp};-webkit-box-orient:vertical;overflow:hidden`)
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
      // Focus ring (:focus-visible) cho điều hướng bàn phím
      const ring = s.desktop?.focusRing
      if (ring && ring !== 'none') hover.push(`${sel}:focus-visible{outline:${ring === 'thick' ? '3px' : '2px'} solid var(--color-primary);outline-offset:${ring === 'inset' ? '-2px' : '2px'}}`)
      const fx = normalizeFx((node.props as { fx?: unknown })?.fx)
      if (fx) {
        const extra = fxCss(sel, fx)
        base.push(...extra.base)
        hover.push(...extra.hover)
      }
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
