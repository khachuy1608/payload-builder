/**
 * Làm sạch mã SVG người dùng dán vào block SVG.
 * Dùng sanitize-html (thuần JS) để chạy được cả server lẫn trình duyệt.
 * Chặn <script>, <foreignObject>, mọi thuộc tính on*, và href không phải #fragment.
 */
import sanitizeHtml from 'sanitize-html'

const SVG_TAGS = [
  'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect',
  'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'symbol',
  'use', 'title', 'desc', 'text', 'tspan',
  // sanitize-html giữ nguyên chữ hoa/thường khi lowerCaseTags=false
  'linearGradient', 'radialGradient', 'clipPath',
]

const SVG_ATTRS = [
  'xmlns', 'viewBox', 'width', 'height', 'fill', 'fill-rule', 'clip-rule', 'fill-opacity',
  'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
  'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'opacity', 'd', 'cx', 'cy', 'r',
  'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'points', 'transform', 'id', 'class',
  'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform',
  'clip-path', 'mask', 'preserveAspectRatio', 'href', 'xlink:href', 'font-size',
  'font-family', 'font-weight', 'text-anchor', 'dominant-baseline', 'aria-hidden', 'role',
  'focusable', 'vector-effect',
]

const cache = new Map<string, string>()

export function sanitizeSvg(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) return ''
  const source = input.slice(0, 100_000)
  const hit = cache.get(source)
  if (hit !== undefined) return hit
  const clean = sanitizeHtml(source, {
    allowedTags: SVG_TAGS,
    allowedAttributes: { '*': SVG_ATTRS },
    allowedSchemes: [],
    allowProtocolRelative: false,
    parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
    exclusiveFilter: (frame) =>
      (frame.attribs?.href ?? frame.attribs?.['xlink:href'] ?? '#').trim().charAt(0) !== '#',
  })
  if (cache.size > 200) cache.clear()
  cache.set(source, clean)
  return clean
}
