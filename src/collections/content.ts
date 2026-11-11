/**
 * Các collection nội dung mẫu để repo là nền cho mọi website: bài viết, danh mục, sản phẩm, sự kiện,
 * FAQ, cảm nhận khách hàng, đội ngũ. Mỗi collection khai báo `custom.builder` để Visual Builder dùng làm nguồn dữ liệu
 * (expose = trường công khai; search = trường tìm kiếm toàn site). Xoá/thêm collection chỉ cần sửa file này + payload.config.
 */
import type { CollectionConfig, Field, FieldHook } from 'payload'
import { canEdit, isStaffUser } from '../lib/access'
import { revalidatePages } from '../lib/revalidate'
import { slugify } from '../lib/slug'

const slugFrom =
  (source: string): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    if (typeof data?.[source] === 'string') return slugify(data[source])
    return value
  }

const slugField = (source: string): Field => ({
  name: 'slug',
  label: 'Đường dẫn (slug)',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'Để trống sẽ tự tạo từ tiêu đề.' },
  hooks: { beforeValidate: [slugFrom(source)] },
})

const publishedField: Field = { name: 'published', label: 'Hiển thị công khai', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } }

/** Khách chỉ đọc bản ghi đã bật hiển thị; người đăng nhập đọc tất cả */
const readPublished: CollectionConfig['access'] = {
  read: ({ req: { user } }) => (isStaffUser(user) ? true : { published: { equals: true } }),
  create: canEdit,
  update: canEdit,
  delete: canEdit,
}

