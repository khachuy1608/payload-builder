import config from '@payload-config'
import { getPayload } from 'payload'
import { permanentRedirect, redirect } from 'next/navigation'

/** Tìm chuyển hướng cho đường dẫn; nếu có thì redirect ngay (không trả về) */
export async function applyRedirect(path: string): Promise<void> {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'redirects', where: { from: { equals: path } }, limit: 1, depth: 0, overrideAccess: true }).catch(() => null)
  const doc = res?.docs[0]
  if (!doc?.to) return
  const to = String(doc.to)
  if (doc.permanent !== false) permanentRedirect(to)
  redirect(to)
}
