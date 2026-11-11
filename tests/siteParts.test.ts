import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pageLayoutFrom, SITE_FOOTER_ID, SITE_HEADER_ID, sitePartOf, sitePartsFrom, withSiteParts } from '../src/builder/siteParts'
import type { BuilderNode } from '../src/builder/types'

const root = (): BuilderNode => ({ id: 'root', type: 'root', props: {}, styles: {}, children: [{ id: 'a', type: 'heading', props: { text: 'x' }, styles: {} }] })

test('withSiteParts: chèn header đầu, footer cuối; không sửa root cũ; không có phần nào thì trả về chính root', () => {
  const r = root()
  const out = withSiteParts(r, { header: '5', footer: '7' })
  assert.deepEqual(out.children!.map((c) => c.id), [SITE_HEADER_ID, 'a', SITE_FOOTER_ID])
  assert.equal(out.children![0].type, 'blockRef')
  assert.deepEqual(out.children![0].props, { blockId: '5' })
  assert.equal(r.children!.length, 1, 'root gốc không đổi')
  assert.equal(withSiteParts(r, { header: null, footer: null }), r)
  assert.equal(withSiteParts(r, null), r)
})

test('withSiteParts: trang tắt header/footer', () => {
  const out = withSiteParts(root(), { header: '5', footer: '7' }, { hideHeader: true })
  assert.deepEqual(out.children!.map((c) => c.id), ['a', SITE_FOOTER_ID])
  assert.equal(withSiteParts(root(), { header: '5', footer: '7' }, { hideHeader: true, hideFooter: true }).children!.length, 1)
})

test('sitePartsFrom / pageLayoutFrom / sitePartOf', () => {
  assert.deepEqual(sitePartsFrom({ header: 3, footer: { id: 9 } }), { header: '3', footer: '9' })
  assert.deepEqual(sitePartsFrom(null), { header: null, footer: null })
  assert.deepEqual(pageLayoutFrom({ layout: { hideFooter: true } }), { hideHeader: false, hideFooter: true })
  assert.equal(sitePartOf(SITE_HEADER_ID), 'header')
  assert.equal(sitePartOf('abc'), null)
})
