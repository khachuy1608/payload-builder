import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compileTreeCss } from '../src/builder/css'
import {
  collectRefIds,
  expandRef,
  loadRefTrees,
  mergeStyles,
  reachesBlock,
  resolveRefs,
  type BlockLookup,
} from '../src/builder/refs'
import { canContain, canSaveAsBlock } from '../src/builder/schema'
import { cloneWithNewIds, countNodes, createRoot, findNode, walk } from '../src/builder/tree'
import type { BuilderNode } from '../src/builder/types'
import { validateBlockTree, validateContent } from '../src/builder/validate'

const leaf = (id: string, type = 'paragraph'): BuilderNode => ({ id, type, props: { text: id }, styles: {} })
const ref = (id: string, blockId: string, extra: Partial<BuilderNode> = {}): BuilderNode => ({
  id,
  type: 'blockRef',
  props: { blockId, name: 'B' + blockId },
  styles: {},
  ...extra,
})

/** Block 1: card (div > heading + paragraph). Block 2: flexbox chứa liên kết tới block 1. */
const card: BuilderNode = {
  id: 'card',
  type: 'div',
  props: { cssClass: 'card' },
  styles: { desktop: { padding: '24px', backgroundColor: 'red' }, hover: { opacity: '0.9' } },
  children: [leaf('h', 'heading'), leaf('p')],
}
const row: BuilderNode = {
  id: 'row',
  type: 'flexbox',
  props: {},
  styles: { desktop: { display: 'flex' } },
  children: [ref('r1', '1'), ref('r2', '1')],
}
const library: Record<string, BuilderNode> = { '1': card, '2': row }
const lookup: BlockLookup = (id) => library[id]

test('collectRefIds & refBlockId: chuẩn hoá id số, bỏ id không hợp lệ', () => {
  const root = createRoot()
  root.children = [ref('a', '1'), { ...ref('b', '2'), props: { blockId: 2 } }, { ...ref('c', 'x'), props: { blockId: 'bad id!' } }]
  assert.deepEqual([...collectRefIds(root)], ['1', '2'])
})

test('expandRef: gốc lấy id của node tham chiếu, con có id duy nhất, ghi đè style và prop Nâng cao', () => {
  const node = ref('k1', '1', { styles: { desktop: { margin: '8px', padding: '0' } }, props: { blockId: '1', hide: { mobile: true } } })
  const out = expandRef(node, card)
  assert.equal(out.id, 'k1')
  assert.equal(out.type, 'div')
  assert.equal(out.linked, 'root')
  assert.deepEqual(out.styles.desktop, { padding: '0', backgroundColor: 'red', margin: '8px' })
  assert.deepEqual(out.styles.hover, { opacity: '0.9' })
  assert.deepEqual(out.props, { cssClass: 'card', hide: { mobile: true } })
  const ids = out.children!.map((c) => c.id)
  assert.deepEqual(ids, ['k1_1', 'k1_2'])
  assert.ok(out.children!.every((c) => c.linked === 'inner'))
  // không đụng tới cây gốc
  assert.equal(card.children![0].id, 'h')
})

test('resolveRefs: triển khai lồng nhau, id duy nhất toàn cây, structural sharing cho nhánh không đổi', () => {
  const root = createRoot()
  const plain = { id: 'box', type: 'div', props: {}, styles: {}, children: [leaf('z')] }
  root.children = [plain, ref('a', '2')]
  const out = resolveRefs(root, lookup)
  assert.notEqual(out, root)
  assert.equal(out.children![0], plain, 'nhánh không chứa blockRef phải giữ nguyên object')
  const a = out.children![1]
  assert.equal(a.type, 'flexbox')
  assert.equal(a.linked, 'root')
  // r1, r2 bên trong block 2 lại là blockRef tới block 1 -> triển khai tiếp
  assert.equal(a.children![0].type, 'div')
  assert.equal(a.children![0].linked, 'root')
  assert.equal(a.children![0].children![0].type, 'heading')
  const ids: string[] = []
  walk(out, (n) => ids.push(n.id))
  assert.equal(new Set(ids).size, ids.length, 'id phải duy nhất')
  assert.ok(ids.every((id) => /^[A-Za-z0-9_-]{1,40}$/.test(id)))
  // gọi lại với cùng input -> cùng kết quả (cache theo object)
  assert.equal(resolveRefs(root, lookup), out)
  // CSS biên dịch có style của block cho đúng selector
  const css = compileTreeCss(out)
  assert.match(css, /\.n-a\{display:flex\}/)
  assert.match(css, /\.n-a_1\{padding:24px;background-color:red\}/)
})

