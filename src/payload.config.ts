import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { FormSubmissions } from './collections/FormSubmissions'
import { Media } from './collections/Media'
import { MyBlocks } from './collections/MyBlocks'
import { Pages } from './collections/Pages'
import { StylePresets } from './collections/StylePresets'
import { Themes } from './collections/Themes'
import { SiteSettings } from './globals/SiteSettings'
import { Users } from './collections/Users'
import { getSources } from './lib/data'
import { migrations } from './migrations'
import { seed } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' – Page Builder' },
  },
  collections: [Pages, MyBlocks, Themes, StylePresets, FormSubmissions, Media, Users],
  endpoints: [
    {
      // Danh sách nguồn dữ liệu + trường công khai cho bộ chọn ⚡ của Visual Builder (cần đăng nhập)
      path: '/builder/sources',
      method: 'get',
      handler: (req) => {
        if (!req.user) return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
        return Response.json({ sources: getSources(req.payload) })
      },
    },
  ],
  globals: [SiteSettings],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    // Môi trường dev tự "push" schema; production chạy migration khi khởi động
    prodMigrations: migrations,
  }),
  sharp,
  onInit: seed,
})
