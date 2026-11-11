import type { Endpoint, Where } from 'payload'
import { isStaffUser } from './access'

/** Một dòng CSV: trích dẫn giá trị có dấu phẩy/ngoặc kép/xuống dòng */
const cell = (v: unknown): string => {
  const s = v == null ? '' : Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Bài gửi form -> CSV (cột cố định + hợp các khoá trong data) */
export function submissionsToCsv(docs: { id: unknown; form?: string | null; page?: string | null; createdAt: string; data?: unknown }[]): string {
  const keys: string[] = []
  for (const d of docs) for (const k of Object.keys((d.data as Record<string, unknown>) ?? {})) if (!keys.includes(k)) keys.push(k)
  const header = ['id', 'form', 'page', 'createdAt', ...keys]
  const rows = docs.map((d) => [d.id, d.form, d.page, d.createdAt, ...keys.map((k) => ((d.data as Record<string, unknown>) ?? {})[k])].map(cell).join(','))
  return '﻿' + [header.map(cell).join(','), ...rows].join('\r\n')
}

/** GET /api/builder/form-submissions.csv?form=<tên>&from=<ISO>&to=<ISO> – chỉ nhân sự CMS */
export const formExportEndpoint: Endpoint = {
  path: '/builder/form-submissions.csv',
  method: 'get',
  handler: async (req) => {
    if (!isStaffUser(req.user)) return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    const form = req.searchParams.get('form') ?? ''
    const from = req.searchParams.get('from')
    const to = req.searchParams.get('to')
    const and: Where[] = []
    if (form) and.push({ form: { equals: form } })
    if (from) and.push({ createdAt: { greater_than_equal: from } })
    if (to) and.push({ createdAt: { less_than_equal: to } })
    const res = await req.payload.find({ collection: 'form-submissions', where: and.length ? { and } : undefined, limit: 10000, depth: 0, pagination: false, sort: '-createdAt', overrideAccess: true })
    const csv = submissionsToCsv(res.docs as never)
    const name = `form-submissions${form ? '-' + form.replace(/[^\w-]/g, '') : ''}-${new Date().toISOString().slice(0, 10)}.csv`
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"` } })
  },
}
