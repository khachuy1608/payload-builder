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

// ---------- Rich text (Paragraph) ----------

const RICH_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'a', 'br', 'code', 'ul', 'ol', 'li']
const richCache = new Map<string, string>()

/**
 * Làm sạch HTML của Paragraph: chỉ giữ đậm/nghiêng/gạch chân/gạch ngang/link/code/xuống dòng và danh sách (ul/ol/li).
 * Văn bản thuần đi qua đây được escape (&, <, >) nên render bằng innerHTML vẫn an toàn và giữ nguyên nội dung.
 */
export function sanitizeRichText(input: unknown): string {
  if (typeof input !== 'string') return ''
  const source = input.slice(0, 50_000)
  const hit = richCache.get(source)
  if (hit !== undefined) return hit
  const clean = sanitizeHtml(source, {
    allowedTags: RICH_TAGS,
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
      }),
      // contentEditable của trình duyệt hay sinh <div>/<p>: đổi thành xuống dòng
      div: () => ({ tagName: 'br', attribs: {} }),
      p: () => ({ tagName: 'br', attribs: {} }),
    },
    textFilter: (text) => text,
  })
    // <br> do div/p sinh ra bị bọc nội dung: "<br>abc</br>" -> "<br>abc"; bỏ <br> thừa cuối
    .replace(/<\/br>/g, '')
    // khoảng trắng giữa các thẻ danh sách sẽ thành dòng trống vì white-space: pre-line
    .replace(/>\s+<(\/?(?:ul|ol|li)\b)/g, '><$1')
    .replace(/(<\/(?:ul|ol|li)>)\s+</g, '$1<')
    .replace(/^(<br\s*\/?>)+/, '')
    .replace(/(<br\s*\/?>)+$/, '')
  if (richCache.size > 500) richCache.clear()
  richCache.set(source, clean)
  return clean
}

/** Văn bản thuần từ rich text (nhãn ở cây Cấu trúc, gợi ý tên block…) */
export function richToPlain(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>\s*<li[^>]*>/gi, '\n')
    .replace(/<\/(ul|ol)>\s*<(ul|ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** Paragraph có danh sách thì phải render bằng <div> (ul/ol không được nằm trong <p>) */
export function richHasBlock(html: string): boolean {
  return /<(ul|ol)\b/i.test(html)
}

// ---------- Nội dung rich text đầy đủ (bài viết từ Lexical, block Rich content) ----------

const CONTENT_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup', 'a', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div']
const contentCache = new Map<string, string>()

/**
 * Làm sạch HTML nội dung dài (tiêu đề, đoạn, danh sách, trích dẫn, ảnh, bảng, code).
 * Dùng cho bài viết/sản phẩm chuyển từ Lexical và block Rich content. Bỏ mọi script/style/on*.
 */
export function sanitizeContentHtml(input: unknown): string {
  if (typeof input !== 'string') return ''
  const source = input.slice(0, 500_000)
  const hit = contentCache.get(source)
  if (hit !== undefined) return hit
  const clean = sanitizeHtml(source, {
    allowedTags: CONTENT_TAGS,
    allowedAttributes: { a: ['href', 'target', 'rel', 'title'], img: ['src', 'alt', 'width', 'height', 'loading'], '*': ['class', 'id'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'], ol: ['start'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
    },
  })
  if (contentCache.size > 200) contentCache.clear()
  contentCache.set(source, clean)
  return clean
}
