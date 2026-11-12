/**
 * E2E: block Xem file (Excel nhiều sheet, Word, CSV, PDF, ZIP, PowerPoint qua LibreOffice nếu máy chủ có)
 * và thư viện media lọc theo loại (ô tài liệu chỉ hiện tài liệu, ô ảnh chỉ hiện ảnh, thả sai loại bị từ chối).
 *   BASE=http://localhost:3000 node e2e/files.mjs
 */
import { readFileSync } from 'node:fs'
import { adminSession, assert, BASE, createPage, editorContext, N, node, run, trackErrors } from './lib.mjs'

const admin = await adminSession()
const FIX = new URL('../tests/fixtures/', import.meta.url)
const MIME = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
  csv: 'text/csv',
  zip: 'application/zip',
  png: 'image/png',
}
// ảnh PNG 1x1 để kiểm tra ô chọn ảnh
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

async function upload(name, buf) {
  const ext = name.split('.').pop()
  const form = new FormData()
  form.append('file', new Blob([buf ?? readFileSync(new URL(name, FIX))], { type: MIME[ext] }), name.replace('.', `-${N}.`))
  form.append('_payload', JSON.stringify({ alt: name }))
  const r = await fetch(`${BASE}/api/media`, { method: 'POST', headers: { Authorization: `JWT ${admin.token}` }, body: form })
  const d = await r.json()
  if (!r.ok) throw new Error(`tải lên ${name}: ${JSON.stringify(d).slice(0, 300)}`)
  return { id: d.doc.id, url: d.doc.url, filename: d.doc.filename, mimeType: d.doc.mimeType, filesize: d.doc.filesize }
}

const f = {
  xlsx: await upload('bao-cao-doanh-thu.xlsx'),
  docx: await upload('quy-trinh.docx'),
  csv: await upload('danh-sach.csv'),
  pdf: await upload('huong-dan.pdf'),
  zip: await upload('tai-lieu.zip'),
  pptx: await upload('gioi-thieu.pptx'),
  png: await upload('anh.png', PNG),
}
const fv = (id, file, extra = {}) => node(id, 'fileViewer', { file, height: '420', showBar: true, download: true, header: true, ...extra }, null, { desktop: { margin: '24px auto', maxWidth: '960px' } })
const root = node('root', 'root', {}, [fv('fxlsx', f.xlsx), fv('fpdf', f.pdf), fv('fdocx', f.docx), fv('fcsv', f.csv, { height: '240' }), fv('fzip', f.zip), fv('fppt', f.pptx)])
const page = await createPage(admin, { title: 'E2E xem file', slug: 'e2e-files', root })
const blank = await createPage(admin, { title: 'E2E chọn file', slug: 'e2e-pick', status: 'draft', root: node('root', 'root', {}, [node('h', 'heading', { text: 'Tài liệu', tag: 'h2' })]) })
const office = (await (await fetch(`${BASE}/api/builder/file-pdf?check=1`)).json()).available

