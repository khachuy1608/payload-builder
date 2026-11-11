import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { isStaffUser } from '@/lib/access'
import { isLocale, localePath } from '@/lib/locale'
import { slugify } from '@/lib/slug'

/** Bật draft mode (chỉ nhân sự CMS) rồi chuyển tới /preview/<đường dẫn> – vùng xem thử render động, tách khỏi trang công khai (ISR) */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = slugify(url.searchParams.get('slug') ?? '')
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !isStaffUser(user)) {
    return new Response('Bạn cần đăng nhập trang quản trị để xem bản nháp.', { status: 401 })
  }
  ;(await draftMode()).enable()
  const locale = url.searchParams.get('locale')
  const path = localePath(isLocale(locale) ? locale : 'vi', slug || 'home')
  redirect(`/preview${path === '/' ? '' : path}`)
}
