import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { canHaveClick, clickAttrs, normalizeClick } from '../src/builder/click'
import { compileTreeCss } from '../src/builder/css'
import { PageRenderer } from '../src/builder/Renderer'
import type { BuilderNode } from '../src/builder/types'
import { validateContent } from '../src/builder/validate'

test('normalizeClick: chỉ nhận hành động/URL/ID hợp lệ, giữ {{trường}}', () => {
  assert.deepEqual(normalizeClick({ action: 'link', href: '/thanh-vien/{{id}}', newTab: true }), { action: 'link', href: '/thanh-vien/{{id}}', newTab: true })
  assert.deepEqual(normalizeClick({ action: 'link', href: 'example.com/x' }), { action: 'link', href: 'https://example.com/x' })
  assert.equal(normalizeClick({ action: 'link', href: 'javascript:alert(1)' }), undefined)
  assert.equal(normalizeClick({ action: 'link', href: '/a"onmouseover="x' }), undefined)
  assert.deepEqual(normalizeClick({ action: 'dialog', target: '#dlg-1', label: ' Mở ' }), { action: 'dialog', target: 'dlg-1', label: 'Mở' })
  assert.equal(normalizeClick({ action: 'scroll', target: 'a b' }), undefined)
  assert.equal(normalizeClick({ action: 'hack', href: '/' }), undefined)
  assert.equal(normalizeClick(null), undefined)
})

test('clickAttrs: role/tabindex/data-*; link còn {{…}} chưa bind thì bỏ', () => {
  assert.deepEqual(clickAttrs({ action: 'link', href: '/a', newTab: true, label: 'Xem' }), { 'data-click': 'link', role: 'link', tabIndex: 0, 'data-click-href': '/a', 'data-click-newtab': '', 'aria-label': 'Xem' })
  assert.deepEqual(clickAttrs({ action: 'toast', target: 't1' }), { 'data-click': 'toast', role: 'button', tabIndex: 0, 'data-click-target': 't1' })
  assert.equal(clickAttrs({ action: 'link', href: '/x/{{id}}' }), null)
})

test('canHaveClick + validate: vùng chứa/ảnh/heading có, button/form/dialog không', () => {
  assert.ok(canHaveClick('div') && canHaveClick('card') && canHaveClick('image') && canHaveClick('dataList'))
  assert.ok(!canHaveClick('button') && !canHaveClick('form') && !canHaveClick('dialog') && !canHaveClick('root'))
  const c = validateContent({ version: 1, root: { id: 'root', type: 'root', props: {}, styles: {}, children: [
    { id: 'a', type: 'div', props: { click: { action: 'link', href: '/x' } }, styles: {}, children: [] },
    { id: 'b', type: 'button', props: { text: 'x', click: { action: 'link', href: '/x' } }, styles: {} },
    { id: 'c', type: 'div', props: { click: { action: 'link', href: 'javascript:1' } }, styles: {}, children: [] },
  ] } })
  assert.deepEqual(c.root.children![0].props.click, { action: 'link', href: '/x' })
  assert.equal(c.root.children![1].props.click, undefined)
  assert.equal(c.root.children![2].props.click, undefined)
})

test('Danh sách dữ liệu: mỗi thẻ có link riêng theo bản ghi; nền xen kẽ + stretch', () => {
  const root: BuilderNode = { id: 'root', type: 'root', props: {}, styles: {}, children: [
    { id: 'list', type: 'dataList', props: { data: { collection: 'users', mode: 'list', limit: 3 } }, styles: { desktop: { display: 'grid', stripeOdd: '#fff', stripeEven: '#eee', stripeHover: 'red' }, mobile: { stripeEven: '#ddd' } }, children: [
      { id: 'card', type: 'div', props: { click: { action: 'link', href: '/thanh-vien/{{id}}', label: 'Hồ sơ {{name}}' } }, styles: {}, children: [{ id: 'h', type: 'heading', props: { text: '{{name}}', tag: 'h3' }, styles: {} }] },
    ] },
  ] }
  const data = { list: { records: [{ id: 1, name: 'An' }, { id: 2, name: 'Bình' }], total: 2, page: 1, totalPages: 1, limit: 3 } }
  const html = renderToStaticMarkup(createElement(PageRenderer, { content: { version: 1, root }, data }))
  assert.ok(html.includes('data-click-href="/thanh-vien/1"') && html.includes('data-click-href="/thanh-vien/2"'), 'href bind theo từng bản ghi')
  assert.ok(html.includes('aria-label="Hồ sơ Bình"') && html.includes('role="link"') && html.includes('tabindex="0"'))
  const css = compileTreeCss(root)
  assert.ok(css.includes('.n-list>:nth-child(odd){background-color:#fff}') && css.includes('.n-list>:nth-child(even){background-color:#eee}') && css.includes('.n-list>:hover{background-color:red}'))
  assert.ok(/@media \(max-width:767px\)\{[^}]*\.n-list>:nth-child\(even\)\{background-color:#ddd\}/.test(css), 'màu riêng theo thiết bị')
  assert.ok(!css.includes('stripe'), 'thuộc tính ảo không lọt vào CSS')
})
