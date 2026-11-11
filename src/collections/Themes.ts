import type { Access, CollectionConfig } from 'payload'
import { BUTTON_TOKEN_LABELS, COLOR_TOKEN_LABELS, FONT_TOKEN_LABELS, RADIUS_TOKEN_LABELS, defaultTheme } from '../builder/theme'
import { revalidatePages } from '../lib/revalidate'

const loggedIn: Access = ({ req: { user } }) => Boolean(user)
/** Preset chỉ đọc: người dùng nhân bản thành My Theme để chỉnh */
const notPreset: Access = ({ req: { user } }) => (user ? { isPreset: { not_equals: true } } : false)

const text = (name: string, label: string, defaultValue: string, description?: string) => ({
  name,
  label,
  type: 'text' as const,
  required: true,
  defaultValue,
  admin: { description },
})

export const Themes: CollectionConfig = {
  slug: 'themes',
  labels: { singular: 'Theme', plural: 'Themes' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isPreset', 'owner', 'updatedAt'],
    description: 'Bộ màu, font, bo góc và kiểu nút cho cả site. Theme preset chỉ đọc – hãy nhân bản trong Visual Builder để chỉnh.',
  },
  access: { read: loggedIn, create: loggedIn, update: notPreset, delete: notPreset },
  fields: [
    { name: 'name', label: 'Tên theme', type: 'text', required: true, maxLength: 80 },
    { name: 'isPreset', label: 'Preset (chỉ đọc)', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', readOnly: true } },
    { name: 'owner', label: 'Chủ sở hữu', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'colors',
      label: 'Màu',
      type: 'group',
      fields: Object.entries(COLOR_TOKEN_LABELS).map(([k, label]) => text(k, label, defaultTheme.colors[k], 'Mã màu CSS, ví dụ #4f46e5')),
    },
    {
      name: 'fonts',
      label: 'Font',
      type: 'group',
      fields: Object.entries(FONT_TOKEN_LABELS).map(([k, label]) => text(k, label, defaultTheme.fonts[k], 'Font stack CSS')),
    },
    {
      name: 'fontUrl',
      label: 'Stylesheet font ngoài (https)',
      type: 'text',
      admin: { description: 'Ví dụ link Google Fonts. Để trống nếu dùng font hệ thống.' },
    },
    {
      name: 'radius',
      label: 'Bo góc',
      type: 'group',
      fields: Object.entries(RADIUS_TOKEN_LABELS).map(([k, label]) => text(k, label, defaultTheme.radius[k])),
    },
    {
      name: 'button',
      label: 'Kiểu nút',
      type: 'group',
      fields: [
        text('radius', BUTTON_TOKEN_LABELS.radius, defaultTheme.button.radius, 'Ví dụ 8px hoặc 999px (tròn)'),
        {
          name: 'weight',
          label: BUTTON_TOKEN_LABELS.weight,
          type: 'select',
          required: true,
          defaultValue: '600',
          options: ['400', '500', '600', '700', '800'].map((v) => ({ label: v, value: v })),
        },
        {
          name: 'transform',
          label: BUTTON_TOKEN_LABELS.transform,
          type: 'select',
          required: true,
          defaultValue: 'none',
          options: [
            { label: 'Bình thường', value: 'none' },
            { label: 'IN HOA', value: 'uppercase' },
            { label: 'Viết Hoa Đầu', value: 'capitalize' },
          ],
        },
      ],
    },
  ],
  hooks: {
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
    beforeChange: [
      ({ data, req, operation }) => {
        if (!data) return data
        // chỉ seed (không có user) mới tạo được preset
        if (req.user) data.isPreset = false
        if (operation === 'create') data.owner = req.user?.id ?? null
        else if ('owner' in data) delete data.owner
        return data
      },
    ],
  },
}
