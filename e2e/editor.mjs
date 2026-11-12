/**
 * E2E Visual Builder: trạng thái xem Đóng/Mở, chế độ chuột Chỉnh sửa / Xem / Bình luận, bình luận
 * (neo vị trí bấm, avatar + số, @nhắc tên, tự cập nhật, badge), Popover trống không che nút. Chạy được trên DB trống.
 *   BASE=http://localhost:3000 node e2e/editor.mjs
 */
import { adminSession, assert, BASE, createPage, editorContext, extraUser, node, run, trackErrors } from './lib.mjs'

const admin = await adminSession()
const viewer = await extraUser(admin)
const root = node('root', 'root', {}, [
  node('h1', 'heading', { text: 'Trang thử editor', tag: 'h1' }, null, { desktop: { padding: '120px 24px 16px' } }),
  node('btn', 'button', { text: 'Liên hệ', href: '/lien-he' }),
  node('dlg', 'dialog', { variant: 'modal', triggerText: 'Mở hộp thoại', title: 'Xin chào', showClose: true, closeText: 'Huỷ' }, [node('dlgp', 'paragraph', { text: 'Nội dung hộp thoại' })]),
  node('dd', 'popover', { variant: 'dropdown', triggerText: 'Tuỳ chọn', items: [{ label: 'Đổi tên', href: '#' }] }, []),
  node('tabs', 'tabs', {}, [node('t1', 'tab', { title: 'Tab một' }, [node('t1p', 'paragraph', { text: 'Nội dung một' })]), node('t2', 'tab', { title: 'Tab hai' }, [node('t2p', 'paragraph', { text: 'Nội dung hai' })])]),
  node('frm', 'form', {}, [node('sel', 'formField', { type: 'select', label: 'Tỉnh thành', name: 'tinh', options: [{ label: 'Hà Nội' }, { label: 'Huế' }] })]),
  node('box', 'div', {}, [], { desktop: { height: '320px', margin: '24px', backgroundColor: '#e0e7ff' } }),
])
const page = await createPage(admin, { title: 'E2E editor', slug: 'e2e-editor', status: 'draft', root })

