import type { CollectionConfig } from 'payload'
import { canEdit } from '../lib/access'
import { revalidatePages } from '../lib/revalidate'
import { DOCUMENT_MIME_TYPES } from '../builder/files'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media' },
  admin: { group: 'Website' },
  access: {
    read: () => true,
    create: canEdit,
    update: canEdit,
    delete: canEdit,
  },
  upload: {
    staticDir: 'media',
    // ảnh, video và tài liệu (PDF, Excel, Word, CSV…) cho block Xem file
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', ...DOCUMENT_MIME_TYPES],
    // Ảnh tối ưu: sinh sẵn 3 cỡ WebP, block Image/Card/Avatar dùng srcset
    imageSizes: [
      { name: 'thumbnail', width: 400, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'card', width: 800, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1600, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [{ name: 'alt', label: 'Mô tả ảnh (alt)', type: 'text' }],
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePages()
        return doc
      },
    ],
  },
}