await run('files', async (b) => {
  const ctx = await editorContext(b, admin.token, { viewport: { width: 1280, height: 900 } })
  const pg = await ctx.newPage()
  const errs = trackErrors(pg)
  // ---- trang thật ----
  await pg.goto(`${BASE}/${page.slug}`)
  await pg.locator('.n-fxlsx .b-file-table').waitFor()
  assert((await pg.locator('.n-fxlsx .b-file-table thead th').allTextContents()).slice(1).join('|') === 'Tháng|Khu vực|Doanh thu (triệu)|Tăng trưởng|Ngày chốt', 'Excel: dòng đầu là tiêu đề cột')
  assert((await pg.locator('.n-fxlsx .b-file-table tbody tr').count()) === 36, 'Excel: 36 dòng sheet 1')
  await pg.locator('.n-fxlsx .b-file-sheets button', { hasText: 'Nhân sự' }).click()
  assert((await pg.locator('.n-fxlsx .b-file-table tbody tr').first().textContent()).includes('Nguyễn Văn An'), 'Excel: chuyển sheet')
  assert((await pg.locator('.n-fpdf iframe.b-file-frame').getAttribute('src')).startsWith(f.pdf.url) || (await pg.locator('.n-fpdf .b-file-card').count()) === 1, 'PDF: khung xem (hoặc nút Mở PDF khi trình duyệt không có trình xem)')
  await pg.locator('.n-fdocx .b-file-doc h1').waitFor()
  assert((await pg.locator('.n-fdocx .b-file-doc h1').textContent()) === 'Quy trình tiếp nhận bệnh nhân', 'Word: chuyển sang HTML')
  await pg.locator('.n-fcsv .b-file-table').waitFor()
  assert((await pg.locator('.n-fcsv .b-file-table tbody tr').first().textContent()).includes('Áo thun "basic"'), 'CSV: bảng (dấu ; và ngoặc kép)')
  assert((await pg.locator('.n-fzip .b-file-card a[download]').count()) === 1, 'ZIP: thẻ tải xuống')
  await pg.waitForFunction(() => ['pdf', 'off'].includes(document.querySelector('.n-fppt')?.getAttribute('data-convert-state')))
  const pptState = await pg.locator('.n-fppt').getAttribute('data-convert-state')
  assert(pptState === (office ? 'pdf' : 'off'), `PowerPoint: ${office ? 'có LibreOffice -> bản PDF' : 'không có LibreOffice -> giữ nút tải xuống'}`)
  if (office) {
    const r = await fetch(`${BASE}/api/builder/file-pdf?src=${encodeURIComponent(f.pptx.url)}`)
    assert(r.ok && r.headers.get('content-type') === 'application/pdf', 'PowerPoint -> PDF qua LibreOffice')
  }
  const bad = await fetch(`${BASE}/api/builder/file-preview?src=${encodeURIComponent('https://evil.example/a.xlsx')}`)
  assert(bad.status === 400, 'chặn đọc URL ngoài thư viện Media')
  // ---- editor: chèn block, chọn file – thư viện lọc theo loại ----
  await pg.goto(`${BASE}/builder/${blank.id}`)
  const fr = pg.frameLocator('iframe.ed-iframe')
  await fr.locator('[data-node-id="h"]').click()
  await pg.locator('.ed-search input').fill('Xem file')
  await pg.locator('.ed-tile', { hasText: 'Xem file' }).click()
  await pg.locator('.ed-media-field .ed-btn--primary', { hasText: 'Chọn file' }).click()
  await pg.waitForFunction(() => document.querySelectorAll('.ed-media-item').length > 0)
  const items = await pg.locator('.ed-media-item').evaluateAll((els) => els.map((e) => !!e.querySelector('img')))
  assert(items.length > 0 && items.every((img) => !img), 'thư viện tài liệu: không có ảnh')
  await pg.locator('.ed-modal input[type=file]').setInputFiles({ name: 'anh.png', mimeType: 'image/png', buffer: PNG })
  await pg.locator('.ed-modal .ed-error', { hasText: 'chỉ nhận tài liệu' }).waitFor()
  assert(true, 'thả ảnh vào ô tài liệu -> từ chối')
  await pg.locator('.ed-media-item', { hasText: f.xlsx.filename }).first().click()
  await fr.locator('.b-file-table').waitFor()
  assert(true, 'chọn Excel -> canvas hiện bảng')
  await pg.locator('.ed-search input').fill('Image')
  await pg.locator('.ed-tile', { hasText: /^Image$/ }).first().click()
  await pg.locator('.ed-media-field .ed-btn--primary', { hasText: 'Chọn ảnh' }).first().click()
  await pg.waitForFunction(() => document.querySelectorAll('.ed-media-item').length > 0)
  const imgs = await pg.locator('.ed-media-item').evaluateAll((els) => els.map((e) => !!e.querySelector('img')))
  assert(imgs.length > 0 && imgs.every(Boolean), 'thư viện ảnh: chỉ có ảnh')
  assert(errs.length === 0, 'không lỗi JS ' + errs.join(' | '))
})
