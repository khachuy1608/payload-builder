import type { Access, FieldAccess } from 'payload'

/**
 * Vai trò người dùng (users.role):
 * - admin: toàn quyền (quản lý người dùng, Cài đặt site, mọi block/theme của người khác)
 * - editor: dựng trang, block, theme, media, redirects
 * - viewer: chỉ xem trong builder và bình luận
 */
export type Role = 'admin' | 'editor' | 'viewer'

type AnyUser = { role?: string | null; collection?: string | null } | null | undefined

/** Nhân sự CMS (collection users) – khách hàng (customers) không bao giờ là nhân sự */
export const isStaffUser = (user: AnyUser): boolean => !!user && (user.collection == null || user.collection === 'users')

/** Vai trò: khách hàng đăng nhập ở front-end luôn là viewer đối với CMS */
export const roleOf = (user: AnyUser): Role => (!isStaffUser(user) && user ? 'viewer' : user?.role === 'admin' ? 'admin' : user?.role === 'viewer' ? 'viewer' : 'editor')

/** Đã đăng nhập với tư cách nhân sự CMS (users) */
export const loggedIn: Access = ({ req: { user } }) => isStaffUser(user)
export const isAdmin: Access = ({ req: { user } }) => isStaffUser(user) && roleOf(user) === 'admin'
/** admin hoặc editor */
export const canEdit: Access = ({ req: { user } }) => isStaffUser(user) && roleOf(user) !== 'viewer'
export const isAdminField: FieldAccess = ({ req: { user } }) => isStaffUser(user) && roleOf(user) === 'admin'

/** Chủ sở hữu (hoặc doc không có chủ) được sửa; admin sửa tất cả; viewer không sửa */
export const ownerOrAdmin: Access = ({ req: { user } }) => {
  if (!isStaffUser(user) || roleOf(user) === 'viewer') return false
  if (roleOf(user) === 'admin') return true
  return { or: [{ owner: { equals: user!.id } }, { owner: { exists: false } }] }
}
