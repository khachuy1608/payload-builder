import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PRESETS, applyPreset, getPresets } from '../src/builder/presets'
import { BLOCKS } from '../src/builder/registry'
import { PageRenderer } from '../src/builder/Renderer'
import { BLOCK_SCHEMAS } from '../src/builder/schema'
import { createRoot, genId } from '../src/builder/tree'
import type { BuilderNode } from '../src/builder/types'
import { validateContent } from '../src/builder/validate'

test('mọi block (trừ root/blockRef) đều có gợi ý; mỗi gợi ý có id duy nhất và không trỏ tới type lạ', () => {
  for (const type of Object.keys(BLOCKS)) {
    if (type === 'root' || type === 'blockRef') continue
    assert.ok(getPresets(type).length >= 2, `${type} cần ≥ 2 gợi ý`)
  }
  for (const [type, list] of Object.entries(PRESETS)) {
    assert.ok(BLOCK_SCHEMAS[type], 'type lạ: ' + type)
    assert.equal(new Set(list.map((p) => p.id)).size, list.length, 'id trùng ở ' + type)
  }
  assert.ok(getPresets('button').length >= 18 && getPresets('button').some((p) => p.props?.icon === 'arrowRight' && p.props?.iconPosition === 'right'), 'button có gợi ý icon sau chữ')
})

test('applyPreset: giữ chữ/link, thay desktop+hover, giữ tablet/mobile của người dùng nếu preset không có', () => {
  const node: BuilderNode = { id: 'b', type: 'button', props: { text: 'Mua ngay', href: '/mua', newTab: true }, styles: { desktop: { backgroundColor: 'red', fontSize: '30px' }, hover: { opacity: '.5' }, mobile: { fontSize: '14px' } } }
  const outline = getPresets('button').find((p) => p.id === 'outline')!
  const out = applyPreset(node, outline)
  assert.equal(out.props.text, 'Mua ngay')
  assert.equal(out.props.href, '/mua')
  assert.equal(out.props.newTab, true)
  assert.equal(out.props.icon, '')
  assert.equal(out.styles.desktop!.backgroundColor, 'transparent')
  assert.equal(out.styles.desktop!.fontSize, undefined, 'desktop được thay hẳn')
  assert.deepEqual(out.styles.hover, outline.styles.hover)
  assert.deepEqual(out.styles.mobile, { fontSize: '14px' }, 'mobile giữ nguyên')
  assert.equal(node.styles.desktop!.backgroundColor, 'red', 'không đụng node gốc')
  const iconOnly = getPresets('button').find((p) => p.id === 'icon-only')!
  const io = applyPreset(node, iconOnly)
  assert.equal(io.props.iconPosition, 'only')
  assert.equal(io.props.text, 'Mua ngay')
})

test('mọi gợi ý áp dụng xong vẫn qua validate và render được (live + editor)', () => {
  for (const [type, list] of Object.entries(PRESETS)) {
    const schema = BLOCK_SCHEMAS[type]
    const d = BLOCKS[type].defaults()
    for (const preset of list) {
      const node = applyPreset({ id: genId(), type, props: d.props, styles: d.styles, ...(d.children ? { children: d.children } : {}) }, preset)
      const root = createRoot()
      const parentType = schema.allowedParents?.[0]
      root.children = parentType ? [{ id: genId(), type: parentType, props: BLOCKS[parentType].defaults().props, styles: {}, children: [node] }] : [node]
      const out = validateContent({ version: 1, root })
      const kept = parentType ? out.root.children![0].children![0] : out.root.children![0]
      assert.ok(kept, `${type}/${preset.id} bị validate loại`)
      assert.deepEqual(kept.styles, node.styles, `${type}/${preset.id}: styles bị làm sạch khác đi`)
      for (const mode of ['live', 'editor'] as const) renderToStaticMarkup(createElement(PageRenderer, { content: out, mode }))
    }
  }
})

test('button có icon render SVG đúng vị trí; chỉ icon thì có aria-label', () => {
  const mk = (props: Record<string, unknown>) => {
    const root = createRoot()
    root.children = [{ id: 'b', type: 'button', props: { text: 'Tải về', href: '#', ...props }, styles: {} }]
    return renderToStaticMarkup(createElement(PageRenderer, { content: { version: 1, root }, mode: 'live' }))
  }
  const right = mk({ icon: 'arrowRight', iconPosition: 'right' })
  assert.ok(/b-button-text">Tải về<\/span><svg/.test(right), 'icon sau chữ')
  const left = mk({ icon: 'download', iconPosition: 'left', iconSize: 20 })
  assert.ok(left.indexOf('<svg') < left.indexOf('b-button-text') && /<svg[^>]*width="20"/.test(left) && left.includes('b-button-icon'), 'icon trước chữ, cỡ 20')
  const only = mk({ icon: 'heart', iconPosition: 'only' })
  assert.ok(only.includes('aria-label="Tải về"') && !only.includes('b-button-text'), 'chỉ icon: ẩn chữ, có aria-label')
})
