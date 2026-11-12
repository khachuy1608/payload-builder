/**
 * Design tokens -> CSS variables.
 * Theme được lưu trong collection `themes` (P4); global `site-settings` chọn theme đang dùng, trang có thể ghi đè.
 * Mọi block tham chiếu `var(--color-*)`, `var(--font-*)`, `var(--radius-*)`, `var(--button-*)` nên đổi theme = đổi bộ token.
 */
import { sanitizeCssValue } from './css'
import { BLOCKS_CSS } from './blocks/blocks.css'
import { FX_CSS } from './effects'

export const COLOR_KEYS = ['primary', 'secondary', 'accent', 'text', 'muted', 'background', 'surface', 'border'] as const
export const FONT_KEYS = ['heading', 'body', 'mono'] as const
export const RADIUS_KEYS = ['sm', 'md', 'lg'] as const
export const BUTTON_KEYS = ['radius', 'weight', 'transform'] as const
export const SPACING_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
export const TEXT_KEYS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const
export const SHADOW_KEYS = ['sm', 'md', 'lg'] as const
export const LAYOUT_KEYS = ['container', 'narrow'] as const

export type ColorKey = (typeof COLOR_KEYS)[number]
export type FontKey = (typeof FONT_KEYS)[number]
export type RadiusKey = (typeof RADIUS_KEYS)[number]
export type ButtonKey = (typeof BUTTON_KEYS)[number]

/** Kiểu chữ đặt tên (text style): áp cho Heading/Paragraph/Button qua class .ts-<name> */
export interface TextStyle {
  name: string
  label: string
  fontFamily?: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing?: string
  textTransform?: string
  color?: string
}

export interface ThemeTokens {
  colors: Record<string, string>
  fonts: Record<string, string>
  radius: Record<string, string>
  /** Kiểu nút mặc định: bo góc, độ đậm, kiểu chữ */
  button: Record<string, string>
  /** Thang khoảng cách: --space-xs … --space-2xl */
  spacing: Record<string, string>
  /** Thang cỡ chữ: --text-xs … --text-4xl */
  text: Record<string, string>
  /** Bóng đổ: --shadow-sm/md/lg */
  shadow: Record<string, string>
  /** Bề rộng bố cục: --container, --narrow */
  layout: Record<string, string>
  /** Kiểu chữ đặt tên */
  textStyles: TextStyle[]
  /** Stylesheet font ngoài (ví dụ Google Fonts), chỉ nhận https */
  fontUrl?: string
}

export const SYSTEM_SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
export const SYSTEM_SERIF = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
export const SYSTEM_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export const defaultTheme: ThemeTokens = {
  colors: {
    primary: '#4f46e5',
    secondary: '#0f172a',
    accent: '#f59e0b',
    text: '#1f2937',
    muted: '#5b6472',
    background: '#ffffff',
    surface: '#f3f4f6',
    border: '#e5e7eb',
  },
  fonts: { heading: SYSTEM_SANS, body: SYSTEM_SANS, mono: SYSTEM_MONO },
  radius: { sm: '4px', md: '8px', lg: '16px' },
  button: { radius: '8px', weight: '600', transform: 'none' },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '40px', '2xl': '64px' },
  text: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px', '2xl': '24px', '3xl': '32px', '4xl': '48px' },
  shadow: { sm: '0 1px 2px rgba(0,0,0,.06)', md: '0 4px 12px rgba(0,0,0,.08)', lg: '0 16px 40px rgba(0,0,0,.14)' },
  layout: { container: '1120px', narrow: '760px' },
  textStyles: [
    { name: 'display', label: 'Display', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.02em' },
    { name: 'h1', label: 'Tiêu đề 1', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: '700', lineHeight: '1.2' },
    { name: 'h2', label: 'Tiêu đề 2', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: '700', lineHeight: '1.25' },
    { name: 'h3', label: 'Tiêu đề 3', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: '600', lineHeight: '1.3' },
    { name: 'lead', label: 'Mở đầu', fontSize: 'var(--text-lg)', fontWeight: '400', lineHeight: '1.6', color: 'var(--color-muted)' },
    { name: 'body', label: 'Nội dung', fontSize: 'var(--text-base)', fontWeight: '400', lineHeight: '1.6' },
    { name: 'small', label: 'Nhỏ', fontSize: 'var(--text-sm)', fontWeight: '400', lineHeight: '1.5', color: 'var(--color-muted)' },
    { name: 'caption', label: 'Chú thích', fontSize: 'var(--text-xs)', fontWeight: '500', lineHeight: '1.4', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-muted)' },
  ],
}

