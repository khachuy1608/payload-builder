'use client'
/** Lối tắt đầu menu admin; đánh dấu mục đang mở theo đường dẫn hiện tại */
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  plus: 'M12 5v14M5 12h14',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export function NavShortcuts({ adminRoute, canCreate }: { adminRoute: string; canCreate: boolean }) {
  const pathname = usePathname()
  const home = pathname === adminRoute || pathname === `${adminRoute}/`
  const create = `${adminRoute}/collections/pages/create`
  return (
    <div className="pb-nav-shortcuts">
      <Link href={adminRoute} className={`pb-nav-shortcut${home ? ' is-active' : ''}`} aria-current={home ? 'page' : undefined} prefetch={false}>
        <Icon d={ICONS.home} />
        <span>Tổng quan</span>
      </Link>
      {canCreate && (
        <Link href={create} className={`pb-nav-shortcut${pathname === create ? ' is-active' : ''}`} prefetch={false}>
          <Icon d={ICONS.plus} />
          <span>Thêm trang</span>
        </Link>
      )}
      <a href="/" target="_blank" rel="noopener noreferrer" className="pb-nav-shortcut">
        <Icon d={ICONS.external} />
        <span>Xem trang web</span>
      </a>
    </div>
  )
}
