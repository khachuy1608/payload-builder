import { BASE_CSS, BASE_CSS_HASH } from '@/builder/theme'

/** CSS nền dùng chung cho mọi trang (block, hiệu ứng) – file ngoài để trình duyệt cache; đổi nội dung thì đổi ?v= */
export const dynamic = 'force-static'

export function GET() {
  return new Response(BASE_CSS, {
    headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable', ETag: `"${BASE_CSS_HASH}"` },
  })
}
