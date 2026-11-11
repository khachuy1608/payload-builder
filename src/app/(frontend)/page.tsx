import type { Metadata } from 'next'
import { PageRenderer } from '@/builder/Renderer'
import { getPageBySlug } from '@/lib/pages'

// Render động để kiểm tra draft mode mỗi request và không chạm DB lúc build; dữ liệu trang lấy từ cache theo tag (lib/pages.ts)
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home')
  return { title: page?.title ?? 'Trang chủ' }
}

export default async function HomePage() {
  const page = await getPageBySlug('home')
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
  return <PageRenderer content={page.content} blocks={(id) => page.blocks[id]} theme={page.theme} data={page.data} />
}
