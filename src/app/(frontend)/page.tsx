import type { Metadata } from 'next'
import { normalizeParams } from '@/builder/data'
import { getPageBySlug } from '@/lib/pages'
import { buildMetadata } from '@/lib/seo'
import { PageView } from './PageView'

// Render động để kiểm tra draft mode mỗi request và không chạm DB lúc build; dữ liệu trang lấy từ cache theo tag (lib/pages.ts)
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home')
  if (!page) return { title: 'Trang chủ' }
  return buildMetadata({ site: page.site, seo: page.seo, title: page.title, path: '/', draft: page.draft })
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const page = await getPageBySlug('home', undefined, normalizeParams(await searchParams))
  if (!page) {
    return (
      <main style={{ padding: 48, fontFamily: 'system-ui' }}>
        <h1>Chưa có trang chủ</h1>
        <p>
          Vào <a href="/admin/collections/pages">trang quản trị</a>, tạo một trang có slug <code>home</code> rồi xuất bản.
        </p>
      </main>
    )
  }
  return <PageView page={page} path="/" />
}
