import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compileTreeCss, declarations } from '../src/builder/css'
import { fxCss, normalizeFx, resolveEasing, springEasing } from '../src/builder/effects'
import { createRoot } from '../src/builder/tree'
import { validateContent } from '../src/builder/validate'

test('springEasing: linear() có overshoot, kết thúc ở 1, thời lượng hợp lý', () => {
  const s = springEasing({ stiffness: 170, damping: 10, mass: 1 })
  assert.match(s.css, /^linear\(0 0%, .* 1 100%\)$/)
  const values = s.css.replace(/^linear\(|\)$/g, '').split(', ').map((p) => parseFloat(p))
  assert.ok(Math.max(...values) > 1.05, 'lò xo ít giảm chấn phải vượt quá 1')
  assert.ok(s.duration > 300 && s.duration < 5000, 'thời lượng ' + s.duration)
  const stiff = springEasing({ stiffness: 600, damping: 40 })
  assert.ok(stiff.duration < s.duration, 'lò xo cứng, giảm chấn mạnh ổn định nhanh hơn')
})

test('resolveEasing: chỉ nhận easing hợp lệ', () => {
  assert.equal(resolveEasing('ease-out'), 'ease-out')
  assert.equal(resolveEasing('cubic-bezier(0.16, 1, 0.3, 1)'), 'cubic-bezier(0.16, 1, 0.3, 1)')
  assert.equal(resolveEasing('url(x)'), 'ease')
  assert.match(resolveEasing('spring'), /^linear\(/)
})

test('normalizeFx: bỏ giá trị lạ, giữ hợp lệ', () => {
  assert.equal(normalizeFx(null), undefined)
  assert.equal(normalizeFx({ reveal: 'none', hover: 'none' }), undefined)
  assert.deepEqual(normalizeFx({ reveal: 'slide-up', easing: 'spring', spring: { stiffness: 200, bogus: 1 }, duration: 99999, delay: -5, once: false, hover: 'evil', parallax: 3, stack: true, stackTop: 40, hideOnScroll: true, text: 'rotate', words: 'a, b' }), {
    reveal: 'slide-up',
    easing: 'spring',
    spring: { stiffness: 200 },
    duration: 10000,
    delay: 0,
    once: false,
    text: 'rotate',
    words: 'a, b',
    parallax: 1,
    stack: true,
    stackTop: 40,
    hideOnScroll: true,
  })
})

test('fxCss + compileTreeCss: reveal, hover lift, stacking, focus ring, line clamp, scrim', () => {
  const { base, hover } = fxCss('.n-a', { reveal: 'fade', duration: 500, delay: 100, easing: 'ease-out', hover: 'lift', stack: true, stackTop: 60 })
  assert.ok(base.includes('.n-a.is-in{animation:bld-fade 500ms ease-out 100ms both}'))
  assert.ok(hover.some((h) => h.includes('.n-a:hover{transform:translateY(-4px)')))
  assert.ok(base.includes('.n-a>:nth-child(3){top:92px}'))

  const root = createRoot()
  root.children = [
    { id: 'x', type: 'heading', props: { fx: { reveal: 'zoom', easing: 'spring' } }, styles: { desktop: { focusRing: 'thick', lineClamp: '2', backgroundImage: 'url(a.jpg)', overlayColor: 'rgba(0,0,0,.4)' } } },
  ]
  const css = compileTreeCss(root)
  assert.match(css, /\.n-x\.is-in\{animation:bld-zoom \d+ms linear\(/)
  assert.ok(css.includes('.n-x:focus-visible{outline:3px solid var(--color-primary)'))
  assert.ok(css.includes('-webkit-line-clamp:2'))
  assert.ok(css.includes('background-image:linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)),url(a.jpg)'))
  assert.ok(!css.includes('focus-ring') && !/[;{]line-clamp:/.test(css) && !css.includes('overlay-color'))
  assert.equal(declarations({ lineClamp: '1' }), 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis')
  assert.match(declarations({ transitionTimingFunction: 'spring' }), /^transition-timing-function:linear\(/)
})

test('validate: fx được làm sạch khi lưu', () => {
  const out = validateContent({ version: 1, root: { id: 'root', type: 'root', props: {}, styles: {}, children: [{ id: 'h', type: 'heading', props: { text: 'x', fx: { reveal: 'fade', hover: 'bad' } }, styles: {} }, { id: 'p', type: 'paragraph', props: { text: 'y', fx: { reveal: 'none' } }, styles: {} }] } })
  assert.deepEqual(out.root.children![0].props.fx, { reveal: 'fade' })
  assert.equal('fx' in out.root.children![1].props, false)
})
