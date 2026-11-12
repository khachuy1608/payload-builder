import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RenderNode } from '../src/builder/Renderer'
import type { BuilderNode } from '../src/builder/types'

const pop = (variant: string, children: BuilderNode[] = []): BuilderNode => ({ id: 'p', type: 'popover', props: { variant, triggerText: 'Tuỳ chọn', items: [{ label: 'Sửa' }], __view: 'open' }, styles: {}, children })
const html = (n: BuilderNode) => renderToStaticMarkup(createElement(RenderNode, { node: n, mode: 'editor' }))

test('Popover trống: không phủ gợi ý “Kéo phần tử vào đây” lên nút kích hoạt', () => {
  for (const v of ['dropdown', 'tooltip', 'popover', 'hovercard']) assert.doesNotMatch(html(pop(v)), /data-empty/, v)
  // dropdown / tooltip không dùng phần tử con -> không có gợi ý
  assert.doesNotMatch(html(pop('dropdown')), /bld-ph/)
  assert.doesNotMatch(html(pop('tooltip')), /bld-ph/)
  // popover / hover card: gợi ý nằm trong ô nội dung
  assert.match(html(pop('popover')), /b-pop-card[^>]*>.*bld-ph bld-ph--inline/)
  // có phần tử con thì không còn gợi ý
  assert.doesNotMatch(html(pop('popover', [{ id: 'c', type: 'paragraph', props: { text: 'Nội dung' }, styles: {} }])), /bld-ph/)
})
