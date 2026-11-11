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
