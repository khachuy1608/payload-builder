import type { Access, CollectionConfig, Payload } from 'payload'
import { isStaffUser, loggedIn, roleOf } from '../lib/access'

/** Tác giả (hoặc admin) được sửa/xoá bình luận của mình */
const authorOrAdmin: Access = ({ req: { user } }) => {
  if (!isStaffUser(user)) return false
  if (roleOf(user) === 'admin') return true
  return { author: { equals: user!.id } }
}

/**
 * Bình luận gắn vào một phần tử của trang trong Visual Builder (cộng tác: viewer/editor/admin đều bình luận được).
 */
export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: { singular: 'Bình luận', plural: 'Bình luận' },
  admin: { group: 'Website', useAsTitle: 'text', defaultColumns: ['text', 'page', 'author', 'resolved', 'createdAt'], description: 'Bình luận trên phần tử của trang trong Visual Builder.' },
  access: { read: loggedIn, create: loggedIn, update: authorOrAdmin, delete: authorOrAdmin },
  fields: [
    { name: 'page', label: 'Trang', type: 'relationship', relationTo: 'pages', required: true, index: true },
    { name: 'nodeId', label: 'Phần tử (id node)', type: 'text', required: true, admin: { description: 'id node trong nội dung trang; "root" là cả trang.' } },
    { name: 'text', label: 'Nội dung', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'author', label: 'Tác giả', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
    { name: 'resolved', label: 'Đã giải quyết', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    // vị trí bấm khi tạo bình luận, theo tỉ lệ 0–1 trong khung phần tử: huy hiệu neo đúng chỗ này trên canvas
    { name: 'anchorX', label: 'Vị trí ngang (0–1)', type: 'number', min: 0, max: 1, admin: { position: 'sidebar', readOnly: true } },
    { name: 'anchorY', label: 'Vị trí dọc (0–1)', type: 'number', min: 0, max: 1, admin: { position: 'sidebar', readOnly: true } },
    // người được @nhắc trong bình luận – nhận email thông báo khi bình luận được tạo
    { name: 'mentions', label: 'Nhắc tới', type: 'relationship', relationTo: 'users', hasMany: true, maxRows: 20, admin: { position: 'sidebar', readOnly: true } },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (!data) return data
        if (operation === 'create') data.author = req.user?.id ?? null
        else {
          if ('author' in data) delete data.author
          // không sửa lại danh sách người được nhắc sau khi đã gửi thông báo
          if ('mentions' in data) delete data.mentions
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        try {
          // đọc lại đủ trường: request tạo có thể dùng select (editor chỉ lấy vài trường) nên doc ở đây có thể thiếu page/mentions
          const full = await req.payload.findByID({ collection: 'comments', id: doc.id, depth: 0, overrideAccess: true, req })
          await notifyMentions(req.payload, full as unknown as CommentDocLike, req.user?.id)
        } catch (err) {
          req.payload.logger.warn({ err }, 'Không gửi được email nhắc tên trong bình luận')
        }
        return doc
      },
    ],
  },
}

type Rel = string | number | { id: string | number } | null | undefined
interface CommentDocLike {
  id: string | number
  text?: string
  page?: Rel
  author?: Rel
  mentions?: Rel[] | null
}
const relId = (r: Rel) => (r && typeof r === 'object' ? r.id : r)
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * Email cho người được @nhắc (trừ chính người viết). Không cấu hình SMTP thì Payload chỉ ghi ra log.
 */
export async function notifyMentions(payload: Payload, doc: CommentDocLike, authorId: string | number | undefined): Promise<number> {
  const ids = [...new Set((doc.mentions ?? []).map(relId).filter((v): v is string | number => v != null && String(v) !== String(authorId ?? '')))]
  if (!ids.length) return 0
  const pageId = relId(doc.page)
  const [users, page, author] = await Promise.all([
    payload.find({ collection: 'users', where: { id: { in: ids } }, depth: 0, limit: ids.length, overrideAccess: true }),
    pageId != null ? payload.findByID({ collection: 'pages', id: pageId, depth: 0, overrideAccess: true }).catch(() => null) : null,
    authorId != null ? payload.findByID({ collection: 'users', id: authorId, depth: 0, overrideAccess: true }).catch(() => null) : null,
  ])
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')
  const link = pageId != null ? `${base}/builder/${pageId}` : base || '/'
  const who = escapeHtml(String((author as { name?: string; email?: string } | null)?.name || (author as { email?: string } | null)?.email || 'Một người'))
  const title = escapeHtml(String((page as { title?: string } | null)?.title || 'trang'))
  let sent = 0
  for (const u of users.docs as { email?: string; name?: string }[]) {
    if (!u.email) continue
    await payload.sendEmail({
      to: u.email,
      subject: `${who} nhắc bạn trong bình luận ở trang “${title}”`,
      html: `<p>Chào ${escapeHtml(u.name || u.email)},</p><p><b>${who}</b> đã nhắc bạn trong một bình luận ở trang <b>${title}</b>:</p><blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #f59e0b;background:#fffbeb">${escapeHtml(String(doc.text ?? '')).replace(/\n/g, '<br>')}</blockquote><p><a href="${link}">Mở trang trong Visual Builder</a></p>`,
    })
    sent++
  }
  return sent
}
