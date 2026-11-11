import type { Endpoint } from 'payload'
import { isStaffUser } from './access'

/**
 * Ai đang mở tài liệu trong builder (hiện diện): bộ nhớ trong tiến trình, mỗi client gửi nhịp 10s,
 * hết hạn sau 30s. Chạy nhiều instance thì mỗi instance chỉ thấy người của mình – đủ cho site đơn.
 */
interface Entry {
  id: string
  name: string
  at: number
}
const rooms = new Map<string, Map<string, Entry>>()
const TTL = 30_000

export function touchPresence(room: string, user: { id: string; name: string }): Entry[] {
  const now = Date.now()
  const r = rooms.get(room) ?? new Map<string, Entry>()
  rooms.set(room, r)
  r.set(user.id, { id: user.id, name: user.name, at: now })
  for (const [k, v] of r) if (now - v.at > TTL) r.delete(k)
  return [...r.values()].filter((e) => e.id !== user.id)
}

export function leavePresence(room: string, userId: string) {
  rooms.get(room)?.delete(userId)
}

export const presenceEndpoints: Endpoint[] = [
  {
    path: '/builder/presence',
    method: 'post',
    handler: async (req) => {
      if (!isStaffUser(req.user)) return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
      const body = (await req.json?.()) as { room?: string; leave?: boolean } | undefined
      const room = String(body?.room ?? '')
      if (!/^[a-z-]+:[A-Za-z0-9_-]+$/.test(room)) return Response.json({ errors: [{ message: 'room không hợp lệ' }] }, { status: 400 })
      const me = { id: String(req.user!.id), name: String((req.user as { name?: string }).name || req.user!.email || 'Người dùng') }
      if (body?.leave) {
        leavePresence(room, me.id)
        return Response.json({ others: [] })
      }
      return Response.json({ others: touchPresence(room, me).map((e) => ({ id: e.id, name: e.name })) })
    },
  },
]