const hooks: CollectionConfig['hooks'] = {
  afterChange: [
    ({ doc }) => {
      revalidatePages()
      return doc
    },
  ],
  afterDelete: [
    ({ doc }) => {
      revalidatePages()
      return doc
    },
  ],
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Danh mục', plural: 'Danh mục' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug'], group: 'Nội dung' },
  access: { read: () => true, create: canEdit, update: canEdit, delete: canEdit },
  custom: { builder: { label: 'Danh mục', expose: ['name', 'slug', 'description'] } },
  hooks,
  fields: [{ name: 'name', label: 'Tên', type: 'text', required: true, localized: true }, slugField('name'), { name: 'description', label: 'Mô tả', type: 'textarea', localized: true }],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Bài viết', plural: 'Bài viết' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'author', 'publishedAt', 'published'], group: 'Nội dung' },
  access: readPublished,
  custom: {
    builder: {
      label: 'Bài viết',
      expose: ['title', 'slug', 'excerpt', 'cover', 'content', 'category', 'author', 'publishedAt', 'tags', 'readingMinutes'],
      search: { title: 'title', excerpt: 'excerpt', image: 'cover', fields: ['title', 'excerpt'] },
    },
  },
  hooks,
  fields: [
    { name: 'title', label: 'Tiêu đề', type: 'text', required: true, localized: true },
    slugField('title'),
    publishedField,
    { name: 'publishedAt', label: 'Ngày đăng', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } }, defaultValue: () => new Date().toISOString() },
    { name: 'excerpt', label: 'Tóm tắt', type: 'textarea', maxLength: 400, localized: true },
    { name: 'cover', label: 'Ảnh bìa', type: 'upload', relationTo: 'media' },
    { name: 'category', label: 'Danh mục', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    { name: 'author', label: 'Tác giả', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    { name: 'tags', label: 'Thẻ', type: 'array', fields: [{ name: 'tag', type: 'text', required: true }], admin: { position: 'sidebar' } },
    { name: 'readingMinutes', label: 'Phút đọc', type: 'number', min: 1, admin: { position: 'sidebar' } },
    { name: 'content', label: 'Nội dung', type: 'richText', localized: true },
  ],
}

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Sản phẩm', plural: 'Sản phẩm' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'price', 'category', 'inStock', 'published'], group: 'Nội dung' },
  access: readPublished,
  custom: {
    builder: {
      label: 'Sản phẩm',
      expose: ['name', 'slug', 'price', 'salePrice', 'summary', 'description', 'images', 'category', 'inStock', 'sku', 'featured'],
      search: { title: 'name', excerpt: 'summary', image: 'images.0.image', fields: ['name', 'summary', 'sku'] },
    },
  },
  hooks,
  fields: [
    { name: 'name', label: 'Tên sản phẩm', type: 'text', required: true, localized: true },
    slugField('name'),
    publishedField,
    { name: 'sku', label: 'Mã (SKU)', type: 'text', admin: { position: 'sidebar' } },
    { name: 'price', label: 'Giá', type: 'number', required: true, min: 0 },
    { name: 'salePrice', label: 'Giá khuyến mãi', type: 'number', min: 0 },
    { name: 'inStock', label: 'Còn hàng', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'featured', label: 'Nổi bật', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'category', label: 'Danh mục', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    { name: 'summary', label: 'Mô tả ngắn', type: 'textarea', maxLength: 300, localized: true },
    { name: 'images', label: 'Ảnh', type: 'array', fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }] },
    { name: 'description', label: 'Mô tả chi tiết', type: 'richText', localized: true },
  ],
}

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Sự kiện', plural: 'Sự kiện' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'startAt', 'location', 'published'], group: 'Nội dung' },
  access: readPublished,
  custom: {
    builder: { label: 'Sự kiện', expose: ['title', 'slug', 'startAt', 'endAt', 'location', 'summary', 'description', 'cover', 'capacity', 'price'], search: { title: 'title', excerpt: 'summary', image: 'cover', fields: ['title', 'summary', 'location'] } },
  },
  hooks,
  fields: [
    { name: 'title', label: 'Tên sự kiện', type: 'text', required: true, localized: true },
    slugField('title'),
    publishedField,
    { name: 'startAt', label: 'Bắt đầu', type: 'date', required: true, admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'endAt', label: 'Kết thúc', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'location', label: 'Địa điểm', type: 'text' },
    { name: 'capacity', label: 'Sức chứa', type: 'number', min: 0, admin: { position: 'sidebar' } },
    { name: 'price', label: 'Giá vé (0 = miễn phí)', type: 'number', min: 0, defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'summary', label: 'Tóm tắt', type: 'textarea', maxLength: 300, localized: true },
    { name: 'cover', label: 'Ảnh bìa', type: 'upload', relationTo: 'media' },
    { name: 'description', label: 'Chi tiết', type: 'richText', localized: true },
  ],
}

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Câu hỏi thường gặp', plural: 'Câu hỏi thường gặp' },
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'order', 'published'], group: 'Nội dung' },
  access: readPublished,
  custom: { builder: { label: 'FAQ', expose: ['question', 'answer', 'order', 'category'], search: { title: 'question', fields: ['question'] } } },
  hooks,
  fields: [
    { name: 'question', label: 'Câu hỏi', type: 'text', required: true, localized: true },
    publishedField,
    { name: 'order', label: 'Thứ tự', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'category', label: 'Danh mục', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    { name: 'answer', label: 'Trả lời', type: 'richText', localized: true },
  ],
}

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Cảm nhận', plural: 'Cảm nhận khách hàng' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'company', 'rating', 'published'], group: 'Nội dung' },
  access: readPublished,
  custom: { builder: { label: 'Cảm nhận', expose: ['name', 'role', 'company', 'quote', 'avatar', 'rating'] } },
  hooks,
  fields: [
    { name: 'name', label: 'Tên', type: 'text', required: true, localized: true },
    publishedField,
    { name: 'role', label: 'Chức danh', type: 'text', localized: true },
    { name: 'company', label: 'Công ty', type: 'text' },
    { name: 'quote', label: 'Cảm nhận', type: 'textarea', required: true, localized: true },
    { name: 'avatar', label: 'Ảnh', type: 'upload', relationTo: 'media' },
    { name: 'rating', label: 'Số sao (1–5)', type: 'number', min: 1, max: 5, defaultValue: 5, admin: { position: 'sidebar' } },
  ],
}

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  labels: { singular: 'Thành viên', plural: 'Đội ngũ' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'order', 'published'], group: 'Nội dung' },
  access: readPublished,
  custom: { builder: { label: 'Đội ngũ', expose: ['name', 'slug', 'role', 'bio', 'photo', 'order', 'email', 'links'], search: { title: 'name', excerpt: 'role', image: 'photo', fields: ['name', 'role'] } } },
  hooks,
  fields: [
    { name: 'name', label: 'Họ tên', type: 'text', required: true },
    slugField('name'),
    publishedField,
    { name: 'role', label: 'Chức danh', type: 'text', localized: true },
    { name: 'order', label: 'Thứ tự', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'email', label: 'Email liên hệ (công khai)', type: 'email' },
    { name: 'bio', label: 'Giới thiệu', type: 'textarea', localized: true },
    { name: 'photo', label: 'Ảnh', type: 'upload', relationTo: 'media' },
    {
      name: 'links',
      label: 'Liên kết',
      type: 'array',
      fields: [
        { name: 'label', label: 'Nhãn', type: 'text', required: true },
        { name: 'url', label: 'URL', type: 'text', required: true },
      ],
    },
  ],
}

export const CONTENT_COLLECTIONS = [Categories, Posts, Products, Events, Faqs, Testimonials, TeamMembers]
