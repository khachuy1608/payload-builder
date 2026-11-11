'use client'

import { useDocumentInfo } from '@payloadcms/ui'

/** Nút trong sidebar khi sửa một Trang ở admin: mở Visual Builder */
export function OpenBuilderButton() {
  const { id } = useDocumentInfo()

  if (!id) {
    return (
      <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)', margin: '0 0 24px' }}>
        Lưu trang lần đầu để mở Visual Builder.
      </p>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <a
        href={`/builder/${id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 6,
          background: '#4f46e5',
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        ✦ Mở Visual Builder
      </a>
    </div>
  )
}
