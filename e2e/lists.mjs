/**
 * E2E: danh sách dữ liệu cập nhật tại chỗ – phân trang / Xem thêm / tìm kiếm không tải lại trang,
 * danh sách khác giữ nguyên, URL đổi theo, Back/Forward hoạt động. Tự tạo 4 FAQ riêng (chạy được trên DB trống).
 *   BASE=http://localhost:3000 node e2e/lists.mjs
 */
import { adminSession, assert, BASE, createPage, editorContext, N, node, run, trackErrors } from './lib.mjs'

const admin = await adminSession()
const P = `E2E${N}`
const questions = [`${P} An toàn khi đi tour?`, `${P} Bao gồm ăn uống?`, `${P} Có hoàn tiền?`, `${P} Đặt chỗ thế nào?`]
for (const q of questions) {
  const r = await fetch(`${BASE}/api/faqs`, { method: 'POST', headers: admin.H, body: JSON.stringify({ question: q, published: true }) })
  if (!r.ok) throw new Error('tạo FAQ ' + r.status + (await r.text()))
}
const only = [{ field: 'question', op: 'contains', value: P }]
const root = node('root', 'root', {}, [
  node('A', 'dataList', { data: { collection: 'faqs', mode: 'list', limit: 2, sort: 'question', urlParams: true, filters: only } }, [node('At', 'heading', { text: '{{question}}', tag: 'h3' })]),
  node('pgA', 'pagination', { auto: true, showPrevNext: true }),
  node('sp', 'spacer', { height: '900' }),
  node('sbB', 'searchBox', { target: 'B', placeholder: 'Tìm…' }),
  node('B', 'dataList', { data: { collection: 'faqs', mode: 'list', limit: 2, sort: '-question', urlParams: true, paramKey: 'b', searchFields: ['question'], filters: only } }, [node('Bt', 'paragraph', { text: '{{question}}' })]),
  node('moreB', 'loadMore', { step: '2', target: 'B' }),
])
const page = await createPage(admin, { title: 'E2E danh sách', slug: 'e2e-lists', root })

await run('lists', async (b) => {
  const ctx = await editorContext(b, null, { viewport: { width: 1280, height: 800 } })
  const pg = await ctx.newPage()
  const errs = trackErrors(pg)
  let docLoads = 0
  pg.on('request', (r) => r.resourceType() === 'document' && docLoads++)
  const texts = (sel) => pg.locator(sel).allTextContents()
  await pg.goto(`${BASE}/${page.slug}`)
  await pg.locator('.n-A h3').first().waitFor()
  const loads0 = docLoads
  await pg.evaluate(() => {
    window.__marker = 1
    document.querySelector('.n-B').__keep = 1
  })
  const a1 = await texts('.n-A h3')
  assert(a1.length === 2 && a1[0] === questions[0], 'A trang 1: 2 mục đầu')
  // phân trang A
  await pg.locator('.n-pgA a.b-page-btn', { hasText: /^2$/ }).click()
  await pg.waitForFunction(() => location.search === '?page=2')
  await pg.waitForFunction((a) => document.querySelector('.n-A h3')?.textContent !== a, a1[0])
  assert((await texts('.n-A h3'))[0] === questions[2], 'A sang trang 2 đúng dữ liệu')
  assert(await pg.evaluate(() => window.__marker === 1) && docLoads === loads0, 'phân trang không tải lại trang')
  assert(await pg.evaluate(() => document.querySelector('.n-B').__keep === 1), 'danh sách B không bị thay')
  // Xem thêm B (replaceState)
  const histLen = await pg.evaluate(() => history.length)
  await pg.locator('.n-moreB a').click()
  await pg.waitForFunction(() => document.querySelectorAll('.n-B p').length === 4)
  assert((await pg.evaluate(() => location.search)) === '?page=2&b_take=4', 'Xem thêm: URL có b_take=4, giữ page=2')
  assert((await pg.evaluate(() => history.length)) === histLen, 'Xem thêm dùng replaceState')
  assert((await pg.locator('.n-B p.b-pn-new').count()) === 2, 'mục mới có hiệu ứng')
  // tìm kiếm B
  await pg.fill('.n-sbB input[type=search]', 'hoàn tiền')
  await pg.press('.n-sbB input[type=search]', 'Enter')
  await pg.waitForFunction(() => new URLSearchParams(location.search).get('b_q') === 'hoàn tiền')
  await pg.waitForFunction(() => document.querySelectorAll('.n-B p').length === 1)
  assert((await texts('.n-B p'))[0] === questions[2], 'tìm kiếm lọc đúng, giữ page=2')
  assert(await pg.evaluate(() => document.activeElement?.matches('.n-sbB input[type=search]')), 'ô tìm kiếm giữ focus')
  assert(await pg.evaluate(() => window.__marker === 1) && docLoads === loads0, 'tìm kiếm không tải lại trang')
  // Back / Forward
  await pg.goBack()
  await pg.waitForFunction(() => location.search === '?page=2&b_take=4')
  await pg.waitForFunction(() => document.querySelectorAll('.n-B p').length === 4)
  await pg.goBack()
  await pg.waitForFunction(() => location.search === '')
  await pg.waitForFunction((a) => document.querySelector('.n-A h3')?.textContent === a, a1[0])
  await pg.goForward()
  await pg.waitForFunction(() => location.search === '?page=2&b_take=4')
  assert(await pg.evaluate(() => window.__marker === 1) && docLoads === loads0, 'Back/Forward cập nhật danh sách, không tải lại trang')
  assert(errs.length === 0, 'không lỗi JS ' + errs.join(' | '))
})
