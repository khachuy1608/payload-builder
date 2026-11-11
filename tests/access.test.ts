import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { PayloadRequest } from 'payload'
import { canEdit, isAdmin, ownerOrAdmin, roleOf } from '../src/lib/access'
import { leavePresence, touchPresence } from '../src/lib/presence'

const req = (user: Record<string, unknown> | null) => ({ req: { user } as unknown as PayloadRequest }) as Parameters<typeof isAdmin>[0]

test('roleOf: mặc định editor, nhận admin/viewer', () => {
  assert.equal(roleOf(null), 'editor')
  assert.equal(roleOf({ role: 'x' }), 'editor')
  assert.equal(roleOf({ role: 'admin' }), 'admin')
  assert.equal(roleOf({ role: 'viewer' }), 'viewer')
})

test('access: isAdmin / canEdit / ownerOrAdmin', () => {
  assert.equal(isAdmin(req({ id: 1, role: 'admin' })), true)
  assert.equal(isAdmin(req({ id: 1, role: 'editor' })), false)
  assert.equal(canEdit(req({ id: 1, role: 'editor' })), true)
  assert.equal(canEdit(req({ id: 1, role: 'viewer' })), false)
  assert.equal(canEdit(req(null)), false)
  assert.equal(ownerOrAdmin(req({ id: 1, role: 'admin' })), true)
  assert.equal(ownerOrAdmin(req({ id: 1, role: 'viewer' })), false)
  assert.deepEqual(ownerOrAdmin(req({ id: 7, role: 'editor' })), { or: [{ owner: { equals: 7 } }, { owner: { exists: false } }] })
})

test('presence: nhịp trả về người khác, rời phòng, hết hạn 30s', () => {
  const room = 'page:t' + Date.now()
  assert.deepEqual(touchPresence(room, { id: 'a', name: 'A' }), [])
  assert.deepEqual(touchPresence(room, { id: 'b', name: 'B' }).map((e) => e.id), ['a'])
  assert.deepEqual(touchPresence(room, { id: 'a', name: 'A' }).map((e) => e.id), ['b'])
  leavePresence(room, 'b')
  assert.deepEqual(touchPresence(room, { id: 'a', name: 'A' }), [])
  // hết hạn: giả lập mốc thời gian cũ
  const realNow = Date.now
  Date.now = () => realNow() + 60_000
  try {
    assert.deepEqual(touchPresence(room, { id: 'c', name: 'C' }), [], 'a đã hết hạn sau 60s')
  } finally {
    Date.now = realNow
  }
})