export const SPACING_TOKEN_LABELS: Record<string, string> = { xs: 'Rất nhỏ', sm: 'Nhỏ', md: 'Vừa', lg: 'Lớn', xl: 'Rất lớn', '2xl': 'Cực lớn' }
export const TEXT_TOKEN_LABELS: Record<string, string> = { xs: 'xs', sm: 'sm', base: 'base', lg: 'lg', xl: 'xl', '2xl': '2xl', '3xl': '3xl', '4xl': '4xl' }
export const SHADOW_TOKEN_LABELS: Record<string, string> = { sm: 'Bóng nhẹ', md: 'Bóng vừa', lg: 'Bóng đậm' }
export const LAYOUT_TOKEN_LABELS: Record<string, string> = { container: 'Bề rộng container', narrow: 'Bề rộng hẹp (bài viết)' }

/** Token gợi ý cho một thuộc tính style (dropdown trong panel Kiểu): [nhãn, giá trị CSS] */
export function tokenOptionsFor(prop: string, theme: ThemeTokens): { label: string; value: string }[] {
  if (/^(padding|margin|gap|rowGap|columnGap|top|right|bottom|left)/.test(prop)) return SPACING_KEYS.map((k) => ({ label: `${SPACING_TOKEN_LABELS[k]} (${theme.spacing[k]})`, value: `var(--space-${k})` }))
  if (prop === 'fontSize') return TEXT_KEYS.map((k) => ({ label: `${k} (${theme.text[k]})`, value: `var(--text-${k})` }))
  if (prop === 'boxShadow') return SHADOW_KEYS.map((k) => ({ label: `${SHADOW_TOKEN_LABELS[k]}`, value: `var(--shadow-${k})` }))
  if (prop === 'maxWidth' || prop === 'width') return LAYOUT_KEYS.map((k) => ({ label: `${LAYOUT_TOKEN_LABELS[k]} (${theme.layout[k]})`, value: `var(--${k})` }))
  if (prop === 'borderRadius') return RADIUS_KEYS.map((k) => ({ label: `${RADIUS_TOKEN_LABELS[k]} (${theme.radius[k]})`, value: `var(--radius-${k})` }))
  return []
}

export const COLOR_TOKEN_LABELS: Record<string, string> = {
  primary: 'Chính',
  secondary: 'Phụ',
  accent: 'Nhấn',
  text: 'Chữ',
  muted: 'Chữ mờ',
  background: 'Nền',
  surface: 'Nền phụ',
  border: 'Viền',
}
export const FONT_TOKEN_LABELS: Record<string, string> = { heading: 'Font tiêu đề', body: 'Font nội dung', mono: 'Font mono' }
export const RADIUS_TOKEN_LABELS: Record<string, string> = { sm: 'Bo góc nhỏ', md: 'Bo góc vừa', lg: 'Bo góc lớn' }
export const BUTTON_TOKEN_LABELS: Record<string, string> = { radius: 'Bo góc nút', weight: 'Độ đậm chữ nút', transform: 'Kiểu chữ nút' }

