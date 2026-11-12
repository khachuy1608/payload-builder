/**
 * Tiện ích dùng chung cho e2e (chạy được trên DB trống như CI):
 * đăng nhập / tạo người dùng đầu tiên, tạo người dùng phụ, tạo trang, mở trình duyệt (PW_CHROMIUM nếu có).
 */
import { chromium } from 'playwright'

export const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '')
export const EMAIL = process.env.E2E_EMAIL || 'admin@example.com'
export const PASSWORD = process.env.E2E_PASSWORD || 'Password123!'
export const N = Date.now()

let failed = 0
export const ok = (m) => console.log('ok -', m)
export function assert(c, m) {
  if (!c) {
    failed++
    console.error('FAIL:', m)
    throw new Error(m)
  }
  ok(m)
}
export const failures = () => failed

export const json = (r) => r.json()
export const node = (id, type, props = {}, children, styles = {}) => ({ id, type, props, styles, ...(children ? { children } : {}) })

export async function login(email = EMAIL, password = PASSWORD) {
  return json(await fetch(`${BASE}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }))
}

/** Admin: đăng nhập, DB trống thì tạo người dùng đầu tiên */
export async function adminSession() {
  let l = await login()
  if (!l.token) {
    const r = await fetch(`${BASE}/api/users/first-register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Admin', role: 'admin' }) })
    if (!r.ok) throw new Error('first-register ' + r.status)
    l = await login()
  }
  if (!l.token) throw new Error('không đăng nhập được admin')
  return { token: l.token, user: l.user, H: { 'Content-Type': 'application/json', Authorization: `JWT ${l.token}` } }
}

/** Tạo (một lần cho mỗi lần chạy) người dùng phụ với tên một từ duy nhất để @nhắc tên */
export async function extraUser(admin, { role = 'viewer', first = `Vy${N}` } = {}) {
  const email = `${first.toLowerCase()}@e2e.test`
  const r = await fetch(`${BASE}/api/users`, { method: 'POST', headers: admin.H, body: JSON.stringify({ email, password: PASSWORD, name: `${first} Viewer`, role }) })
  if (!r.ok && r.status !== 400) throw new Error('tạo người dùng ' + r.status + (await r.text()))
  const l = await login(email)
  return { token: l.token, user: l.user, name: `${first} Viewer`, first }
}

export async function createPage(admin, { title, slug, root, status = 'published' }) {
  const r = await fetch(`${BASE}/api/pages?depth=0`, { method: 'POST', headers: admin.H, body: JSON.stringify({ title, slug: `${slug}-${N}`, _status: status, content: { version: 1, root } }) })
  const d = await r.json()
  if (!d.doc?.id) throw new Error('tạo trang ' + JSON.stringify(d).slice(0, 300))
  return d.doc
}

/** Trình duyệt + context đã đăng nhập (cookie) và bỏ tour hướng dẫn */
export async function browser() {
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
  return b
}
export async function editorContext(b, token, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts })
  if (token) await ctx.addCookies([{ name: 'payload-token', value: token, domain: new URL(BASE).hostname, path: '/' }])
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('ed-tour-done', '1')
    } catch {
      /* chế độ riêng tư */
    }
  })
  return ctx
}

/** Gom lỗi JS của trang (bỏ qua favicon/404 tài nguyên) */
export function trackErrors(pg) {
  const errs = []
  pg.on('pageerror', (e) => errs.push(String(e)))
  return errs
}

/** Chạy kịch bản, in tổng kết và đặt mã thoát */
export async function run(name, fn) {
  const b = await browser()
  try {
    await fn(b)
    console.log(`${name}: ALL OK`)
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await b.close()
  }
}
