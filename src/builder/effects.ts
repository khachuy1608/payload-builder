/**
 * Hệ hiệu ứng dùng chung (thuần dữ liệu): các preset người dùng chọn cho bất kỳ phần tử nào.
 * Lưu trong `props.fx` của node; biên dịch thành CSS trong css.ts và chạy phần cần JS trong blocks/Runtime.tsx.
 *
 * Nguồn tham khảo tên gọi: namethatui.com (Scroll Reveal, Stacking Cards, Hide-on-Scroll Header,
 * Hover Highlight/Lift/Spotlight, Typewriter/Rotating Words/Shimmer, Text Scramble, Parallax, Spring, Easing).
 */

export type RevealType = 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'flip'
export type HoverType = 'none' | 'highlight' | 'lift' | 'grow' | 'glow' | 'spotlight'
export type TextFxType = 'none' | 'scramble' | 'typewriter' | 'rotate' | 'shimmer'

export interface SpringConfig {
  stiffness: number
  damping: number
  mass: number
}

export interface FxProps {
  /** Xuất hiện khi cuộn tới (Scroll Reveal) */
  reveal?: RevealType
  /** Easing CSS hoặc 'spring' */
  easing?: string
  /** ms – bỏ qua khi easing = spring (tự tính theo lò xo) */
  duration?: number
  delay?: number
  /** Chỉ chạy lần đầu (mặc định true) */
  once?: boolean
  spring?: Partial<SpringConfig>
  hover?: HoverType
  /** Hiệu ứng chữ (block có chữ) */
  text?: TextFxType
  /** Các từ xoay vòng cho 'rotate', cách nhau bằng dấu phẩy */
  words?: string
  /** Tốc độ parallax: -1..1 (0 = tắt). Âm = chậm hơn cuộn, dương = nhanh hơn */
  parallax?: number
  /** Container: các con xếp chồng dính khi cuộn (Stacking Cards) */
  stack?: boolean
  /** Khoảng cách từ mép trên khi xếp chồng (px) */
  stackTop?: number
  /** Ẩn khi cuộn xuống, hiện lại khi cuộn lên (header) */
  hideOnScroll?: boolean
}

export const REVEAL_OPTIONS: { value: RevealType; label: string }[] = [
  { value: 'none', label: 'Không' },
  { value: 'fade', label: 'Mờ dần hiện (fade in)' },
  { value: 'slide-up', label: 'Trượt lên' },
  { value: 'slide-down', label: 'Trượt xuống' },
  { value: 'slide-left', label: 'Trượt từ phải sang' },
  { value: 'slide-right', label: 'Trượt từ trái sang' },
  { value: 'zoom', label: 'Phóng to (zoom in)' },
  { value: 'flip', label: 'Lật (flip)' },
]

export const HOVER_OPTIONS: { value: HoverType; label: string }[] = [
  { value: 'none', label: 'Không' },
  { value: 'highlight', label: 'Hover Highlight – đổi nền nhẹ' },
  { value: 'lift', label: 'Hover Lift – nâng lên + bóng' },
  { value: 'grow', label: 'Phóng nhẹ (scale)' },
  { value: 'glow', label: 'Phát sáng viền' },
  { value: 'spotlight', label: 'Cursor Spotlight – vệt sáng theo chuột' },
]

export const TEXT_FX_OPTIONS: { value: TextFxType; label: string }[] = [
  { value: 'none', label: 'Không' },
  { value: 'scramble', label: 'Text Scramble – ký tự ngẫu nhiên rồi hiện chữ' },
  { value: 'typewriter', label: 'Typewriter – gõ từng chữ' },
  { value: 'rotate', label: 'Rotating Words – xoay vòng các từ' },
  { value: 'shimmer', label: 'Text Shimmer – ánh sáng chạy qua chữ' },
]

