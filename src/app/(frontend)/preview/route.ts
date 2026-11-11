import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { isLocale, localePath } from '@/lib/locale'
import { slugify } from '@/lib/slug'

/** Bật draft mode (chỉ khi đã đăng nhập admin) rồi chuyển tới trang cần xem */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = slugify(url.searchParams.get('slug') ?? '')
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return new Response('Bạn cần đăng nhập trang quản trị để xem bản nháp.', { status: 401 })
  }
  ;(await draftMode()).enable()
  const locale = url.searchParams.get('locale')
  redirect(localePath(isLocale(locale) ? locale : 'vi', slug || 'home'))
}
