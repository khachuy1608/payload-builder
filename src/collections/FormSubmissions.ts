import type { CollectionConfig } from 'payload'
import { canEdit } from '../lib/access'
import { APIError } from 'payload'

/** Giới hạn tần suất gửi form theo IP: tối đa 10 bài / phút (bộ nhớ tiến trình) */
const hits = new Map<string, number[]>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  list.push(now)
  hits.set(ip, list)
  if (hits.size > 5000) hits.clear()
  return list.length > 10
}

/** Xác minh Cloudflare Turnstile khi cấu hình TURNSTILE_SECRET_KEY */
async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (typeof token !== 'string' || !token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    return !!((await res.json()) as { success?: boolean }).success
  } catch {
    return false
  }
}

/**
 * Bài gửi từ block Form trên trang (blocks/Runtime.tsx gửi JSON tới /api/form-submissions).
 * Khách tạo được (đã có honeypot + giới hạn kích thước), chỉ người đăng nhập đọc/xoá.
 */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Bài gửi form', plural: 'Bài gửi form' },
  admin: { useAsTitle: 'form', defaultColumns: ['form', 'page', 'createdAt'], description: 'Dữ liệu người dùng gửi qua block Form trong Visual Builder.' },
  access: {
    create: () => true,
    read: canEdit,
    update: () => false,
    delete: canEdit,
  },
  fields: [
    { name: 'form', label: 'Tên form', type: 'text', required: true, index: true },
    { name: 'page', label: 'Trang gửi', type: 'text' },
    { name: 'data', label: 'Dữ liệu', type: 'json', required: true },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data
        if (operation === 'create' && !req.user) {
          const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
          if (rateLimited(ip)) throw new APIError('Bạn gửi quá nhanh, vui lòng thử lại sau một phút.', 429, undefined, true)
          const src = data.data && typeof data.data === 'object' ? (data.data as Record<string, unknown>) : {}
          if (!(await verifyTurnstile(src['cf-turnstile-response'], ip))) throw new APIError('Xác minh chống spam thất bại.', 400, undefined, true)
          delete src['cf-turnstile-response']
        }
        data.form = String(data.form ?? 'form').slice(0, 80)
        data.page = String(data.page ?? '').slice(0, 300)
        // chỉ nhận object phẳng gồm chuỗi/số/boolean/mảng chuỗi, tối đa 60 trường, mỗi giá trị <= 5000 ký tự
        const src = data.data && typeof data.data === 'object' && !Array.isArray(data.data) ? (data.data as Record<string, unknown>) : {}
        const clean: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(src).slice(0, 60)) {
          const key = k.replace(/[^\w.-]/g, '').slice(0, 60)
          if (!key) continue
          if (typeof v === 'string') clean[key] = v.slice(0, 5000)
          else if (typeof v === 'number' || typeof v === 'boolean') clean[key] = v
          else if (Array.isArray(v)) clean[key] = v.filter((x) => typeof x === 'string').map((x) => x.slice(0, 500)).slice(0, 50)
        }
        data.data = clean
        return data
      },
    ],
  },
}
