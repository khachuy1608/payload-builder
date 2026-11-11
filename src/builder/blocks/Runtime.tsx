'use client'

/**
 * Phần JS của hệ hiệu ứng và vài block tương tác, chạy cho cả trang thật lẫn canvas editor (trong iframe).
 * Quét theo data-attribute nên không cần biết cây node; MutationObserver bắt phần tử mới (editor render lại).
 * - [data-fx-reveal]      Scroll Reveal: thêm .is-in khi vào khung nhìn (IntersectionObserver)
 * - [data-fx-text]        Text Scramble / Typewriter / Rotating Words
 * - [data-fx-parallax]    Parallax theo cuộn
 * - [data-fx-hide]        Hide-on-Scroll Header
 * - [data-fx-hover=spotlight]  toạ độ chuột cho vệt sáng
 * - [data-scrollspy]      Scrollspy: đánh dấu link đang xem
 * - [data-back-to-top]    nút lên đầu trang chỉ hiện khi đã cuộn
 */
import { useEffect, useRef } from 'react'
import type { RenderMode } from './types'

const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function BuilderRuntime({ mode }: { mode: RenderMode }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const doc = ref.current?.ownerDocument
    const win = doc?.defaultView
    if (!doc || !win) return
    const root = doc.body
    const cleanups: (() => void)[] = []
    const reduced = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // ---------- Scroll Reveal ----------
    const seen = new WeakSet<Element>()
    const io = new win.IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement
          if (e.isIntersecting) {
            el.classList.add('is-in')
            if (el.dataset.fxOnce !== 'false') io.unobserve(el)
          } else if (el.dataset.fxOnce === 'false') el.classList.remove('is-in')
        }
      },
      { threshold: 0.15 },
    )
    cleanups.push(() => io.disconnect())

    // ---------- Text effects ----------
    const textTimers = new WeakMap<Element, number>()
    const runText = (el: HTMLElement) => {
      if (reduced || el.isContentEditable || el.children.length) return
      const kind = el.dataset.fxText
      const original = el.dataset.fxOriginal ?? el.textContent ?? ''
      el.dataset.fxOriginal = original
      const prev = textTimers.get(el)
      if (prev) win.clearInterval(prev)
      if (kind === 'scramble') {
        let frame = 0
        const total = Math.max(12, original.length * 2)
        const timer = win.setInterval(() => {
          frame++
          const done = Math.floor((frame / total) * original.length)
          el.textContent =
            original.slice(0, done) +
            original
              .slice(done)
              .split('')
              .map((c) => (c === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]))
              .join('')
          if (frame >= total) {
            el.textContent = original
            win.clearInterval(timer)
          }
        }, 40)
        textTimers.set(el, timer)
      } else if (kind === 'typewriter') {
        let i = 0
        el.textContent = ''
        el.classList.add('bld-caret')
        const timer = win.setInterval(() => {
          i++
          el.textContent = original.slice(0, i)
          if (i >= original.length) {
            win.clearInterval(timer)
            win.setTimeout(() => el.classList.remove('bld-caret'), 1500)
          }
        }, 45)
        textTimers.set(el, timer)
      } else if (kind === 'rotate') {
        const words = (el.dataset.fxWords ?? '').split(',').map((w) => w.trim()).filter(Boolean)
        if (!words.length) return
        let i = 0
        el.textContent = words[0]
        const timer = win.setInterval(() => {
          i = (i + 1) % words.length
          el.style.transition = 'opacity .25s'
          el.style.opacity = '0'
          win.setTimeout(() => {
            el.textContent = words[i]
            el.style.opacity = '1'
          }, 250)
        }, 2200)
        textTimers.set(el, timer)
      }
    }
    const textIo = new win.IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        if (seen.has(el)) continue
        seen.add(el)
        runText(el)
      }
    })
    cleanups.push(() => textIo.disconnect())

    // ---------- Spotlight ----------
    const onSpot = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.('[data-fx-hover=spotlight]') as HTMLElement | null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    doc.addEventListener('mousemove', onSpot)
    cleanups.push(() => doc.removeEventListener('mousemove', onSpot))

    // ---------- Scroll-driven: parallax, hide-on-scroll, scrollspy, back-to-top ----------
    let lastY = win.scrollY
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = win.requestAnimationFrame(() => {
        raf = 0
        const y = win.scrollY
        const vh = win.innerHeight
        if (!reduced)
          root.querySelectorAll<HTMLElement>('[data-fx-parallax]').forEach((el) => {
            const speed = parseFloat(el.dataset.fxParallax ?? '0')
            const r = el.getBoundingClientRect()
            const center = r.top + r.height / 2 - vh / 2
            el.style.transform = `translateY(${Math.round(-center * speed * 0.5)}px)`
          })
        root.querySelectorAll<HTMLElement>('[data-fx-hide]').forEach((el) => {
          if (y > lastY + 4 && y > 80) el.classList.add('is-hidden')
          else if (y < lastY - 4) el.classList.remove('is-hidden')
        })
        root.querySelectorAll<HTMLElement>('[data-scrollspy]').forEach((nav) => {
          const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
          let active: HTMLAnchorElement | null = null
          for (const a of links) {
            const target = doc.getElementById(a.getAttribute('href')!.slice(1))
            if (target && target.getBoundingClientRect().top <= vh * 0.35) active = a
          }
          links.forEach((a) => a.classList.toggle('is-active', a === active))
        })
        root.querySelectorAll<HTMLElement>('[data-back-to-top]').forEach((el) => el.classList.toggle('is-visible', y > 300))
        lastY = y
      })
    }
    win.addEventListener('scroll', onScroll, { passive: true })
    win.addEventListener('resize', onScroll)
    cleanups.push(() => {
      win.removeEventListener('scroll', onScroll)
      win.removeEventListener('resize', onScroll)
      win.cancelAnimationFrame(raf)
    })

    // ---------- quét phần tử (lần đầu + khi DOM đổi) ----------
    const scan = () => {
      root.querySelectorAll('[data-fx-reveal]').forEach((el) => io.observe(el))
      root.querySelectorAll('[data-fx-text]').forEach((el) => {
        if ((el as HTMLElement).dataset.fxText === 'shimmer') return
        textIo.observe(el)
      })
      onScroll()
    }
    scan()
    const mo = new win.MutationObserver((records) => {
      // phần tử text vừa render lại (sửa chữ) thì chạy lại hiệu ứng
      for (const r of records) r.addedNodes.forEach((n) => n instanceof win.HTMLElement && n.matches('[data-fx-text]') && seen.delete(n))
      scan()
    })
    mo.observe(root, { childList: true, subtree: true })
    cleanups.push(() => mo.disconnect())

    // ---------- Tương tác của block (delegated click) ----------
    const closeMenus = (except?: Element | null) =>
      root.querySelectorAll<HTMLElement>('[data-menu].is-open').forEach((m) => {
        if (m !== except) {
          m.classList.remove('is-open')
          m.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false')
        }
      })
    const toastTimers = new WeakMap<Element, number>()
    const showToast = (host: HTMLElement) => {
      const el = host.querySelector<HTMLElement>('[data-toast-el]')
      if (!el) return
      el.classList.add('is-visible')
      const prev = toastTimers.get(el)
      if (prev) win.clearTimeout(prev)
      toastTimers.set(el, win.setTimeout(() => el.classList.remove('is-visible'), (parseFloat(host.dataset.toastDuration ?? '4') || 4) * 1000))
    }
    const scrollCarousel = (track: HTMLElement, index: number) => {
      const slide = track.children[index] as HTMLElement | undefined
      if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' })
    }
    const carouselIndex = (track: HTMLElement) => {
      const w = (track.children[0] as HTMLElement | undefined)?.offsetWidth || 1
      return Math.round(track.scrollLeft / w)
    }
    const editor = mode === 'editor'

    // trạng thái mở của mục accordion lúc nhấn chuột (editor có thể mở mục ngay khi chọn, trước sự kiện click)
    let accordionWasOpen: boolean | null = null
    const onPointerDown = (e: PointerEvent) => {
      const summary = (e.target as HTMLElement).closest?.('[data-accordion-toggle]')
      accordionWasOpen = summary ? (summary.closest('details') as HTMLDetailsElement).open : null
    }
    doc.addEventListener('pointerdown', onPointerDown, true)
    cleanups.push(() => doc.removeEventListener('pointerdown', onPointerDown, true))

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const hit = (sel: string) => t.closest<HTMLElement>(sel)
      // accordion (toggle thủ công vì editor chặn hành vi mặc định)
      const summary = hit('[data-accordion-toggle]')
      if (summary) {
        e.preventDefault()
        const item = summary.closest<HTMLDetailsElement>('details')!
        const acc = item.closest<HTMLElement>('[data-accordion]')
        const willOpen = !(accordionWasOpen ?? item.open)
        accordionWasOpen = null
        if (willOpen && acc?.dataset.accordion === 'single') acc.querySelectorAll<HTMLDetailsElement>(':scope > details[open]').forEach((d) => (d.open = false))
        item.open = willOpen
        return
      }
      // carousel
      const prev = hit('[data-carousel-prev]')
      const next = hit('[data-carousel-next]')
      const dot = hit('[data-carousel-dot]')
      if (prev || next || dot) {
        const track = (prev ?? next ?? dot)!.closest('[data-carousel]')!.querySelector<HTMLElement>('[data-carousel-track]')!
        const n = track.children.length
        const cur = carouselIndex(track)
        scrollCarousel(track, dot ? Number(dot.dataset.carouselDot) : prev ? (cur - 1 + n) % n : (cur + 1) % n)
        return
      }
      // header drawer
      const drawer = hit('[data-drawer-toggle]')
      if (drawer) {
        const header = drawer.closest<HTMLElement>('.b-header')!
        const open = header.classList.toggle('is-open')
        header.querySelector('[data-drawer-toggle][aria-expanded]')?.setAttribute('aria-expanded', String(open))
        return
      }
      // toggle group (không có link)
      const tbtn = hit('[data-toggle-group] .b-toggle-btn')
      if (tbtn && tbtn.tagName === 'BUTTON') {
        tbtn.parentElement!.querySelectorAll('.b-toggle-btn').forEach((b) => {
          b.classList.toggle('is-active', b === tbtn)
          b.setAttribute('aria-pressed', String(b === tbtn))
        })
        return
      }
      // đóng alert / chip / toast
      const dismiss = hit('[data-dismiss]')
      if (dismiss) {
        const target = dismiss.closest<HTMLElement>('[data-dismissible], .b-tag, [data-toast-el]')
        if (target) {
          if (target.matches('[data-toast-el]')) target.classList.remove('is-visible')
          else target.classList.add('is-dismissed'), (target.style.display = 'none')
        }
        return
      }
      // mật khẩu: mắt
      const eye = hit('[data-toggle-password]')
      if (eye) {
        const input = eye.parentElement?.querySelector('input')
        if (input) input.type = input.type === 'password' ? 'text' : 'password'
        return
      }
      if (editor) return // phần dưới chỉ chạy trên trang thật (editor render sẵn trạng thái mở)
      // menu / popover / dropdown
      const toggle = hit('[data-menu-toggle]')
      if (toggle) {
        const menu = toggle.closest<HTMLElement>('[data-menu]')!
        const open = !menu.classList.contains('is-open')
        closeMenus(menu)
        menu.classList.toggle('is-open', open)
        toggle.setAttribute('aria-expanded', String(open))
        return
      }
      // drill-down menu
      const cascadeItem = hit('[data-cascade=drilldown] [data-cascade-item]')
      if (cascadeItem && cascadeItem.querySelector('.b-menu-sub') && t.closest('.b-menu-item') === cascadeItem.querySelector(':scope > .b-menu-item')) {
        e.preventDefault()
        const rootList = cascadeItem.closest<HTMLElement>('[data-cascade-root]')!
        rootList.classList.add('is-drilled')
        cascadeItem.classList.add('is-active')
        const back = rootList.parentElement?.querySelector<HTMLElement>('[data-cascade-back]')
        if (back) back.hidden = false
        return
      }
      const back = hit('[data-cascade-back]')
      if (back) {
        const rootList = back.parentElement?.querySelector<HTMLElement>('[data-cascade-root]')
        rootList?.classList.remove('is-drilled')
        rootList?.querySelectorAll('.is-active').forEach((li) => li.classList.remove('is-active'))
        back.hidden = true
        return
      }
      const cascader = hit('[data-cascade=cascader] [data-cascade-item]')
      if (cascader) {
        cascader.parentElement?.querySelectorAll(':scope > .is-active').forEach((li) => li.classList.remove('is-active'))
        cascader.classList.add('is-active')
      }
      // dialog
      const dopen = hit('[data-dialog-open]')
      if (dopen) {
        dopen.closest('.b-dialog-host')?.querySelector<HTMLDialogElement>('dialog[data-dialog]')?.showModal()
        return
      }
      const dclose = hit('[data-dialog-close]')
      if (dclose) {
        dclose.closest<HTMLDialogElement>('dialog')?.close()
        return
      }
      // toast
      const topen = hit('[data-toast-open]')
      if (topen) {
        showToast(topen.closest<HTMLElement>('[data-toast]')!)
        return
      }
      // lightbox
      const litem = hit('[data-lightbox-item]')
      if (litem) {
        const gallery = litem.closest<HTMLElement>('[data-lightbox]')!
        const dialog = gallery.querySelector<HTMLDialogElement>('[data-lightbox-dialog]')
        if (!dialog) return
        const list = [...gallery.querySelectorAll<HTMLElement>('[data-lightbox-item]')]
        const show = (i: number) => {
          const it = list[(i + list.length) % list.length]
          dialog.dataset.index = String((i + list.length) % list.length)
          dialog.querySelector<HTMLImageElement>('[data-lightbox-img]')!.src = it.dataset.src ?? ''
          dialog.querySelector<HTMLElement>('[data-lightbox-caption]')!.textContent = it.dataset.caption ?? ''
        }
        show(list.indexOf(litem))
        dialog.showModal()
        ;(dialog as HTMLDialogElement & { _show?: (i: number) => void })._show = show
        return
      }
      const lnav = hit('[data-lightbox-prev], [data-lightbox-next], [data-lightbox-close]')
      if (lnav) {
        const dialog = lnav.closest<HTMLDialogElement & { _show?: (i: number) => void }>('dialog')!
        if (lnav.hasAttribute('data-lightbox-close')) dialog.close()
        else dialog._show?.(Number(dialog.dataset.index ?? 0) + (lnav.hasAttribute('data-lightbox-next') ? 1 : -1))
        return
      }
      // command palette
      const copen = hit('[data-cmdk-open]')
      if (copen) {
        const dialog = copen.closest('[data-cmdk]')?.querySelector<HTMLDialogElement>('[data-cmdk-dialog]')
        dialog?.showModal()
        dialog?.querySelector<HTMLInputElement>('[data-cmdk-input]')?.focus()
        return
      }
      // product tour
      const tstart = hit('[data-tour-start]')
      if (tstart) {
        startTour(tstart.closest<HTMLElement>('[data-tour]')!)
        return
      }
      const tnav = hit('[data-tour-next], [data-tour-prev], [data-tour-skip]')
      if (tnav) {
        tourStep(tnav.hasAttribute('data-tour-skip') ? Infinity : tnav.hasAttribute('data-tour-next') ? 1 : -1)
        return
      }
      // link #logout: đăng xuất khỏi Payload rồi tải lại
      const logout = hit('a[href="#logout"]')
      if (logout) {
        e.preventDefault()
        fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).finally(() => win.location.reload())
        return
      }
      // bấm ngoài: đóng menu; bấm vào backdrop của dialog: đóng
      if (!t.closest('[data-menu]')) closeMenus()
      if (t instanceof win.HTMLDialogElement && t.matches('.b-dialog-el, .b-lightbox-dlg, .b-cmdk-dialog')) t.close()
    }
    doc.addEventListener('click', onClick)
    cleanups.push(() => doc.removeEventListener('click', onClick))

    // Escape đóng menu
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenus()
      if (!editor && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const dialog = root.querySelector<HTMLDialogElement>('[data-cmdk-dialog]')
        if (dialog) {
          e.preventDefault()
          if (dialog.open) dialog.close()
          else {
            dialog.showModal()
            dialog.querySelector<HTMLInputElement>('[data-cmdk-input]')?.focus()
          }
        }
      }
    }
    doc.addEventListener('keydown', onKeyDown)
    cleanups.push(() => doc.removeEventListener('keydown', onKeyDown))

    // command palette: lọc
    const onInput = (e: Event) => {
      const input = e.target as HTMLInputElement
      if (input.matches('[data-cmdk-input]')) {
        const q = input.value.trim().toLowerCase()
        const list = input.closest('.b-cmdk-panel')!
        let n = 0
        list.querySelectorAll<HTMLElement>('[data-cmdk-item]').forEach((it) => {
          const show = !q || (it.textContent ?? '').toLowerCase().includes(q)
          it.hidden = !show
          if (show) n++
        })
        list.querySelectorAll<HTMLElement>('.b-cmdk-group').forEach((g) => (g.hidden = ![...g.querySelectorAll<HTMLElement>('[data-cmdk-item]')].some((i) => !i.hidden)))
        const empty = list.querySelector<HTMLElement>('.b-cmdk-empty')
        if (empty) empty.hidden = n > 0
      }
      // multi-select: hiện chip các giá trị đã chọn
      if (input.matches('.b-multi-native')) {
        const chips = input.parentElement?.querySelector('[data-multi-chips]')
        if (chips) chips.innerHTML = [...(input as unknown as HTMLSelectElement).selectedOptions].map((o) => `<span>${o.textContent}</span>`).join('')
      }
    }
    doc.addEventListener('input', onInput)
    doc.addEventListener('change', onInput)
    cleanups.push(() => {
      doc.removeEventListener('input', onInput)
      doc.removeEventListener('change', onInput)
    })

    // carousel: cập nhật chấm khi cuộn + tự chạy
    const carouselTimers: number[] = []
    const onTrackScroll = (e: Event) => {
      const track = e.target as HTMLElement
      if (!track.matches?.('[data-carousel-track]')) return
      const i = carouselIndex(track)
      track.closest('[data-carousel]')?.querySelectorAll('[data-carousel-dot]').forEach((d, j) => d.classList.toggle('is-active', j === i))
    }
    doc.addEventListener('scroll', onTrackScroll, true)
    cleanups.push(() => doc.removeEventListener('scroll', onTrackScroll, true))
    if (!editor)
      root.querySelectorAll<HTMLElement>('[data-carousel][data-autoplay]').forEach((c) => {
        const track = c.querySelector<HTMLElement>('[data-carousel-track]')!
        carouselTimers.push(win.setInterval(() => !c.matches(':hover') && scrollCarousel(track, (carouselIndex(track) + 1) % track.children.length), (parseFloat(c.dataset.autoplay ?? '5') || 5) * 1000))
      })
    cleanups.push(() => carouselTimers.forEach((t) => win.clearInterval(t)))

    // toast khi vào trang
    if (!editor) root.querySelectorAll<HTMLElement>('[data-toast][data-toast-trigger=load]').forEach((h) => win.setTimeout(() => showToast(h), 1000))

    // form: gửi JSON tới form-submissions (hoặc action riêng)
    const onSubmit = async (e: Event) => {
      const form = e.target as HTMLFormElement
      if (editor) {
        e.preventDefault()
        return
      }
      if (form.matches('[data-signin]')) {
        // Sign-in Form không có action: đăng nhập vào Payload (cookie) rồi tải lại trang
        e.preventDefault()
        const fd = new FormData(form)
        const btn = form.querySelector<HTMLButtonElement>('.b-signin-submit')
        let msg = form.querySelector<HTMLElement>('.b-form-msg')
        if (!msg) {
          msg = doc.createElement('p')
          msg.className = 'b-form-msg'
          form.append(msg)
        }
        if (btn) btn.disabled = true
        try {
          const res = await fetch('/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }) })
          if (!res.ok) throw new Error(String(res.status))
          msg.textContent = 'Đăng nhập thành công, đang tải lại…'
          msg.classList.remove('is-error')
          win.location.reload()
        } catch {
          msg.textContent = 'Email hoặc mật khẩu không đúng.'
          msg.classList.add('is-error')
          if (btn) btn.disabled = false
        }
        return
      }
      if (!form.matches('[data-form]')) return
      e.preventDefault()
      const msg = form.querySelector<HTMLElement>('.b-form-msg')!
      let valid = true
      form.querySelectorAll<HTMLElement>('[data-field]').forEach((f) => {
        const inputs = [...f.querySelectorAll<HTMLInputElement>('input, select, textarea')]
        const filled = inputs.some((i) => (i.type === 'checkbox' || i.type === 'radio' ? i.checked : i.value.trim() !== ''))
        const required = f.hasAttribute('data-required')
        const email = inputs.find((i) => i.type === 'email')
        const badEmail = !!email && email.value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
        const ok = (!required || filled) && !badEmail
        f.classList.toggle('is-error', !ok)
        const err = f.querySelector<HTMLElement>('[data-field-error]')
        if (err) {
          err.hidden = ok
          if (badEmail) err.textContent = 'Email không hợp lệ'
        }
        if (!ok) valid = false
      })
      if (!valid) {
        form.querySelector<HTMLElement>('.is-error input, .is-error select, .is-error textarea')?.focus()
        return
      }
      const fd = new FormData(form)
      if (String(fd.get('website') ?? '')) return // honeypot
      fd.delete('website')
      const data: Record<string, unknown> = {}
      for (const [k, v] of fd.entries()) {
        if (typeof v !== 'string') continue
        if (k in data) data[k] = ([] as string[]).concat(data[k] as string[], v)
        else data[k] = v
      }
      const btn = form.querySelector<HTMLButtonElement>('.b-form-submit')
      if (btn) btn.disabled = true
      msg.hidden = true
      try {
        const action = form.dataset.formAction
        const res = action
          ? await fetch(action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          : await fetch('/api/form-submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form: form.dataset.form, page: win.location.pathname, data }) })
        if (!res.ok) throw new Error(String(res.status))
        msg.textContent = form.dataset.formSuccess || 'Đã gửi.'
        msg.classList.remove('is-error')
        msg.hidden = false
        form.reset()
      } catch {
        msg.textContent = 'Gửi thất bại, vui lòng thử lại.'
        msg.classList.add('is-error')
        msg.hidden = false
      } finally {
        if (btn) btn.disabled = false
      }
    }
    doc.addEventListener('submit', onSubmit)
    cleanups.push(() => doc.removeEventListener('submit', onSubmit))

    // ---------- Product tour ----------
    let tour: { steps: { target: string; title: string; text: string }[]; i: number; spot: HTMLElement; card: HTMLElement } | null = null
    const endTour = () => {
      tour?.spot.remove()
      tour?.card.remove()
      tour = null
    }
    const tourStep = (delta: number) => {
      if (!tour) return
      const i = tour.i + delta
      if (i < 0 || i >= tour.steps.length) return endTour()
      tour.i = i
      const step = tour.steps[i]
      const target = step.target ? doc.getElementById(step.target) : null
      if (!target) return tourStep(delta > 0 ? 1 : -1)
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const r = target.getBoundingClientRect()
      const top = r.top + win.scrollY
      Object.assign(tour.spot.style, { left: `${r.left - 6}px`, top: `${top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px` })
      tour.card.innerHTML = `<b></b><span></span><div class="b-tour-card-foot"><small>${i + 1} / ${tour.steps.length}</small><span><button type="button" class="b-tour-skip" data-tour-skip>Bỏ qua</button> ${i > 0 ? '<button type="button" data-tour-prev>Trước</button> ' : ''}<button type="button" data-tour-next>${i === tour.steps.length - 1 ? 'Xong' : 'Tiếp'}</button></span></div>`
      tour.card.querySelector('b')!.textContent = step.title
      tour.card.querySelector('span')!.textContent = step.text
      const below = top + r.height + 12
      Object.assign(tour.card.style, { left: `${Math.max(12, Math.min(r.left, win.innerWidth - 340))}px`, top: `${below}px` })
    }
    const startTour = (host: HTMLElement) => {
      endTour()
      let steps: { target: string; title: string; text: string }[] = []
      try {
        steps = JSON.parse(host.dataset.tour ?? '[]')
      } catch {
        return
      }
      if (!steps.length) return
      const spot = doc.createElement('div')
      spot.className = 'b-tour-spot'
      const card = doc.createElement('div')
      card.className = 'b-tour-card'
      root.append(spot, card)
      tour = { steps, i: -1, spot, card }
      tourStep(1)
    }
    if (!editor) {
      const auto = root.querySelector<HTMLElement>('[data-tour][data-tour-auto]')
      const key = 'bld-tour-' + win.location.pathname
      if (auto && !win.localStorage?.getItem(key)) {
        win.setTimeout(() => startTour(auto), 800)
        try {
          win.localStorage.setItem(key, '1')
        } catch {
          /* private mode */
        }
      }
    }
    cleanups.push(endTour)

    // editor: cho phép "Xem thử" bằng sự kiện tuỳ biến
    const replay = (e: Event) => {
      const el = (e as CustomEvent<string>).detail ? doc.querySelector<HTMLElement>(`[data-node-id="${(e as CustomEvent<string>).detail}"]`) : null
      if (!el) return
      el.classList.remove('is-in')
      void el.offsetWidth
      if (el.dataset.fxReveal) el.classList.add('is-in')
      if (el.dataset.fxText) {
        seen.delete(el)
        runText(el)
      }
    }
    doc.addEventListener('bld:replay', replay)
    cleanups.push(() => doc.removeEventListener('bld:replay', replay))

    return () => cleanups.forEach((fn) => fn())
  }, [mode])
  return <span ref={ref} hidden data-builder-runtime="" />
}
