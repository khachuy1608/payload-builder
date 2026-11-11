import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageRenderer } from '@/builder/Renderer'
import { getPageBySlug } from '@/lib/pages'

// Render động để kiểm tra draft mode mỗi request và không chạm DB lúc build; dữ liệu trang lấy từ cache theo tag (lib/pages.ts)
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  return { title: page?.title ?? 'Không tìm thấy' }
}

export default async function Page({ params }: Args) {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) notFound()
  return <PageRenderer content={page.content} blocks={(id) => page.blocks[id]} theme={page.theme} />
}
