import type { Metadata } from 'next'
import { bindString, type DataRecord } from '../builder/data'

export interface SiteInfo {
  siteName: string
  siteDescription: string
  url: string
  logo?: string | null
  favicon?: string | null
  defaultOgImage?: string | null
}

export interface PageSeo {
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: string | null
  noIndex?: boolean | null
  canonical?: string | null
}

const mediaUrl = (v: unknown): string | null => (v && typeof v === 'object' && typeof (v as { url?: unknown }).url === 'string' ? ((v as { url: string }).url as string) : null)

export function siteInfoFrom(settings: Record<string, unknown> | null | undefined): SiteInfo {
  const url = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  return {
    siteName: String(settings?.siteName ?? '') || 'Page Builder',
    siteDescription: String(settings?.siteDescription ?? ''),
    url,
    logo: mediaUrl(settings?.logo),
    favicon: mediaUrl(settings?.favicon),
    defaultOgImage: mediaUrl(settings?.defaultOgImage),
  }
}

export function pageSeoFrom(seo: Record<string, unknown> | null | undefined): PageSeo {
  return { metaTitle: (seo?.metaTitle as string) ?? null, metaDescription: (seo?.metaDescription as string) ?? null, ogImage: mediaUrl(seo?.ogImage), noIndex: !!seo?.noIndex, canonical: (seo?.canonical as string) ?? null }
}

const abs = (site: SiteInfo, u: string | null | undefined) => (!u ? undefined : /^https?:/.test(u) ? u : site.url + u)

/** Metadata của Next từ SEO trang + cài đặt site; trang mẫu động bind {{trường}} theo bản ghi */
export function buildMetadata(args: { site: SiteInfo; seo: PageSeo; title: string; path: string; record?: DataRecord | null; draft?: boolean; locale?: string; languages?: { code: string; path: string }[] }): Metadata {
  const { site, seo, record } = args
  const bind = (v: string | null | undefined) => (v && record ? bindString(v, record) : v) ?? undefined
  const metaTitle = (bind(seo.metaTitle) ?? '').replace(/\{\{[^}]*\}\}/g, '').trim()
  // Meta title do người dùng nhập là tiêu đề đầy đủ (absolute); không có thì dùng tên trang + hậu tố tên site từ layout
  const title = (metaTitle || args.title || site.siteName).replace(/\{\{[^}]*\}\}/g, '').trim()
  const description = (bind(seo.metaDescription) || site.siteDescription || undefined)?.replace(/\{\{[^}]*\}\}/g, '').trim() || undefined
  const image = abs(site, seo.ogImage || site.defaultOgImage)
  const canonical = abs(site, seo.canonical) ?? site.url + args.path
  return {
    title: metaTitle ? { absolute: metaTitle } : title,
    description,
    alternates: { canonical, ...(args.languages?.length ? { languages: Object.fromEntries(args.languages.map((l) => [l.code, site.url + l.path])) } : {}) },
    robots: seo.noIndex || args.draft ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url: canonical, siteName: site.siteName, type: 'website', ...(args.locale ? { locale: args.locale } : {}), ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, ...(image ? { images: [image] } : {}) },
    icons: site.favicon ? { icon: site.favicon } : undefined,
  }
}

/** JSON-LD: WebSite + Organization (trang chủ) và WebPage */
export function buildJsonLd(args: { site: SiteInfo; title: string; description?: string; path: string; isHome: boolean }): Record<string, unknown>[] {
  const { site } = args
  const out: Record<string, unknown>[] = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: args.title, description: args.description, url: site.url + args.path, isPartOf: { '@type': 'WebSite', name: site.siteName, url: site.url } }]
  if (args.isHome) {
    out.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: site.siteName, url: site.url, description: site.siteDescription || undefined })
    out.push({ '@context': 'https://schema.org', '@type': 'Organization', name: site.siteName, url: site.url, ...(site.logo ? { logo: site.url + site.logo } : {}) })
  }
  return out
}
