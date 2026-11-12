import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cssToStyles, parseDeclarations, parseStylesheet } from '../src/builder/cssImport'

test('parseDeclarations: camelCase, bỏ !important/biến/thuộc tính lạ, không cắt trong ngoặc', () => {
  assert.deepEqual(parseDeclarations('padding: 16px 24px; background-color:#fff !important; --x: 1; -webkit-line-clamp: 2; bad prop: 1; box-shadow: 0 1px 2px rgba(0,0,0,.1)'), {
    padding: '16px 24px',
    backgroundColor: '#fff',
    webkitLineClamp: '2',
    boxShadow: '0 1px 2px rgba(0,0,0,.1)',
  })
  // không cắt khai báo ở dấu ; trong ngoặc (bộ làm sạch chung vẫn bỏ ký tự ; trong giá trị)
  assert.deepEqual(parseDeclarations('background-image: url("data:image/png;base64,AAA"); color: red'), { backgroundImage: 'url("data:image/pngbase64,AAA")', color: 'red' })
  assert.deepEqual(parseDeclarations('color: red}</style><script>'), { color: 'red/stylescript' })
})

test('parseStylesheet: selector, :hover, @media max-width -> tablet/mobile, bỏ ::before/@keyframes', () => {
  const rules = parseStylesheet(`
    /* thẻ */ .card, .box { padding: 20px; border-radius: 12px }
    .card:hover { transform: translateY(-4px) }
    .card::before { content: '' }
    @keyframes spin { from { opacity: 0 } to { opacity: 1 } }
    @media (max-width: 1024px) { .card { padding: 16px } }
    @media screen and (max-width: 767px) { .card h3 { font-size: 18px } }
    @media (min-width: 768px) { .card { padding: 40px } }
  `)
  assert.deepEqual(rules.map((r) => [r.selector, r.bucket, Object.keys(r.decls).join(',')]), [
    ['.card', 'desktop', 'padding,borderRadius'],
    ['.box', 'desktop', 'padding,borderRadius'],
    ['.card', 'hover', 'transform'],
    ['.card', 'tablet', 'padding'],
    ['.card h3', 'mobile', 'fontSize'],
  ])
})

test('cssToStyles: chỉ khai báo -> bucket mặc định; có luật -> desktop/hover/tablet/mobile', () => {
  assert.deepEqual(cssToStyles('color: red; padding: 8px', 'tablet'), { tablet: { color: 'red', padding: '8px' } })
  assert.deepEqual(cssToStyles('.x { color: red } .x:hover { color: blue } @media (max-width: 600px) { .x { color: green } }'), {
    desktop: { color: 'red' },
    hover: { color: 'blue' },
    mobile: { color: 'green' },
  })
  assert.deepEqual(cssToStyles('   '), {})
})
