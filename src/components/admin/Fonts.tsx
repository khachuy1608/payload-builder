'use client'
/**
 * Provider admin: nạp font Be Vietnam Pro (hỗ trợ tiếng Việt đầy đủ) cho toàn bộ admin.
 * React 19 tự đưa <link precedence> lên <head>; mất mạng thì dùng font hệ thống (xem --font-body trong admin-theme.css).
 */
import type { ReactNode } from 'react'

const HREF = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap'

export function AdminFonts({ children }: { children?: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={HREF} precedence="pb-admin-font" />
      {children}
    </>
  )
}
