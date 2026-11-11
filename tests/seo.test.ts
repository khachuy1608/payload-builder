import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildJsonLd, buildMetadata, pageSeoFrom, siteInfoFrom } from '../src/lib/seo'

const site = siteInfoFrom({ siteName: 'Bệnh viện A', siteDescription: 'Mô tả site', defaultOgImage: { url: '/media/og.png' }, favicon: { url: '/media/fav.png' } })

test('siteInfo / pageSeo chuẩn hoá', () => {
  assert.equal(site.siteName, 'Bệnh viện A')
  assert.equal(site.defaultOgImage, '/media/og.png')
  assert.deepEqual(pageSeoFrom(null), { metaTitle: null, metaDescription: null, ogImage: null, noIndex: false, canonical: null })
})

test('buildMetadata: title/description từ SEO hoặc fallback, OG ảnh mặc định, canonical, noindex, bind bản ghi', () => {
  const m = buildMetadata({ site, seo: pageSeoFrom({ metaTitle: 'Hồ sơ {{name}}', metaDescription: '{{title}} tại A', noIndex: false }), title: 'Thành viên', path: '/thanh-vien/1', record: { name: 'Bob', title: 'Thiết kế' } })
  assert.deepEqual(m.title, { absolute: 'Hồ sơ Bob' }, 'meta title nhập tay là tiêu đề tuyệt đối, không gắn hậu tố site')
  assert.equal(m.description, 'Thiết kế tại A')
  assert.equal((m.openGraph as { images?: { url: string }[] }).images?.[0].url, 'http://localhost:3000/media/og.png')
  assert.equal(m.alternates?.canonical, 'http://localhost:3000/thanh-vien/1')
  assert.equal(m.robots, undefined)
  assert.deepEqual(m.icons, { icon: '/media/fav.png' })
  const n = buildMetadata({ site, seo: pageSeoFrom({ noIndex: true, canonical: 'https://khac.vn/x', ogImage: { url: '/media/p.png' } }), title: 'Trang {{name}}', path: '/x' })
  assert.equal(n.title, 'Trang', 'không có meta title -> tên trang (layout gắn hậu tố tên site)')
  assert.deepEqual(n.robots, { index: false, follow: false })
  assert.equal(n.alternates?.canonical, 'https://khac.vn/x')
  assert.equal((n.openGraph as { images?: { url: string }[] }).images?.[0].url, 'http://localhost:3000/media/p.png')
  assert.deepEqual(buildMetadata({ site, seo: pageSeoFrom(null), title: 'Nháp', path: '/n', draft: true }).robots, { index: false, follow: false })
})

test('JSON-LD: trang chủ có WebSite + Organization, trang con chỉ WebPage', () => {
  const home = buildJsonLd({ site, title: 'Trang chủ', path: '/', isHome: true })
  assert.deepEqual(home.map((x) => x['@type']), ['WebPage', 'WebSite', 'Organization'])
  assert.equal(buildJsonLd({ site, title: 'X', path: '/x', isHome: false }).length, 1)
})
