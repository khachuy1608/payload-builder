'use client'

import { useDocumentInfo } from '@payloadcms/ui'

/** Nút trong sidebar khi sửa một Trang hoặc My Block ở admin: mở Visual Builder */
export function OpenBuilderButton() {
  const { id, collectionSlug } = useDocumentInfo()
  const isBlock = collectionSlug === 'my-blocks'

  if (!id) {
    return (
      <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)', margin: '0 0 24px' }}>
        {isBlock ? 'Hãy tạo block từ Visual Builder: chọn phần tử trên trang rồi bấm “Lưu thành My Block”.' : 'Lưu trang lần đầu để mở Visual Builder.'}
      </p>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <a
        href={isBlock ? `/builder/block/${id}` : `/builder/${id}`}
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
