import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bindString, buildWhere, collectDataNodes, dataResult, fieldPaths, normalizeDataSource, normalizeParams, pageFromParams, pageHrefPattern, projectRecord, resolveData, withParam } from '../src/builder/data'
import { createRoot, walk } from '../src/builder/tree'
import type { BuilderNode } from '../src/builder/types'
import { validateContent } from '../src/builder/validate'

const users = [
  { id: 1, name: 'An', title: 'Dev', avatar: { id: 9, url: '/a.png', alt: 'An' }, email: 'an@x.y' },
  { id: 2, name: 'Bình', title: 'Design', avatar: null },
  { id: 3, name: 'Chi', title: '' },
]

test('normalizeDataSource & buildWhere', () => {
  assert.equal(normalizeDataSource({ collection: 'Bad Slug' }), undefined)
  const src = normalizeDataSource({ collection: 'users', mode: 'list', limit: 999, sort: '-name', filters: [{ field: 'title', op: 'contains', value: 'Dev' }, { field: 'x}', op: 'equals', value: '1' }, { field: 'tags', op: 'in', value: 'a, b' }] })!
  assert.deepEqual(src, { collection: 'users', mode: 'list', limit: 100, sort: '-name', filters: [{ field: 'title', op: 'contains', value: 'Dev' }, { field: 'tags', op: 'in', value: 'a, b' }] })
  assert.deepEqual(buildWhere(src), { and: [{ title: { contains: 'Dev' } }, { tags: { in: ['a', 'b'] } }] })
  const one = normalizeDataSource({ collection: 'users', mode: 'one', byField: 'name', byValue: 'An' })!
  assert.deepEqual(buildWhere(one), { and: [{ name: { equals: 'An' } }] })
  assert.equal(buildWhere({ collection: 'users', mode: 'list' }), undefined)
})

test('projectRecord: chỉ giữ trường expose, luôn có id', () => {
  assert.deepEqual(projectRecord(users[0], ['name', 'avatar']), { id: 1, name: 'An', avatar: users[0].avatar })
})

test('bindString: đường dẫn lồng nhau, object upload -> tên hiển thị, index/count', () => {
  assert.equal(bindString('Xin chào {{name}} ({{title}}) – {{avatar.url}} / {{avatar}} / {{missing}} #{{index}}/{{count}}', users[0], { index: 2, count: 5 }), 'Xin chào An (Dev) – /a.png / An /  #2/5')
})

test('resolveData: dataList lặp mẫu, bản đầu giữ id, bản sau linked inner, media {{avatar}} thành MediaValue', () => {
  const root = createRoot()
  const list: BuilderNode = {
    id: 'list',
    type: 'dataList',
    props: { data: { collection: 'users', mode: 'list' } },
    styles: {},
    children: [
      { id: 'card', type: 'card', props: { media: '{{avatar}}' }, styles: {}, children: [{ id: 'h', type: 'heading', props: { text: '{{name}} {{index}}' }, styles: {} }] },
    ],
  }
  const single: BuilderNode = { id: 'one', type: 'div', props: { data: { collection: 'users', mode: 'one' } }, styles: {}, children: [{ id: 'p', type: 'paragraph', props: { text: 'Chức danh: {{title}}' }, styles: {} }] }
  const plain: BuilderNode = { id: 'plain', type: 'paragraph', props: { text: '{{name}} không có nguồn' }, styles: {} }
  root.children = [list, single, plain]
  const out = resolveData(root, (id) => (id === 'list' ? dataResult(users) : id === 'one' ? dataResult([users[1]]) : undefined))
  const outList = out.children![0]
  assert.equal(outList.children!.length, 3)
  assert.equal(outList.children![0].id, 'card')
  assert.equal(outList.children![1].id, 'card_1')
  assert.equal(outList.children![0].linked, undefined)
  assert.equal(outList.children![1].linked, 'inner')
  assert.equal(outList.children![1].children![0].linked, 'inner')
  assert.deepEqual(outList.children![0].props.media, { id: 9, url: '/a.png', alt: 'An', width: undefined, height: undefined, mimeType: undefined })
  assert.equal(outList.children![1].props.media, '') // không có ảnh -> chuỗi rỗng
  assert.equal(outList.children![2].children![0].props.text, 'Chi 3')
  assert.equal(out.children![1].children![0].props.text, 'Chức danh: Design')
  assert.equal(out.children![2], plain, 'nhánh không có nguồn giữ nguyên object')
  const ids: string[] = []
  walk(out, (n) => ids.push(n.id))
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(resolveData(root, () => undefined).children![0].children!.length, 0, 'không có dữ liệu -> danh sách rỗng')
  assert.deepEqual(collectDataNodes(root).map((n) => n.id), ['list', 'one'])
})

