import assert from 'node:assert/strict'
import { test } from 'node:test'
import { diffTrees, summarizeDiff } from '../src/builder/diff'
import type { BuilderNode } from '../src/builder/types'

const n = (id: string, type: string, props: Record<string, unknown> = {}, children?: BuilderNode[], styles: BuilderNode['styles'] = {}): BuilderNode => ({ id, type, props, styles, ...(children ? { children } : {}) })

test('diffTrees: thêm, xoá, đổi props/styles, di chuyển', () => {
  const before = n('root', 'root', {}, [n('a', 'heading', { text: 'A' }), n('b', 'paragraph', { text: 'B' }, undefined, { desktop: { color: 'red' } }), n('c', 'div', {}, [n('d', 'button', { text: 'D' })])])
  const after = n('root', 'root', {}, [n('b', 'paragraph', { text: 'B' }, undefined, { desktop: { color: 'blue' }, hover: { opacity: '.5' } }), n('a', 'heading', { text: 'A2' }), n('d', 'button', { text: 'D' }), n('e', 'image', {})])
  const d = diffTrees(before, after)
  const by = (kind: string) => d.filter((x) => x.kind === kind).map((x) => x.id).sort()
  assert.deepEqual(by('removed'), ['c'])
  assert.deepEqual(by('added'), ['e'])
  assert.deepEqual(by('moved'), ['a', 'b', 'd'])
  const changed = d.filter((x) => x.kind === 'changed')
  assert.deepEqual(changed.find((x) => x.id === 'a')?.changes, ['text'])
  assert.deepEqual(changed.find((x) => x.id === 'b')?.changes?.sort(), ['desktop.color', 'hover.opacity'])
  assert.deepEqual(summarizeDiff(d), { added: 1, removed: 1, changed: 2, moved: 3 })
})

test('diffTrees: cây giống nhau -> rỗng; thêm anh em không làm phần tử cũ bị coi là di chuyển', () => {
  const t = n('root', 'root', {}, [n('a', 'heading', { text: 'A' }), n('b', 'paragraph', { text: 'B' })])
  assert.deepEqual(diffTrees(t, structuredClone(t)), [])
  const withNew = n('root', 'root', {}, [n('x', 'divider'), n('a', 'heading', { text: 'A' }), n('b', 'paragraph', { text: 'B' })])
  assert.deepEqual(diffTrees(t, withNew), [{ kind: 'added', id: 'x', type: 'divider' }])
})
