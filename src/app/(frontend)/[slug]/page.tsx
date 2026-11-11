import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageRenderer } from '@/builder/Renderer'
import { normalizeParams } from '@/builder/data'
import { getPageBySlug } from '@/lib/pages'

// Render động để kiểm tra draft mode mỗi request và không chạm DB lúc build; dữ liệu trang lấy từ cache theo tag (lib/pages.ts)
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  return { title: page?.title ?? 'Không tìm thấy' }
}

export default async function Page({ params, searchParams }: Args) {
  const { slug } = await params
  const page = await getPageBySlug(slug, undefined, normalizeParams(await searchParams))
  if (!page) notFound()
  return <PageRenderer content={page.content} blocks={(id) => page.blocks[id]} theme={page.theme} data={page.data} params={page.params} />
}
