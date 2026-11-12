import type { GlobalConfig } from 'payload'
import { isAdmin, loggedIn } from '../lib/access'
import { revalidatePages } from '../lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Cài đặt site',
  admin: { group: 'Hệ thống' },
  access: { read: loggedIn, update: isAdmin },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePages()
        return doc
      },
    ],
  },
  fields: [
    { name: 'siteName', label: 'Tên site', type: 'text', localized: true, admin: { description: 'Dùng cho <title>, Open Graph và JSON-LD.' } },
    { name: 'siteDescription', label: 'Mô tả site', type: 'textarea', localized: true },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    { name: 'favicon', label: 'Favicon (PNG/SVG)', type: 'upload', relationTo: 'media' },
    { name: 'defaultOgImage', label: 'Ảnh chia sẻ mặc định (Open Graph)', type: 'upload', relationTo: 'media' },
    { name: 'maintenance', label: 'Chế độ bảo trì', type: 'checkbox', defaultValue: false, admin: { description: 'Khách thấy trang "maintenance" (nếu có) hoặc thông báo; người đã đăng nhập vẫn xem bình thường.' } },
    { name: 'maintenanceMessage', label: 'Thông báo bảo trì', type: 'textarea', localized: true, defaultValue: 'Trang web đang được bảo trì, vui lòng quay lại sau.' },
    { name: 'notifyEmail', label: 'Email nhận thông báo bài gửi form', type: 'email' },
    {
      name: 'header',
      label: 'Header toàn site',
      type: 'relationship',
      relationTo: 'my-blocks',
      admin: { description: 'My Block được chèn tự động vào đầu mọi trang (trang có thể tắt trong Cài đặt trang → Bố cục).' },
    },
    {
      name: 'footer',
      label: 'Footer toàn site',
      type: 'relationship',
      relationTo: 'my-blocks',
      admin: { description: 'My Block được chèn tự động vào cuối mọi trang.' },
    },
    {
      name: 'theme',
      label: 'Theme đang dùng',
      type: 'relationship',
      relationTo: 'themes',
      admin: { description: 'Áp dụng cho mọi trang, trừ trang có ghi đè theme riêng.' },
    },
  ],
}
