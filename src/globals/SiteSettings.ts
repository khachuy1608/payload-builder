import type { GlobalConfig } from 'payload'
import { revalidatePages } from '../lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Cài đặt site',
  access: { read: ({ req: { user } }) => Boolean(user), update: ({ req: { user } }) => Boolean(user) },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePages()
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'theme',
      label: 'Theme đang dùng',
      type: 'relationship',
      relationTo: 'themes',
      admin: { description: 'Áp dụng cho mọi trang, trừ trang có ghi đè theme riêng.' },
    },
  ],
}
