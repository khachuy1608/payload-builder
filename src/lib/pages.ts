import config from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'
import { normalizeContent } from '../builder/validate'
import { loadBlocksForContent } from './blocks'
import { loadThemeForPage } from './themes'

/**
 * Lấy trang theo slug cho front-end.
 * - Bình thường: chỉ trang đã xuất bản.
 * - Draft mode (bật qua /preview khi đã đăng nhập): lấy bản nháp mới nhất.
 */
export const getPageBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode()
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
  // cây gốc của các My Block liên kết mà trang dùng (kể cả lồng nhau)
  const [blocks, theme] = await Promise.all([loadBlocksForContent(payload, content), loadThemeForPage(payload, doc.theme)])
  return { title: doc.title, slug: doc.slug, content, blocks, theme: theme.tokens, draft }
})
