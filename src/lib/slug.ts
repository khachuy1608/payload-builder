/** Chuyển chuỗi (kể cả tiếng Việt có dấu) thành slug URL */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Slug trùng với route hệ thống sẽ làm hỏng điều hướng */
export const RESERVED_SLUGS = ['admin', 'api', 'builder', 'preview', 'media', '_next']