/** Easing (timing function) hay dùng; 'spring' là mô phỏng lò xo vật lý qua linear() */
export const EASING_OPTIONS: { value: string; label: string }[] = [
  { value: 'ease', label: 'Ease (mặc định)' },
  { value: 'linear', label: 'Linear – đều' },
  { value: 'ease-in', label: 'Ease in – chậm lúc đầu' },
  { value: 'ease-out', label: 'Ease out – chậm lúc cuối' },
  { value: 'ease-in-out', label: 'Ease in-out' },
  { value: 'cubic-bezier(0.16, 1, 0.3, 1)', label: 'Expo out – vút rồi hãm' },
  { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Back out – vượt quá rồi lùi' },
  { value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', label: 'Elastic' },
  { value: 'spring', label: 'Spring – lò xo vật lý' },
]

export const DEFAULT_SPRING: SpringConfig = { stiffness: 170, damping: 18, mass: 1 }

/**
 * Mô phỏng lò xo tắt dần (vị trí 0 -> 1) và xuất thành easing `linear()` của CSS.
 * Giá trị có thể vượt 1 (overshoot) đúng như spring thật. Trả về cả thời lượng để lò xo ổn định.
 */
export function springEasing(config: Partial<SpringConfig> = {}, samples = 40): { css: string; duration: number } {
  const stiffness = clamp(config.stiffness ?? DEFAULT_SPRING.stiffness, 1, 1000)
  const damping = clamp(config.damping ?? DEFAULT_SPRING.damping, 0, 200)
  const mass = clamp(config.mass ?? DEFAULT_SPRING.mass, 0.1, 20)
  const dt = 1 / 240
  let x = 0
  let v = 0
  let t = 0
  let settled = 0
  const positions: number[] = []
  // mô phỏng tới khi ổn định (hoặc tối đa 5s)
  while (t < 5) {
    const a = (-stiffness * (x - 1) - damping * v) / mass
    v += a * dt
    x += v * dt
    t += dt
    positions.push(x)
    settled = Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01 ? settled + dt : 0
    if (settled > 0.05) break
  }
  const duration = Math.max(100, Math.round(t * 1000))
  const points: string[] = []
  for (let i = 0; i <= samples; i++) {
    const idx = Math.min(positions.length - 1, Math.round((i / samples) * (positions.length - 1)))
    const value = i === 0 ? 0 : i === samples ? 1 : positions[idx]
    points.push(`${round(value)} ${round((i / samples) * 100)}%`)
  }
  return { css: `linear(${points.join(', ')})`, duration }
}

/** Easing CSS thực tế cho giá trị người dùng chọn (spring -> linear()) */
export function resolveEasing(easing: string | undefined, spring?: Partial<SpringConfig>): string {
  if (!easing) return 'ease'
  if (easing === 'spring') return springEasing(spring).css
  return /^[a-z-]+$|^cubic-bezier\([\d.,\s-]+\)$|^steps\([\d\s,a-z-]+\)$/.test(easing) ? easing : 'ease'
}

/** Thời lượng hiệu lực (ms) */
export function resolveDuration(fx: FxProps): number {
  if (fx.easing === 'spring') return springEasing(fx.spring).duration
  return clamp(fx.duration ?? 600, 50, 10000)
}

/** Làm sạch props.fx từ dữ liệu bất kỳ; trả về undefined nếu không có hiệu ứng nào */
export function normalizeFx(input: unknown): FxProps | undefined {
  if (!input || typeof input !== 'object') return undefined
  const src = input as Record<string, unknown>
  const fx: FxProps = {}
  const pick = <T extends string>(key: string, allowed: readonly T[]): T | undefined => {
    const v = src[key]
    return typeof v === 'string' && (allowed as readonly string[]).includes(v) && v !== 'none' ? (v as T) : undefined
  }
  fx.reveal = pick('reveal', REVEAL_OPTIONS.map((o) => o.value))
  fx.hover = pick('hover', HOVER_OPTIONS.map((o) => o.value))
  fx.text = pick('text', TEXT_FX_OPTIONS.map((o) => o.value))
  if (typeof src.easing === 'string' && src.easing && src.easing !== 'ease') fx.easing = resolveEasing(src.easing) === src.easing || src.easing === 'spring' ? src.easing : undefined
  if (typeof src.duration === 'number' && isFinite(src.duration)) fx.duration = clamp(Math.round(src.duration), 50, 10000)
  if (typeof src.delay === 'number' && isFinite(src.delay)) fx.delay = clamp(Math.round(src.delay), 0, 10000)
  if (src.once === false) fx.once = false
  if (src.spring && typeof src.spring === 'object') {
    const sp = src.spring as Record<string, unknown>
    const out: Partial<SpringConfig> = {}
    for (const k of ['stiffness', 'damping', 'mass'] as const) if (typeof sp[k] === 'number' && isFinite(sp[k] as number)) out[k] = sp[k] as number
    if (Object.keys(out).length) fx.spring = out
  }
  if (typeof src.words === 'string' && src.words.trim()) fx.words = src.words.slice(0, 500)
  if (typeof src.parallax === 'number' && isFinite(src.parallax) && src.parallax !== 0) fx.parallax = clamp(src.parallax, -1, 1)
  if (src.stack === true) fx.stack = true
  if (typeof src.stackTop === 'number' && isFinite(src.stackTop)) fx.stackTop = clamp(Math.round(src.stackTop), 0, 400)
  if (src.hideOnScroll === true) fx.hideOnScroll = true
  for (const k of Object.keys(fx) as (keyof FxProps)[]) if (fx[k] === undefined) delete fx[k]
  return Object.keys(fx).length ? fx : undefined
}

/** Có phần nào của fx cần JS (Runtime) không */
export function fxNeedsRuntime(fx: FxProps | undefined): boolean {
  return !!fx && (!!fx.reveal || !!fx.parallax || !!fx.hideOnScroll || fx.hover === 'spotlight' || (!!fx.text && fx.text !== 'shimmer'))
}

/** Keyframes + luật chung cho hiệu ứng (đưa vào BASE_CSS) */
export const FX_CSS = `
@keyframes bld-fade{from{opacity:0}to{opacity:1}}
@keyframes bld-slide-up{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
@keyframes bld-slide-down{from{opacity:0;transform:translateY(-32px)}to{opacity:1;transform:none}}
@keyframes bld-slide-left{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
@keyframes bld-slide-right{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}
@keyframes bld-zoom{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
@keyframes bld-flip{from{opacity:0;transform:perspective(800px) rotateX(-20deg)}to{opacity:1;transform:none}}
@keyframes bld-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
@keyframes bld-caret{50%{opacity:0}}
[data-fx-reveal]{opacity:0}
[data-fx-reveal].is-in{opacity:1}
[data-fx-text=shimmer]{background-image:linear-gradient(90deg,currentColor 40%,rgba(255,255,255,.95) 50%,currentColor 60%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:bld-shimmer 2.5s linear infinite}
.bld-caret::after{content:'|';margin-left:1px;animation:bld-caret 1s steps(1) infinite}
[data-fx-hide]{transition:transform .3s ease}
[data-fx-hide].is-hidden{transform:translateY(-110%)}
[data-fx-hover=spotlight]{position:relative;overflow:hidden}
[data-fx-hover=spotlight]::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .25s;background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.28),transparent 65%)}
[data-fx-hover=spotlight]:hover::after{opacity:1}
@media (prefers-reduced-motion:reduce){[data-fx-reveal]{opacity:1!important;animation:none!important}[data-fx-text=shimmer]{animation:none}[data-fx-parallax]{transform:none!important}}
`

/** CSS riêng cho một node theo fx (gọi từ css.ts). `sel` là selector `.n-<id>` */
export function fxCss(sel: string, fx: FxProps): { base: string[]; hover: string[] } {
  const base: string[] = []
  const hover: string[] = []
  if (fx.reveal) {
    const easing = resolveEasing(fx.easing, fx.spring)
    base.push(`${sel}.is-in{animation:bld-${fx.reveal} ${resolveDuration(fx)}ms ${easing} ${fx.delay ?? 0}ms both}`)
  }
  switch (fx.hover) {
    case 'highlight':
      base.push(`${sel}{transition:background-color .2s ease,color .2s ease}`)
      hover.push(`${sel}:hover{background-color:color-mix(in srgb,var(--color-primary) 12%,transparent)}`)
      break
    case 'lift':
      base.push(`${sel}{transition:transform .25s ease,box-shadow .25s ease}`)
      hover.push(`${sel}:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(15,23,42,.14)}`)
      break
    case 'grow':
      base.push(`${sel}{transition:transform .2s ease}`)
      hover.push(`${sel}:hover{transform:scale(1.03)}`)
      break
    case 'glow':
      base.push(`${sel}{transition:box-shadow .25s ease}`)
      hover.push(`${sel}:hover{box-shadow:0 0 0 3px color-mix(in srgb,var(--color-primary) 35%,transparent),0 8px 24px color-mix(in srgb,var(--color-primary) 30%,transparent)}`)
      break
  }
  if (fx.stack) {
    const top = fx.stackTop ?? 80
    base.push(`${sel}>*{position:sticky}`)
    for (let i = 1; i <= 12; i++) base.push(`${sel}>:nth-child(${i}){top:${top + (i - 1) * 16}px}`)
  }
  if (fx.parallax) base.push(`${sel}{will-change:transform}`)
  return { base, hover }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
function round(n: number) {
  return Math.round(n * 1000) / 1000
}
