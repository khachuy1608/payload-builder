import { PageRenderer } from '@/builder/Renderer'
import type { LoadedPage } from '@/lib/pages'
import config from '@payload-config'
import { getPayload } from 'payload'
import { resolveRefs } from '@/builder/refs'
import { loadDataForTree } from '@/lib/data'
import { getAuthUser, getCurrentUser } from '@/lib/user'
import { LangSetter } from './LangSetter'
import { buildJsonLd } from '@/lib/seo'
import { getPageBySlug } from '@/lib/pages'

/**
 * Render một trang đã nạp: bảo trì (khách), JSON-LD, người dùng chỉ khi trang cần.
 * Dùng chung cho /, /[slug], /[slug]/[param] và trang 404.
 */
export async function PageView({ page, path }: { page: LoadedPage; path: string }) {
  const user = page.needsUser || page.site.maintenance ? await getCurrentUser() : null
  if (page.site.maintenance && !user && page.slug !== 'maintenance') {
    const maint = await getPageBySlug('maintenance', undefined, {}, page.locale).catch(() => null)
    if (maint) return <PageRenderer content={maint.content} blocks={(id) => maint.blocks[id]} theme={maint.theme} data={maint.data} params={{}} />
    return (
      <main style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-body)' }}>
        <h1>Đang bảo trì</h1>
        <p>{page.site.maintenanceMessage}</p>
      </main>
    )
  }
  const jsonLd = buildJsonLd({ site: page.site, title: page.title, description: page.seo.metaDescription ?? undefined, path, isHome: page.slug === 'home' })
  // nguồn “chỉ của tôi”: nạp riêng theo người đăng nhập (không cache), gộp với dữ liệu chung
  let data = page.data
  if (page.hasOwned) {
    const payload = await getPayload({ config })
    const auth = await getAuthUser()
    const owned = await loadDataForTree(payload, resolveRefs(page.content.root, (id) => page.blocks[id]), page.params, { onlyOwned: true, user: auth })
    data = { ...page.data, ...owned }
  }
  return (
    <>
      <PageRenderer content={page.content} blocks={(id) => page.blocks[id]} theme={page.theme} data={data} params={page.params} user={user} locale={page.locale} path={path} />
      <LangSetter lang={page.locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  )
}
