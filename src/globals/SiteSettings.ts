import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Cài đặt site',
  access: { read: ({ req: { user } }) => Boolean(user), update: ({ req: { user } }) => Boolean(user) },
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
