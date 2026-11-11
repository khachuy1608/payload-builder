/**
 * Design tokens -> CSS variables.
 * P0–P2 chỉ có một theme mặc định. P4 sẽ lưu theme trong collection `themes`
 * và chỉ cần thay object tokens truyền vào `themeToCss()` – các block đã tham chiếu `var(--...)`.
 */

export interface ThemeTokens {
  colors: Record<string, string>
  fonts: Record<string, string>
  radius: Record<string, string>
}

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
  fonts: {
    heading: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    body: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
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

export function themeToCss(theme: ThemeTokens = defaultTheme): string {
  const vars: string[] = []
  for (const [k, v] of Object.entries(theme.colors)) vars.push(`--color-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.fonts)) vars.push(`--font-${k}:${v}`)
  for (const [k, v] of Object.entries(theme.radius)) vars.push(`--radius-${k}:${v}`)
  return `:root{${vars.join(';')}}`
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
.b-image{height:auto}
.b-image-link{display:block}
.b-svg{display:inline-flex;line-height:0}
.b-svg svg{width:100%;height:100%}
.b-button{display:inline-block;cursor:pointer;text-decoration:none;font:inherit;border:0}
.b-youtube{position:relative;width:100%;aspect-ratio:16/9}
.b-youtube iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.b-tabs-nav{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--color-border)}
.b-tabs-btn{appearance:none;background:none;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;padding:10px 16px;font:inherit;color:var(--color-muted);cursor:pointer}
.b-tabs-btn[aria-selected=true]{color:var(--color-primary);border-bottom-color:var(--color-primary);font-weight:600}
.b-tabs-panel[hidden]{display:none}
`
