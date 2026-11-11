import type { Endpoint, PayloadRequest } from 'payload'
import { isStaffUser } from './access'

/**
 * Lên lịch xuất bản / gỡ xuất bản trang bằng hàng đợi jobs của Payload (task có sẵn `schedulePublish`).
 * Job được chạy bởi `jobs.autoRun` (cron mỗi phút trong tiến trình Next) – xem payload.config.ts.
 */
export interface ScheduledJob {
  id: string
  type: 'publish' | 'unpublish'
  waitUntil: string
}

const unauthorized = () => Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
const bad = (message: string) => Response.json({ errors: [{ message }] }, { status: 400 })

type JobDoc = { id: string | number; waitUntil?: string | null; input?: { type?: string; doc?: { relationTo?: string; value?: string } } }

/** Job schedulePublish chưa chạy của một trang */
export async function listScheduled(req: PayloadRequest, pageId: string): Promise<ScheduledJob[]> {
  const res = await req.payload.find({
    collection: 'payload-jobs',
    where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { hasError: { not_equals: true } }] },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  return (res.docs as unknown as JobDoc[])
    .filter((j) => j.input?.doc?.relationTo === 'pages' && String(j.input.doc.value) === String(pageId))
    .map((j): ScheduledJob => ({ id: String(j.id), type: j.input?.type === 'unpublish' ? 'unpublish' : 'publish', waitUntil: String(j.waitUntil ?? '') }))
    .sort((a, b) => a.waitUntil.localeCompare(b.waitUntil))
}

export const scheduleEndpoints: Endpoint[] = [
  {
    path: '/builder/schedule',
    method: 'get',
    handler: async (req) => {
      if (!isStaffUser(req.user)) return unauthorized()
      const pageId = req.searchParams.get('pageId') ?? ''
      if (!pageId) return bad('Thiếu pageId.')
      return Response.json({ jobs: await listScheduled(req, pageId) })
    },
  },
  {
    path: '/builder/schedule',
    method: 'post',
    handler: async (req) => {
      if (!isStaffUser(req.user)) return unauthorized()
      const body = (await req.json?.()) as { pageId?: string; at?: string; type?: string } | undefined
      const pageId = String(body?.pageId ?? '')
      const at = new Date(String(body?.at ?? ''))
      const type = body?.type === 'unpublish' ? 'unpublish' : 'publish'
      if (!pageId || isNaN(at.getTime())) return bad('Thiếu pageId hoặc thời điểm không hợp lệ.')
      if (at.getTime() < Date.now() + 30_000) return bad('Thời điểm phải ở tương lai (ít nhất 1 phút).')
      // người dùng phải có quyền sửa trang
      const page = await req.payload.find({ collection: 'pages', where: { id: { equals: pageId } }, limit: 1, depth: 0, user: req.user, overrideAccess: false })
      if (!page.docs[0]) return Response.json({ errors: [{ message: 'Không tìm thấy trang hoặc không có quyền.' }] }, { status: 404 })
      const job = await req.payload.jobs.queue({
        task: 'schedulePublish',
        // input.doc.value: Payload lưu dạng chuỗi và tự ép về số khi chạy (xem versions/schedule/job)
        input: { type, doc: { relationTo: 'pages', value: pageId as unknown as number }, user: { relationTo: 'users', value: req.user!.id } },
        waitUntil: at,
        queue: 'default',
      })
      return Response.json({ job: { id: String(job.id), type, waitUntil: at.toISOString() } satisfies ScheduledJob }, { status: 201 })
    },
  },
  {
    path: '/builder/schedule/:jobId',
    method: 'delete',
    handler: async (req) => {
      if (!isStaffUser(req.user)) return unauthorized()
      const jobId = String(req.routeParams?.jobId ?? '')
      if (!jobId) return bad('Thiếu jobId.')
      await req.payload.delete({ collection: 'payload-jobs', id: /^\d+$/.test(jobId) ? Number(jobId) : jobId, overrideAccess: true })
      return Response.json({ ok: true })
    },
  },
]
