import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { normalizeParams } from '@/builder/data'
import { DEFAULT_LOCALE, localePath, LOCALES, splitLocale } from '@/lib/locale'
import { getPageBySlug } from '@/lib/pages'
import { applyRedirect } from '@/lib/redirects'
import { buildMetadata } from '@/lib/seo'
import { PageView } from '../PageView'

/**
 * Mọi đường dẫn front-end: [/<locale>][/<slug>][/<param>]
 * - /            trang chủ (slug home)      - /en          trang chủ tiếng Anh
 * - /gioi-thieu  trang thường               - /en/gioi-thieu
 * - /bai-viet/<slug bài>  trang mẫu động    - /en/bai-viet/<slug bài>
 * Render động để kiểm tra draft mode mỗi request và không chạm DB lúc build; dữ liệu trang lấy từ cache theo tag (lib/pages.ts).
 */
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function parse(path: string[] | undefined): { locale: string; slug: string; param?: string } | null {
  const { locale, segments } = splitLocale(path ?? [])
  if (segments.length > 2) return null
  const [slug = 'home', param] = segments.map((s) => decodeURIComponent(s))
  return { locale, slug, param }
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const parsed = parse((await params).path)
  if (!parsed) return { title: 'Không tìm thấy' }
  const page = await getPageBySlug(parsed.slug, parsed.param, {}, parsed.locale)
  if (!page) return { title: parsed.slug === 'home' ? 'Trang chủ' : 'Không tìm thấy' }
  const path = localePath(parsed.locale, parsed.slug, parsed.param)
  const languages = LOCALES.map((l) => ({ code: l.code, path: localePath(l.code, parsed.slug, parsed.param) }))
  return buildMetadata({ site: page.site, seo: page.seo, title: page.title, path, record: page.record, draft: page.draft, locale: parsed.locale, languages })
}

export default async function FrontPage({ params, searchParams }: Args) {
  const parsed = parse((await params).path)
  if (!parsed) notFound()
  const page = await getPageBySlug(parsed.slug, parsed.param, normalizeParams(await searchParams), parsed.locale)
  const path = localePath(parsed.locale, parsed.slug, parsed.param)
  if (!page) {
    if (parsed.slug === 'home' && parsed.locale === DEFAULT_LOCALE) {
      return (
        <main style={{ padding: 48, fontFamily: 'system-ui' }}>
          <h1>Chưa có trang chủ</h1>
          <p>
            Vào <a href="/admin/collections/pages">trang quản trị</a>, tạo một trang có slug <code>home</code> rồi xuất bản.
          </p>
        </main>
      )
    }
    await applyRedirect(path)
    notFound()
  }
  return <PageView page={page} path={path} />
}
