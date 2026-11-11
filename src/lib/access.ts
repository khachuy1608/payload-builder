import type { Access, FieldAccess } from 'payload'

/**
 * Vai trò người dùng (users.role):
 * - admin: toàn quyền (quản lý người dùng, Cài đặt site, mọi block/theme của người khác)
 * - editor: dựng trang, block, theme, media, redirects
 * - viewer: chỉ xem trong builder và bình luận
 */
export type Role = 'admin' | 'editor' | 'viewer'

export const roleOf = (user: { role?: string | null } | null | undefined): Role => (user?.role === 'admin' ? 'admin' : user?.role === 'viewer' ? 'viewer' : 'editor')

export const loggedIn: Access = ({ req: { user } }) => Boolean(user)
export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin'
/** admin hoặc editor */
export const canEdit: Access = ({ req: { user } }) => !!user && roleOf(user) !== 'viewer'
export const isAdminField: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin'

/** Chủ sở hữu (hoặc doc không có chủ) được sửa; admin sửa tất cả; viewer không sửa */
export const ownerOrAdmin: Access = ({ req: { user } }) => {
  if (!user || roleOf(user) === 'viewer') return false
  if (roleOf(user) === 'admin') return true
  return { or: [{ owner: { equals: user.id } }, { owner: { exists: false } }] }
}
