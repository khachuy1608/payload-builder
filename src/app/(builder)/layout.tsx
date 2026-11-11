import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/editor/editor.css'

export const metadata: Metadata = {
  title: 'Visual Builder',
  robots: { index: false, follow: false },
}

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="ed-body">{children}</body>
    </html>
  )
}
