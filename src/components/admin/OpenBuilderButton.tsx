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
      <a href={isBlock ? `/builder/block/${id}` : `/builder/${id}`} className="pb-open-builder">
        ✦ Mở Visual Builder
      </a>
    </div>
  )
}
