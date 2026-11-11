import config from '@payload-config'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { cache } from 'react'
import { bindString, type DataMap, FIELD_PATTERN, type UrlParams } from '../builder/data'
import { resolveRefs } from '../builder/refs'
import type { ThemeTokens } from '../builder/theme'
import type { BuilderNode, PageContent } from '../builder/types'
import { normalizeContent } from '../builder/validate'
import { loadBlocksForContent } from './blocks'
import { loadDataForTree } from './data'
import { pageLayoutFrom, sitePartsFrom, withSiteParts } from '../builder/siteParts'
import { PAGES_TAG } from './revalidate'
import { loadThemeForPage } from './themes'
import { type PageSeo, pageSeoFrom, type SiteInfo, siteInfoFrom } from './seo'

export interface LoadedPage {
  title: string
  slug: string
  /** Trang mẫu động: collection + trường khớp URL */
  template?: { collection: string; field: string }
  content: PageContent
  /** Cây gốc của các My Block liên kết mà trang dùng (object thuần để cache được) */
  blocks: Record<string, BuilderNode>
  theme: ThemeTokens
  /** Bản ghi đã nạp cho các node có nguồn dữ liệu (kể cả trong My Block liên kết) */
  data: DataMap
  params: UrlParams
  draft: boolean
  seo: PageSeo
  site: SiteInfo & { maintenance: boolean; maintenanceMessage: string }
  /** Bản ghi hiện tại của trang mẫu động (để bind meta) */
  record: DataMap[string]['records'][number] | null
  /** Trang có dùng {{user}} hay điều kiện đăng nhập -> cần render theo người dùng */
  needsUser: boolean
}

/** Cài đặt site (cache theo tag pages, làm mới khi đổi) */
export async function getSiteSettings() {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: true }).catch(() => null)
}

/**
 * @param param đoạn cuối URL của trang mẫu động (/slug/param). Root được gắn nguồn "một bản ghi" khớp param;
 *   không có bản ghi -> null (404).
 */
async function fetchPage(slug: string, draft: boolean, param?: string, params: UrlParams = {}): Promise<LoadedPage | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: draft,
    where: draft
      ? { slug: { equals: slug } }
      : { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
  })
  const doc = result.docs[0]
  if (!doc) return null
  const content = normalizeContent(doc.content)
  const template = doc.templateCollection ? { collection: String(doc.templateCollection), field: FIELD_PATTERN.test(String(doc.templateField ?? '')) ? String(doc.templateField) : 'id' } : undefined
  if (param !== undefined && !template) return null
  if (template) {
    // root bind vào bản ghi khớp URL (hoặc bản ghi xem thử đã lưu khi mở /slug không có param)
    const saved = (content.root.props.data ?? {}) as Record<string, unknown>
    content.root.props.data = param !== undefined ? { collection: template.collection, mode: 'one', byField: template.field, byValue: param } : { ...saved, collection: template.collection, mode: 'one' }
  }
  const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: true }).catch(() => null)) as Record<string, unknown> | null
  // header/footer toàn site chèn vào cây trước khi nạp block và dữ liệu
  content.root = withSiteParts(content.root, sitePartsFrom(settings), pageLayoutFrom(doc as unknown as Record<string, unknown>))
  const [blocks, theme] = await Promise.all([loadBlocksForContent(payload, content), loadThemeForPage(payload, doc.theme)])
  // nguồn dữ liệu có thể nằm trong My Block liên kết -> thu thập trên cây đã triển khai
  const data = await loadDataForTree(payload, resolveRefs(content.root, (id) => blocks.get(id)), params)
  const record = data.root?.records[0]
  if (param !== undefined && !record) return null
  const title = record ? bindString(doc.title, record) : doc.title.replace(/\{\{[^}]*\}\}/g, '').trim()
  const json = JSON.stringify(content)
  const needsUser = json.includes('{{user') || json.includes('"auth":"user"') || json.includes('"auth":"guest"') || json.includes('"field":"user.')
  return {
    title,
    slug: doc.slug,
    template,
    content,
    blocks: Object.fromEntries(blocks),
    theme: theme.tokens,
    data,
    params,
    draft,
    seo: pageSeoFrom(doc.seo as Record<string, unknown> | null),
    site: { ...siteInfoFrom(settings), maintenance: !!settings?.maintenance, maintenanceMessage: String(settings?.maintenanceMessage ?? 'Trang web đang được bảo trì.') },
    record: record ?? null,
    needsUser,
  }
}

/**
 * Trang đã xuất bản được cache theo tag `pages`; hook afterChange của Pages / My Blocks / Themes / Site Settings
 * gọi revalidateTag nên cache chỉ mới lại khi có thay đổi (xem lib/revalidate.ts).
 */
// revalidate 60s làm lưới an toàn cho thay đổi xảy ra ngoài ngữ cảnh request (job lên lịch xuất bản, CLI import) – khi đó revalidateTag không chạy được
const getPublishedPage = unstable_cache((slug: string, param: string | undefined, paramsKey: string) => fetchPage(slug, false, param, JSON.parse(paramsKey)), ['published-page'], { tags: [PAGES_TAG], revalidate: 60 })

/**
 * Lấy trang theo slug cho front-end.
 * - Bình thường: trang đã xuất bản, từ cache.
 * - Draft mode (bật qua /preview khi đã đăng nhập): luôn đọc bản nháp mới nhất, không cache.
 */
export const getPageBySlug = cache(async (slug: string, param?: string, params: UrlParams = {}): Promise<LoadedPage | null> => {
  const { isEnabled: draft } = await draftMode()
  // tham số URL là một phần của khoá cache (sắp xếp khoá để ổn định)
  const key = JSON.stringify(Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))))
  return draft ? fetchPage(slug, true, param, params) : getPublishedPage(slug, param, key)
})
