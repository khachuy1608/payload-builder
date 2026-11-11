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

export type ColorKey = (typeof COLOR_KEYS)[number]
export type FontKey = (typeof FONT_KEYS)[number]
export type RadiusKey = (typeof RADIUS_KEYS)[number]
export type ButtonKey = (typeof BUTTON_KEYS)[number]

export interface ThemeTokens {
  colors: Record<string, string>
  fonts: Record<string, string>
  radius: Record<string, string>
  /** Kiểu nút mặc định: bo góc, độ đậm, kiểu chữ */
  button: Record<string, string>
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
    muted: '#6b7280',
    background: '#ffffff',
    surface: '#f3f4f6',
    border: '#e5e7eb',
  },
  fonts: { heading: SYSTEM_SANS, body: SYSTEM_SANS, mono: SYSTEM_MONO },
  radius: { sm: '4px', md: '8px', lg: '16px' },
  button: { radius: '8px', weight: '600', transform: 'none' },
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
  }
  const url = typeof src.fontUrl === 'string' ? src.fontUrl.trim() : ''
  if (url && FONT_URL_PATTERN.test(url) && url.length <= 500) theme.fontUrl = url
  return theme
}

export function themeToCss(theme: ThemeTokens = defaultTheme): string {
  const vars: string[] = []
  for (const [k, v] of Object.entries(theme.colors)) vars.push(`--color-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.fonts)) vars.push(`--font-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.radius)) vars.push(`--radius-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.button ?? {})) vars.push(`--button-${k}:${v}`)
  return `:root{${vars.join(';')}}`
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
` + FX_CSS + BLOCKS_CSS

/** Các theme preset (chỉ đọc) được seed vào collection `themes` */
export const PRESET_THEMES: { name: string; tokens: ThemeTokens }[] = [
  { name: 'Indigo', tokens: defaultTheme },
  {
    name: 'Ocean',
    tokens: {
      colors: { primary: '#0e7490', secondary: '#082f49', accent: '#f97316', text: '#1e293b', muted: '#64748b', background: '#f8fafc', surface: '#e0f2fe', border: '#cbd5e1' },
      fonts: { heading: "'Be Vietnam Pro', " + SYSTEM_SANS, body: "'Be Vietnam Pro', " + SYSTEM_SANS, mono: SYSTEM_MONO },
      radius: { sm: '6px', md: '12px', lg: '24px' },
      button: { radius: '999px', weight: '600', transform: 'none' },
      fontUrl: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap',
    },
  },
  {
    name: 'Sunset',
    tokens: {
      colors: { primary: '#e11d48', secondary: '#431407', accent: '#f59e0b', text: '#292524', muted: '#78716c', background: '#fffbf5', surface: '#ffedd5', border: '#fed7aa' },
      fonts: { heading: "'Playfair Display', " + SYSTEM_SERIF, body: "'Lora', " + SYSTEM_SERIF, mono: SYSTEM_MONO },
      radius: { sm: '2px', md: '6px', lg: '12px' },
      button: { radius: '6px', weight: '700', transform: 'uppercase' },
      fontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap',
    },
  },
  {
    name: 'Mono',
    tokens: {
      colors: { primary: '#111111', secondary: '#111111', accent: '#facc15', text: '#171717', muted: '#737373', background: '#ffffff', surface: '#f5f5f5', border: '#d4d4d4' },
      fonts: { heading: "'Inter', " + SYSTEM_SANS, body: "'Inter', " + SYSTEM_SANS, mono: SYSTEM_MONO },
      radius: { sm: '0px', md: '0px', lg: '0px' },
      button: { radius: '0px', weight: '600', transform: 'uppercase' },
      fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    },
  },
]
