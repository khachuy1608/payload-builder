import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { vi } from '@payloadcms/translations/languages/vi'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Comments } from './collections/Comments'
import { CONTENT_COLLECTIONS } from './collections/content'
import { Bookings, Customers } from './collections/Customers'
import { FormSubmissions } from './collections/FormSubmissions'
import { FormUploads } from './collections/FormUploads'
import { Media } from './collections/Media'
import { MyBlocks } from './collections/MyBlocks'
import { Pages } from './collections/Pages'
import { Redirects } from './collections/Redirects'
import { StylePresets } from './collections/StylePresets'
import { Themes } from './collections/Themes'
import { SiteSettings } from './globals/SiteSettings'
import { Users } from './collections/Users'
import { isStaffUser } from './lib/access'
import { DEFAULT_LOCALE, LOCALES } from './lib/locale'
import { getSources } from './lib/data'
import { formExportEndpoint } from './lib/formExport'
import { linksEndpoint } from './lib/links'
import { filePreviewEndpoint } from './lib/filePreview'
import { filePdfEndpoint } from './lib/officeConvert'
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
    // trang đăng nhập & thương hiệu admin (logo/tên lấy từ Cài đặt site) – giao diện ở app/(payload)/custom.css
    components: {
      graphics: { Logo: '/components/admin/Brand#BrandLogo', Icon: '/components/admin/Brand#BrandIcon' },
      beforeLogin: ['/components/admin/LoginAside#LoginAside'],
      afterLogin: ['/components/admin/LoginAside#LoginFooter'],
      // menu admin: thương hiệu + lối tắt ở đầu, thẻ người dùng ở cuối
      beforeNavLinks: ['/components/admin/Nav#NavHeader'],
      afterNavLinks: ['/components/admin/Nav#NavUser'],
      // theme toàn admin: font (provider) + lời chào/số liệu ở Tổng quan; CSS ở app/(payload)/admin-theme.css
      providers: ['/components/admin/Fonts#AdminFonts'],
      beforeDashboard: ['/components/admin/Dashboard#DashboardWelcome'],
    },
  },
  // admin tiếng Việt (vẫn chọn được tiếng Anh trong Tài khoản)
  i18n: { supportedLanguages: { vi, en }, fallbackLanguage: 'vi' },
  // thứ tự = thứ tự nhóm trên menu admin: Website → Nội dung → Khách hàng & Form → Hệ thống
  collections: [Pages, MyBlocks, Media, Themes, StylePresets, Redirects, Comments, ...CONTENT_COLLECTIONS, Customers, Bookings, FormSubmissions, FormUploads, Users],
  editor: lexicalEditor(),
  // Đa ngôn ngữ: trường localized có bản riêng cho từng ngôn ngữ, thiếu thì fallback về mặc định
  localization: { locales: LOCALES.map((l) => ({ code: l.code, label: l.label })), defaultLocale: DEFAULT_LOCALE, fallback: true },
  // Email: SMTP qua biến môi trường (quên mật khẩu, thông báo form); không cấu hình thì ghi ra console
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'no-reply@example.com',
        defaultFromName: process.env.SMTP_FROM_NAME || 'Page Builder',
        transportOptions: { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined },
      })
    : undefined,
  endpoints: [
    ...scheduleEndpoints,
    ...presenceEndpoints,
    formExportEndpoint,
    linksEndpoint,
    filePreviewEndpoint,
    filePdfEndpoint,
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
        if (!isStaffUser(req.user)) return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
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
