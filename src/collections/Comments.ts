import type { Access, CollectionConfig } from 'payload'
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
  admin: { useAsTitle: 'text', defaultColumns: ['text', 'page', 'author', 'resolved', 'createdAt'], description: 'Bình luận trên phần tử của trang trong Visual Builder.' },
  access: { read: loggedIn, create: loggedIn, update: authorOrAdmin, delete: authorOrAdmin },
  fields: [
    { name: 'page', label: 'Trang', type: 'relationship', relationTo: 'pages', required: true, index: true },
    { name: 'nodeId', label: 'Phần tử (id node)', type: 'text', required: true, admin: { description: 'id node trong nội dung trang; "root" là cả trang.' } },
    { name: 'text', label: 'Nội dung', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'author', label: 'Tác giả', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
    { name: 'resolved', label: 'Đã giải quyết', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (!data) return data
        if (operation === 'create') data.author = req.user?.id ?? null
        else if ('author' in data) delete data.author
        return data
      },
    ],
  },
}
