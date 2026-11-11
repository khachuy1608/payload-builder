import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'
import { type DataRecord, projectRecord } from '../builder/data'

/**
 * Người đang đăng nhập (cookie payload-token) đã lọc theo `custom.builder.expose` của collection users,
 * để dùng cho {{user.*}} và điều kiện "chỉ đã đăng nhập". Không bao giờ chứa email/hash.
 */
export const getCurrentUser = cache(async (): Promise<DataRecord | null> => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() }).catch(() => ({ user: null }))
  if (!user) return null
  const expose = (payload.collections.users?.config.custom as { builder?: { expose?: string[] } } | undefined)?.builder?.expose ?? ['name']
  const full = await payload.findByID({ collection: 'users', id: user.id, depth: 1, overrideAccess: true }).catch(() => null)
  return projectRecord((full ?? user) as unknown as Record<string, unknown>, expose)
})
