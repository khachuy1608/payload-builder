import { PageRenderer } from '@/builder/Renderer'
import { getPageBySlug } from '@/lib/pages'

/** Trang 404: nếu có trang slug "404" dựng bằng builder thì dùng, không thì mẫu đơn giản */
export default async function NotFound() {
  const page = await getPageBySlug('404').catch(() => null)
  if (page) return <PageRenderer content={page.content} blocks={(id) => page.blocks[id]} theme={page.theme} data={page.data} params={page.params} />
  return (
    <main style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
      <p>Không tìm thấy trang.</p>
      <a href="/">Về trang chủ</a>
    </main>
  )
}