test('validate: props.data chỉ hợp lệ trên block chứa', () => {
  const out = validateContent({
    version: 1,
    root: { id: 'root', type: 'root', props: {}, styles: {}, children: [{ id: 'd', type: 'div', props: { data: { collection: 'users', mode: 'list', limit: 3 } }, styles: {}, children: [] }, { id: 'h', type: 'heading', props: { text: 'x', data: { collection: 'users' } }, styles: {} }] },
  })
  assert.deepEqual(out.root.children![0].props.data, { collection: 'users', mode: 'list', limit: 3 })
  assert.equal('data' in out.root.children![1].props, false)
})

test('fieldPaths: upload/group/relationship sinh đường dẫn con', () => {
  const paths = fieldPaths({ slug: 'users', label: 'U', fields: [{ name: 'name', label: 'Tên', type: 'text' }, { name: 'avatar', label: 'Ảnh', type: 'upload' }, { name: 'addr', label: 'Địa chỉ', type: 'group', fields: [{ name: 'city', label: 'Thành phố', type: 'text' }] }] })
  assert.deepEqual(paths.map((p) => p.path), ['name', 'avatar', 'avatar.url', 'addr.city'])
})

test('tham số URL: tìm kiếm, lọc theo trường cho phép, phân trang, link giữ tham số', () => {
  const src = normalizeDataSource({ collection: 'users', mode: 'list', urlParams: true, searchFields: ['name', 'title', 'bad field'] })!
  assert.deepEqual(src.searchFields, ['name', 'title'])
  const params = normalizeParams({ q: 'bo', title: 'Thiết kế', email: 'x', page: '3', 'bad key!': 'y', arr: ['a', 'b'] })
  assert.deepEqual(params, { q: 'bo', title: 'Thiết kế', email: 'x', page: '3', arr: 'a' })
  assert.deepEqual(buildWhere(src, params, ['name', 'title', 'bio', 'avatar']), { and: [{ or: [{ name: { like: 'bo' } }, { title: { like: 'bo' } }] }, { title: { equals: 'Thiết kế' } }] })
  assert.equal(buildWhere({ collection: 'users', mode: 'list' }, params), undefined, 'không bật urlParams thì bỏ qua')
  assert.equal(pageFromParams(params), 3)
  assert.equal(pageFromParams({ page: '-1' }), 1)
  assert.equal(withParam(params, 'title', 'Khác'), '?q=bo&email=x&arr=a&title=Kh%C3%A1c')
  assert.equal(pageHrefPattern(params), '?q=bo&title=Thi%E1%BA%BFt+k%E1%BA%BF&email=x&arr=a&page={n}')
  assert.equal(pageHrefPattern({}), '?page={n}')
  assert.equal(withParam({ title: 'a' }, 'title', null), '?')
  // pagination auto + searchBox + toggleGroup param nhận trạng thái từ nguồn chính
  const root = createRoot()
  root.children = [
    { id: 'list', type: 'dataList', props: { data: src }, styles: {}, children: [{ id: 't', type: 'heading', props: { text: '{{name}} ({{page}}/{{totalPages}}, {{total}})' }, styles: {} }] },
    { id: 'pg', type: 'pagination', props: { auto: true }, styles: {} },
    { id: 'sb', type: 'searchBox', props: {}, styles: {} },
    { id: 'tg', type: 'toggleGroup', props: { param: 'title', items: [{ label: 'Tất cả', value: '' }, { label: 'TK', value: 'Thiết kế' }] }, styles: {} },
  ]
  const out = resolveData(root, (id) => (id === 'list' ? { records: [users[0]], total: 7, page: 3, totalPages: 4, limit: 2 } : undefined), { params: { q: 'bo', title: 'Thiết kế', page: '3' } })
  assert.equal(out.children![0].children![0].props.text, 'An (3/4, 7)')
  assert.deepEqual(out.children![1].props, { auto: true, pages: '4', current: '3', hrefPattern: '?q=bo&title=Thi%E1%BA%BFt+k%E1%BA%BF&page={n}' })
  assert.deepEqual(out.children![2].props, { value: 'bo', total: '7' })
  assert.equal(out.children![3].props.currentValue, 'Thiết kế')
  assert.equal(out.children![3].props.baseQuery, '?q=bo')
})
