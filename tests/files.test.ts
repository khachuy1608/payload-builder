import assert from 'node:assert/strict'
import path from 'node:path'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Payload } from 'payload'
import { canPreviewOnServer, fileKindOf, formatBytes, parseCsv } from '../src/builder/files'
import { RenderNode } from '../src/builder/Renderer'
import { mediaFilenameFromSrc, previewMediaFile } from '../src/lib/filePreview'

test('fileKindOf / canPreviewOnServer', () => {
  assert.equal(fileKindOf('Bao-cao.PDF'), 'pdf')
  assert.equal(fileKindOf('a.xlsx'), 'sheet')
  assert.equal(fileKindOf('a.csv'), 'csv')
  assert.equal(fileKindOf('a.docx'), 'doc')
  assert.equal(fileKindOf('a.pptx'), 'slides')
  assert.equal(fileKindOf('x', 'application/pdf'), 'pdf')
  assert.equal(fileKindOf('x', 'image/png'), 'image')
  assert.equal(fileKindOf('/api/media/file/a.pdf?x=1'), 'pdf')
  assert.equal(canPreviewOnServer('a.xlsx'), true)
  assert.equal(canPreviewOnServer('a.xls'), false) // .xls cũ: chỉ tải xuống
  assert.equal(canPreviewOnServer('a.docx'), true)
  assert.equal(canPreviewOnServer('a.doc'), false)
  assert.equal(canPreviewOnServer('a.pdf'), false) // PDF: trình duyệt tự xem
})

test('formatBytes', () => {
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(1536), '1,5 KB')
  assert.equal(formatBytes(15 * 1024 * 1024), '15 MB')
  assert.equal(formatBytes(undefined), '')
})

test('parseCsv: dấu phân cách tự đoán, ngoặc kép, BOM, giới hạn dòng', () => {
  assert.deepEqual(parseCsv('﻿a;b\n"x ""y""";2\n').rows, [['a', 'b'], ['x "y"', '2']])
  assert.deepEqual(parseCsv('a,b\r\n1,"dòng\nhai"').rows, [['a', 'b'], ['1', 'dòng\nhai']])
  assert.deepEqual(parseCsv('a\tb\n1\t2').rows, [['a', 'b'], ['1', '2']])
  const many = parseCsv(Array.from({ length: 30 }, (_, i) => `r${i}`).join('\n'), 10)
  assert.equal(many.rows.length, 10)
  assert.equal(many.truncated, true)
})

test('mediaFilenameFromSrc: chỉ file trong thư viện Media (chống SSRF / path traversal)', () => {
  assert.equal(mediaFilenameFromSrc('/api/media/file/bao-cao.xlsx'), 'bao-cao.xlsx')
  assert.equal(mediaFilenameFromSrc('https://site.vn/api/media/file/b%C3%A1o.pdf'), 'báo.pdf')
  assert.equal(mediaFilenameFromSrc('https://evil.com/x.xlsx'), null)
  assert.equal(mediaFilenameFromSrc('/api/media/file/..%2F..%2Fetc%2Fpasswd'), null)
  assert.equal(mediaFilenameFromSrc('/api/media/file/..'), null)
  assert.equal(mediaFilenameFromSrc('file:///etc/passwd'), null)
})

const fakePayload = (mimeType = '') =>
  ({
    find: async ({ where }: { where: { filename: { equals: string } } }) => ({ docs: [{ filename: where.filename.equals, mimeType }] }),
    collections: { media: { config: { upload: { staticDir: path.resolve('tests/fixtures') } } } },
  }) as unknown as Payload

test('previewMediaFile: xlsx nhiều sheet, csv, docx', async () => {
  const x = await previewMediaFile(fakePayload(), '/api/media/file/bao-cao-doanh-thu.xlsx')
  assert.equal(x.kind, 'table')
  if (x.kind !== 'table') return
  assert.deepEqual(x.sheets.map((s) => s.name), ['Doanh thu', 'Nhân sự'])
  assert.deepEqual(x.sheets[0].rows[0], ['Tháng', 'Khu vực', 'Doanh thu (triệu)', 'Tăng trưởng', 'Ngày chốt'])
  assert.equal(x.sheets[0].rows.length, 37)
  assert.match(x.sheets[0].rows[1][4], /28\/1\/2026|28\/01\/2026/)
  const c = await previewMediaFile(fakePayload('text/csv'), '/api/media/file/danh-sach.csv')
  assert.ok(c.kind === 'table' && c.sheets[0].rows[1][1] === 'Áo thun "basic"')
  const d = await previewMediaFile(fakePayload(), '/api/media/file/quy-trinh.docx')
  assert.ok(d.kind === 'html' && /<h1>Quy trình tiếp nhận bệnh nhân<\/h1>/.test(d.html) && /<table>/.test(d.html) && !/<script/i.test(d.html))
  await assert.rejects(previewMediaFile(fakePayload(), 'https://evil.com/a.xlsx'), /thư viện Media/)
})

const n = (props: Record<string, unknown>) => ({ id: 'fv', type: 'fileViewer', props, styles: {} })
test('fileViewer render: PDF iframe, bảng qua server, thẻ tải xuống', () => {
  const pdf = renderToStaticMarkup(createElement(RenderNode, { node: n({ file: { id: 1, url: '/api/media/file/hd.pdf', filename: 'hd.pdf', mimeType: 'application/pdf', filesize: 2048 } }), mode: 'live' }))
  assert.match(pdf, /<iframe class="b-file-frame" src="\/api\/media\/file\/hd.pdf#view=FitH"/)
  assert.match(pdf, /PDF · 2,0 KB|PDF · 2 KB/)
  assert.match(pdf, /download="hd.pdf"/)
  const xlsx = renderToStaticMarkup(createElement(RenderNode, { node: n({ file: { id: 2, url: '/api/media/file/bc.xlsx', filename: 'bc.xlsx' } }), mode: 'live' }))
  assert.match(xlsx, /data-src="\/api\/media\/file\/bc.xlsx"/)
  assert.match(xlsx, /data-file-mount=""/)
  const zip = renderToStaticMarkup(createElement(RenderNode, { node: n({ url: 'https://cdn.vn/tai-lieu.zip', download: false }), mode: 'live' }))
  assert.match(zip, /b-file-card/)
  assert.doesNotMatch(zip, /data-file-mount/)
  // URL không an toàn bị bỏ
  assert.equal(renderToStaticMarkup(createElement(RenderNode, { node: n({ url: 'javascript:alert(1)' }), mode: 'live' })), '')
  // editor: lớp chắn để chọn được block PDF
  assert.match(renderToStaticMarkup(createElement(RenderNode, { node: n({ url: 'https://cdn.vn/a.pdf' }), mode: 'editor' })), /b-file-shield/)
})
