import type { CollectionConfig } from 'payload'
import { canEdit } from '../lib/access'
import { revalidatePages } from '../lib/revalidate'

/** Chuyển hướng đường dẫn cũ → mới (tự tạo khi đổi slug trang đã xuất bản, hoặc thêm tay) */
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Chuyển hướng', plural: 'Chuyển hướng' },
  admin: { useAsTitle: 'from', defaultColumns: ['from', 'to', 'permanent', 'updatedAt'] },
  access: { read: () => true, create: canEdit, update: canEdit, delete: canEdit },
  fields: [
    { name: 'from', label: 'Từ đường dẫn', type: 'text', required: true, unique: true, index: true, admin: { description: 'Ví dụ /gioi-thieu-cu' } },
    { name: 'to', label: 'Tới', type: 'text', required: true, admin: { description: 'Đường dẫn nội bộ (/lien-he) hoặc URL đầy đủ' } },
    { name: 'permanent', label: 'Vĩnh viễn (301)', type: 'checkbox', defaultValue: true },
    { name: 'note', label: 'Ghi chú', type: 'text' },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.from) data.from = '/' + String(data.from).trim().replace(/^\/+/, '').replace(/\/+$/, '')
        if (data?.from === '/' ) data.from = '/'
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        revalidatePages()
        return doc
      },
    ],
  },
}
