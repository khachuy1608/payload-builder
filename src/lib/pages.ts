import config from '@payload-config'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { DataMap } from '../builder/data'
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
  content: PageContent
  /** Cây gốc của các My Block liên kết mà trang dùng (object thuần để cache được) */
  blocks: Record<string, BuilderNode>
  theme: ThemeTokens
  /** Bản ghi đã nạp cho các node có nguồn dữ liệu (kể cả trong My Block liên kết) */
  data: DataMap
  draft: boolean
}

async function fetchPage(slug: string, draft: boolean): Promise<LoadedPage | null> {
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
  const [blocks, theme] = await Promise.all([loadBlocksForContent(payload, content), loadThemeForPage(payload, doc.theme)])
  // nguồn dữ liệu có thể nằm trong My Block liên kết -> thu thập trên cây đã triển khai
  const data = await loadDataForTree(payload, resolveRefs(content.root, (id) => blocks.get(id)))
  return { title: doc.title, slug: doc.slug, content, blocks: Object.fromEntries(blocks), theme: theme.tokens, data, draft }
}

/**
 * Trang đã xuất bản được cache theo tag `pages`; hook afterChange của Pages / My Blocks / Themes / Site Settings
 * gọi revalidateTag nên cache chỉ mới lại khi có thay đổi (xem lib/revalidate.ts).
 */
const getPublishedPage = unstable_cache((slug: string) => fetchPage(slug, false), ['published-page'], { tags: [PAGES_TAG] })

/**
 * Lấy trang theo slug cho front-end.
 * - Bình thường: trang đã xuất bản, từ cache.
 * - Draft mode (bật qua /preview khi đã đăng nhập): luôn đọc bản nháp mới nhất, không cache.
 */
export const getPageBySlug = cache(async (slug: string): Promise<LoadedPage | null> => {
  const { isEnabled: draft } = await draftMode()
  return draft ? fetchPage(slug, true) : getPublishedPage(slug)
})