await run('editor', async (b) => {
  const ctx = await editorContext(b, admin.token)
  const pg = await ctx.newPage()
  const errs = trackErrors(pg)
  pg.on('dialog', (d) => d.accept())
  const f = pg.frameLocator('iframe.ed-iframe')
  await pg.goto(`${BASE}/builder/${page.id}`)
  await f.locator('[data-node-id="dlg"]').waitFor()

  // ---- Popover trống: không có gợi ý phủ lên nút ----
  assert((await f.locator('[data-node-id="dd"][data-empty]').count()) === 0, 'Dropdown trống: không phủ “Kéo phần tử vào đây” lên nút')

  // ---- trạng thái xem Đóng / Mở ----
  assert((await f.locator('.b-dialog-preview').count()) === 0 && (await f.locator('.b-select-preview').count()) === 0, 'mặc định: dialog / select đóng như trang thật')
  await f.locator('[data-node-id="dlg"] .b-button').first().click()
  await f.locator('.b-dialog-preview').waitFor()
  assert(true, 'chọn dialog -> tự mở')
  await pg.locator('.ed-viewstate button[data-view="closed"]').click()
  await f.locator('.b-dialog-preview').waitFor({ state: 'detached' })
  assert(true, 'ghim Đóng từ panel')
  await pg.locator('.ed-toolbar [data-view-toggle="closed"]').click()
  await f.locator('.b-dialog-preview').waitFor()
  assert(true, 'nút con mắt -> Mở')
  await pg.locator('.ed-viewstate .ed-linkbtn').click()
  // về tự động + bỏ chọn -> dialog đóng lại như trang thật
  await pg.keyboard.press('Escape')
  await f.locator('.b-dialog-preview').waitFor({ state: 'detached' })
  assert(true, 'về tự động + bỏ chọn -> dialog đóng')
  await f.locator('[data-node-id="sel"]').click()
  await f.locator('.b-select-preview').waitFor()
  assert(true, 'chọn select -> xem trước danh sách lựa chọn')

  // ---- chế độ Xem ----
  await pg.locator('[data-pointer-mode="view"]').click()
  await pg.locator('[data-view-badge]').waitFor()
  await f.locator('.b-dialog-host').first().waitFor()
  assert((await f.locator('[data-node-id]').count()) === 0, 'chế độ Xem: render như trang thật')
  await f.locator('.b-dialog-host [data-dialog-open]').click()
  await f.locator('dialog[open]').waitFor()
  await f.locator('dialog[open] [data-dialog-close]').first().click()
  assert(true, 'chế độ Xem: mở/đóng dialog thật')
  await f.locator('.b-tabs [role="tab"]', { hasText: 'Tab hai' }).click()
  assert((await f.locator('.b-tabs [role="tab"]', { hasText: 'Tab hai' }).getAttribute('aria-selected')) === 'true', 'chế độ Xem: chuyển tab')
  await f.locator('a.b-button', { hasText: 'Liên hệ' }).click()
  await pg.locator('.ed-toast', { hasText: 'không mở trang khác' }).waitFor()
  assert((await f.locator('h1', { hasText: 'Trang thử editor' }).count()) === 1, 'chế độ Xem: link sang trang khác bị chặn')
  await f.locator('body').click({ position: { x: 5, y: 5 } })
  await pg.keyboard.press('e')
  await f.locator('[data-node-id="dlg"]').waitFor()
  assert(true, 'phím E -> chỉnh sửa')

  // ---- chế độ Bình luận ----
  await pg.keyboard.press('c')
  await pg.locator('[data-comment-badge]').waitFor()
  const P = { x: 240, y: 60 }
  await f.locator('[data-node-id="box"]').scrollIntoViewIfNeeded()
  await f.locator('[data-node-id="box"]').click({ position: P })
  await pg.locator('[data-comment-pop="box"]').waitFor()
  await pg.locator('[data-comment-draft]').waitFor()
  assert((await pg.locator('.ed-toolbar').count()) === 0, 'bấm phần tử: khung bình luận + ghim nháp, không chọn')
  await pg.keyboard.type(`Nhờ @${viewer.first}`)
  await pg.locator(`[data-mention-user="${viewer.user.id}"]`).waitFor()
  await pg.keyboard.press('Enter')
  assert((await pg.locator('[data-comment-pop="box"] textarea').inputValue()) === `Nhờ @${viewer.name} `, '@nhắc tên: gợi ý + Enter chèn tên')
  await pg.keyboard.type('đổi màu nền')
  await pg.keyboard.press('Control+Enter')
  await pg.locator('.ed-cpop-item .ed-mention-tag').waitFor()
  await pg.locator('[data-comment-pin="box"]').waitFor()
  const box = await f.locator('[data-node-id="box"]').boundingBox()
  const pin = await pg.locator('[data-comment-pin="box"]').boundingBox()
  assert(Math.abs(pin.x - (box.x + P.x)) <= 2 && Math.abs(pin.y + pin.height - (box.y + P.y)) <= 2, 'huy hiệu neo đúng chỗ bấm')
  const saved = (await (await fetch(`${BASE}/api/comments?where[page][equals]=${page.id}&depth=0`, { headers: admin.H })).json()).docs[0]
  assert(saved.anchorX > 0 && JSON.stringify(saved.mentions) === JSON.stringify([viewer.user.id]), 'lưu vị trí bấm + người được nhắc')
  await pg.keyboard.press('Escape')
  // người khác bình luận -> tự cập nhật, huy hiệu có 2 avatar + số, badge chưa xem khi rời chế độ Bình luận
  await pg.keyboard.press('e')
  await fetch(`${BASE}/api/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `JWT ${viewer.token}` }, body: JSON.stringify({ page: page.id, nodeId: 'box', text: 'Đã xem' }) })
  await pg.locator('.ed-mode-badge.is-unread', { hasText: '2' }).waitFor({ timeout: 30000 })
  assert(true, 'bình luận của người khác tự hiện (badge 2, chưa xem)')
  await pg.keyboard.press('c')
  await pg.locator('.ed-mode-badge:not(.is-unread)').waitFor()
  // huy hiệu cập nhật theo khung hình (rAF) -> chờ tới khi đủ 2 avatar + số 2 thay vì đọc ngay
  const pinOk = await pg
    .waitForFunction(
      () => {
        const el = document.querySelector('[data-comment-pin="box"]')
        return !!el && el.querySelectorAll('.ed-cpin-av').length === 2 && el.querySelector('.ed-cpin-count')?.textContent.trim() === '2'
      },
      null,
      { timeout: 20000 },
    )
    .then(() => true, () => false)
  const pinInfo = await pg.locator('[data-comment-pin="box"]').evaluate((el) => `${el.querySelectorAll('.ed-cpin-av').length} avatar, số ${el.querySelector('.ed-cpin-count')?.textContent.trim()}`)
  assert(pinOk, `huy hiệu: 2 avatar + số 2 (đang: ${pinInfo})`)
  await pg.locator('[data-comment-pin="box"]').click()
  await pg.locator('[data-comment-pop="box"] .ed-cpop-item').nth(1).waitFor()
  await pg.locator('.ed-cpop-item .ed-linkbtn', { hasText: 'Đã xong' }).first().click()
  await pg.locator('[data-comment-pin="box"] .ed-cpin-count', { hasText: '1' }).waitFor()
  await pg.locator('.ed-cpop-item .ed-linkbtn', { hasText: 'Đã xong' }).first().click()
  await pg.locator('[data-comment-pin="box"]').waitFor({ state: 'detached' })
  assert(true, 'giải quyết hết -> huy hiệu ẩn')
  assert(errs.length === 0, 'không lỗi JS ' + errs.join(' | '))
})