/** Một số font stack gợi ý trong UI (tên hiển thị -> giá trị) */
export const FONT_PRESETS: { label: string; value: string }[] = [
  { label: 'Hệ thống (sans-serif)', value: SYSTEM_SANS },
  { label: 'Hệ thống (serif)', value: SYSTEM_SERIF },
  { label: 'Mono', value: SYSTEM_MONO },
  { label: 'Inter', value: "'Inter', " + SYSTEM_SANS },
  { label: 'Roboto', value: "'Roboto', " + SYSTEM_SANS },
  { label: 'Be Vietnam Pro', value: "'Be Vietnam Pro', " + SYSTEM_SANS },
  { label: 'Playfair Display', value: "'Playfair Display', " + SYSTEM_SERIF },
  { label: 'Lora', value: "'Lora', " + SYSTEM_SERIF },
]

const FONT_URL_PATTERN = /^https:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+$/

// ---------- Google Fonts ----------

export type FontCategory = 'sans' | 'serif' | 'display' | 'mono'
export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = { sans: 'Sans-serif', serif: 'Serif', display: 'Display / tiêu đề', mono: 'Mono' }

/** Danh sách Google Fonts phổ biến (có hỗ trợ tiếng Việt với đa số font sans/serif) */
export const GOOGLE_FONTS: { name: string; category: FontCategory }[] = [
  ...['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Be Vietnam Pro', 'Nunito', 'Nunito Sans', 'Raleway', 'Work Sans', 'DM Sans', 'Manrope', 'Source Sans 3', 'Noto Sans', 'PT Sans', 'Rubik', 'Mulish', 'Fira Sans', 'Karla', 'Quicksand', 'Josefin Sans', 'Archivo', 'Plus Jakarta Sans', 'Lexend', 'Outfit', 'Space Grotesk'].map((name) => ({ name, category: 'sans' as const })),
  ...['Playfair Display', 'Merriweather', 'Lora', 'Noto Serif', 'PT Serif', 'Libre Baskerville', 'Crimson Text', 'EB Garamond', 'Cormorant Garamond', 'Bitter', 'Roboto Slab', 'Source Serif 4', 'Literata'].map((name) => ({ name, category: 'serif' as const })),
  ...['Oswald', 'Bebas Neue', 'Anton', 'Righteous', 'Pacifico', 'Lobster', 'Dancing Script', 'Abril Fatface'].map((name) => ({ name, category: 'display' as const })),
  ...['Roboto Mono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono', 'Space Mono'].map((name) => ({ name, category: 'mono' as const })),
]

const GOOGLE_FALLBACK: Record<FontCategory, string> = { sans: SYSTEM_SANS, serif: SYSTEM_SERIF, display: SYSTEM_SANS, mono: SYSTEM_MONO }

/** Font stack CSS cho một Google Font: 'Tên', fallback hệ thống theo nhóm */
export function googleFontStack(name: string): string {
  const font = GOOGLE_FONTS.find((f) => f.name === name)
  return `'${name}', ${GOOGLE_FALLBACK[font?.category ?? 'sans']}`
}

/** Tên Google Font đứng đầu một font stack (nếu có trong danh sách) */
export function googleFontOfStack(stack: string): string | null {
  const m = stack.trim().match(/^['"]?([^'",]+)['"]?\s*(,|$)/)
  const name = m?.[1]?.trim()
  return name && GOOGLE_FONTS.some((f) => f.name === name) ? name : null
}

/** Các Google Font mà theme đang dùng (theo thứ tự heading, body, mono; không trùng) */
export function googleFamiliesInTheme(theme: Pick<ThemeTokens, 'fonts'>): string[] {
  const out: string[] = []
  for (const key of FONT_KEYS) {
    const name = googleFontOfStack(theme.fonts[key] ?? '')
    if (name && !out.includes(name)) out.push(name)
  }
  return out
}

const GOOGLE_FONTS_BASE = 'https://fonts.googleapis.com/css2?'

/** URL stylesheet Google Fonts cho các font đã chọn (đủ các độ đậm hay dùng); '' nếu không có font nào */
export function buildGoogleFontsUrl(families: string[]): string {
  if (!families.length) return ''
  const q = families.map((name) => `family=${name.trim().replace(/\s+/g, '+')}:wght@400;500;600;700;800`).join('&')
  return `${GOOGLE_FONTS_BASE}${q}&display=swap`
}