test('resolveRefs: block thiếu, vòng lặp và lồng quá sâu không làm treo và được đánh dấu lỗi', () => {
  const cyc: Record<string, BuilderNode> = {
    A: { id: 'A', type: 'div', props: {}, styles: {}, children: [ref('toB', 'B')] },
    B: { id: 'B', type: 'div', props: {}, styles: {}, children: [ref('toA', 'A')] },
  }
  const root = createRoot()
  root.children = [ref('m', '404'), ref('c', 'A')]
  const out = resolveRefs(root, (id) => cyc[id])
  assert.equal(out.children![0].type, 'blockRef')
  assert.equal(out.children![0].props.refError, 'missing')
  const c = out.children![1]
  assert.equal(c.linked, 'root') // A triển khai
  const b = c.children![0]
  assert.equal(b.linked, 'root') // B triển khai
  const backToA = b.children![0]
  assert.equal(backToA.type, 'blockRef')
  assert.equal(backToA.props.refError, 'cycle')

  // lồng quá sâu: chuỗi dài hơn maxDepth
  const chain: Record<string, BuilderNode> = {}
  for (let i = 0; i < 10; i++) chain[String(i)] = { id: 'n' + i, type: 'div', props: {}, styles: {}, children: [ref('l' + i, String(i + 1))] }
  const deep = createRoot()
  deep.children = [ref('d', '0')]
  const res = resolveRefs(deep, (id) => chain[id], 3)
  let errors = 0
  walk(res, (n) => n.props.refError === 'depth' && errors++)
  assert.equal(errors, 1)
  assert.ok(countNodes(res) < 12)
})

test('reachesBlock: phát hiện vòng lặp trực tiếp và gián tiếp', () => {
  assert.equal(reachesBlock(row, '1', lookup), true) // row -> 1
  assert.equal(reachesBlock(card, '2', lookup), false)
  const lib2: Record<string, BuilderNode> = { ...library, '3': { id: 'x', type: 'div', props: {}, styles: {}, children: [ref('q', '2')] } }
  assert.equal(reachesBlock(lib2['3'], '1', (id) => lib2[id]), true) // 3 -> 2 -> 1
})

test('loadRefTrees: nạp theo tầng kể cả block lồng nhau, bỏ qua id không tồn tại', async () => {
  const calls: string[][] = []
  const trees = await loadRefTrees(['2', '404'], async (ids) => {
    calls.push([...ids].sort())
    return ids.filter((id) => library[id]).map((id) => ({ id, tree: library[id] }))
  })
  assert.deepEqual([...trees.keys()].sort(), ['1', '2'])
  assert.deepEqual(calls, [['2', '404'], ['1']])
})

test('schema: blockRef đặt được trong div/flexbox/tab nhưng không vào tabs; không lưu root/tab/blockRef thành block', () => {
  assert.equal(canContain('div', 'blockRef'), true)
  assert.equal(canContain('tab', 'blockRef'), true)
  assert.equal(canContain('root', 'blockRef'), true)
  assert.equal(canContain('tabs', 'blockRef'), false)
  assert.equal(canSaveAsBlock('div'), true)
  assert.equal(canSaveAsBlock('tabs'), true)
  assert.equal(canSaveAsBlock('root'), false)
  assert.equal(canSaveAsBlock('tab'), false)
  assert.equal(canSaveAsBlock('blockRef'), false)
})

test('validateContent: giữ blockRef hợp lệ, chuẩn hoá id số, bỏ blockRef thiếu id, xoá cờ render', () => {
  const content = {
    version: 1,
    root: {
      id: 'root',
      type: 'root',
      props: {},
      styles: {},
      children: [
        { id: 'ok', type: 'blockRef', props: { blockId: 12, name: 'Card', refError: 'missing' }, styles: {}, linked: 'root', children: [leaf('junk')] },
        { id: 'no', type: 'blockRef', props: {}, styles: {} },
      ],
    },
  }
  const out = validateContent(content)
  assert.equal(out.root.children!.length, 1)
  const node = out.root.children![0]
  assert.deepEqual(node, { id: 'ok', type: 'blockRef', props: { blockId: '12', name: 'Card' }, styles: {} })
  assert.equal('linked' in node, false)
})

test('validateBlockTree: làm sạch cây, từ chối gốc là tab/root', () => {
  const tree = validateBlockTree({ ...card, styles: { desktop: { padding: '24px', 'bad}': 'x' } } })
  assert.equal(tree.id, 'card')
  assert.deepEqual(tree.styles, { desktop: { padding: '24px' } })
  assert.throws(() => validateBlockTree({ id: 't', type: 'tab', props: {}, styles: {}, children: [] }))
  assert.throws(() => validateBlockTree({ id: 'r', type: 'root', props: {}, styles: {}, children: [] }))
  assert.throws(() => validateBlockTree(ref('x', '1')))
  assert.throws(() => validateBlockTree(null))
})

test('detach = expandRef + cloneWithNewIds: bỏ cờ linked, id mới, giữ blockRef lồng bên trong', () => {
  const detached = cloneWithNewIds(expandRef(ref('k', '2'), row))
  assert.equal(detached.type, 'flexbox')
  assert.equal('linked' in detached, false)
  assert.ok(detached.children!.every((c) => !('linked' in c) && c.type === 'blockRef'))
  assert.notEqual(detached.id, 'k')
  assert.equal(findNode(detached, 'k'), null)
})

test('mergeStyles: bucket rỗng bị bỏ', () => {
  assert.deepEqual(mergeStyles({ desktop: { a: '1' } }, { mobile: {} }), { desktop: { a: '1' } })
})

test('seed: block mẫu hợp lệ', async () => {
  const { demoBlockTree } = await import('../src/seed')
  const tree = demoBlockTree()
  assert.deepEqual(validateBlockTree(tree), tree)
})
