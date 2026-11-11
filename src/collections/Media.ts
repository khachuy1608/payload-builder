import type { CollectionConfig } from 'payload'
import { revalidatePages } from '../lib/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media' },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
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
