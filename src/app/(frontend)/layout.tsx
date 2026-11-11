import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import type { ReactNode } from 'react'
import { BASE_CSS } from '@/builder/theme'

export const metadata: Metadata = {
  title: { default: 'Page Builder', template: '%s – Page Builder' },
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const { isEnabled: draft } = await draftMode()
  return (
    <html lang="vi">
      <head>
        {/* token màu/font của theme do PageRenderer phát theo từng trang */}
        <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
      </head>
      <body>
        {draft && (
          <div
            style={{
              position: 'fixed',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: '#111827',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,.25)',
            }}
          >
            Đang xem bản nháp
            <a href="/preview/exit" style={{ color: '#a5b4fc' }}>
              Thoát
            </a>
          </div>
        )}
        {children}
      </body>
    </html>
  )
}
