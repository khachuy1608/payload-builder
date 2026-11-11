import type { CollectionConfig } from 'payload'
import { revalidatePages } from '../lib/revalidate'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Người dùng', plural: 'Người dùng' },
  auth: true,
  admin: { useAsTitle: 'email' },
  /**
   * Nguồn dữ liệu cho Visual Builder: chỉ các trường trong `expose` được đưa ra trang công khai
   * (email, mật khẩu… không bao giờ lộ). Collection khác muốn dùng làm nguồn chỉ cần khai báo tương tự.
   */
  custom: { builder: { label: 'Người dùng', expose: ['name', 'title', 'bio', 'avatar'] } },
  fields: [
    { name: 'name', label: 'Họ tên', type: 'text' },
    { name: 'title', label: 'Chức danh', type: 'text' },
    { name: 'bio', label: 'Giới thiệu', type: 'textarea' },
    { name: 'avatar', label: 'Ảnh đại diện', type: 'upload', relationTo: 'media' },
  ],
  hooks: {
    // trang nào bind dữ liệu người dùng sẽ được làm mới cache
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
  },
}
