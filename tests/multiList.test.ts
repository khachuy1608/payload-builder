import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildWhere, freeParamKey, listTargets, normalizeDataSource, pageHrefPattern, paramName, resolveData, scopedParams, takeHref } from '../src/builder/data'
import type { BuilderNode } from '../src/builder/types'
import { effectiveLimit } from '../src/lib/data'

const n = (id: string, type: string, props: Record<string, unknown> = {}, children?: BuilderNode[]): BuilderNode => ({ id, type, props, styles: {}, ...(children ? { children } : {}) })
const list = (id: string, data: Record<string, unknown>) => n(id, 'dataList', { data: { collection: 'users', mode: 'list', limit: 2, ...data } }, [n(id + 't', 'heading', { text: '{{name}}' })])

test('scopedParams / paramName / link phân trang theo mã danh sách', () => {
  const params = { page: '3', q: 'an', b_page: '2', b_q: 'bình', b_take: '6', category: 'x' }
  assert.deepEqual(scopedParams(params, 'b'), { page: '2', q: 'bình', take: '6' })
  assert.equal(scopedParams(params, undefined), params)
  assert.equal(paramName('b', 'page'), 'b_page')
  assert.equal(paramName(undefined, 'q'), 'q')
  // đổi trang danh sách B giữ trang của A và bỏ b_page cũ
  assert.equal(pageHrefPattern(params, 'b'), '?page=3&q=an&b_q=b%C3%ACnh&b_take=6&category=x&b_page={n}')
  assert.equal(pageHrefPattern({}, 'b'), '?b_page={n}')
  assert.equal(pageHrefPattern({ page: '2' }), '?page={n}')
  assert.equal(takeHref({ page: '3', b_page: '2' }, 8, 'b'), '?page=3&b_take=8')
  assert.equal(effectiveLimit({ collection: 'users', mode: 'list', limit: 4, urlParams: true, paramKey: 'b' }, { take: '20', b_take: '10' }), 10)
  assert.equal(normalizeDataSource({ collection: 'users', mode: 'list', paramKey: 'B!' })?.paramKey, undefined)
  assert.equal(normalizeDataSource({ collection: 'users', mode: 'list', paramKey: 'ds2' })?.paramKey, 'ds2')
  // ?take / tham số có tiền tố khác không lọt thành điều kiện lọc
  assert.equal(buildWhere({ collection: 'users', mode: 'list', urlParams: true }, { take: '9', b_page: '2' }, ['name']), undefined)
})

test('listTargets: ưu tiên chỉ định, rồi danh sách đã bật gần nhất phía trên, rồi phía dưới; không bật -> gần nhất', () => {
  const root = n('root', 'root', {}, [
    n('search', 'searchBox'),
    list('A', { urlParams: true }),
    n('pgA', 'pagination', { auto: true }),
    list('B', { urlParams: true, paramKey: 'b' }),
    n('pgB', 'pagination', { auto: true }),
    n('pgX', 'pagination', { auto: true, target: 'A' }),
  ])
  const { lists, targetOf } = listTargets(root)
  assert.deepEqual(lists.map((l) => l.id), ['A', 'B'])
  assert.equal(targetOf('search')?.id, 'A', 'ô tìm kiếm phía trên -> danh sách phía dưới gần nhất')
  assert.equal(targetOf('pgA')?.id, 'A')
  assert.equal(targetOf('pgB')?.id, 'B')
  assert.equal(targetOf('pgX', 'A')?.id, 'A', 'chỉ định target')
  const off = n('root', 'root', {}, [list('C', {}), n('pg', 'pagination')])
  assert.equal(listTargets(off).targetOf('pg')?.id, 'C')
  const mixed = n('root', 'root', {}, [list('B', { urlParams: true }), list('A', {}), n('pg', 'pagination')])
  assert.equal(listTargets(mixed).targetOf('pg')?.id, 'B', 'giữ hành vi cũ: danh sách đã bật thắng danh sách gần hơn chưa bật')
})

test('freeParamKey: danh sách đầu không mã, các danh sách sau lấy b, c…', () => {
  const root = n('root', 'root', {}, [list('A', {}), list('B', {}), list('C', { urlParams: true, paramKey: 'b' })])
  assert.equal(freeParamKey(root, 'A'), undefined)
  const withA = n('root', 'root', {}, [list('A', { urlParams: true }), list('B', {}), list('C', { urlParams: true, paramKey: 'b' })])
  assert.equal(freeParamKey(withA, 'B'), 'c')
  assert.equal(freeParamKey(withA, 'A'), undefined, 'chính nó không tính là trùng')
})

test('resolveData: hai danh sách, mỗi Pagination/Xem thêm/Ô tìm kiếm nhận số liệu và link của danh sách mình', () => {
  const root = n('root', 'root', {}, [
    n('sA', 'searchBox'),
    list('A', { urlParams: true }),
    n('pgA', 'pagination', { auto: true }),
    list('B', { urlParams: true, paramKey: 'b' }),
    n('pgB', 'pagination', { auto: true }),
    n('moreB', 'loadMore', { step: '2' }),
    n('sB', 'searchBox', { target: 'B' }),
    list('C', {}),
    n('pgC', 'pagination', { auto: true, target: 'C' }),
  ])
  const data: Record<string, { records: { id: number; name: string }[]; total: number; page: number; totalPages: number; limit: number }> = {
    A: { records: [{ id: 1, name: 'a1' }, { id: 2, name: 'a2' }], total: 6, page: 3, totalPages: 3, limit: 2 },
    B: { records: [{ id: 3, name: 'b1' }, { id: 4, name: 'b2' }], total: 4, page: 2, totalPages: 2, limit: 2 },
    C: { records: [{ id: 5, name: 'c1' }], total: 1, page: 1, totalPages: 1, limit: 2 },
  }
  const out = resolveData(root, (id) => data[id], { params: { page: '3', b_page: '2', b_q: 'x' } })
  const p = (id: string) => out.children!.find((c) => c.id === id)!.props
  assert.deepEqual([p('pgA').pages, p('pgA').current, p('pgA').hrefPattern, p('pgA').unlinked], ['3', '3', '?b_page=2&b_q=x&page={n}', false])
  assert.deepEqual([p('pgB').pages, p('pgB').current, p('pgB').hrefPattern], ['2', '2', '?page=3&b_q=x&b_page={n}'])
  assert.equal(p('moreB').href, '?page=3&b_q=x&b_take=4')
  assert.deepEqual([p('sA').paramName, p('sA').value, p('sA').total], ['q', '', '6'])
  assert.deepEqual([p('sB').paramName, p('sB').value, p('sB').total], ['b_q', 'x', '4'])
  assert.deepEqual(p('sB').keep, [['page', '3']], 'ô tìm kiếm B giữ trang của A, bỏ b_q/b_page/b_take')
  assert.equal(p('pgC').unlinked, true, 'danh sách chưa bật -> đánh dấu unlinked')
  assert.equal(p('pgC').pages, '1')
})

test('nearestOf: danh sách gần nhất kể cả chưa bật (để tự bật khi chèn)', () => {
  const root = n('root', 'root', {}, [list('A', { urlParams: true }), list('B', {}), n('pg', 'pagination')])
  const t = listTargets(root)
  assert.equal(t.targetOf('pg')?.id, 'A', 'quy tắc hiển thị vẫn ưu tiên danh sách đã bật')
  assert.equal(t.nearestOf('pg')?.id, 'B', 'khi chèn: danh sách gần nhất là B')
})
