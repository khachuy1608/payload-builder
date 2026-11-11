import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isStaffUser, loggedIn, roleOf } from '../lib/access'
import { revalidatePages } from '../lib/revalidate'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Người dùng', plural: 'Người dùng' },
  auth: true,
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'] },
  access: {
    read: loggedIn,
    create: isAdmin,
    delete: isAdmin,
    // admin sửa mọi người; người khác chỉ sửa hồ sơ của mình (không đổi được role – xem field access)
    update: ({ req: { user } }) => (!isStaffUser(user) ? false : roleOf(user) === 'admin' ? true : { id: { equals: user!.id } }),
  },
  /**
   * Nguồn dữ liệu cho Visual Builder: chỉ các trường trong `expose` được đưa ra trang công khai
   * (email, mật khẩu… không bao giờ lộ). Collection khác muốn dùng làm nguồn chỉ cần khai báo tương tự.
   */
  custom: { builder: { label: 'Người dùng', expose: ['name', 'title', 'bio', 'avatar'] } },
  fields: [
    {
      name: 'role',
      label: 'Vai trò',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin – toàn quyền', value: 'admin' },
        { label: 'Editor – dựng trang, block, theme', value: 'editor' },
        { label: 'Viewer – chỉ xem và bình luận', value: 'viewer' },
      ],
      access: { update: isAdminField, create: isAdminField },
      admin: { position: 'sidebar' },
    },
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