/** fontUrl đang được editor tự sinh (trống hoặc là link Google Fonts) -> có thể tự cập nhật khi đổi font */
export function isAutoFontUrl(url: string | undefined): boolean {
  return !url || url.startsWith(GOOGLE_FONTS_BASE)
}

function pickGroup(input: unknown, keys: readonly string[], base: Record<string, string>): Record<string, string> {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const out: Record<string, string> = {}
  for (const key of keys) {
    const raw = src[key]
    const value = typeof raw === 'string' || typeof raw === 'number' ? sanitizeCssValue(String(raw)) : ''
    out[key] = value || base[key]
  }
  return out
}

/**
 * Chuẩn hoá token từ dữ liệu bất kỳ (doc trong DB, form…): điền giá trị thiếu từ `base`,
 * làm sạch giá trị để không chèn được CSS lạ, chỉ nhận fontUrl dạng https.
 */
export function normalizeTheme(input: unknown, base: ThemeTokens = defaultTheme): ThemeTokens {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const theme: ThemeTokens = {
    colors: pickGroup(src.colors, COLOR_KEYS, base.colors),
    fonts: pickGroup(src.fonts, FONT_KEYS, base.fonts),
    radius: pickGroup(src.radius, RADIUS_KEYS, base.radius),
    button: pickGroup(src.button, BUTTON_KEYS, base.button),
    spacing: pickGroup(src.spacing, SPACING_KEYS, base.spacing),
    text: pickGroup(src.text, TEXT_KEYS, base.text),
    shadow: pickGroup(src.shadow, SHADOW_KEYS, base.shadow),
    layout: pickGroup(src.layout, LAYOUT_KEYS, base.layout),
    textStyles: normalizeTextStyles(src.textStyles, base.textStyles),
  }
  const url = typeof src.fontUrl === 'string' ? src.fontUrl.trim() : ''
  if (url && FONT_URL_PATTERN.test(url) && url.length <= 500) theme.fontUrl = url
  return theme
}

export const TEXT_STYLE_NAME = /^[a-z][a-z0-9-]{0,30}$/

/** Kiểu chữ đặt tên: tên hợp lệ, không trùng, giá trị đã làm sạch; thiếu thì dùng base (hoặc mặc định) */
export function normalizeTextStyles(input: unknown, base: TextStyle[] = defaultTheme.textStyles): TextStyle[] {
  if (!Array.isArray(input)) return structuredClone(base)
  const out: TextStyle[] = []
  const seen = new Set<string>()
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    const name = String(r.name ?? '').trim()
    if (!TEXT_STYLE_NAME.test(name) || seen.has(name)) continue
    seen.add(name)
    const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? sanitizeCssValue(String(v)) : '')
    const ts: TextStyle = { name, label: String(r.label ?? name).slice(0, 60) || name, fontSize: str(r.fontSize) || 'var(--text-base)', fontWeight: str(r.fontWeight) || '400', lineHeight: str(r.lineHeight) || '1.5' }
    for (const k of ['fontFamily', 'letterSpacing', 'textTransform', 'color'] as const) {
      const v = str(r[k])
      if (v) ts[k] = v
    }
    out.push(ts)
  }
  return out
}

