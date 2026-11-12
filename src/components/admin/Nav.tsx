/**
 * Thanh điều hướng admin (sidebar):
 * - NavHeader (beforeNavLinks): thương hiệu + lối tắt (Tổng quan, Thêm trang, Xem trang web)
 * - NavUser (afterNavLinks): thẻ người dùng đang đăng nhập (tên, vai trò) dẫn tới hồ sơ
 * Icon từng mục menu và giao diện: app/(payload)/custom.css (phần "menu admin").
 */
import type { Payload, TypedUser } from 'payload'
import { BrandMark, siteBrand } from './Brand'
import { NavShortcuts } from './NavShortcuts'

type Props = { payload?: Payload; user?: TypedUser | null }

const ROLE_LABEL: Record<string, string> = { admin: 'Quản trị', editor: 'Biên tập', viewer: 'Chỉ xem' }

type NavUserDoc = { id?: string | number; email?: string | null; name?: string | null; role?: string | null; avatar?: { url?: string | null; sizes?: { thumbnail?: { url?: string | null } } } | string | number | null }

export async function NavHeader({ payload, user }: Props) {
  const { name, logo } = await siteBrand(payload)
  const role = (user as NavUserDoc | null | undefined)?.role ?? 'viewer'
  const admin = payload?.config.routes.admin ?? '/admin'
  return (
    <div className="pb-nav-head">
      <a className="pb-nav-brand" href={admin}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo ? <img src={logo} alt="" className="pb-nav-brand__img" /> : <BrandMark size={34} />}
        <span className="pb-nav-brand__text">
          <span className="pb-nav-brand__name">{name}</span>
          <span className="pb-nav-brand__sub">Quản trị nội dung</span>
        </span>
      </a>
      <NavShortcuts adminRoute={admin} canCreate={role !== 'viewer'} />
    </div>
  )
}

function initials(s: string): string {
  const parts = s.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function NavUser({ payload, user }: Props) {
  const u = user as NavUserDoc | null | undefined
  if (!u) return null
  const label = u.name?.trim() || u.email || 'Tài khoản'
  const avatar = u.avatar && typeof u.avatar === 'object' ? (u.avatar.sizes?.thumbnail?.url ?? u.avatar.url ?? null) : null
  const admin = payload?.config.routes.admin ?? '/admin'
  return (
    <a className="pb-nav-user" href={`${admin}/account`} title="Tài khoản của tôi">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {avatar ? <img className="pb-nav-user__avatar" src={avatar} alt="" /> : <span className="pb-nav-user__avatar" aria-hidden="true">{initials(label)}</span>}
      <span className="pb-nav-user__text">
        <span className="pb-nav-user__name">{label}</span>
        <span className="pb-nav-user__role">{ROLE_LABEL[u.role ?? ''] ?? 'Người dùng'}</span>
      </span>
    </a>
  )
}
