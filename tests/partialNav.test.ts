import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { isPartialList, listSignature, normalizeDataSource, resolveData } from '../src/builder/data'
import { RenderNode } from '../src/builder/Renderer'
import type { BuilderNode } from '../src/builder/types'

const n = (id: string, type: string, props: Record<string, unknown> = {}, children?: BuilderNode[]): BuilderNode => ({ id, type, props, styles: {}, ...(children ? { children } : {}) })
const list = (id: string, data: Record<string, unknown>) => n(id, 'dataList', { data: { collection: 'users', mode: 'list', limit: 2, urlParams: true, ...data } }, [n(id + 't', 'heading', { text: '{{name}}' })])
const result = { records: [{ name: 'An' }, { name: 'Bình' }], total: 5, page: 1, totalPages: 3 }

test('listSignature: chỉ tính tham số của chính danh sách, đã sắp xếp', () => {
  const params = { page: '2', q: 'an', b_page: '3', b_q: 'x', category: 'tin' }
  assert.equal(listSignature(params, 'b'), 'page=3&q=x')
  // danh sách không mã: bỏ tham số thuộc mã của danh sách khác
  assert.equal(listSignature(params, undefined, ['b']), 'category=tin&page=2&q=an')
  assert.equal(listSignature({}, undefined), '')
  // đổi trang danh sách B không đổi chữ ký của A
  assert.equal(listSignature({ ...params, b_page: '4' }, undefined, ['b']), listSignature(params, undefined, ['b']))
})

test('reload: tắt cập nhật tại chỗ cho danh sách', () => {
  assert.equal(normalizeDataSource({ collection: 'posts', mode: 'list', reload: true })?.reload, true)
  assert.equal(normalizeDataSource({ collection: 'posts', mode: 'list', reload: 'yes' })?.reload, undefined)
  assert.equal(isPartialList({ source: { collection: 'posts', mode: 'list', urlParams: true } }), true)
  assert.equal(isPartialList({ source: { collection: 'posts', mode: 'list', urlParams: true, reload: true } }), false)
  assert.equal(isPartialList({ source: { collection: 'posts', mode: 'list' } }), false)
})

test('resolveData gắn đánh dấu cập nhật tại chỗ cho danh sách và block điều khiển', () => {
  const root = n('root', 'root', {}, [
    list('a', {}),
    n('pg', 'pagination', { auto: true }),
    list('b', { paramKey: 'b' }),
    n('more', 'loadMore', { step: '2' }),
    n('sb', 'searchBox', { target: 'b' }),
    list('c', { urlParams: undefined }),
    n('pc', 'pagination', { auto: true, target: 'c' }),
  ])
  const out = resolveData(root, () => result, { params: { page: '2', b_q: 'x' } })
  const [a, pg, b, more, sb, c, pc] = out.children!
  assert.equal(a.props.pn, 'list')
  assert.equal(a.props.pnSig, 'page=2')
  assert.equal(b.props.pnSig, 'q=x')
  assert.equal(pg.props.pnNav, 'page')
  assert.equal(more.props.pnNav, 'more')
  assert.equal(sb.props.pnNav, 'page')
  // danh sách chưa bật tham số URL: không cập nhật tại chỗ; block điều khiển của nó chỉ được làm mới
  assert.equal(c.props.pn, undefined)
  assert.equal(pc.props.pn, 'ctl')
  assert.equal(pc.props.pnNav, undefined)
  // bản sao mục trong danh sách không bị đánh dấu
  assert.equal(a.children!.every((ch) => ch.props.pn === undefined), true)
})

test('Renderer: thuộc tính data-pn chỉ ở trang thật', () => {
  const root = n('root', 'root', {}, [list('a', {}), n('pg', 'pagination', { auto: true })])
  const out = resolveData(root, () => result, { params: { page: '2' } })
  const live = renderToStaticMarkup(createElement(RenderNode, { node: out, mode: 'live' }))
  assert.match(live, /data-pn="list" data-pn-id="a" data-pn-sig="page=2"/)
  assert.match(live, /data-pn="ctl" data-pn-id="pg" data-pn-nav="page"/)
  const editor = renderToStaticMarkup(createElement(RenderNode, { node: out, mode: 'editor' }))
  assert.doesNotMatch(editor, /data-pn/)
})

test('reload = true: không gắn đánh dấu điều hướng', () => {
  const root = n('root', 'root', {}, [list('a', { reload: true }), n('pg', 'pagination', { auto: true })])
  const out = resolveData(root, () => result, { params: {} })
  assert.equal(out.children![0].props.pn, undefined)
  assert.equal(out.children![1].props.pn, undefined)
})
