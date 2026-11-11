import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Người dùng', plural: 'Người dùng' },
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [{ name: 'name', label: 'Họ tên', type: 'text' }],
}
