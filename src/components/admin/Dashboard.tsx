/**
 * beforeDashboard: lời chào + số liệu nhanh + lối tắt ở trang Tổng quan admin.
 * Số liệu đếm theo quyền của người đang đăng nhập (không đọc được thì ẩn ô đó).
 */
import type { CollectionSlug, Payload, TypedUser, Where } from 'payload'

type Props = { payload?: Payload; user?: TypedUser | null }

type Stat = { label: string; href: string; slug: CollectionSlug; where?: Where; hint?: string }

async function count(payload: Payload, user: TypedUser | null | undefined, slug: CollectionSlug, where?: Where): Promise<number | null> {
  try {
    const r = await payload.count({ collection: slug, where, user: user ?? undefined, overrideAccess: false })
    return r.totalDocs
  } catch {
    return null
  }
}

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))
  return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
}

export async function DashboardWelcome({ payload, user }: Props) {
  if (!payload) return null
  const admin = payload.config.routes.admin
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
  const stats: Stat[] = [
    { label: 'Trang', href: `${admin}/collections/pages`, slug: 'pages' as CollectionSlug },
    { label: 'Bài viết', href: `${admin}/collections/posts`, slug: 'posts' as CollectionSlug },
    { label: 'Bài gửi form', href: `${admin}/collections/form-submissions`, slug: 'form-submissions' as CollectionSlug, where: { createdAt: { greater_than: weekAgo } }, hint: '7 ngày qua' },
    { label: 'Media', href: `${admin}/collections/media`, slug: 'media' as CollectionSlug },
  ]
  const values = await Promise.all(stats.map((s) => count(payload, user, s.slug, s.where)))
  const u = user as { name?: string | null; email?: string | null; role?: string | null } | null | undefined
  const name = u?.name?.trim() || u?.email?.replace(/@.*/, '') || ''
  return (
    <section className="pb-dash">
      <div className="pb-dash__hero">
        <div>
          <p className="pb-dash__eyebrow">{greeting()}</p>
          <h1 className="pb-dash__title">{name ? `Xin chào, ${name} 👋` : 'Xin chào 👋'}</h1>
          <p className="pb-dash__lead">Quản lý trang, nội dung và dữ liệu khách hàng của website tại đây.</p>
        </div>
        <div className="pb-dash__actions">
          {u?.role !== 'viewer' && (
            <a className="pb-dash__btn pb-dash__btn--primary" href={`${admin}/collections/pages/create`}>
              + Thêm trang
            </a>
          )}
          <a className="pb-dash__btn" href="/" target="_blank" rel="noopener noreferrer">
            Xem trang web ↗
          </a>
        </div>
      </div>
      <ul className="pb-dash__stats">
        {stats.map((s, i) =>
          values[i] == null ? null : (
            <li key={s.slug}>
              <a className="pb-dash__stat" href={s.href} id={`stat-${s.slug}`}>
                <span className="pb-dash__stat-ico" aria-hidden="true" />
                <span className="pb-dash__stat-body">
                  <span className="pb-dash__stat-value">{values[i]!.toLocaleString('vi-VN')}</span>
                  <span className="pb-dash__stat-label">
                    {s.label}
                    {s.hint ? <em> · {s.hint}</em> : null}
                  </span>
                </span>
              </a>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
