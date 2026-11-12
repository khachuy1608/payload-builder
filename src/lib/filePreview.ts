/**
 * Bản xem trước của file trong thư viện Media cho block "Xem file":
 * - .xlsx  -> các sheet dạng bảng (read-excel-file)
 * - .csv / .tsv -> bảng
 * - .docx  -> HTML đã làm sạch (mammoth + sanitizeContentHtml)
 * - .txt / .md / .json -> văn bản thuần
 * Chỉ đọc file của collection media trên đĩa (theo tên file), không tải URL bên ngoài (tránh SSRF).
 */
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type { Endpoint, Payload } from 'payload'
import { canPreviewOnServer, fileKindOf, parseCsv } from '@/builder/files'
import { sanitizeContentHtml } from '@/builder/sanitize'

export const MAX_PREVIEW_BYTES = 15 * 1024 * 1024
const MAX_ROWS = 1000
const MAX_COLS = 50

export type FilePreview =
  | { kind: 'table'; name: string; sheets: { name: string; rows: string[][]; truncated: boolean }[] }
  | { kind: 'html'; name: string; html: string }
  | { kind: 'text'; name: string; text: string; truncated: boolean }

export class PreviewError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

/** Tên file media từ src: /api/media/file/<tên> (có thể kèm origin của site) */
export function mediaFilenameFromSrc(src: string): string | null {
  let p = src.trim()
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname
  } catch {
    return null
  }
  const m = /^\/api\/media\/file\/([^/?#]+)$/.exec(p.split(/[?#]/)[0])
  if (!m) return null
  let name: string
  try {
    name = decodeURIComponent(m[1])
  } catch {
    return null
  }
  return /^[^/\\\0]+$/.test(name) && name !== '.' && name !== '..' ? name : null
}

function cellText(v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toLocaleDateString('vi-VN', { timeZone: 'UTC' })
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return String(v).slice(0, 2000)
}

/** Bỏ các cột trống ở cuối (sheet Excel hay có vùng định dạng thừa) */
function trimRows(rows: string[][]): string[][] {
  const width = rows.reduce((w, r) => {
    let last = r.length
    while (last > 0 && r[last - 1] === '') last--
    return Math.max(w, last)
  }, 0)
  return rows.map((r) => r.slice(0, width)).filter((r) => r.some((c) => c !== ''))
}

const cache = new Map<string, FilePreview>()

export interface MediaFileInfo {
  filename: string
  mime: string
  /** Đường dẫn tuyệt đối trên đĩa (đã kiểm tra nằm trong thư mục media) */
  file: string
  size: number
  mtimeMs: number
}

/**
 * Tìm file của thư viện Media từ src (/api/media/file/<tên>): chỉ file có bản ghi trong collection media,
 * nằm trong thư mục media trên đĩa (chặn path traversal), tối đa 15 MB.
 */
export async function resolveMediaFile(payload: Payload, src: string): Promise<MediaFileInfo> {
  const filename = mediaFilenameFromSrc(src)
  if (!filename) throw new PreviewError('Chỉ xem trước được file trong thư viện Media.')
  const found = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })
  const doc = found.docs[0] as { filename?: string; mimeType?: string; updatedAt?: string } | undefined
  if (!doc?.filename) throw new PreviewError('Không tìm thấy file.', 404)
  const media = payload.collections.media?.config.upload
  // turbopackIgnore: đường dẫn chỉ biết lúc chạy – không để bundler đi quét cả dự án khi build
  const dir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), (typeof media === 'object' && media.staticDir) || 'media')
  const file = path.resolve(/*turbopackIgnore: true*/ dir, doc.filename)
  if (!file.startsWith(dir + path.sep)) throw new PreviewError('Đường dẫn không hợp lệ.')
  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) throw new PreviewError('File không còn trên máy chủ.', 404)
  if (info.size > MAX_PREVIEW_BYTES) throw new PreviewError('File quá lớn để xem trước (tối đa 15 MB) – hãy tải xuống.', 413)
  return { filename, mime: doc.mimeType ?? '', file, size: info.size, mtimeMs: info.mtimeMs }
}

export async function previewMediaFile(payload: Payload, src: string): Promise<FilePreview> {
  const { filename, mime, file, size, mtimeMs } = await resolveMediaFile(payload, src)
  if (!canPreviewOnServer(filename, mime)) throw new PreviewError('Loại file này không xem trước dạng bảng/văn bản được – hãy tải xuống.', 415)
  const info = { size, mtimeMs }

  const key = `${filename}|${info.size}|${info.mtimeMs}`
  const hit = cache.get(key)
  if (hit) return hit
  const buf = await readFile(file)
  const kind = fileKindOf(filename, mime)
  let out: FilePreview
  if (kind === 'sheet') {
    const { default: readXlsxFile } = await import('read-excel-file/node')
    const sheets = await readXlsxFile(buf)
    out = {
      kind: 'table',
      name: filename,
      sheets: sheets.slice(0, 20).map((s) => {
        const rows = trimRows(s.data.slice(0, MAX_ROWS).map((r) => r.slice(0, MAX_COLS).map(cellText)))
        return { name: String(s.sheet).slice(0, 80), rows, truncated: s.data.length > MAX_ROWS }
      }),
    }
  } else if (kind === 'csv') {
    const { rows, truncated } = parseCsv(buf.toString('utf8'), MAX_ROWS, MAX_COLS)
    out = { kind: 'table', name: filename, sheets: [{ name: 'Sheet1', rows: trimRows(rows), truncated }] }
  } else if (kind === 'doc') {
    const mammoth = await import('mammoth')
    const convert = (mammoth as unknown as { default?: typeof mammoth }).default ?? mammoth
    const result = await convert.convertToHtml(
      { buffer: buf },
      {
        // ảnh nhúng: giữ ảnh nhỏ (data URI), bỏ ảnh lớn để trang không nặng
        convertImage: convert.images.imgElement(async (image) => {
          const b64 = await image.readAsBase64String()
          return b64.length > 400_000 ? { src: '' } : { src: `data:${image.contentType};base64,${b64}` }
        }),
      },
    )
    out = { kind: 'html', name: filename, html: sanitizeContentHtml(result.value) }
  } else {
    const text = buf.toString('utf8').replace(/^﻿/, '')
    out = { kind: 'text', name: filename, text: text.slice(0, 200_000), truncated: text.length > 200_000 }
  }
  if (cache.size > 50) cache.clear()
  cache.set(key, out)
  return out
}

/** GET /api/builder/file-preview?src=/api/media/file/<tên> – công khai như chính file media */
export const filePreviewEndpoint: Endpoint = {
  path: '/builder/file-preview',
  method: 'get',
  handler: async (req) => {
    const src = req.searchParams.get('src') ?? ''
    try {
      const preview = await previewMediaFile(req.payload, src)
      return Response.json(preview, { headers: { 'Cache-Control': 'public, max-age=300' } })
    } catch (err) {
      const status = err instanceof PreviewError ? err.status : 500
      if (status === 500) req.payload.logger.error({ err, src }, 'file-preview')
      return Response.json({ error: err instanceof PreviewError ? err.message : 'Không đọc được file.' }, { status })
    }
  },
}
