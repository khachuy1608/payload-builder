import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Payload } from 'payload'
import { notifyMentions } from '../src/collections/Comments'

test('notifyMentions: email cho người được nhắc, bỏ chính người viết, escape HTML, có link builder', async () => {
  process.env.NEXT_PUBLIC_SERVER_URL = 'https://site.vn/'
  const sent: { to: string; subject: string; html: string }[] = []
  const users: Record<string, { id: number; email: string; name: string }> = { '1': { id: 1, email: 'a@x.vn', name: 'An' }, '2': { id: 2, email: 'b@x.vn', name: 'Bình' } }
  const payload = {
    find: async ({ where }: { where: { id: { in: (string | number)[] } } }) => ({ docs: where.id.in.map((id) => users[String(id)]).filter(Boolean) }),
    findByID: async ({ collection, id }: { collection: string; id: string | number }) => (collection === 'pages' ? { id, title: 'Trang <chủ>' } : users[String(id)]),
    sendEmail: async (m: { to: string; subject: string; html: string }) => void sent.push(m),
  } as unknown as Payload
  const n = await notifyMentions(payload, { id: 9, text: 'Xem <b>giúp</b> @Bình', page: 7, mentions: [1, 2, 2] }, 1)
  assert.equal(n, 1)
  assert.deepEqual(sent.map((m) => m.to), ['b@x.vn'])
  assert.match(sent[0].subject, /^An nhắc bạn trong bình luận ở trang “Trang &lt;chủ&gt;”$/)
  assert.match(sent[0].html, /Xem &lt;b&gt;giúp&lt;\/b&gt; @Bình/)
  assert.match(sent[0].html, /href="https:\/\/site\.vn\/builder\/7"/)
  assert.equal(await notifyMentions(payload, { id: 10, text: 'x', page: 7, mentions: [] }, 1), 0)
})
