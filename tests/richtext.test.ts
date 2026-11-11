import assert from 'node:assert/strict'
import { test } from 'node:test'
import { richToPlain, sanitizeRichText } from '../src/builder/sanitize'
import { validateContent } from '../src/builder/validate'

test('sanitizeRichText: giữ inline an toàn, bỏ script/style/sự kiện, đổi div/p thành xuống dòng', () => {
  const dirty = '<div>Xin <b>chào</b> <i>bạn</i></div><div><a href="javascript:alert(1)" onclick="x()">x</a> <a href="https://a.b" target="_blank">ok</a><script>alert(1)</script><span style="color:red">s</span></div>'
  const clean = sanitizeRichText(dirty)
  assert.ok(clean.includes('<b>chào</b>') && clean.includes('<i>bạn</i>'))
  assert.ok(!/script|onclick|javascript|style|span|<div/.test(clean))
  assert.ok(clean.includes('<a href="https://a.b" target="_blank" rel="noopener noreferrer">ok</a>'))
  assert.ok(clean.includes('<br />') || clean.includes('<br>'), 'div thứ hai thành xuống dòng')
  assert.ok(!/^<br/.test(clean) && !/<br\s*\/?>$/.test(clean), 'không có br thừa đầu/cuối')
})

test('sanitizeRichText: văn bản thuần được escape nhưng giữ nguyên nội dung và xuống dòng', () => {
  assert.equal(sanitizeRichText('a < b & c\nd'), 'a &lt; b &amp; c\nd')
  assert.equal(sanitizeRichText(42), '')
  assert.equal(richToPlain('x <b>y</b><br>z &amp; w'), 'x y\nz & w')
})

test('validate: paragraph được làm sạch khi lưu', () => {
  const out = validateContent({
    version: 1,
    root: { id: 'root', type: 'root', props: {}, styles: {}, children: [{ id: 'p1', type: 'paragraph', props: { text: 'Hi <img src=x onerror=alert(1)> <u>u</u>' }, styles: {} }] },
  })
  assert.equal(out.root.children![0].props.text, 'Hi  <u>u</u>')
})
