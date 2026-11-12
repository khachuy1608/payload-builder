import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BLOCK_CATEGORIES, BLOCKS } from '../src/builder/registry'
import { PageRenderer } from '../src/builder/Renderer'
import { BLOCK_SCHEMAS, canContain, canSaveAsBlock } from '../src/builder/schema'
import { createRoot, genId } from '../src/builder/tree'
import type { BuilderNode } from '../src/builder/types'
import { validateContent } from '../src/builder/validate'
import { BASE_CSS } from '../src/builder/theme'

const nodeFor = (type: string): BuilderNode => {
  const d = BLOCKS[type].defaults()
  return { id: genId(), type, props: d.props, styles: d.styles, ...(d.children ? { children: d.children } : {}) }
}

test('registry ↔ schema: mọi block có schema và ngược lại; category hợp lệ', () => {
  const types = Object.keys(BLOCKS)
  for (const t of types) assert.ok(BLOCK_SCHEMAS[t], 'thiếu schema cho ' + t)
  for (const t of Object.keys(BLOCK_SCHEMAS)) assert.ok(BLOCKS[t], 'thiếu block cho ' + t)
  const cats = new Set(BLOCK_CATEGORIES.map((c) => c.id))
  for (const t of types) assert.ok(cats.has(BLOCKS[t].category), 'category lạ ở ' + t)
  assert.ok(types.length >= 46, 'có ' + types.length + ' block')
})

test('mọi block (trừ root/con bắt buộc) đặt được vào root, mặc định hợp lệ sau validate', () => {
  const root = createRoot()
  const placeable = Object.keys(BLOCKS).filter((t) => canContain('root', t) && t !== 'blockRef') // blockRef mặc định chưa có id -> bị bỏ là đúng
  root.children = placeable.map(nodeFor)
  const out = validateContent({ version: 1, root })
  assert.equal(out.root.children!.length, placeable.length, 'validate không được bỏ block nào')
  // block con bắt buộc phải nằm đúng cha
  assert.equal(canContain('root', 'slide'), false)
  assert.equal(canContain('carousel', 'slide'), true)
  assert.equal(canContain('root', 'formField'), false)
  assert.equal(canContain('form', 'formField'), true)
  assert.equal(canContain('accordion', 'heading'), false)
  assert.equal(canSaveAsBlock('slide'), false)
  assert.equal(canSaveAsBlock('card'), true)
})

test('render tĩnh từng block ở chế độ live và editor không ném lỗi, có class b-/n-', () => {
  for (const type of Object.keys(BLOCKS)) {
    if (type === 'root' || type === 'blockRef') continue
    const schema = BLOCK_SCHEMAS[type]
    const node = nodeFor(type)
    const parentType = schema.allowedParents?.[0]
    const root = createRoot()
    root.children = parentType ? [{ ...nodeFor(parentType), children: [node] }] : [node]
    for (const mode of ['live', 'editor'] as const) {
      const html = renderToStaticMarkup(createElement(PageRenderer, { content: { version: 1, root }, mode }))
      // block media chưa có nội dung thì trang thật không render gì (chỉ editor hiện ô placeholder)
      if (mode === 'live' && ['youtube', 'image', 'lightbox'].includes(type)) continue
      assert.ok(html.includes(`n-${node.id}`), `${type}/${mode} không render`)
      if (mode === 'editor') assert.ok(html.includes(`data-node-id="${node.id}"`), `${type}/editor thiếu data-node-id`)
      else assert.ok(!html.includes('data-node-id'), `${type}/live lộ data-node-id`)
    }
  }
})

test('block tương tác: HTML có đủ móc data-* cho Runtime và trang thật không có nội dung chỉ-editor', () => {
  const root = createRoot()
  root.children = ['dialog', 'popover', 'toast', 'commandPalette', 'accordion', 'carousel', 'header', 'form', 'lightbox'].map(nodeFor)
  const live = renderToStaticMarkup(createElement(PageRenderer, { content: { version: 1, root }, mode: 'live' }))
  for (const hook of ['data-dialog-open', 'data-dialog=""', 'data-menu-toggle', 'data-toast-open', 'data-cmdk-open', 'data-accordion-toggle', 'data-carousel-next', 'data-drawer-toggle', 'data-form=', 'name="website"']) assert.ok(live.includes(hook), 'thiếu ' + hook)
  assert.ok(!live.includes('bld-editor-only'), 'trang thật không được chứa khung chỉ-editor')
  const editor = renderToStaticMarkup(createElement(PageRenderer, { content: { version: 1, root }, mode: 'editor' }))
  assert.ok(editor.includes('b-dialog-preview') && editor.includes('b-cmdk-preview'), 'editor (chưa gắn trạng thái = mở) hiện lớp phủ xem trước để sửa')
  assert.ok(!editor.includes('<dialog'), 'editor không render <dialog> thật')
})

test('CSS nền có style cho block và hiệu ứng', () => {
  for (const cls of ['.b-card', '.b-carousel-track', '.b-acc-item', '.b-header-nav', '.b-table', '.b-toast', '.b-dialog-box', '.b-field', '.b-tour-spot', '@keyframes bld-fade', '[data-fx-reveal]']) assert.ok(BASE_CSS.includes(cls), 'thiếu ' + cls)
})

test('chart: tổng phần trăm ~100, path cho mỗi phần', () => {
  const node = nodeFor('chart')
  const root = createRoot()
  root.children = [node]
  const html = renderToStaticMarkup(createElement(PageRenderer, { content: { version: 1, root }, mode: 'live' }))
  assert.equal((html.match(/<path /g) ?? []).length, 3)
  assert.ok(html.includes('45%') && html.includes('35%') && html.includes('20%'))
})

test('pagination: rút gọn bằng dấu … và link theo mẫu', () => {
  const node = nodeFor('pagination')
  node.props = { ...node.props, auto: false, pages: '20', current: '10', hrefPattern: '/blog?p={n}' }
  const root = createRoot()
  root.children = [node]
  const html = renderToStaticMarkup(createElement(PageRenderer, { content: { version: 1, root }, mode: 'live' }))
  assert.ok(html.includes('href="/blog?p=9"') && html.includes('href="/blog?p=11"') && html.includes('href="/blog?p=20"'))
  assert.equal((html.match(/…/g) ?? []).length, 2)
  assert.ok(!html.includes('href="/blog?p=5"'))
})
