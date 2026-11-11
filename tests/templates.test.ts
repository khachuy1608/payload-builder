import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPageTemplates } from '../src/builder/templates'
import { cloneWithNewIds, walk } from '../src/builder/tree'
import { validateContent } from '../src/builder/validate'

test('mẫu trang có sẵn: hợp lệ theo schema, id không trùng, nhân bản ra id mới', () => {
  const list = getPageTemplates()
  assert.ok(list.length >= 5)
  for (const t of list) {
    const content = validateContent({ version: 1, root: t.root })
    assert.equal(content.root.children?.length ?? 0, t.root.children?.length ?? 0, `mẫu ${t.id} không bị cắt bớt khi validate`)
    const ids = new Set<string>()
    walk(t.root, (n) => {
      assert.ok(!ids.has(n.id), `id trùng trong mẫu ${t.id}: ${n.id}`)
      ids.add(n.id)
    })
    const clone = cloneWithNewIds(t.root)
    const cloneIds: string[] = []
    walk(clone, (n) => cloneIds.push(n.id))
    assert.ok(cloneIds.slice(1).every((id) => !ids.has(id)), 'bản sao có id mới')
  }
  const landing = list.find((t) => t.id === 'landing')!
  const json = JSON.stringify(landing.root)
  assert.ok(json.includes('"type":"form"') && json.includes('"type":"accordion"'), 'landing có form và FAQ')
  const about = list.find((t) => t.id === 'about')!
  assert.ok(JSON.stringify(about.root).includes('"collection":"users"'), 'about có danh sách dữ liệu users')
})
