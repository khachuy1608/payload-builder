import type { CollectionConfig } from 'payload'

/**
 * Bài gửi từ block Form trên trang (blocks/Runtime.tsx gửi JSON tới /api/form-submissions).
 * Khách tạo được (đã có honeypot + giới hạn kích thước), chỉ người đăng nhập đọc/xoá.
 */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Bài gửi form', plural: 'Bài gửi form' },
  admin: { useAsTitle: 'form', defaultColumns: ['form', 'page', 'createdAt'], description: 'Dữ liệu người dùng gửi qua block Form trong Visual Builder.' },
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    update: () => false,
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'form', label: 'Tên form', type: 'text', required: true, index: true },
    { name: 'page', label: 'Trang gửi', type: 'text' },
    { name: 'data', label: 'Dữ liệu', type: 'json', required: true },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        data.form = String(data.form ?? 'form').slice(0, 80)
        data.page = String(data.page ?? '').slice(0, 300)
        // chỉ nhận object phẳng gồm chuỗi/số/boolean/mảng chuỗi, tối đa 60 trường, mỗi giá trị <= 5000 ký tự
        const src = data.data && typeof data.data === 'object' && !Array.isArray(data.data) ? (data.data as Record<string, unknown>) : {}
        const clean: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(src).slice(0, 60)) {
          const key = k.replace(/[^\w.-]/g, '').slice(0, 60)
          if (!key) continue
          if (typeof v === 'string') clean[key] = v.slice(0, 5000)
          else if (typeof v === 'number' || typeof v === 'boolean') clean[key] = v
          else if (Array.isArray(v)) clean[key] = v.filter((x) => typeof x === 'string').map((x) => x.slice(0, 500)).slice(0, 50)
        }
        data.data = clean
        return data
      },
    ],
  },
}
