import type { CollectionConfig } from 'payload'
import { canEdit, loggedIn, ownerOrAdmin } from '../lib/access'


/** "Gợi ý của tôi": kiểu (styles + prop hình thức) của một loại block do người dùng lưu để dùng lại */
export const StylePresets: CollectionConfig = {
  slug: 'style-presets',
  labels: { singular: 'Gợi ý kiểu', plural: 'Gợi ý kiểu' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'blockType', 'scope', 'owner', 'updatedAt'], description: 'Kiểu người dùng lưu từ Visual Builder (tab Gợi ý) để dùng lại cho block cùng loại.' },
  access: { read: loggedIn, create: canEdit, update: ownerOrAdmin, delete: ownerOrAdmin },
  fields: [
    { name: 'name', label: 'Tên', type: 'text', required: true, maxLength: 80 },
    { name: 'blockType', label: 'Loại block', type: 'text', required: true, index: true },
    {
      name: 'scope',
      label: 'Phạm vi',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: [
        { label: 'Riêng tôi', value: 'private' },
        { label: 'Dùng chung', value: 'shared' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'owner', label: 'Chủ sở hữu', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
    { name: 'props', label: 'Prop hình thức', type: 'json' },
    { name: 'styles', label: 'Styles', type: 'json', required: true },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (!data) return data
        if (operation === 'create') data.owner = req.user?.id ?? null
        else if ('owner' in data) delete data.owner
        data.blockType = String(data.blockType ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 40)
        if (data.props && typeof data.props === 'object' && !Array.isArray(data.props)) {
          // không lưu nội dung/nguồn dữ liệu, chỉ prop hình thức
          const p = data.props as Record<string, unknown>
          for (const k of ['text', 'href', 'media', 'data', 'show', 'fx', 'items', 'links', 'cssId', 'cssClass', 'hide', 'blockId', 'name', 'condHidden']) delete p[k]
        } else data.props = {}
        return data
      },
    ],
  },
}
