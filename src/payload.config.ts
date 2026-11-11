import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Comments } from './collections/Comments'
import { FormSubmissions } from './collections/FormSubmissions'
import { Media } from './collections/Media'
import { MyBlocks } from './collections/MyBlocks'
import { Pages } from './collections/Pages'
import { Redirects } from './collections/Redirects'
import { StylePresets } from './collections/StylePresets'
import { Themes } from './collections/Themes'
import { SiteSettings } from './globals/SiteSettings'
import { Users } from './collections/Users'
import { getSources } from './lib/data'
import { presenceEndpoints } from './lib/presence'
import { scheduleEndpoints } from './lib/schedule'
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
  collections: [Pages, MyBlocks, Themes, StylePresets, Comments, FormSubmissions, Redirects, Media, Users],
  endpoints: [
    ...scheduleEndpoints,
    ...presenceEndpoints,
    {
      // Health check cho load balancer / giám sát: kiểm tra kết nối DB
      path: '/health',
      method: 'get',
      handler: async (req) => {
        try {
          await req.payload.count({ collection: 'pages', overrideAccess: true })
          return Response.json({ ok: true, time: new Date().toISOString() })
        } catch (err) {
          return Response.json({ ok: false, error: String(err) }, { status: 503 })
        }
      },
    },
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
  jobs: {
    tasks: [],
    // chạy job đã tới hạn (lên lịch xuất bản) mỗi phút ngay trong tiến trình Next; tắt bằng PAYLOAD_RUN_JOBS=false (nếu chạy worker riêng)
    autoRun: [{ cron: '* * * * *', queue: 'default', limit: 20 }],
    shouldAutoRun: async () => process.env.PAYLOAD_RUN_JOBS !== 'false',
    deleteJobOnComplete: true,
  },
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
