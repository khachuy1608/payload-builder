import config from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/** sitemap.xml: mọi trang đã xuất bản (trừ noindex); trang mẫu động nở ra theo từng bản ghi */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  const payload = await getPayload({ config })
  const pages = await payload.find({ collection: 'pages', where: { _status: { equals: 'published' } }, limit: 1000, depth: 0, pagination: false, overrideAccess: true })
  const out: MetadataRoute.Sitemap = []
  for (const p of pages.docs) {
    if ((p.seo as { noIndex?: boolean } | null)?.noIndex || ['404', 'maintenance'].includes(p.slug)) continue
    const path = p.slug === 'home' ? '' : `/${p.slug}`
    if (p.templateCollection) {
      const field = String(p.templateField || 'id')
      const find = payload.find as unknown as (args: Record<string, unknown>) => Promise<{ docs: Record<string, unknown>[] }>
      const recs = await find({ collection: p.templateCollection, limit: 5000, depth: 0, pagination: false, overrideAccess: true }).catch(() => ({ docs: [] }))
      for (const r of recs.docs) {
        const v = r[field]
        if (v == null || v === '') continue
        out.push({ url: `${base}${path}/${encodeURIComponent(String(v))}`, lastModified: String(r.updatedAt ?? p.updatedAt), changeFrequency: 'weekly', priority: 0.6 })
      }
      continue
    }
    out.push({ url: `${base}${path || '/'}`, lastModified: p.updatedAt, changeFrequency: p.slug === 'home' ? 'daily' : 'weekly', priority: p.slug === 'home' ? 1 : 0.7 })
  }
  return out
}
