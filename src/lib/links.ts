import type { Endpoint, Payload, Where } from 'payload'
import { isStaffUser } from './access'
import { DEFAULT_LOCALE, isLocale, localePath, type LocaleCode } from './locale'

/**
 * Gợi ý liên kết nội bộ cho bộ chọn liên kết trong builder:
 * - Trang (pages) thường: /slug (trang chủ: /), theo ngôn ngữ đang sửa (/en/...)
 * - Bản ghi của mọi collection có "trang mẫu động" (bài viết, sự kiện, sản phẩm, đội ngũ…): /<slug trang mẫu>/<trường khớp>
 */
export interface LinkItem {
  label: string
  href: string
  /** Thông tin phụ: slug, trạng thái nháp… */
  sub?: string
}
export interface LinkGroup {
  key: string
  label: string
  items: LinkItem[]
}

type Doc = Record<string, unknown>

export async function searchLinks(payload: Payload, q: string, locale: LocaleCode = DEFAULT_LOCALE, perGroup = 8): Promise<LinkGroup[]> {
  const query = q.trim().slice(0, 80)
  const find = payload.find as unknown as (args: Record<string, unknown>) => Promise<{ docs: Doc[] }>
  const pages = await find({ collection: 'pages', limit: 200, depth: 0, pagination: false, overrideAccess: true, draft: true, locale, fallbackLocale: DEFAULT_LOCALE, sort: 'title' })
  const groups: LinkGroup[] = []
  // trang thường
  const normal = pages.docs.filter((p) => !p.templateCollection && !['404', 'maintenance'].includes(String(p.slug)))
  const match = (s: unknown) => !query || String(s ?? '').toLowerCase().includes(query.toLowerCase())
  const pageItems = normal
    .filter((p) => match(p.title) || match(p.slug))
    .sort((a, b) => (a.slug === 'home' ? -1 : b.slug === 'home' ? 1 : 0))
    .slice(0, query ? perGroup : 50)
    .map((p) => ({ label: String(p.title || p.slug), href: localePath(locale, String(p.slug)), sub: `${p.slug === 'home' ? 'Trang chủ' : '/' + p.slug}${p._status === 'draft' ? ' · nháp' : ''}` }))
  if (pageItems.length) groups.push({ key: 'pages', label: 'Trang', items: pageItems })

  // bản ghi có trang mẫu động
  const templates = pages.docs.filter((p) => p.templateCollection)
  const seen = new Set<string>()
  for (const tpl of templates) {
    const slug = String(tpl.templateCollection)
    if (seen.has(slug)) continue
    seen.add(slug)
    const col = payload.config.collections.find((c) => c.slug === slug)
    if (!col) continue
    const field = String(tpl.templateField || 'id')
    const titleField = typeof col.admin?.useAsTitle === 'string' ? col.admin.useAsTitle : 'id'
    const and: Where[] = []
    if (query && titleField !== 'id') and.push({ [titleField]: { like: query } })
    if (col.fields.some((f) => 'name' in f && f.name === 'published')) and.push({ published: { equals: true } })
    const res = await find({ collection: slug, where: and.length ? { and } : undefined, limit: perGroup, depth: 0, overrideAccess: true, locale, fallbackLocale: DEFAULT_LOCALE, sort: titleField === 'id' ? '-createdAt' : titleField }).catch(() => ({ docs: [] as Doc[] }))
    const items = res.docs
      .filter((d) => d[field] != null && d[field] !== '')
      .map((d) => ({ label: String(d[titleField] ?? d.id), href: localePath(locale, String(tpl.slug), String(d[field])), sub: `/${tpl.slug}/${String(d[field])}` }))
    if (items.length) {
      const label = (col.custom as { builder?: { label?: string } } | undefined)?.builder?.label ?? (typeof col.labels?.plural === 'string' ? col.labels.plural : slug)
      groups.push({ key: slug, label, items })
    }
  }
  return groups
}

/** GET /api/builder/links?q=&locale= – chỉ nhân sự CMS */
export const linksEndpoint: Endpoint = {
  path: '/builder/links',
  method: 'get',
  handler: async (req) => {
    if (!isStaffUser(req.user)) return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    const locale = req.searchParams.get('locale')
    const groups = await searchLinks(req.payload, req.searchParams.get('q') ?? '', isLocale(locale) ? locale : DEFAULT_LOCALE)
    return Response.json({ groups })
  },
}
