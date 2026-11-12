import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RenderNode } from '../src/builder/Renderer'
import type { BuilderNode } from '../src/builder/types'
import { applyViewStates, initialViewState, viewStateInfo } from '../src/builder/viewState'

const n = (id: string, type: string, props: Record<string, unknown> = {}, children?: BuilderNode[]): BuilderNode => ({ id, type, props, styles: {}, ...(children ? { children } : {}) })
const html = (node: BuilderNode, mode: 'editor' | 'live' = 'editor') => renderToStaticMarkup(createElement(RenderNode, { node, mode }))

test('viewStateInfo: chỉ block tương tác có hai trạng thái', () => {
  for (const t of ['dialog', 'popover', 'toast', 'accordionItem', 'cascadingMenu', 'waffleMenu', 'overflowMenu', 'commandPalette', 'header', 'lightbox']) assert.ok(viewStateInfo(n('x', t)), t)
  assert.equal(viewStateInfo(n('x', 'heading')), null)
  assert.ok(viewStateInfo(n('x', 'formField', { type: 'select' })))
  assert.equal(viewStateInfo(n('x', 'formField', { type: 'text' })), null)
  assert.equal(viewStateInfo(n('x', 'popover', { variant: 'tooltip' }))?.open, 'Đang hiện')
  assert.equal(initialViewState(n('a', 'accordionItem', { open: true })), 'open')
  assert.equal(initialViewState(n('d', 'dialog')), 'closed')
})

test('applyViewStates: ghim > đang chọn (mở) > trạng thái ban đầu; nhánh không đổi giữ nguyên object', () => {
  const plain = n('p', 'div', {}, [n('h', 'heading')])
  const root = n('root', 'root', {}, [n('d', 'dialog', {}, [n('dp', 'paragraph')]), n('a', 'accordionItem', { open: true }), n('m', 'overflowMenu'), plain])
  const out = applyViewStates(root, { m: 'open' }, new Set(['d']))
  const [d, a, m, p] = out.children!
  assert.equal(d.props.__view, 'open') // đang chọn
  assert.equal(a.props.__view, 'open') // “Mở sẵn”
  assert.equal(m.props.__view, 'open') // ghim
  assert.equal(p, plain)
  const out2 = applyViewStates(root, { d: 'closed' }, new Set(['d']))
  assert.equal(out2.children![0].props.__view, 'closed') // ghim thắng đang chọn
  assert.equal(out2.children![2].props.__view, 'closed')
  // không sửa cây gốc (không lưu vào nội dung)
  assert.equal(root.children![0].props.__view, undefined)
})

test('Render theo trạng thái xem trong editor', () => {
  const dialog = (v: string) => n('d', 'dialog', { title: 'Xoá?', triggerText: 'Mở', variant: 'drawer', __view: v }, [n('dp', 'paragraph', { text: 'Nội dung' })])
  assert.match(html(dialog('open')), /b-dialog-preview b-dialog-preview--drawer/)
  assert.doesNotMatch(html(dialog('closed')), /b-dialog-preview|Nội dung/)
  assert.match(html(dialog('closed')), /Mở<\/button>/)
  const pop = (v: string) => n('p', 'popover', { variant: 'dropdown', triggerText: 'Menu', items: [{ label: 'Sửa' }], __view: v })
  assert.match(html(pop('open')), /b-pop[^"]*is-open/)
  assert.doesNotMatch(html(pop('closed')), /is-open/)
  const acc = (v: string | undefined, open = false) => n('a', 'accordionItem', { title: 'Hỏi', open, ...(v ? { __view: v } : {}) })
  assert.match(html(acc('open')), /<details[^>]* open=""/)
  assert.doesNotMatch(html(acc('closed', true)), /<details[^>]* open=""/)
  assert.match(html(acc(undefined, true), 'live'), /<details[^>]* open=""/)
  const sel = (v: string) => n('f', 'formField', { type: 'select', label: 'Tỉnh', options: [{ label: 'Hà Nội' }, { label: 'Huế' }], __view: v })
  assert.match(html(sel('open')), /b-select-preview[\s\S]*Hà Nội[\s\S]*Huế/)
  assert.doesNotMatch(html(sel('closed')), /b-select-preview/)
  const toast = (v: string) => n('t', 'toast', { message: 'Đã lưu', __view: v })
  assert.match(html(toast('open')), /b-toast-el[^"]*is-visible/)
  assert.doesNotMatch(html(toast('closed')), /is-visible/)
  const cmdk = (v: string) => n('c', 'commandPalette', { buttonText: 'Tìm', items: [{ label: 'Trang chủ' }], __view: v })
  assert.match(html(cmdk('open')), /b-cmdk-preview/)
  assert.doesNotMatch(html(cmdk('closed')), /b-cmdk-preview/)
  // trang thật không bao giờ có lớp xem trước, kể cả khi props lỡ có __view
  assert.doesNotMatch(html(dialog('open'), 'live'), /b-dialog-preview/)
  assert.doesNotMatch(html(sel('open'), 'live'), /b-select-preview/)
})
