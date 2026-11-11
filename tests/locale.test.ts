import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveData } from '../src/builder/data'
import type { BuilderNode } from '../src/builder/types'
import { localePath, splitLocale, switchLocalePath } from '../src/lib/locale'

test('splitLocale / localePath / switchLocalePath', () => {
  assert.deepEqual(splitLocale([]), { locale: 'vi', segments: [] })
  assert.deepEqual(splitLocale(['en']), { locale: 'en', segments: [] })
  assert.deepEqual(splitLocale(['en', 'gioi-thieu']), { locale: 'en', segments: ['gioi-thieu'] })
  assert.deepEqual(splitLocale(['vi', 'x']), { locale: 'vi', segments: ['vi', 'x'] }, 'mã mặc định không phải tiền tố')
  assert.deepEqual(splitLocale(['fr', 'x']), { locale: 'vi', segments: ['fr', 'x'] }, 'mã lạ là slug thường')
  assert.equal(localePath('vi', 'home'), '/')
  assert.equal(localePath('en', 'home'), '/en')
  assert.equal(localePath('en', 'bai-viet', 'a b'), '/en/bai-viet/a%20b')
  assert.equal(switchLocalePath('/gioi-thieu?q=1', 'en'), '/en/gioi-thieu?q=1')
  assert.equal(switchLocalePath('/en/gioi-thieu', 'vi'), '/gioi-thieu')
  assert.equal(switchLocalePath('/en', 'vi'), '/')
  assert.equal(switchLocalePath('/', 'en'), '/en')
})

test('block Chuyển ngôn ngữ nhận link theo đường dẫn + ngôn ngữ hiện tại', () => {
  const root: BuilderNode = { id: 'root', type: 'root', props: {}, styles: {}, children: [{ id: 'l', type: 'languageSwitcher', props: {}, styles: {} }] }
  const out = resolveData(root, () => undefined, { locale: 'en', path: '/en/lien-he', params: { q: 'x' } })
  const opts = out.children![0].props.options as { code: string; href: string; current: boolean }[]
  assert.deepEqual(opts.map((o) => [o.code, o.href, o.current]), [['vi', '/lien-he?q=x', false], ['en', '/en/lien-he?q=x', true]])
})
