import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compileTreeCss, declarations } from '../src/builder/css'
import { parseYouTubeId, safeHref } from '../src/builder/registry'
import { sanitizeSvg } from '../src/builder/sanitize'
import { canContain } from '../src/builder/schema'
import { cloneWithNewIds, createRoot, findNode, moveNode } from '../src/builder/tree'
import type { BuilderNode } from '../src/builder/types'
import { validateContent } from '../src/builder/validate'
import { demoHomeContent } from '../src/seed'

const leaf = (id: string): BuilderNode => ({ id, type: 'paragraph', props: { text: id }, styles: {} })

function sample(): BuilderNode {
  const root = createRoot()
  root.children = [
    leaf('a'),
    leaf('b'),
    { id: 'box', type: 'div', props: {}, styles: {}, children: [leaf('c')] },
  ]
  return root
}

const ids = (n: BuilderNode) => (n.children ?? []).map((c) => c.id)

test('moveNode: kéo xuống trong cùng cha tính index theo vị trí trước khi gỡ', () => {
  const root = sample()
  moveNode(root, 'a', { parentId: 'root', index: 2 }) // thả giữa b và box
  assert.deepEqual(ids(root), ['b', 'a', 'box'])
})

test('moveNode: chuyển sang cha khác', () => {
  const root = sample()
  moveNode(root, 'b', { parentId: 'box', index: 0 })
  assert.deepEqual(ids(root), ['a', 'box'])
  assert.deepEqual(ids(findNode(root, 'box')!), ['b', 'c'])
})

test('moveNode: không cho thả một node vào chính cây con của nó', () => {
  const root = sample()
  assert.equal(moveNode(root, 'box', { parentId: 'box', index: 0 }), false)
  assert.deepEqual(ids(root), ['a', 'b', 'box'])
})

test('cloneWithNewIds tạo id mới cho toàn bộ cây con', () => {
  const copy = cloneWithNewIds(findNode(sample(), 'box')!)
  assert.notEqual(copy.id, 'box')
  assert.notEqual(copy.children![0].id, 'c')
  assert.match(copy.id, /^[a-z]/)
})

test('schema: tab chỉ nằm trong tabs, tabs chỉ chứa tab', () => {
  assert.equal(canContain('tabs', 'tab'), true)
  assert.equal(canContain('tabs', 'heading'), false)
  assert.equal(canContain('div', 'tab'), false)
  assert.equal(canContain('heading', 'paragraph'), false)
  assert.equal(canContain('div', 'root'), false)
})

test('css: responsive, hover, ẩn theo thiết bị, thêm px cho số', () => {
  const root = createRoot()
  root.children = [
    {
      id: 'x1',
      type: 'heading',
      props: { hide: { mobile: true } },
      styles: { desktop: { fontSize: '32', lineHeight: '1.2' }, tablet: { fontSize: '24px' }, hover: { color: 'red' } },
    },
  ]
  const css = compileTreeCss(root)
  assert.match(css, /\.n-x1\{font-size:32px;line-height:1\.2\}/)
  assert.match(css, /\.n-x1:hover\{color:red\}/)
  assert.match(css, /@media \(max-width:1024px\)\{\.n-x1\{font-size:24px\}\}/)
  assert.match(css, /@media \(max-width:767px\)\{\.n-x1\{display:none!important\}\}/)
})

test('css: chặn chèn CSS / thoát thẻ style', () => {
  const out = declarations({ color: 'red}</style><script>alert(1)</script>', 'bad-prop': 'x' })
  assert.ok(!out.includes('<') && !out.includes('}'))
  assert.ok(!out.includes('bad'))
})

test('css: viết tắt đứng trước viết chi tiết', () => {
  assert.equal(declarations({ paddingTop: '4px', padding: '16px' }), 'padding:16px;padding-top:4px')
})

test('svg: loại script, on*, href ngoài nhưng giữ viewBox', () => {
  const dirty = '<svg viewBox="0 0 10 10" onload="alert(1)"><script>alert(1)</script><a href="javascript:x"><path d="M0 0"/></a><use href="https://evil/x.svg#a"/><path d="M1 1" fill="red"/></svg>'
  const clean = sanitizeSvg(dirty)
  assert.ok(clean.includes('viewBox="0 0 10 10"'))
  assert.ok(!/script|onload|javascript|evil/.test(clean))
  assert.ok(clean.includes('fill="red"'))
})

test('validate: bỏ block lạ, sai quan hệ cha-con; báo lỗi id trùng', () => {
  const content = {
    version: 1,
    root: {
      id: 'root',
      type: 'root',
      props: {},
      styles: { desktop: { color: 'red', 'x}': 'y' } },
      children: [
        { id: 'u1', type: 'unknown', props: {}, styles: {} },
        { id: 't1', type: 'tab', props: {}, styles: {}, children: [] },
        { id: 'h1', type: 'heading', props: { text: 'Hi' }, styles: {}, children: [leaf('p9')] },
      ],
    },
  }
  const out = validateContent(content)
  assert.deepEqual(ids(out.root), ['h1'])
  assert.equal(out.root.children![0].children, undefined)
  assert.deepEqual(out.root.styles, { desktop: { color: 'red' } })

  const dup = { version: 1, root: { id: 'root', type: 'root', props: {}, styles: {}, children: [leaf('a'), leaf('a')] } }
  assert.throws(() => validateContent(dup))
})

test('validate: nội dung mẫu hợp lệ', () => {
  const demo = demoHomeContent()
  assert.deepEqual(validateContent(demo), demo)
})

test('link & youtube', () => {
  assert.equal(safeHref('javascript:alert(1)'), undefined)
  assert.equal(safeHref('/lien-he'), '/lien-he')
  assert.equal(safeHref('example.com'), 'https://example.com')
  assert.equal(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5'), 'dQw4w9WgXcQ')
  assert.equal(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(parseYouTubeId('not a video'), null)
})
