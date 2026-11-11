import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageRenderer } from '@/builder/Renderer'
import { getPageBySlug } from '@/lib/pages'

// Trang mẫu động: /<slug trang>/<giá trị trường khớp> – ví dụ /thanh-vien/12
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string; param: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug, param } = await params
  const page = await getPageBySlug(slug, decodeURIComponent(param))
  return { title: page?.title ?? 'Không tìm thấy' }
}

export default async function TemplatePage({ params }: Args) {
  const { slug, param } = await params
  const page = await getPageBySlug(slug, decodeURIComponent(param))
  if (!page) notFound()
  return <PageRenderer content={page.content} blocks={(id) => page.blocks[id]} theme={page.theme} data={page.data} />
}
