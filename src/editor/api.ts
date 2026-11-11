'use client'

import type { PageContent } from '@/builder/types'
import type { MediaValue } from '@/builder/types'
import { useEditor } from './store'

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    const first = body?.errors?.[0]
    const fieldMsg = first?.data?.errors?.map((e: { message: string }) => e.message).join(', ')
    return fieldMsg || first?.message || body?.message || `Lỗi ${res.status}`
  } catch {
    return `Lỗi ${res.status}`
  }
}

/** Lưu trang qua REST API của Payload. publish=false: tạo bản nháp, không ảnh hưởng bản đã xuất bản */
export async function savePage(publish: boolean): Promise<boolean> {
  const s = useEditor.getState()
  if (s.saving) return false
  s.setSaving(true)
  const content: PageContent = { version: 1, root: s.root }
  try {
    const res = await fetch(`/api/pages/${s.pageId}?depth=0${publish ? '' : '&draft=true'}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: s.title,
        slug: s.slug,
        content,
        _status: publish ? 'published' : 'draft',
      }),
    })
    if (!res.ok) throw new Error(await readError(res))
    const { doc } = await res.json()
    if (doc?.slug && doc.slug !== s.slug) useEditor.getState().setMeta({ slug: doc.slug })
    useEditor.getState().markSaved(publish ? 'published' : 'draft')
    useEditor.getState().toast('success', publish ? 'Đã xuất bản.' : 'Đã lưu bản nháp.')
    return true
  } catch (err) {
    useEditor.getState().setSaving(false)
    useEditor.getState().toast('error', `Lưu thất bại: ${(err as Error).message}`)
    return false
  }
}

export interface MediaDoc {
  id: string | number
  url: string
  alt?: string
  filename?: string
  width?: number
  height?: number
  mimeType?: string
}

export function toMediaValue(doc: MediaDoc): MediaValue {
  return { id: doc.id, url: doc.url, alt: doc.alt ?? '', width: doc.width, height: doc.height, mimeType: doc.mimeType }
}

export async function listMedia(page = 1): Promise<{ docs: MediaDoc[]; hasNextPage: boolean }> {
  const res = await fetch(`/api/media?limit=40&page=${page}&sort=-createdAt&depth=0`, { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function uploadMedia(file: File, alt: string): Promise<MediaDoc> {
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt }))
  const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body: form })
  if (!res.ok) throw new Error(await readError(res))
  const { doc } = await res.json()
  return doc
}
