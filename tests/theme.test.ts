import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PRESET_THEMES, defaultTheme, normalizeTextStyles, normalizeTheme, textStylesCss, themeToCss, tokenOptionsFor } from '../src/builder/theme'

test('normalizeTheme: điền thiếu từ mặc định, làm sạch giá trị, chỉ nhận fontUrl https', () => {
  const t = normalizeTheme({ colors: { primary: 'red}</style><script>', accent: '' }, fonts: null, button: { radius: '999px' }, fontUrl: 'http://x.y/z' })
  assert.ok(!/[{}<>]/.test(t.colors.primary))
  assert.equal(t.colors.accent, defaultTheme.colors.accent)
  assert.equal(t.colors.secondary, defaultTheme.colors.secondary)
  assert.deepEqual(t.fonts, defaultTheme.fonts)
  assert.equal(t.button.radius, '999px')
  assert.equal(t.button.weight, '600')
  assert.equal(t.fontUrl, undefined)
  assert.equal(normalizeTheme({ fontUrl: 'https://fonts.googleapis.com/css2?family=Inter&display=swap' }).fontUrl, 'https://fonts.googleapis.com/css2?family=Inter&display=swap')
  assert.equal(normalizeTheme({ fontUrl: 'https://x.y/"><script>' }).fontUrl, undefined)
  assert.deepEqual(normalizeTheme(null), defaultTheme)
})

test('themeToCss: phát đủ biến màu/font/bo góc/nút', () => {
  const css = themeToCss(defaultTheme)
  assert.match(css, /^:root\{/)
  assert.ok(css.includes('--color-primary:#4f46e5'))
  assert.ok(css.includes('--font-heading:'))
  assert.ok(css.includes('--radius-md:8px'))
  assert.ok(css.includes('--button-radius:8px') && css.includes('--button-weight:600') && css.includes('--button-transform:none'))
})

test('preset: 4 theme, giá trị đã sạch, tên khác nhau', () => {
  assert.equal(PRESET_THEMES.length, 4)
  assert.equal(new Set(PRESET_THEMES.map((p) => p.name)).size, 4)
  for (const p of PRESET_THEMES) assert.deepEqual(normalizeTheme(p.tokens), p.tokens, p.name)
})

test('google fonts: nhận diện font trong stack, sinh URL, phân biệt URL tự sinh', async () => {
  const { GOOGLE_FONTS, buildGoogleFontsUrl, googleFamiliesInTheme, googleFontOfStack, googleFontStack, isAutoFontUrl } = await import('../src/builder/theme')
  assert.ok(GOOGLE_FONTS.length > 40 && new Set(GOOGLE_FONTS.map((f) => f.name)).size === GOOGLE_FONTS.length)
  assert.equal(googleFontOfStack("'Be Vietnam Pro', ui-sans-serif, system-ui"), 'Be Vietnam Pro')
  assert.equal(googleFontOfStack('Inter, sans-serif'), 'Inter')
  assert.equal(googleFontOfStack('ui-sans-serif, system-ui'), null)
  assert.match(googleFontStack('Lora'), /^'Lora', ui-serif/)
  assert.match(googleFontStack('JetBrains Mono'), /^'JetBrains Mono', ui-monospace/)
  const sunset = PRESET_THEMES.find((p) => p.name === 'Sunset')!.tokens
  assert.deepEqual(googleFamiliesInTheme(sunset), ['Playfair Display', 'Lora'])
  assert.equal(buildGoogleFontsUrl(['Playfair Display', 'Lora']), 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700;800&display=swap')
  assert.equal(buildGoogleFontsUrl([]), '')
  assert.ok(normalizeTheme({ fontUrl: buildGoogleFontsUrl(['Inter']) }).fontUrl, 'URL sinh ra qua được bộ lọc https')
  assert.equal(isAutoFontUrl(undefined), true)
  assert.equal(isAutoFontUrl(buildGoogleFontsUrl(['Inter'])), true)
  assert.equal(isAutoFontUrl('https://use.typekit.net/abc.css'), false)
})

test('token mở rộng: spacing/text/shadow/layout thành CSS variables, preset đủ nhóm', () => {
  const css = themeToCss(defaultTheme)
  assert.ok(css.includes('--space-md:16px') && css.includes('--text-4xl:48px') && css.includes('--shadow-sm:') && css.includes('--container:1120px'))
  for (const p of PRESET_THEMES) assert.ok(p.tokens.spacing.md && p.tokens.textStyles.length >= 8, `preset ${p.name} đủ nhóm token`)
  const t = normalizeTheme({ spacing: { md: '20px' }, layout: { container: '960px' } })
  assert.equal(t.spacing.md, '20px')
  assert.equal(t.spacing.xs, '4px', 'thiếu thì lấy mặc định')
  assert.equal(t.layout.container, '960px')
})

test('kiểu chữ đặt tên: chuẩn hoá tên/giá trị, bỏ trùng, sinh CSS .ts-*', () => {
  const list = normalizeTextStyles([
    { name: 'h1', label: 'H1', fontSize: '40px', fontWeight: 700, lineHeight: '1.1', color: 'red}</style>' },
    { name: 'h1', label: 'trùng', fontSize: '1px', fontWeight: '1', lineHeight: '1' },
    { name: 'Bad Name', fontSize: '1px' },
    { name: 'tiny', fontSize: '', fontWeight: '', lineHeight: '' },
  ])
  assert.deepEqual(list.map((s) => s.name), ['h1', 'tiny'])
  assert.equal(list[0].color, 'red/style', 'giá trị đã lọc ký tự CSS nguy hiểm')
  assert.equal(list[1].fontSize, 'var(--text-base)')
  const css = textStylesCss(list)
  assert.ok(css.startsWith('.ts-h1{font-size:40px;font-weight:700;line-height:1.1;color:red/style}'), css)
  assert.ok(themeToCss(normalizeTheme({ textStyles: list })).includes('.ts-tiny{'))
  assert.deepEqual(normalizeTextStyles(undefined).map((s) => s.name), defaultTheme.textStyles.map((s) => s.name), 'không có -> mặc định')
  assert.deepEqual(normalizeTextStyles(undefined, []), [], 'base rỗng -> rỗng')
})

test('tokenOptionsFor: gợi ý token theo thuộc tính', () => {
  assert.ok(tokenOptionsFor('paddingTop', defaultTheme).some((o) => o.value === 'var(--space-md)'))
  assert.ok(tokenOptionsFor('fontSize', defaultTheme).some((o) => o.value === 'var(--text-2xl)'))
  assert.ok(tokenOptionsFor('maxWidth', defaultTheme).some((o) => o.value === 'var(--container)'))
  assert.deepEqual(tokenOptionsFor('color', defaultTheme), [])
})
