/**
 * Xem PowerPoint / Excel, Word đời cũ / OpenDocument dưới dạng PDF: chuyển bằng LibreOffice (soffice --headless) nếu máy chủ có.
 * - Không qua shell (spawn với mảng tham số), giới hạn thời gian, mỗi lúc chỉ chuyển 1 file (LibreOffice nặng).
 * - Cache PDF trong thư mục tạm theo tên + cỡ + thời điểm sửa của file gốc; chuyển trùng thì chờ chung.
 * - Không có LibreOffice: endpoint trả 501, block giữ nút tải xuống.
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rename, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { Endpoint } from 'payload'
import { canConvertToPdf } from '@/builder/files'
import { PreviewError, resolveMediaFile } from './filePreview'

const TIMEOUT_MS = 90_000
const SOFFICE = process.env.SOFFICE_PATH || 'soffice'

let available: Promise<boolean> | null = null
/** Máy chủ có LibreOffice không (kiểm tra 1 lần: soffice --version) */
export function hasSoffice(): Promise<boolean> {
  if (process.env.DISABLE_OFFICE_PREVIEW === '1') return Promise.resolve(false)
  return (available ??= new Promise<boolean>((resolve) => {
    try {
      const p = spawn(/*turbopackIgnore: true*/ SOFFICE, ['--version'], { stdio: 'ignore' })
      const t = setTimeout(() => {
        p.kill('SIGKILL')
        resolve(false)
      }, 15_000)
      p.on('error', () => (clearTimeout(t), resolve(false)))
      p.on('exit', (code) => (clearTimeout(t), resolve(code === 0)))
    } catch {
      resolve(false)
    }
  }))
}

// hàng đợi 1 việc: LibreOffice không chạy song song tốt và tốn RAM
let queue: Promise<unknown> = Promise.resolve()
const inflight = new Map<string, Promise<string>>()
const cacheDir = () => path.join(/*turbopackIgnore: true*/ os.tmpdir(), 'pb-office-pdf')

function run(file: string, outDir: string, profile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(/*turbopackIgnore: true*/ SOFFICE, [`-env:UserInstallation=file://${profile}`, '--headless', '--norestore', '--convert-to', 'pdf', '--outdir', outDir, file], { stdio: 'ignore' })
    const t = setTimeout(() => {
      p.kill('SIGKILL')
      reject(new PreviewError('Chuyển đổi quá lâu – hãy tải file xuống.', 504))
    }, TIMEOUT_MS)
    p.on('error', (e) => (clearTimeout(t), reject(e)))
    p.on('exit', (code) => (clearTimeout(t), code === 0 ? resolve() : reject(new PreviewError('Không chuyển được file sang PDF.', 500))))
  })
}

/** Đường dẫn PDF đã chuyển (dùng cache nếu file gốc chưa đổi) */
export async function convertToPdf(file: string, key: string): Promise<string> {
  const dir = cacheDir()
  const out = path.join(dir, `${createHash('sha1').update(key).digest('hex')}.pdf`)
  if (await stat(out).then((s) => s.size > 0).catch(() => false)) return out
  const running = inflight.get(out)
  if (running) return running
  const job = (async () => {
    await mkdir(dir, { recursive: true })
    const work = await mkdtemp(path.join(dir, 'job-'))
    try {
      const prev = queue
      let release!: () => void
      queue = new Promise<void>((r) => (release = r))
      await prev.catch(() => undefined)
      try {
        await run(file, work, path.join(work, 'profile'))
      } finally {
        release()
      }
      const produced = path.join(work, `${path.basename(file, path.extname(file))}.pdf`)
      await rename(produced, out)
      return out
    } finally {
      await rm(work, { recursive: true, force: true })
      inflight.delete(out)
    }
  })()
  inflight.set(out, job)
  return job
}

/**
 * GET /api/builder/file-pdf?src=/api/media/file/<tên>  -> PDF (hiển thị trong trang)
 * GET /api/builder/file-pdf?check=1                       -> { available } (máy chủ có LibreOffice không)
 */
export const filePdfEndpoint: Endpoint = {
  path: '/builder/file-pdf',
  method: 'get',
  handler: async (req) => {
    const ok = await hasSoffice()
    if (req.searchParams.get('check')) return Response.json({ available: ok }, { headers: { 'Cache-Control': 'public, max-age=300' } })
    if (!ok) return Response.json({ error: 'Máy chủ chưa cài LibreOffice để xem trước loại file này.' }, { status: 501 })
    try {
      const m = await resolveMediaFile(req.payload, req.searchParams.get('src') ?? '')
      if (!canConvertToPdf(m.filename, m.mime)) throw new PreviewError('Loại file này không cần/không thể chuyển sang PDF.', 415)
      const pdf = await convertToPdf(m.file, `${m.filename}|${m.size}|${m.mtimeMs}`)
      const name = `${path.basename(m.filename, path.extname(m.filename))}.pdf`
      return new Response(new Uint8Array(await readFile(/*turbopackIgnore: true*/ pdf)), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(name)}`, 'Cache-Control': 'public, max-age=300' },
      })
    } catch (err) {
      const status = err instanceof PreviewError ? err.status : 500
      if (status === 500) req.payload.logger.error({ err }, 'file-pdf')
      return Response.json({ error: err instanceof PreviewError ? err.message : 'Không chuyển được file.' }, { status })
    }
  },
}
