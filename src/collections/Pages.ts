import type { Access, CollectionConfig, FieldHook } from 'payload'
import { APIError } from 'payload'
import { ContentValidationError, validateContent } from '../builder/validate'
import { canEdit } from '../lib/access'
import { revalidatePages } from '../lib/revalidate'
import { RESERVED_SLUGS, slugify } from '../lib/slug'

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
    create: canEdit,
    update: canEdit,
    delete: canEdit,
  },
  versions: {
    drafts: { schedulePublish: true },
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
      name: 'seo',
      label: 'SEO',
      type: 'group',
      fields: [
        { name: 'metaTitle', label: 'Tiêu đề (meta title)', type: 'text', maxLength: 120, admin: { description: 'Để trống dùng tiêu đề trang. Trang mẫu động nhận {{trường}}.' } },
        { name: 'metaDescription', label: 'Mô tả (meta description)', type: 'textarea', maxLength: 320 },
        { name: 'ogImage', label: 'Ảnh chia sẻ (Open Graph)', type: 'upload', relationTo: 'media' },
        { name: 'noIndex', label: 'Không cho máy tìm kiếm lập chỉ mục (noindex)', type: 'checkbox', defaultValue: false },
        { name: 'canonical', label: 'Canonical URL', type: 'text' },
      ],
    },
    {
      name: 'versionNote',
      label: 'Ghi chú phiên bản',
      type: 'text',
      maxLength: 200,
      admin: { position: 'sidebar', description: 'Lưu cùng mỗi lần Lưu nháp / Xuất bản để nhận ra phiên bản trong Lịch sử.' },
    },
    {
      name: 'layout',
      label: 'Bố cục',
      type: 'group',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'hideHeader', label: 'Ẩn header toàn site', type: 'checkbox', defaultValue: false },
        { name: 'hideFooter', label: 'Ẩn footer toàn site', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'templateCollection',
      label: 'Trang mẫu động cho collection',
      type: 'text',
      admin: { position: 'sidebar', description: 'Ví dụ "users": trang phục vụ /<slug>/<giá trị>, toàn bộ nội dung bind vào bản ghi khớp.' },
    },
    {
      name: 'templateField',
      label: 'Trường khớp với URL',
      type: 'text',
      defaultValue: 'id',
      admin: { position: 'sidebar', description: 'Trường của collection dùng để tìm bản ghi theo đoạn cuối URL (mặc định id).' },
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
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // xuất bản, bỏ xuất bản hay đổi slug: làm mới cache trang công khai
        if (doc?._status === 'published' || previousDoc?._status === 'published') {
          revalidatePages(doc?.slug)
          if (previousDoc?.slug && previousDoc.slug !== doc?.slug) revalidatePages(previousDoc.slug)
        }
        // đổi slug của trang đã xuất bản: tự tạo redirect 301 từ đường dẫn cũ
        if (previousDoc?.slug && doc?.slug && previousDoc.slug !== doc.slug && previousDoc._status === 'published') {
          const from = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`
          const to = doc.slug === 'home' ? '/' : `/${doc.slug}`
          try {
            const existing = await req.payload.find({ collection: 'redirects', where: { from: { equals: from } }, limit: 1, depth: 0 })
            if (!existing.totalDocs) await req.payload.create({ collection: 'redirects', data: { from, to, permanent: true, note: 'Tự tạo khi đổi slug' } })
          } catch (err) {
            req.payload.logger.warn({ err }, 'Không tạo được redirect khi đổi slug')
          }
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidatePages(doc?.slug)
        return doc
      },
    ],
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
