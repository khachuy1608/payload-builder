import { draftMode } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { normalizeParams } from '@/builder/data'
import { localePath, splitLocale } from '@/lib/locale'
import { getPageBySlug } from '@/lib/pages'
import { PageView } from '../../PageView'

/**
 * Xem thử bản nháp: /preview[/<locale>][/<slug>][/<param>]. Luôn render động, đọc bản nháp mới nhất, không cache.
 * Trang công khai ([[...path]]) tách riêng nên vẫn ISR được.
 */
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function PreviewPage({ params, searchParams }: Args) {
  const { isEnabled } = await draftMode()
  const { path } = await params
  const { locale, segments } = splitLocale(path ?? [])
  if (segments.length > 2) notFound()
  const [slug = 'home', param] = segments.map((s) => decodeURIComponent(s))
  // chưa bật draft mode (mở link trực tiếp): đi qua /preview/enter để kiểm tra đăng nhập
  if (!isEnabled) redirect(`/preview/enter?slug=${encodeURIComponent(slug)}&locale=${locale}`)
  const page = await getPageBySlug(slug, param, normalizeParams(await searchParams), locale, true)
  if (!page) notFound()
  const livePath = localePath(locale, slug, param)
  return (
    <>
      <PageView page={page} path={livePath} />
      <div className="bld-draft-bar">
        Đang xem bản nháp · <a href={livePath}>Bản công khai</a> · <a href="/preview/exit">Thoát</a>
      </div>
    </>
  )
}