const TS_PROPS: Record<keyof Omit<TextStyle, 'name' | 'label'>, string> = { fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', lineHeight: 'line-height', letterSpacing: 'letter-spacing', textTransform: 'text-transform', color: 'color' }

/** CSS cho các kiểu chữ đặt tên (.ts-<name>) */
export function textStylesCss(styles: TextStyle[]): string {
  return styles
    .map((ts) => {
      const decl = (Object.keys(TS_PROPS) as (keyof typeof TS_PROPS)[])
        .filter((k) => ts[k])
        .map((k) => `${TS_PROPS[k]}:${ts[k]}`)
        .join(';')
      return `.ts-${ts.name}{${decl}}`
    })
    .join('')
}

export function themeToCss(theme: ThemeTokens = defaultTheme): string {
  const vars: string[] = []
  for (const [k, v] of Object.entries(theme.colors)) vars.push(`--color-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.fonts)) vars.push(`--font-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.radius)) vars.push(`--radius-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.button ?? {})) vars.push(`--button-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.spacing ?? {})) vars.push(`--space-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.text ?? {})) vars.push(`--text-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.shadow ?? {})) vars.push(`--shadow-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.layout ?? {})) vars.push(`--${k}:${v}`)
  return `:root{${vars.join(';')}}` + textStylesCss(theme.textStyles ?? [])
}

/** Thẻ <link> nạp font ngoài (chuỗi HTML an toàn vì fontUrl đã được lọc theo pattern) */
export function themeFontLink(theme: ThemeTokens): string {
  return theme.fontUrl ? `<link rel="stylesheet" href="${theme.fontUrl}">` : ''
}

/** CSS nền cho mọi trang render bằng builder (front-end + canvas của editor) */
export const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:var(--font-body);color:var(--color-text);background:var(--color-background);line-height:1.6;-webkit-font-smoothing:antialiased}
img,svg,video,iframe{display:block;max-width:100%}
.bld-root{min-height:100vh}
.b-heading{margin:0;font-family:var(--font-heading);line-height:1.2;color:var(--color-secondary)}
.b-paragraph{margin:0;white-space:pre-line}
.b-paragraph ul,.b-paragraph ol{margin:0;padding-left:1.5em}
.b-paragraph li{white-space:pre-line}
.b-image{height:auto}
.b-image-link{display:block}
.b-svg{display:inline-flex;line-height:0}
.b-svg svg{width:100%;height:100%}
.b-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;text-decoration:none;font:inherit;border:0;border-radius:var(--button-radius);font-weight:var(--button-weight);text-transform:var(--button-transform)}
.b-button-icon{flex:none}
.b-youtube{position:relative;width:100%;aspect-ratio:16/9}
.b-youtube iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.b-tabs-nav{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--color-border)}
.b-tabs-btn{appearance:none;background:none;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;padding:10px 16px;font:inherit;color:var(--color-muted);cursor:pointer}
.b-tabs-btn[aria-selected=true]{color:var(--color-primary);border-bottom-color:var(--color-primary);font-weight:600}

.b-tabs-panel[hidden]{display:none}
[data-click]{cursor:pointer}[data-click]:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}
.b-rich{line-height:1.7}
.b-rich h1,.b-rich h2,.b-rich h3,.b-rich h4{font-family:var(--font-heading);line-height:1.25;margin:1.4em 0 .5em;color:var(--color-secondary)}
.b-rich h1{font-size:var(--text-3xl)}.b-rich h2{font-size:var(--text-2xl)}.b-rich h3{font-size:var(--text-xl)}
.b-rich p{margin:0 0 1em}.b-rich ul,.b-rich ol{margin:0 0 1em;padding-left:1.5em}
.b-rich blockquote{margin:1.2em 0;padding:.6em 1em;border-left:4px solid var(--color-primary);background:var(--color-surface);border-radius:var(--radius-sm)}
.b-rich img{border-radius:var(--radius-md);margin:1em 0}.b-rich pre{background:#0f172a;color:#e2e8f0;padding:1em;border-radius:var(--radius-md);overflow:auto;font-family:var(--font-mono);font-size:.9em}
.b-rich code{font-family:var(--font-mono);font-size:.92em}.b-rich p code{background:var(--color-surface);padding:.1em .35em;border-radius:4px}
.b-rich table{border-collapse:collapse;width:100%;margin:1em 0}.b-rich th,.b-rich td{border:1px solid var(--color-border);padding:.5em .75em;text-align:left}.b-rich th{background:var(--color-surface)}
.b-rich a{color:var(--color-primary)}.b-rich hr{border:0;border-top:1px solid var(--color-border);margin:2em 0}
.b-lang{font-size:14px}.b-lang-item{display:inline-flex;align-items:center;gap:6px}.b-lang-sep{color:var(--color-border)}.b-lang-link{color:var(--color-muted);text-decoration:none}.b-lang-link.is-active{color:var(--color-primary);font-weight:600}.b-lang-select{padding:6px 10px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-background);font:inherit}
.b-load-more .b-button{background:var(--color-primary);color:#fff;padding:12px 24px}
.b-load-more-done{color:var(--color-muted);font-size:14px}
[data-pn=list]{scroll-margin-top:96px;transition:opacity .2s}[data-pn].is-pn-loading{opacity:.55;pointer-events:none;cursor:progress}
.b-load-more.is-pn-loading .b-button,.b-pagination.is-pn-loading .b-page-btn.is-active{position:relative}
.b-load-more.is-pn-loading .b-button::after{content:"";display:inline-block;width:14px;height:14px;margin-left:8px;vertical-align:-2px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:b-pn-spin .7s linear infinite}
.b-pn-new{animation:b-pn-in .45s ease both}@keyframes b-pn-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes b-pn-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.b-pn-new,.b-load-more.is-pn-loading .b-button::after{animation:none}}
.bld-draft-bar{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#111827;color:#fff;padding:8px 16px;border-radius:999px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)}.bld-draft-bar a{color:#a5b4fc}
` + FX_CSS + BLOCKS_CSS

/** Băm nội dung CSS nền để đặt ?v= cho /builder.css (đổi CSS là đổi URL -> không dính cache cũ) */
export const BASE_CSS_HASH = (() => {
  let h = 5381
  for (let i = 0; i < BASE_CSS.length; i++) h = ((h << 5) + h + BASE_CSS.charCodeAt(i)) >>> 0
  return h.toString(36)
})()

/** Các theme preset (chỉ đọc) được seed vào collection `themes` – nhóm thiếu lấy từ mặc định */
const PRESET_SOURCE: { name: string; tokens: Partial<ThemeTokens> }[] = [
  { name: 'Indigo', tokens: defaultTheme },
  {
    name: 'Ocean',
    tokens: {
      colors: { primary: '#0e7490', secondary: '#082f49', accent: '#f97316', text: '#1e293b', muted: '#526275', background: '#f8fafc', surface: '#e0f2fe', border: '#cbd5e1' },
      fonts: { heading: "'Be Vietnam Pro', " + SYSTEM_SANS, body: "'Be Vietnam Pro', " + SYSTEM_SANS, mono: SYSTEM_MONO },
      radius: { sm: '6px', md: '12px', lg: '24px' },
      button: { radius: '999px', weight: '600', transform: 'none' },
      fontUrl: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap',
    },
  },
  {
    name: 'Sunset',
    tokens: {
      colors: { primary: '#e11d48', secondary: '#431407', accent: '#f59e0b', text: '#292524', muted: '#6b625b', background: '#fffbf5', surface: '#ffedd5', border: '#fed7aa' },
      fonts: { heading: "'Playfair Display', " + SYSTEM_SERIF, body: "'Lora', " + SYSTEM_SERIF, mono: SYSTEM_MONO },
      radius: { sm: '2px', md: '6px', lg: '12px' },
      button: { radius: '6px', weight: '700', transform: 'uppercase' },
      fontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap',
    },
  },
  {
    name: 'Mono',
    tokens: {
      colors: { primary: '#111111', secondary: '#111111', accent: '#facc15', text: '#171717', muted: '#616161', background: '#ffffff', surface: '#f5f5f5', border: '#d4d4d4' },
      fonts: { heading: "'Inter', " + SYSTEM_SANS, body: "'Inter', " + SYSTEM_SANS, mono: SYSTEM_MONO },
      radius: { sm: '0px', md: '0px', lg: '0px' },
      button: { radius: '0px', weight: '600', transform: 'uppercase' },
      fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    },
  },
]

export const PRESET_THEMES: { name: string; tokens: ThemeTokens }[] = PRESET_SOURCE.map((p) => ({ name: p.name, tokens: normalizeTheme(p.tokens) }))
