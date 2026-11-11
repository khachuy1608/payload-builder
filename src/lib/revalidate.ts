import { revalidatePath, revalidateTag } from 'next/cache'

/** Tag cache cho mọi trang công khai (src/lib/pages.ts) */
export const PAGES_TAG = 'pages'

/**
 * Làm mới cache trang công khai sau khi xuất bản/sửa trang, My Block, theme hay cài đặt site.
 * Ngoài ngữ cảnh request của Next (seed lúc khởi động, CLI) các hàm này ném lỗi – bỏ qua là đủ,
 * vì lúc đó chưa có cache để làm mới.
 */
export function revalidatePages(slug?: string | null) {
  try {
    // expire: 0 = hết hạn ngay (không stale-while-revalidate) để người dùng thấy bản mới ở lần tải kế tiếp
    revalidateTag(PAGES_TAG, { expire: 0 })
    if (slug) revalidatePath(slug === 'home' ? '/' : `/${slug}`)
  } catch {
    /* ngoài ngữ cảnh Next */
  }
}
