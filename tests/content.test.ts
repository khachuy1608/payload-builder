import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveData, takeHref, withParam } from '../src/builder/data'
import { sanitizeContentHtml } from '../src/builder/sanitize'
import type { BuilderNode } from '../src/builder/types'
import { effectiveLimit } from '../src/lib/data'
import { isLexical, lexicalToHtml, lexicalToText } from '../src/lib/richtext'
import { lexical } from '../src/seed/content'

test('lexicalToHtml: tiêu đề, đoạn, danh sách, trích dẫn -> HTML sạch; không phải Lexical -> rỗng', () => {
  const doc = lexical({ type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Tiêu đề', format: 0, version: 1 }], version: 1 }, { type: 'paragraph', children: [{ type: 'text', text: 'Đậm', format: 1, version: 1 }, { type: 'text', text: ' thường', format: 0, version: 1 }], version: 1 }, { type: 'list', listType: 'bullet', tag: 'ul', start: 1, children: [{ type: 'listitem', value: 1, children: [{ type: 'text', text: 'Một', format: 0, version: 1 }], version: 1 }], version: 1 })
  assert.ok(isLexical(doc))
  const html = lexicalToHtml(doc)
  assert.ok(html.includes('<h2') && html.includes('Tiêu đề</h2>'), html)
  assert.ok(html.includes('<strong>Đậm</strong>') && html.includes('<ul') && html.includes('<li'), html)
  assert.equal(lexicalToText(doc).replace(/\s+/g, ' '), 'Tiêu đề Đậm thường Một')
  assert.equal(lexicalToHtml('chuỗi'), '')
  assert.equal(lexicalToHtml({ root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: '<script>alert(1)</script>', format: 0, version: 1 }], version: 1 }] } }).includes('<script'), false)
})

test('sanitizeContentHtml: giữ tiêu đề/ảnh/bảng/code, bỏ script/on*/javascript:', () => {
  const dirty = '<h1 onclick="x()">A</h1><p>B <a href="javascript:alert(1)">x</a> <a href="https://a.b" target="_blank">y</a></p><img src="https://a.b/c.png" alt="c"><script>bad()</script><table><tr><th>1</th><td>2</td></tr></table><pre><code>let a</code></pre><style>body{}</style>'
  const clean = sanitizeContentHtml(dirty)
  assert.ok(clean.startsWith('<h1>A</h1>'), clean)
  assert.ok(!clean.includes('javascript:') && !clean.includes('<script') && !clean.includes('<style') && !clean.includes('onclick'), clean)
  assert.ok(clean.includes('rel="noopener noreferrer"') && clean.includes('<img src="https://a.b/c.png" alt="c" loading="lazy"') && clean.includes('<th>1</th>') && clean.includes('<code>let a</code>'), clean)
})

test('effectiveLimit / takeHref: ?take= ghi đè limit (tối đa 100), giữ tham số khác, bỏ ?page', () => {
  const src = { collection: 'posts', mode: 'list' as const, limit: 6, urlParams: true }
  assert.equal(effectiveLimit(src, {}), 6)
  assert.equal(effectiveLimit(src, { take: '14' }), 14)
  assert.equal(effectiveLimit(src, { take: '3' }), 6, 'take nhỏ hơn limit thì bỏ qua')
  assert.equal(effectiveLimit(src, { take: '999' }), 100)
  assert.equal(effectiveLimit({ ...src, urlParams: false }, { take: '14' }), 6)
  assert.equal(effectiveLimit({ ...src, mode: 'one' }, { take: '14' }), 1)
  assert.equal(takeHref({ q: 'x', page: '3' }, 16), '?q=x&take=16')
  assert.equal(withParam({ take: '8' }, 'take', '16'), '?take=16')
})

test('block Xem thêm: nhận số đã tải/tổng từ nguồn có urlParams, ẩn khi hết', () => {
  const root: BuilderNode = {
    id: 'root', type: 'root', props: {}, styles: {},
    children: [
      { id: 'list', type: 'dataList', props: { data: { collection: 'posts', mode: 'list', limit: 2, urlParams: true } }, styles: {}, children: [{ id: 'h', type: 'heading', props: { text: '{{title}}' }, styles: {} }] },
      { id: 'more', type: 'loadMore', props: { text: 'Xem thêm', step: '2' }, styles: {} },
    ],
  }
  const lookup = () => ({ records: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }], total: 5, page: 1, totalPages: 3, limit: 2 })
  const out = resolveData(root, lookup, { params: { q: 'a' } })
  const more = out.children!.find((c) => c.type === 'loadMore')!
  assert.equal(more.props.loaded, '2')
  assert.equal(more.props.total, '5')
  assert.equal(more.props.href, '?q=a&take=4')
  assert.equal(more.props.done, false)
  const done = resolveData(root, () => ({ records: [{ id: 1 }, { id: 2 }], total: 2, page: 1, totalPages: 1, limit: 2 }), {})
  assert.equal(done.children!.find((c) => c.type === 'loadMore')!.props.done, true)
})
