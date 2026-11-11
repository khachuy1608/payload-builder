import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { normalizeParams } from '@/builder/data'
import { getPageBySlug } from '@/lib/pages'
import { applyRedirect } from '@/lib/redirects'
import { buildMetadata } from '@/lib/seo'
import { PageView } from '../PageView'

// Render động để kiểm tra draft mode mỗi request và không chạm DB lúc build; dữ liệu trang lấy từ cache theo tag (lib/pages.ts)
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return { title: 'Không tìm thấy' }
  return buildMetadata({ site: page.site, seo: page.seo, title: page.title, path: `/${slug}`, draft: page.draft })
}

export default async function Page({ params, searchParams }: Args) {
  const { slug } = await params
  const page = await getPageBySlug(slug, undefined, normalizeParams(await searchParams))
  if (!page) {
    await applyRedirect(`/${slug}`)
    notFound()
  }
  return <PageView page={page} path={`/${slug}`} />
}
