/**
 * Smoke test end-to-end chạy trong CI (và tại chỗ): server đã khởi động ở BASE (mặc định http://localhost:3000),
 * DB có thể trống (tự tạo người dùng đầu tiên). Kiểm tra: health, trang chủ, CSS ngoài, đăng nhập, API builder,
 * tạo + xuất bản trang qua API và render, xem thử bản nháp, sitemap/robots, editor mở được, a11y (axe) không lỗi critical.
 *   node e2e/smoke.mjs            (cần: npx playwright install chromium)
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '')
const EMAIL = process.env.E2E_EMAIL || 'admin@example.com'
const PASSWORD = process.env.E2E_PASSWORD || 'Password123!'
let failed = 0
const ok = (m) => console.log('ok -', m)
const assert = (c, m) => {
  if (!c) {
    failed++
    console.error('FAIL:', m)
    throw new Error(m)
  }
  ok(m)
}
const j = (r) => r.json()
const dom = async (res) => (await res.text()).replace(/<script[\s\S]*?<\/script>/g, '')
const node = (id, type, props, children) => ({ id, type, props, styles: {}, ...(children ? { children } : {}) })

const health = await fetch(`${BASE}/api/health`)
assert(health.ok && (await j(health)).ok === true, 'GET /api/health')

let login = await j(await fetch(`${BASE}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) }))
if (!login.token) {
  const r = await fetch(`${BASE}/api/users/first-register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Admin', role: 'admin' }) })
  assert(r.ok, 'tạo người dùng đầu tiên (first-register)')
  login = await j(await fetch(`${BASE}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) }))
}
assert(login.token, 'đăng nhập admin')
const H = { 'Content-Type': 'application/json', Authorization: `JWT ${login.token}` }
const N = Date.now()

let html = await dom(await fetch(`${BASE}/`))
assert(html.includes('<link rel="stylesheet" href="/builder.css?v=') && html.includes('b-heading'), 'trang chủ render, dùng /builder.css')
const css = await fetch(`${BASE}/builder.css?v=x`)
assert(css.ok && (await css.text()).includes('.b-button'), '/builder.css')
const sources = await j(await fetch(`${BASE}/api/builder/sources`, { headers: H }))
assert(Array.isArray(sources.sources) && sources.sources.some((s) => s.slug === 'posts'), 'API nguồn dữ liệu')

const SLUG = 'ci-' + N
const page = (await j(await fetch(`${BASE}/api/pages?depth=0`, { method: 'POST', headers: H, body: JSON.stringify({ title: 'CI', slug: SLUG, _status: 'published', seo: { metaTitle: 'CI meta' }, content: { version: 1, root: node('root', 'root', {}, [node('h', 'heading', { text: 'CI PUBLISHED', tag: 'h1' }), node('l', 'dataList', { data: { collection: 'posts', mode: 'list', limit: 2 } }, [node('t', 'paragraph', { text: '{{title}}' })]), node('b', 'button', { text: 'Bấm', href: '/' })]) } }) }))).doc
assert(page?.id, 'tạo trang qua API')
html = await dom(await fetch(`${BASE}/${SLUG}`))
assert(html.includes('CI PUBLISHED') && html.includes('<title>CI meta</title>'), 'trang xuất bản render với meta')
assert((html.match(/class="n-t(_\d+)? b-paragraph"/g) || []).length === 2, 'danh sách dữ liệu lặp 2 bài viết seed')
html = await dom(await fetch(`${BASE}/en/${SLUG}`))
assert(html.includes('CI PUBLISHED'), '/en fallback')
await fetch(`${BASE}/api/pages/${page.id}?depth=0&draft=true`, { method: 'PATCH', headers: H, body: JSON.stringify({ _status: 'draft', content: { version: 1, root: node('root', 'root', {}, [node('h', 'heading', { text: 'CI DRAFT', tag: 'h1' })]) } }) })
html = await dom(await fetch(`${BASE}/${SLUG}`))
assert(html.includes('CI PUBLISHED') && !html.includes('CI DRAFT'), 'bản nháp không lộ ra trang công khai')
let r = await fetch(`${BASE}/preview/enter?slug=${SLUG}`, { headers: { Cookie: `payload-token=${login.token}` }, redirect: 'manual' })
assert([302, 307].includes(r.status), 'preview/enter chuyển hướng')
const draftCookie = (r.headers.get('set-cookie') || '').split(/,(?=[^ ])/).map((c) => c.split(';')[0]).join('; ')
html = await dom(await fetch(`${BASE}/preview/${SLUG}`, { headers: { Cookie: `payload-token=${login.token}; ${draftCookie}` } }))
assert(html.includes('CI DRAFT') && html.includes('bld-draft-bar'), 'xem thử hiện bản nháp')
assert((await fetch(`${BASE}/preview/enter?slug=${SLUG}`)).status === 401, 'khách không xem thử được')
const sm = await (await fetch(`${BASE}/sitemap.xml`)).text()
assert(sm.includes(`/${SLUG}</loc>`), 'sitemap')
assert((await (await fetch(`${BASE}/robots.txt`)).text()).includes('Sitemap:'), 'robots.txt')
assert((await fetch(`${BASE}/khong-ton-tai-${N}`)).status === 404, '404')

// ---------- trình duyệt: editor + a11y ----------
const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
// PW_CHROMIUM: đường dẫn Chromium có sẵn (khi không muốn `npx playwright install`)
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
await ctx.addCookies([{ name: 'payload-token', value: login.token, domain: new URL(BASE).hostname, path: '/' }])
const pg = await ctx.newPage()
const errors = []
pg.on('pageerror', (e) => errors.push(String(e)))
try {
  await pg.goto(`${BASE}/builder/${page.id}`)
  await pg.frameLocator('iframe.ed-iframe').locator('[data-node-id="h"]').waitFor({ timeout: 60000 })
  assert(true, 'editor mở trang')
  await pg.frameLocator('iframe.ed-iframe').locator('[data-node-id="h"]').click()
  await pg.locator('.ed-right-title strong', { hasText: 'Heading' }).waitFor()
  assert(true, 'chọn phần tử -> panel thuộc tính')
  await pg.getByRole('button', { name: 'Xuất bản', exact: true }).click()
  await pg.locator('.ed-toast', { hasText: 'Đã xuất bản' }).waitFor()
  html = await dom(await fetch(`${BASE}/${SLUG}`))
  assert(html.includes('CI DRAFT'), 'xuất bản từ editor')
  assert(errors.length === 0, 'editor không có lỗi JS (' + errors.slice(0, 2).join(' | ') + ')')
  // a11y với axe trên trang công khai
  for (const path of ['/', `/${SLUG}`]) {
    await pg.goto(`${BASE}${path}`)
    await pg.addScriptTag({ content: axeSource })
    const result = await pg.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })
      return res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }))
    })
    const critical = result.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    for (const v of result) console.log(`   a11y ${path} [${v.impact}] ${v.id}: ${v.help} (${v.nodes})`)
    assert(critical.length === 0, `a11y ${path}: không có vi phạm serious/critical (${critical.map((v) => v.id).join(', ') || 'none'})`)
  }
} finally {
  await browser.close()
}
console.log(failed ? `FAILED ${failed}` : 'ALL OK')
process.exit(failed ? 1 : 0)
