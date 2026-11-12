/**
 * Thương hiệu trong admin Payload (trang đăng nhập, quên mật khẩu, thanh điều hướng):
 * logo và tên lấy từ Cài đặt site; chưa có logo thì dùng biểu tượng mặc định.
 */
import type { Payload } from 'payload'

type Props = { payload?: Payload }

export async function siteBrand(payload?: Payload): Promise<{ name: string; logo: string | null }> {
  try {
    const s = (await payload?.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: true })) as { siteName?: string | null; logo?: { url?: string | null } | null } | undefined
    return { name: s?.siteName?.trim() || 'Page Builder', logo: s?.logo && typeof s.logo === 'object' ? (s.logo.url ?? null) : null }
  } catch {
    return { name: 'Page Builder', logo: null }
  }
}

/** Biểu tượng mặc định: các khối xếp chồng (dựng trang bằng block); nền gradient bằng CSS để không trùng id SVG */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <span className="pb-mark" style={{ width: size, height: size, borderRadius: size * 0.28 }} aria-hidden="true">
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 22 22">
        <rect x="0" y="0" width="10" height="10" rx="2.5" fill="#fff" />
        <rect x="12" y="0" width="10" height="10" rx="2.5" fill="#fff" opacity=".6" />
        <rect x="0" y="12" width="22" height="10" rx="2.5" fill="#fff" opacity=".85" />
      </svg>
    </span>
  )
}

/** graphics.Logo – hiện trên trang đăng nhập / quên mật khẩu / tạo người dùng đầu tiên */
export async function BrandLogo({ payload }: Props) {
  const { name, logo } = await siteBrand(payload)
  return (
    <span className="pb-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" className="pb-brand__img" /> : <BrandMark />}
      <span className="pb-brand__name">{name}</span>
    </span>
  )
}

/** graphics.Icon – biểu tượng nhỏ ở thanh điều hướng admin */
export function BrandIcon() {
  return <BrandMark size={28} />
}
