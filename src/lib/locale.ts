/**
 * Đa ngôn ngữ: Payload localization (vi mặc định, en) + tiền tố URL cho ngôn ngữ phụ (/en/...).
 * Thêm ngôn ngữ: sửa LOCALES ở đây (Payload và front-end dùng chung); chạy migration vì các bảng *_locales đổi.
 */
export interface LocaleDef {
  code: string
  label: string
}

export const LOCALES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
] as const satisfies readonly LocaleDef[]
export type LocaleCode = (typeof LOCALES)[number]['code']
export const DEFAULT_LOCALE: LocaleCode = 'vi'
export const LOCALE_CODES: string[] = LOCALES.map((l) => l.code)

export const isLocale = (v: unknown): v is LocaleCode => typeof v === 'string' && LOCALE_CODES.includes(v)

/** Tách tiền tố ngôn ngữ khỏi các đoạn đường dẫn: ['en','gioi-thieu'] -> { locale:'en', segments:['gioi-thieu'] } */
export function splitLocale(segments: string[]): { locale: LocaleCode; segments: string[] } {
  const [first, ...rest] = segments
  if (first && first !== DEFAULT_LOCALE && isLocale(first)) return { locale: first, segments: rest }
  return { locale: DEFAULT_LOCALE, segments }
}

/** Tiền tố URL của một ngôn ngữ ('' với ngôn ngữ mặc định) */
export function localePrefix(locale: string): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`
}

/** Đường dẫn trang theo ngôn ngữ: localePath('en', 'gioi-thieu') -> /en/gioi-thieu; home -> /en */
export function localePath(locale: string, slug: string, param?: string): string {
  const base = slug === 'home' ? '' : `/${slug}`
  const p = param ? `/${encodeURIComponent(param)}` : ''
  const path = `${localePrefix(locale)}${base}${p}`
  return path || '/'
}

/** Đổi tiền tố ngôn ngữ của một đường dẫn hiện tại (giữ query) */
export function switchLocalePath(path: string, to: string): string {
  const [pathname, query] = path.split('?')
  const segs = pathname.split('/').filter(Boolean)
  const { segments } = splitLocale(segs)
  const next = `${localePrefix(to)}/${segments.join('/')}`.replace(/\/$/, '') || '/'
  return query ? `${next}?${query}` : next
}
