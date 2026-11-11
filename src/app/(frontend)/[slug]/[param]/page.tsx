import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { normalizeParams } from '@/builder/data'
import { getPageBySlug } from '@/lib/pages'
import { applyRedirect } from '@/lib/redirects'
import { buildMetadata } from '@/lib/seo'
import { PageView } from '../../PageView'

// Trang mẫu động: /<slug trang>/<giá trị trường khớp> – ví dụ /thanh-vien/12
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string; param: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug, param } = await params
  const page = await getPageBySlug(slug, decodeURIComponent(param))
  if (!page) return { title: 'Không tìm thấy' }
  return buildMetadata({ site: page.site, seo: page.seo, title: page.title, path: `/${slug}/${param}`, record: page.record, draft: page.draft })
}

export default async function TemplatePage({ params, searchParams }: Args) {
  const { slug, param } = await params
  const page = await getPageBySlug(slug, decodeURIComponent(param), normalizeParams(await searchParams))
  if (!page) {
    await applyRedirect(`/${slug}/${param}`)
    notFound()
  }
  return <PageView page={page} path={`/${slug}/${param}`} />
}
