import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { BASE_CSS_HASH } from '@/builder/theme'
import { getSiteSettings } from '@/lib/pages'
import { siteInfoFrom } from '@/lib/seo'

/** Tên site trong Cài đặt site làm hậu tố <title> cho mọi trang */
export async function generateMetadata(): Promise<Metadata> {
  const site = siteInfoFrom((await getSiteSettings()) as Record<string, unknown> | null)
  return { title: { default: site.siteName, template: `%s – ${site.siteName}` } }
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* CSS nền cho block/hiệu ứng là file ngoài (cache lâu); token màu/font của theme do PageRenderer phát theo từng trang */}
        <link rel="stylesheet" href={`/builder.css?v=${BASE_CSS_HASH}`} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
