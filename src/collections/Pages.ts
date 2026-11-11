import type { Access, CollectionConfig, FieldHook } from 'payload'
import { APIError } from 'payload'
import { ContentValidationError, validateContent } from '../builder/validate'
import { RESERVED_SLUGS, slugify } from '../lib/slug'

const loggedIn: Access = ({ req: { user } }) => Boolean(user)

/** Khách chỉ đọc được trang đã xuất bản, người đã đăng nhập đọc được cả bản nháp */
const readPublishedOrLoggedIn: Access = ({ req: { user } }) =>
  user ? true : { _status: { equals: 'published' } }

const formatSlug: FieldHook = ({ value, data, operation }) => {
  if (typeof value === 'string' && value.trim()) return slugify(value)
  if (operation === 'create' && typeof data?.title === 'string') return slugify(data.title)
  return value
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Trang', plural: 'Trang' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    preview: (doc) => `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/preview?slug=${encodeURIComponent(String(doc?.slug ?? ''))}`,
  },
  access: {
    read: readPublishedOrLoggedIn,
    create: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
  fields: [
    { name: 'title', label: 'Tiêu đề', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Đường dẫn (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Trang có slug "home" là trang chủ. Để trống sẽ tự tạo từ tiêu đề.',
      },
      hooks: { beforeValidate: [formatSlug] },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !value) return 'Cần có slug.'
        if (RESERVED_SLUGS.includes(value)) return `"${value}" là đường dẫn hệ thống, hãy chọn slug khác.`
        return true
      },
    },
    {
      name: 'builder',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/OpenBuilderButton#OpenBuilderButton' },
      },
    },
    {
      name: 'theme',
      label: 'Ghi đè theme',
      type: 'relationship',
      relationTo: 'themes',
      admin: { position: 'sidebar', description: 'Để trống sẽ dùng theme trong Cài đặt site.' },
    },
    {
      name: 'content',
      label: 'Nội dung (JSON từ Visual Builder)',
      type: 'json',
      admin: { hidden: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data && 'content' in data && data.content != null) {
          try {
            data.content = validateContent(data.content)
          } catch (err) {
            if (err instanceof ContentValidationError) throw new APIError(err.message, 400, undefined, true)
            throw err
          }
        }
        return data
      },
    ],
  },
}
