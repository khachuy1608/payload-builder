import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PRESET_THEMES, defaultTheme, normalizeTheme, themeToCss } from '../src/builder/theme'

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
