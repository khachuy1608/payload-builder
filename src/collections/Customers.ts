import type { CollectionConfig } from 'payload'
import { roleOf } from '../lib/access'

const siteUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/**
 * Khách hàng / thành viên của website (tách khỏi `users` là người quản trị CMS).
 * Đăng ký, đăng nhập, quên mật khẩu qua REST của Payload; front-end có sẵn block Đăng ký / Quên mật khẩu / Tài khoản.
 * Dữ liệu "của riêng tôi": collection khác khai báo `custom.builder.ownerField` trỏ tới customers (xem Bookings).
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Khách hàng', plural: 'Khách hàng' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'phone', 'createdAt'], group: 'Khách hàng & Form' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
    forgotPassword: {
      generateEmailSubject: () => 'Đặt lại mật khẩu',
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const user = args?.user as { name?: string } | undefined
        return `<p>Xin chào ${user?.name || ''},</p><p>Bấm vào liên kết sau để đặt lại mật khẩu (hết hạn sau 1 giờ):</p><p><a href="${siteUrl()}/dat-lai-mat-khau?token=${token}">${siteUrl()}/dat-lai-mat-khau?token=${token}</a></p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`
      },
    },
  },
  custom: { builder: { label: 'Khách hàng', expose: ['name', 'phone', 'avatar'] } },
  access: {
    // ai cũng đăng ký được; mỗi người chỉ đọc/sửa chính mình; admin CMS toàn quyền
    create: () => true,
    read: ({ req: { user } }) => (!user ? false : user.collection === 'users' ? true : { id: { equals: user.id } }),
    update: ({ req: { user } }) => (!user ? false : user.collection === 'users' ? roleOf(user) !== 'viewer' : { id: { equals: user.id } }),
    delete: ({ req: { user } }) => !!user && user.collection === 'users' && roleOf(user) === 'admin',
    admin: () => false,
  },
  fields: [
    { name: 'name', label: 'Họ tên', type: 'text', required: true },
    { name: 'phone', label: 'Điện thoại', type: 'text' },
    { name: 'avatar', label: 'Ảnh đại diện', type: 'upload', relationTo: 'media' },
    { name: 'note', label: 'Ghi chú nội bộ', type: 'textarea', access: { read: ({ req: { user } }) => user?.collection === 'users', update: ({ req: { user } }) => user?.collection === 'users' } },
  ],
}

/** Ví dụ dữ liệu thuộc về khách hàng: đặt chỗ sự kiện. Khách tạo (form), chỉ thấy của mình; nguồn dữ liệu bật “Chỉ của tôi”. */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Đặt chỗ', plural: 'Đặt chỗ' },
  admin: { useAsTitle: 'id', defaultColumns: ['customer', 'event', 'seats', 'status', 'createdAt'], group: 'Khách hàng & Form' },
  custom: { builder: { label: 'Đặt chỗ (của tôi)', expose: ['event', 'seats', 'status', 'note', 'createdAt'], ownerField: 'customer' } },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => (!user ? false : user.collection === 'users' ? true : { customer: { equals: user.id } }),
    update: ({ req: { user } }) => (!user ? false : user.collection === 'users' ? roleOf(user) !== 'viewer' : { customer: { equals: user.id } }),
    delete: ({ req: { user } }) => (!user ? false : user.collection === 'users' ? roleOf(user) !== 'viewer' : { customer: { equals: user.id } }),
  },
  fields: [
    { name: 'customer', label: 'Khách hàng', type: 'relationship', relationTo: 'customers', required: true, index: true, admin: { readOnly: true } },
    { name: 'event', label: 'Sự kiện', type: 'relationship', relationTo: 'events', required: true },
    { name: 'seats', label: 'Số chỗ', type: 'number', min: 1, defaultValue: 1, required: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Chờ xác nhận', value: 'pending' },
        { label: 'Đã xác nhận', value: 'confirmed' },
        { label: 'Đã huỷ', value: 'cancelled' },
      ],
    },
    { name: 'note', label: 'Ghi chú', type: 'textarea' },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (!data) return data
        // khách hàng tự tạo: chủ sở hữu luôn là chính họ; CMS tạo hộ thì chọn trong admin
        if (req.user?.collection === 'customers') {
          if (operation === 'create') data.customer = req.user.id
          else delete data.customer
          if ('status' in data && operation === 'update') delete data.status
        }
        return data
      },
    ],
  },
}
