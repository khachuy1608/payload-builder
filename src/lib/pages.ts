import config from '@payload-config'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { cache } from 'react'
import { bindString, type DataMap, FIELD_PATTERN } from '../builder/data'
import { resolveRefs } from '../builder/refs'
import type { ThemeTokens } from '../builder/theme'
import type { BuilderNode, PageContent } from '../builder/types'
import { normalizeContent } from '../builder/validate'
import { loadBlocksForContent } from './blocks'
import { loadDataForTree } from './data'
import { PAGES_TAG } from './revalidate'
import { loadThemeForPage } from './themes'

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
  draft: boolean
}

/**
 * @param param đoạn cuối URL của trang mẫu động (/slug/param). Root được gắn nguồn "một bản ghi" khớp param;
 *   không có bản ghi -> null (404).
 */
async function fetchPage(slug: string, draft: boolean, param?: string): Promise<LoadedPage | null> {
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
  const [blocks, theme] = await Promise.all([loadBlocksForContent(payload, content), loadThemeForPage(payload, doc.theme)])
  // nguồn dữ liệu có thể nằm trong My Block liên kết -> thu thập trên cây đã triển khai
  const data = await loadDataForTree(payload, resolveRefs(content.root, (id) => blocks.get(id)))
  const record = data.root?.[0]
  if (param !== undefined && !record) return null
  const title = record ? bindString(doc.title, record) : doc.title.replace(/\{\{[^}]*\}\}/g, '').trim()
  return { title, slug: doc.slug, template, content, blocks: Object.fromEntries(blocks), theme: theme.tokens, data, draft }
}

/**
 * Trang đã xuất bản được cache theo tag `pages`; hook afterChange của Pages / My Blocks / Themes / Site Settings
 * gọi revalidateTag nên cache chỉ mới lại khi có thay đổi (xem lib/revalidate.ts).
 */
const getPublishedPage = unstable_cache((slug: string, param?: string) => fetchPage(slug, false, param), ['published-page'], { tags: [PAGES_TAG] })

/**
 * Lấy trang theo slug cho front-end.
 * - Bình thường: trang đã xuất bản, từ cache.
 * - Draft mode (bật qua /preview khi đã đăng nhập): luôn đọc bản nháp mới nhất, không cache.
 */
export const getPageBySlug = cache(async (slug: string, param?: string): Promise<LoadedPage | null> => {
  const { isEnabled: draft } = await draftMode()
  return draft ? fetchPage(slug, true, param) : getPublishedPage(slug, param)
})
