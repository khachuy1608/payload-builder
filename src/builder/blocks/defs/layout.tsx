/**
 * Block bố cục & điều hướng (render tĩnh, tương tác nhỏ do blocks/Runtime.tsx xử lý qua data-attribute).
 * Tên gọi theo namethatui.com: Masonry, Bento Grid, Card, Marquee, Carousel, Accordion, Site Header / Navigation Bar
 * (có Hamburger Menu / Nav Drawer), Breadcrumbs, Pagination, Steps, Toggle Group, Bottom Navigation,
 * Floating Action Button / Chat Launcher / Back-to-Top, Scrollspy, Waffle Menu, Submenu / Cascader / Drill-Down.
 */
import {
  ArrowUpCircle,
  ChevronsRight,
  CreditCard,
  GalleryHorizontal,
  Grid3X3,
  LayoutDashboard,
  LayoutGrid,
  ListCollapse,
  ListOrdered,
  ListTree,
  Menu,
  MoreHorizontal,
  Navigation,
  PanelBottom,
  Route,
  ScrollText,
  ToggleLeft,
} from 'lucide-react'
import { genId } from '../../tree'
import type { BuilderNode, MediaValue } from '../../types'
import { bool, ContainerRender, EditorOnly, Icon, items, num, safeHref, safeId, text } from '../helpers'
import type { BlockDefinition } from '../types'

const node = (type: string, props: Record<string, unknown>, styles: BuilderNode['styles'] = {}, children?: BuilderNode[]): BuilderNode => ({
  id: genId(),
  type,
  props,
  styles,
  ...(children ? { children } : {}),
})
const CONTAINER_GROUPS = ['layout', 'size', 'spacing', 'background', 'border', 'effects', 'position', 'child']
const BOX_GROUPS = ['typography', 'size', 'spacing', 'background', 'border', 'effects', 'position', 'child']

const sampleCard = (title: string, body: string, extra: Record<string, string> = {}) =>
  node('div', {}, { desktop: { padding: '20px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', ...extra } }, [
    node('heading', { text: title, tag: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', marginBottom: '6px' } }),
    node('paragraph', { text: body }, { desktop: { color: 'var(--color-muted)', fontSize: '14px' } }),
  ])

type Link = { label?: string; href?: string; badge?: string; icon?: string; group?: string; description?: string }

export const LAYOUT_BLOCKS: BlockDefinition[] = [
  {
    type: 'masonry',
    label: 'Masonry',
    category: 'layout',
    icon: LayoutDashboard,
    defaults: () => ({
      props: { columns: '3', gap: '16' },
      styles: {},
      children: [1, 2, 3, 4, 5, 6].map((i) => sampleCard(`Thẻ ${i}`, i % 2 ? 'Thẻ cao thấp khác nhau được xếp sát vào cột, không để trống hàng như lưới thường.' : 'Ngắn gọn.')),
    }),
    contentControls: [
      { type: 'select', prop: 'columns', label: 'Số cột', options: ['2', '3', '4', '5'].map((v) => ({ value: v, label: v + ' cột' })) },
      { type: 'number', prop: 'gap', label: 'Khoảng cách (px)', min: 0, max: 80 },
      { type: 'custom', component: 'data' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: CONTAINER_GROUPS,
    Render: ({ node, attrs, children }) => (
      <div {...attrs} className={attrs.className + ' b-masonry'} style={{ columnCount: num(node.props.columns, 3), columnGap: num(node.props.gap, 16), ['--gap' as string]: `${num(node.props.gap, 16)}px` } as React.CSSProperties}>
        {children}
      </div>
    ),
  },
  {
    type: 'bento',
    label: 'Bento Grid',
    category: 'layout',
    icon: LayoutGrid,
    defaults: () => ({
      props: { columns: '4', rowHeight: '140', gap: '16' },
      styles: {},
      children: [
        sampleCard('Doanh thu', '$48.2k – tăng 12% so với tháng trước.', { gridColumn: 'span 2', gridRow: 'span 2' }),
        sampleCard('Người dùng', '2.4k'),
        sampleCard('Tăng trưởng', '↑ 12%'),
        sampleCard('Hôm nay', '+9 đăng ký mới', { gridColumn: 'span 2' }),
      ],
    }),
    contentControls: [
      { type: 'select', prop: 'columns', label: 'Số cột', options: ['2', '3', '4', '6'].map((v) => ({ value: v, label: v + ' cột' })) },
      { type: 'number', prop: 'rowHeight', label: 'Chiều cao hàng tối thiểu (px)', min: 40, max: 600 },
      { type: 'number', prop: 'gap', label: 'Khoảng cách (px)', min: 0, max: 80, help: 'Chọn một ô con rồi vào Kiểu → “Trong flex cha” để đặt Cột/Hàng (vd: span 2).' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: CONTAINER_GROUPS,
    Render: ({ node, attrs, children }) => (
      <div
        {...attrs}
        className={attrs.className + ' b-bento'}
        style={{ gridTemplateColumns: `repeat(${num(node.props.columns, 4)}, minmax(0, 1fr))`, gridAutoRows: `minmax(${num(node.props.rowHeight, 140)}px, auto)`, gap: num(node.props.gap, 16) }}
      >
        {children}
      </div>
    ),
  },
  {
    type: 'card',
    label: 'Card',
    category: 'layout',
    icon: CreditCard,
    defaults: () => ({
      props: { media: null, mediaPosition: 'top', href: '' },
      styles: { desktop: { backgroundColor: 'var(--color-background)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' } },
      children: [
        node('heading', { text: 'Tiêu đề thẻ', tag: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', marginBottom: '6px' } }),
        node('paragraph', { text: 'Thẻ gồm media, tiêu đề, phần thân và chân thẻ. Kéo thêm phần tử vào đây.' }, { desktop: { color: 'var(--color-muted)', marginBottom: '14px' } }),
        node('button', { text: 'Đọc tiếp', href: '#', newTab: false }, { desktop: { backgroundColor: 'var(--color-primary)', color: '#ffffff', padding: '10px 18px' } }),
      ],
    }),
    contentControls: [
      { type: 'media', prop: 'media', label: 'Ảnh (media)' },
      { type: 'select', prop: 'mediaPosition', label: 'Vị trí ảnh', options: [{ value: 'top', label: 'Trên' }, { value: 'left', label: 'Trái' }, { value: 'right', label: 'Phải' }] },
      { type: 'custom', component: 'data' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: CONTAINER_GROUPS,
    Render: ({ node, attrs, children }) => {
      const raw = node.props.media
      const media = raw && typeof raw === 'object' ? (raw as MediaValue) : null
      const pos = text(node.props.mediaPosition, 'top')
      return (
        <div {...attrs} className={`${attrs.className} b-card b-card--${media?.url ? pos : 'none'}`}>
          {media?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="b-card-media" src={media.url} alt={media.alt ?? ''} loading="lazy" />
          )}
          <div className="b-card-body">{children}</div>
        </div>
      )
    },
  },
  {
    type: 'marquee',
    label: 'Marquee',
    category: 'layout',
    icon: ChevronsRight,
    defaults: () => ({
      props: { speed: '25', direction: 'left', pauseOnHover: true },
      styles: { desktop: { padding: '16px 0' } },
      children: ['▲ Vertex', '● Orbit', '■ Quadra', '✦ Nova', '◆ Prism', '⬢ Hexal'].map((t) => node('heading', { text: t, tag: 'span' }, { desktop: { fontSize: '22px', fontWeight: '700', padding: '0 32px', whiteSpace: 'nowrap' } })),
    }),
    contentControls: [
      { type: 'number', prop: 'speed', label: 'Thời gian một vòng (giây)', min: 2, max: 120 },
      { type: 'select', prop: 'direction', label: 'Hướng', options: [{ value: 'left', label: 'Sang trái' }, { value: 'right', label: 'Sang phải' }] },
      { type: 'toggle', prop: 'pauseOnHover', label: 'Dừng khi rê chuột' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: CONTAINER_GROUPS,
    Render: ({ node, attrs, children, mode }) => (
      <div
        {...attrs}
        className={`${attrs.className} b-marquee${bool(node.props.pauseOnHover, true) ? ' b-marquee--pause' : ''}${mode === 'editor' ? ' is-static' : ''}`}
        style={{ ['--dur' as string]: `${num(node.props.speed, 25)}s`, ['--dir' as string]: text(node.props.direction) === 'right' ? 'reverse' : 'normal' } as React.CSSProperties}
      >
        <div className="b-marquee-track">
          <div className="b-marquee-group">{children}</div>
          {mode === 'live' && (
            <div className="b-marquee-group" aria-hidden>
              {children}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    type: 'carousel',
    label: 'Carousel',
    category: 'layout',
    icon: GalleryHorizontal,
    defaults: () => ({
      props: { autoplay: false, interval: '5', showArrows: true, showDots: true, perView: '1' },
      styles: {},
      children: ['Dunes', 'Reef', 'Meadow'].map((t, i) =>
        node('slide', {}, { desktop: { padding: '64px 24px', minHeight: '260px', backgroundColor: ['#e0e7ff', '#ccfbf1', '#fef3c7'][i], textAlign: 'center' } }, [
          node('heading', { text: t, tag: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700' } }),
          node('paragraph', { text: `Slide ${i + 1} / 3 – kéo phần tử vào slide để tuỳ biến.` }),
        ]),
      ),
    }),
    contentControls: [
      { type: 'select', prop: 'perView', label: 'Số slide hiện cùng lúc', options: ['1', '2', '3'].map((v) => ({ value: v, label: v })) },
      { type: 'toggle', prop: 'showArrows', label: 'Hiện mũi tên' },
      { type: 'toggle', prop: 'showDots', label: 'Hiện chấm điều hướng' },
      { type: 'toggle', prop: 'autoplay', label: 'Tự chạy' },
      { type: 'number', prop: 'interval', label: 'Giây mỗi slide (tự chạy)', min: 1, max: 60 },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: ['size', 'spacing', 'background', 'border', 'effects', 'position', 'child'],
    Render: ({ node, attrs, children, mode }) => {
      const slides = node.children ?? []
      return (
        <div
          {...attrs}
          className={attrs.className + ' b-carousel'}
          role="region"
          aria-roledescription="carousel"
          data-carousel=""
          data-autoplay={bool(node.props.autoplay) && mode === 'live' ? num(node.props.interval, 5) : undefined}
          style={{ ['--per-view' as string]: String(num(node.props.perView, 1)) } as React.CSSProperties}
        >
          <div className="b-carousel-track" data-carousel-track="">
            {children}
          </div>
          {bool(node.props.showArrows, true) && slides.length > 1 && (
            <>
              <button type="button" className="b-carousel-arrow b-carousel-arrow--prev" data-carousel-prev="" aria-label="Slide trước">
                <Icon name="chevronLeft" />
              </button>
              <button type="button" className="b-carousel-arrow b-carousel-arrow--next" data-carousel-next="" aria-label="Slide sau">
                <Icon name="chevronRight" />
              </button>
            </>
          )}
          {bool(node.props.showDots, true) && slides.length > 1 && (
            <div className="b-carousel-dots" role="tablist">
              {slides.map((s, i) => (
                <button key={s.id} type="button" className={`b-carousel-dot${i === 0 ? ' is-active' : ''}`} data-carousel-dot={i} data-tab-index={i} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      )
    },
  },
  {
    type: 'slide',
    label: 'Slide',
    category: 'layout',
    icon: GalleryHorizontal,
    defaults: () => ({ props: {}, styles: { desktop: { padding: '48px 24px', minHeight: '220px' } }, children: [] }),
    contentControls: [{ type: 'custom', component: 'children' }],
    styleGroups: CONTAINER_GROUPS,
    Render: ({ attrs, children }) => (
      <div {...attrs} className={attrs.className + ' b-slide'} role="group" aria-roledescription="slide">
        {children}
      </div>
    ),
  },
  {
    type: 'accordion',
    label: 'Accordion',
    category: 'layout',
    icon: ListCollapse,
    defaults: () => ({
      props: { single: true },
      styles: {},
      children: [
        ['Component là gì?', 'Một phần giao diện dùng lại được, có cấu trúc và hành vi riêng.'],
        ['Design token là gì?', 'Một giá trị có tên cho màu, khoảng cách, chữ hoặc quyết định thiết kế khác.'],
        ['Vì sao cần gọi tên pattern?', 'Tên dùng chung giúp đội thiết kế và lập trình nói cùng một ngôn ngữ.'],
      ].map(([t, b], i) => node('accordionItem', { title: t, open: i === 0 }, {}, [node('paragraph', { text: b })])),
    }),
    contentControls: [
      { type: 'toggle', prop: 'single', label: 'Chỉ mở một mục mỗi lúc', help: 'Thêm mục bằng cách nhân bản một mục trong cây Cấu trúc.' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: ['typography', 'size', 'spacing', 'background', 'border', 'effects', 'position', 'child'],
    Render: ({ node, attrs, children }) => (
      <div {...attrs} className={attrs.className + ' b-accordion'} data-accordion={bool(node.props.single, true) ? 'single' : 'multiple'}>
        {children}
      </div>
    ),
  },
  {
    type: 'accordionItem',
    label: 'Mục Accordion',
    category: 'layout',
    icon: ListCollapse,
    defaults: () => ({ props: { title: 'Câu hỏi mới', open: false }, styles: {}, children: [] }),
    contentControls: [
      { type: 'text', prop: 'title', label: 'Tiêu đề' },
      { type: 'toggle', prop: 'open', label: 'Mở sẵn' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: ['typography', 'spacing', 'background', 'border'],
    inlineEdit: { prop: 'title' },
    Render: ({ node, attrs, children }) => {
      const idx = 0
      return (
        <details {...attrs} className={attrs.className + ' b-acc-item'} open={bool(node.props.open) || undefined}>
          <summary className="b-acc-summary" data-tab-index={idx} data-accordion-toggle="">
            <span>{text(node.props.title)}</span>
            <Icon name="chevronDown" className="b-acc-chevron" />
          </summary>
          <div className="b-acc-panel">{children}</div>
        </details>
      )
    },
  },

  // ===================== Điều hướng =====================
  {
    type: 'header',
    label: 'Site Header / Navbar',
    category: 'nav',
    icon: Menu,
    defaults: () => ({
      props: {
        brand: 'Field Notes',
        brandHref: '/',
        logo: null,
        links: [
          { label: 'Trang chủ', href: '/' },
          { label: 'Bài viết', href: '#' },
          { label: 'Lưu trữ', href: '#' },
          { label: 'Giới thiệu', href: '#' },
        ],
        ctaText: 'Đăng nhập',
        ctaHref: '#',
        sticky: true,
        drawerSide: 'right',
      },
      styles: { desktop: { backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)', padding: '0 24px' } },
    }),
    contentControls: [
      { type: 'text', prop: 'brand', label: 'Tên thương hiệu' },
      { type: 'media', prop: 'logo', label: 'Logo (tuỳ chọn)' },
      { type: 'url', prop: 'brandHref', label: 'Link thương hiệu' },
      { type: 'list', prop: 'links', label: 'Liên kết (Navigation Bar)', itemLabel: 'Liên kết', fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'href', label: 'Link', type: 'url' }] },
      { type: 'text', prop: 'ctaText', label: 'Nút hành động (để trống = ẩn)' },
      { type: 'url', prop: 'ctaHref', label: 'Link nút' },
      { type: 'toggle', prop: 'sticky', label: 'Dính trên cùng khi cuộn', help: 'Muốn ẩn khi cuộn xuống: bật “Ẩn khi cuộn” trong Kiểu → Hiệu ứng.' },
      { type: 'select', prop: 'drawerSide', label: 'Ngăn kéo (mobile) mở từ', options: [{ value: 'right', label: 'Phải' }, { value: 'left', label: 'Trái' }] },
    ],
    styleGroups: ['typography', 'size', 'spacing', 'background', 'border', 'effects', 'position'],
    Render: ({ node, attrs }) => {
      const links = items<Link>(node.props.links)
      const logo = node.props.logo as MediaValue | null
      const id = `nav-${node.id}`
      return (
        <header {...attrs} className={`${attrs.className} b-header${bool(node.props.sticky, true) ? ' b-header--sticky' : ''}`} data-drawer-side={text(node.props.drawerSide, 'right')}>
          <div className="b-header-inner">
            <a className="b-header-brand" href={safeHref(node.props.brandHref) ?? '/'}>
              {logo?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.url} alt={logo.alt ?? ''} />
              )}
              {text(node.props.brand)}
            </a>
            <nav className="b-header-nav" id={id} aria-label="Điều hướng chính">
              {links.map((l, i) => (
                <a key={i} href={safeHref(l.href) ?? '#'}>
                  {text(l.label)}
                </a>
              ))}
              {text(node.props.ctaText) && (
                <a className="b-button b-header-cta" href={safeHref(node.props.ctaHref) ?? '#'}>
                  {text(node.props.ctaText)}
                </a>
              )}
            </nav>
            <button type="button" className="b-hamburger" data-drawer-toggle="" aria-expanded="false" aria-controls={id} aria-label="Mở menu">
              <Icon name="menu" size={22} />
            </button>
          </div>
          <div className="b-header-scrim" data-drawer-toggle="" />
        </header>
      )
    },
  },
  {
    type: 'breadcrumbs',
    label: 'Breadcrumbs',
    category: 'nav',
    icon: Route,
    defaults: () => ({
      props: { items: [{ label: 'Trang chủ', href: '/' }, { label: 'Thành phần', href: '#' }, { label: 'Nút bấm', href: '' }], separator: '/' },
      styles: {},
    }),
    contentControls: [
      { type: 'list', prop: 'items', label: 'Các cấp', itemLabel: 'Cấp', fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'href', label: 'Link (trống = trang hiện tại)', type: 'url' }] },
      { type: 'select', prop: 'separator', label: 'Dấu phân cách', options: ['/', '›', '→', '•'].map((v) => ({ value: v, label: v })) },
    ],
    styleGroups: BOX_GROUPS,
    Render: ({ node, attrs }) => {
      const list = items<Link>(node.props.items)
      return (
        <nav {...attrs} className={attrs.className + ' b-breadcrumbs'} aria-label="Breadcrumb">
          <ol>
            {list.map((it, i) => {
              const last = i === list.length - 1
              const href = safeHref(it.href)
              return (
                <li key={i}>
                  {href && !last ? <a href={href}>{text(it.label)}</a> : <span aria-current={last ? 'page' : undefined}>{text(it.label)}</span>}
                  {!last && <span className="b-breadcrumbs-sep" aria-hidden>{text(node.props.separator, '/')}</span>}
                </li>
              )
            })}
          </ol>
        </nav>
      )
    },
  },
  {
    type: 'pagination',
    label: 'Pagination',
    category: 'nav',
    icon: MoreHorizontal,
    defaults: () => ({ props: { pages: '8', current: '1', variant: 'numbers', hrefPattern: '?page={n}', showPrevNext: true }, styles: {} }),
    contentControls: [
      { type: 'number', prop: 'pages', label: 'Tổng số trang', min: 1, max: 999 },
      { type: 'number', prop: 'current', label: 'Trang hiện tại', min: 1 },
      { type: 'select', prop: 'variant', label: 'Kiểu', options: [{ value: 'numbers', label: 'Số trang' }, { value: 'dots', label: 'Chấm (page control)' }] },
      { type: 'text', prop: 'hrefPattern', label: 'Mẫu link', placeholder: '?page={n}', help: '{n} được thay bằng số trang.' },
      { type: 'toggle', prop: 'showPrevNext', label: 'Nút Trước / Sau' },
    ],
    styleGroups: BOX_GROUPS,
    Render: ({ node, attrs }) => {
      const total = Math.max(1, Math.min(999, num(node.props.pages, 1)))
      const cur = Math.max(1, Math.min(total, num(node.props.current, 1)))
      const href = (n: number) => (text(node.props.hrefPattern, '?page={n}') || '?page={n}').replace('{n}', String(n)).replace(/[<>"']/g, '')
      const pages: (number | '…')[] = []
      for (let n = 1; n <= total; n++) {
        if (n === 1 || n === total || Math.abs(n - cur) <= 1) pages.push(n)
        else if (pages[pages.length - 1] !== '…') pages.push('…')
      }
      const dots = text(node.props.variant) === 'dots'
      return (
        <nav {...attrs} className={`${attrs.className} b-pagination${dots ? ' b-pagination--dots' : ''}`} aria-label="Phân trang">
          {bool(node.props.showPrevNext, true) && !dots && (
            <a className="b-page-btn" href={href(Math.max(1, cur - 1))} aria-disabled={cur === 1}>
              <Icon name="chevronLeft" size={16} /> Trước
            </a>
          )}
          {dots
            ? Array.from({ length: Math.min(total, 12) }, (_, i) => <a key={i} className={`b-page-dot${i + 1 === cur ? ' is-active' : ''}`} href={href(i + 1)} aria-label={`Trang ${i + 1}`} aria-current={i + 1 === cur ? 'page' : undefined} />)
            : pages.map((p, i) =>
                p === '…' ? (
                  <span key={'e' + i} className="b-page-ellipsis">
                    …
                  </span>
                ) : (
                  <a key={p} className={`b-page-btn${p === cur ? ' is-active' : ''}`} href={href(p)} aria-current={p === cur ? 'page' : undefined}>
                    {p}
                  </a>
                ),
              )}
          {bool(node.props.showPrevNext, true) && !dots && (
            <a className="b-page-btn" href={href(Math.min(total, cur + 1))} aria-disabled={cur === total}>
              Sau <Icon name="chevronRight" size={16} />
            </a>
          )}
        </nav>
      )
    },
  },
  {
    type: 'steps',
    label: 'Steps',
    category: 'nav',
    icon: ListOrdered,
    defaults: () => ({
      props: { items: [{ label: 'Giỏ hàng' }, { label: 'Giao hàng' }, { label: 'Thanh toán' }, { label: 'Xem lại' }], current: '2', orientation: 'horizontal' },
      styles: {},
    }),
    contentControls: [
      { type: 'list', prop: 'items', label: 'Các bước', itemLabel: 'Bước', fields: [{ key: 'label', label: 'Tên bước', type: 'text' }, { key: 'description', label: 'Mô tả', type: 'text' }] },
      { type: 'number', prop: 'current', label: 'Bước hiện tại', min: 1 },
      { type: 'select', prop: 'orientation', label: 'Hướng', options: [{ value: 'horizontal', label: 'Ngang' }, { value: 'vertical', label: 'Dọc' }] },
    ],
    styleGroups: BOX_GROUPS,
    Render: ({ node, attrs }) => {
      const list = items<Link>(node.props.items)
      const cur = num(node.props.current, 1)
      return (
        <ol {...attrs} className={`${attrs.className} b-steps b-steps--${text(node.props.orientation, 'horizontal')}`}>
          {list.map((it, i) => {
            const n = i + 1
            const state = n < cur ? 'done' : n === cur ? 'current' : 'todo'
            return (
              <li key={i} className={`b-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="b-step-circle">{state === 'done' ? <Icon name="check" size={14} /> : n}</span>
                <span className="b-step-text">
                  <span className="b-step-label">{text(it.label)}</span>
                  {text(it.description) && <span className="b-step-desc">{text(it.description)}</span>}
                </span>
              </li>
            )
          })}
        </ol>
      )
    },
  },
  {
    type: 'toggleGroup',
    label: 'Toggle Group',
    category: 'nav',
    icon: ToggleLeft,
    defaults: () => ({ props: { items: [{ label: 'Trái' }, { label: 'Giữa' }, { label: 'Phải' }], selected: '2', variant: 'segmented' }, styles: {} }),
    contentControls: [
      { type: 'list', prop: 'items', label: 'Các lựa chọn', itemLabel: 'Lựa chọn', fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'href', label: 'Link (tuỳ chọn)', type: 'url' }] },
      { type: 'number', prop: 'selected', label: 'Đang chọn (số thứ tự)', min: 1 },
      { type: 'select', prop: 'variant', label: 'Kiểu', options: [{ value: 'segmented', label: 'Segmented control' }, { value: 'pills', label: 'Pills rời' }] },
    ],
    styleGroups: BOX_GROUPS,
    Render: ({ node, attrs }) => {
      const list = items<Link>(node.props.items)
      const sel = num(node.props.selected, 1)
      return (
        <div {...attrs} className={`${attrs.className} b-toggle-group b-toggle-group--${text(node.props.variant, 'segmented')}`} role="group" data-toggle-group="">
          {list.map((it, i) => {
            const href = safeHref(it.href)
            const cls = `b-toggle-btn${i + 1 === sel ? ' is-active' : ''}`
            return href ? (
              <a key={i} className={cls} href={href} aria-pressed={i + 1 === sel}>
                {text(it.label)}
              </a>
            ) : (
              <button key={i} type="button" className={cls} aria-pressed={i + 1 === sel}>
                {text(it.label)}
              </button>
            )
          })}
        </div>
      )
    },
  },
  {
    type: 'bottomNav',
    label: 'Bottom Navigation',
    category: 'nav',
    icon: PanelBottom,
    defaults: () => ({
      props: {
        items: [
          { label: 'Trang chủ', icon: 'home', href: '/' },
          { label: 'Tìm kiếm', icon: 'search', href: '#' },
          { label: 'Hộp thư', icon: 'inbox', href: '#', badge: '3' },
          { label: 'Hồ sơ', icon: 'user', href: '#' },
        ],
        current: '1',
        fixed: false,
      },
      styles: {},
    }),
    contentControls: [
      {
        type: 'list',
        prop: 'items',
        label: 'Các mục (3–5)',
        itemLabel: 'Mục',
        max: 5,
        fields: [
          { key: 'label', label: 'Nhãn', type: 'text' },
          { key: 'icon', label: 'Icon', type: 'select', options: ['home', 'search', 'inbox', 'user', 'chat', 'plus', 'grid'].map((v) => ({ value: v, label: v })) },
          { key: 'href', label: 'Link', type: 'url' },
          { key: 'badge', label: 'Badge (số)', type: 'text' },
        ],
      },
      { type: 'number', prop: 'current', label: 'Mục đang chọn', min: 1 },
      { type: 'toggle', prop: 'fixed', label: 'Cố định dưới màn hình (mobile)' },
    ],
    styleGroups: ['typography', 'background', 'border', 'effects', 'position'],
    Render: ({ node, attrs }) => {
      const list = items<Link>(node.props.items)
      const cur = num(node.props.current, 1)
      return (
        <nav {...attrs} className={`${attrs.className} b-bottom-nav${bool(node.props.fixed) ? ' b-bottom-nav--fixed' : ''}`} aria-label="Điều hướng dưới">
          {list.map((it, i) => (
            <a key={i} href={safeHref(it.href) ?? '#'} className={`b-bottom-nav-item${i + 1 === cur ? ' is-active' : ''}`} aria-current={i + 1 === cur ? 'page' : undefined}>
              <span className="b-bottom-nav-icon">
                <Icon name={text(it.icon, 'home')} size={22} />
                {text(it.badge) && <span className="b-badge-count">{text(it.badge)}</span>}
              </span>
              <span>{text(it.label)}</span>
            </a>
          ))}
        </nav>
      )
    },
  },
  {
    type: 'floatingButton',
    label: 'Floating Button',
    category: 'nav',
    icon: ArrowUpCircle,
    defaults: () => ({ props: { variant: 'backToTop', label: 'Chat với chúng tôi', hint: 'Thường trả lời trong vài phút', href: '#', position: 'right' }, styles: {} }),
    contentControls: [
      {
        type: 'select',
        prop: 'variant',
        label: 'Loại',
        options: [
          { value: 'backToTop', label: 'Back-to-Top – lên đầu trang' },
          { value: 'fab', label: 'Floating Action Button (+)' },
          { value: 'chat', label: 'Chat Launcher' },
        ],
      },
      { type: 'text', prop: 'label', label: 'Nhãn / tooltip' },
      { type: 'text', prop: 'hint', label: 'Dòng phụ (chat launcher)' },
      { type: 'url', prop: 'href', label: 'Link (FAB / chat)' },
      { type: 'select', prop: 'position', label: 'Góc', options: [{ value: 'right', label: 'Phải dưới' }, { value: 'left', label: 'Trái dưới' }] },
    ],
    styleGroups: ['background', 'border', 'effects'],
    Render: ({ node, attrs, mode }) => {
      const variant = text(node.props.variant, 'backToTop')
      const cls = `${attrs.className} b-float b-float--${variant} b-float--${text(node.props.position, 'right')}${mode === 'editor' ? ' is-editor' : ''}`
      if (variant === 'backToTop')
        return (
          <a {...attrs} className={cls} href="#top" data-back-to-top="" aria-label={text(node.props.label, 'Lên đầu trang')}>
            <Icon name="arrowUp" size={20} />
          </a>
        )
      if (variant === 'chat')
        return (
          <a {...attrs} className={cls} href={safeHref(node.props.href) ?? '#'}>
            <span className="b-float-bubble">
              <b>{text(node.props.label, 'Chat')}</b>
              <small>{text(node.props.hint)}</small>
            </span>
            <span className="b-float-circle">
              <Icon name="chat" size={22} />
            </span>
          </a>
        )
      return (
        <a {...attrs} className={cls} href={safeHref(node.props.href) ?? '#'} aria-label={text(node.props.label)} title={text(node.props.label)}>
          <Icon name="plus" size={24} />
        </a>
      )
    },
  },
  {
    type: 'scrollspy',
    label: 'Scrollspy',
    category: 'nav',
    icon: ScrollText,
    defaults: () => ({
      props: { title: 'Trong trang này', items: [{ label: 'Tổng quan', anchor: 'tong-quan' }, { label: 'Cài đặt', anchor: 'cai-dat' }], sticky: true },
      styles: {},
    }),
    contentControls: [
      { type: 'text', prop: 'title', label: 'Tiêu đề' },
      {
        type: 'list',
        prop: 'items',
        label: 'Các mục',
        itemLabel: 'Mục',
        help: 'Anchor = CSS ID của phần tử đích (đặt trong tab Nâng cao của phần tử đó).',
        fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'anchor', label: 'Anchor (CSS ID)', type: 'text', placeholder: 'tong-quan' }],
      },
      { type: 'toggle', prop: 'sticky', label: 'Dính khi cuộn' },
    ],
    styleGroups: BOX_GROUPS,
    Render: ({ node, attrs }) => {
      const list = items<{ label?: string; anchor?: string }>(node.props.items)
      return (
        <nav {...attrs} className={`${attrs.className} b-scrollspy${bool(node.props.sticky, true) ? ' b-scrollspy--sticky' : ''}`} data-scrollspy="" aria-label={text(node.props.title)}>
          {text(node.props.title) && <span className="b-scrollspy-title">{text(node.props.title)}</span>}
          {list.map((it, i) => (
            <a key={i} href={`#${safeId(it.anchor)}`}>
              {text(it.label)}
            </a>
          ))}
        </nav>
      )
    },
  },
  {
    type: 'waffleMenu',
    label: 'Waffle Menu',
    category: 'nav',
    icon: Grid3X3,
    defaults: () => ({
      props: {
        apps: [
          { label: 'Mail', href: '#', color: '#ef4444' },
          { label: 'Lịch', href: '#', color: '#3b82f6' },
          { label: 'Drive', href: '#', color: '#f59e0b' },
          { label: 'Ảnh', href: '#', color: '#10b981' },
          { label: 'Ghi chú', href: '#', color: '#8b5cf6' },
          { label: 'Chat', href: '#', color: '#06b6d4' },
        ],
      },
      styles: {},
    }),
    contentControls: [
      {
        type: 'list',
        prop: 'apps',
        label: 'Ứng dụng',
        itemLabel: 'Ứng dụng',
        fields: [{ key: 'label', label: 'Tên', type: 'text' }, { key: 'href', label: 'Link', type: 'url' }, { key: 'color', label: 'Màu', type: 'color' }],
      },
    ],
    styleGroups: ['background', 'border', 'effects', 'position'],
    Render: ({ node, attrs, mode }) => {
      const apps = items<{ label?: string; href?: string; color?: string }>(node.props.apps)
      return (
        <div {...attrs} className={`${attrs.className} b-waffle${mode === 'editor' ? ' is-open' : ''}`} data-menu="">
          <button type="button" className="b-waffle-btn" data-menu-toggle="" aria-expanded={mode === 'editor'} aria-label="Mở ứng dụng">
            <Icon name="grid" size={22} />
          </button>
          <div className="b-menu-panel b-waffle-panel">
            {apps.map((a, i) => (
              <a key={i} href={safeHref(a.href) ?? '#'} className="b-waffle-app">
                <span style={{ background: /^#[0-9a-fA-F]{3,8}$/.test(text(a.color)) ? a.color : 'var(--color-primary)' }}>{text(a.label).slice(0, 1)}</span>
                {text(a.label)}
              </a>
            ))}
          </div>
        </div>
      )
    },
  },
  {
    type: 'cascadingMenu',
    label: 'Submenu / Cascader',
    category: 'nav',
    icon: ListTree,
    defaults: () => ({
      props: {
        variant: 'submenu',
        buttonText: 'Menu',
        items: [
          { label: 'Cửa hàng', href: '#' },
          { label: 'Nam', href: '#', group: 'Cửa hàng' },
          { label: 'Nữ', href: '#', group: 'Cửa hàng' },
          { label: 'Tạp chí', href: '#' },
          { label: 'Liên hệ', href: '#' },
        ],
      },
      styles: {},
    }),
    contentControls: [
      {
        type: 'select',
        prop: 'variant',
        label: 'Kiểu',
        options: [
          { value: 'submenu', label: 'Submenu – mở sang bên khi rê chuột' },
          { value: 'cascader', label: 'Cascader – các cột cạnh nhau' },
          { value: 'drilldown', label: 'Drill-Down – thay panel, có nút Quay lại' },
        ],
      },
      { type: 'text', prop: 'buttonText', label: 'Nút mở menu' },
      {
        type: 'list',
        prop: 'items',
        label: 'Các mục',
        itemLabel: 'Mục',
        help: '“Thuộc mục cha” = nhãn của mục cấp trên (để trống = cấp 1).',
        fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'href', label: 'Link', type: 'url' }, { key: 'group', label: 'Thuộc mục cha', type: 'text' }],
      },
    ],
    styleGroups: ['typography', 'background', 'border', 'effects', 'position'],
    Render: ({ node, attrs, mode }) => {
      const list = items<Link>(node.props.items)
      const variant = text(node.props.variant, 'submenu')
      const roots = list.filter((it) => !text(it.group))
      const kids = (label: string) => list.filter((it) => text(it.group) === label)
      const link = (it: Link, extra = '') => (
        <a className={'b-menu-item' + extra} href={safeHref(it.href) ?? '#'}>
          {text(it.label)}
          {kids(text(it.label)).length > 0 && <Icon name="chevronRight" size={14} className="b-menu-arrow" />}
        </a>
      )
      return (
        <div {...attrs} className={`${attrs.className} b-cascade b-cascade--${variant}${mode === 'editor' ? ' is-open' : ''}`} data-menu="" data-cascade={variant}>
          <button type="button" className="b-button b-menu-trigger" data-menu-toggle="" aria-expanded={mode === 'editor'}>
            {text(node.props.buttonText, 'Menu')} <Icon name="chevronDown" size={14} />
          </button>
          <div className="b-menu-panel b-cascade-panel">
            {variant === 'drilldown' && (
              <button type="button" className="b-menu-item b-menu-back" data-cascade-back="" hidden>
                <Icon name="chevronLeft" size={14} /> Quay lại
              </button>
            )}
            <ul className="b-menu-list" data-cascade-root="">
              {roots.map((it, i) => (
                <li key={i} className="b-menu-li" data-cascade-item={text(it.label)}>
                  {link(it)}
                  {kids(text(it.label)).length > 0 && (
                    <ul className="b-menu-list b-menu-sub">
                      {kids(text(it.label)).map((c, j) => (
                        <li key={j} className="b-menu-li">
                          {link(c)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
  },
  {
    type: 'overflowMenu',
    label: 'Overflow Menu (⋯)',
    category: 'nav',
    icon: Navigation,
    defaults: () => ({
      props: { variant: 'kebab', items: [{ label: 'Đổi tên…', href: '#' }, { label: 'Nhân bản', href: '#' }, { label: 'Xoá', href: '#', danger: true }] },
      styles: {},
    }),
    contentControls: [
      { type: 'select', prop: 'variant', label: 'Kiểu nút', options: [{ value: 'kebab', label: 'Kebab ⋮ (dọc)' }, { value: 'meatballs', label: 'Meatballs ⋯ (ngang)' }] },
      {
        type: 'list',
        prop: 'items',
        label: 'Các hành động',
        itemLabel: 'Hành động',
        fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'href', label: 'Link', type: 'url' }, { key: 'danger', label: 'Hành động nguy hiểm (đỏ)', type: 'toggle' }],
      },
    ],
    styleGroups: ['background', 'border', 'effects', 'position'],
    Render: ({ node, attrs, mode }) => {
      const list = items<Link & { danger?: boolean }>(node.props.items)
      return (
        <div {...attrs} className={`${attrs.className} b-overflow${mode === 'editor' ? ' is-open' : ''}`} data-menu="">
          <button type="button" className="b-overflow-btn" data-menu-toggle="" aria-expanded={mode === 'editor'} aria-label="Thêm hành động">
            <Icon name={text(node.props.variant) === 'meatballs' ? 'dots' : 'dotsV'} size={20} />
          </button>
          <div className="b-menu-panel" role="menu">
            {list.map((it, i) => (
              <a key={i} role="menuitem" className={`b-menu-item${it.danger ? ' is-danger' : ''}`} href={safeHref(it.href) ?? '#'}>
                {text(it.label)}
              </a>
            ))}
          </div>
        </div>
      )
    },
  },
  {
    type: 'commandPalette',
    label: 'Command Palette',
    category: 'nav',
    icon: ScrollText,
    defaults: () => ({
      props: {
        buttonText: 'Tìm nhanh…',
        placeholder: 'Gõ lệnh hoặc tìm kiếm…',
        items: [
          { label: 'Tạo dự án mới', href: '#', shortcut: '⌘ N', group: 'Gợi ý' },
          { label: 'Mời đồng đội', href: '#', shortcut: '⌘ I', group: 'Gợi ý' },
          { label: 'Mở cài đặt', href: '#', shortcut: '⌘ ,', group: 'Gợi ý' },
        ],
      },
      styles: {},
    }),
    contentControls: [
      { type: 'text', prop: 'buttonText', label: 'Nút mở (hiện phím tắt Ctrl+K)' },
      { type: 'text', prop: 'placeholder', label: 'Placeholder ô tìm' },
      {
        type: 'list',
        prop: 'items',
        label: 'Lệnh',
        itemLabel: 'Lệnh',
        fields: [{ key: 'label', label: 'Tên', type: 'text' }, { key: 'href', label: 'Link', type: 'url' }, { key: 'shortcut', label: 'Phím tắt (hiển thị)', type: 'text' }, { key: 'group', label: 'Nhóm', type: 'text' }],
      },
    ],
    styleGroups: ['background', 'border', 'effects'],
    Render: ({ node, attrs, mode }) => {
      const list = items<Link & { shortcut?: string }>(node.props.items)
      const groups = [...new Set(list.map((it) => text(it.group)))]
      const panel = (
        <div className="b-cmdk-panel" role="dialog" aria-label="Command palette">
          <div className="b-cmdk-input">
            <Icon name="search" size={16} />
            <input type="text" placeholder={text(node.props.placeholder)} data-cmdk-input="" aria-label="Tìm lệnh" />
            <kbd>ESC</kbd>
          </div>
          <div className="b-cmdk-list">
            {groups.map((g) => (
              <div key={g} className="b-cmdk-group">
                {g && <span className="b-cmdk-group-title">{g}</span>}
                {list
                  .filter((it) => text(it.group) === g)
                  .map((it, i) => (
                    <a key={i} className="b-cmdk-item" href={safeHref(it.href) ?? '#'} data-cmdk-item="">
                      <span>{text(it.label)}</span>
                      {text(it.shortcut) && <kbd>{text(it.shortcut)}</kbd>}
                    </a>
                  ))}
              </div>
            ))}
            <p className="b-cmdk-empty" hidden>
              Không có kết quả.
            </p>
          </div>
        </div>
      )
      return (
        <div {...attrs} className={attrs.className + ' b-cmdk'} data-cmdk="">
          <button type="button" className="b-cmdk-btn" data-cmdk-open="">
            <Icon name="search" size={16} />
            <span>{text(node.props.buttonText)}</span>
            <kbd>Ctrl K</kbd>
          </button>
          {mode === 'editor' ? (
            <EditorOnly label="Command palette – mở bằng nút hoặc Ctrl+K trên trang thật">{panel}</EditorOnly>
          ) : (
            <dialog className="b-cmdk-dialog" data-cmdk-dialog="">
              {panel}
            </dialog>
          )}
        </div>
      )
    },
  },
  {
    type: 'productTour',
    label: 'Product Tour',
    category: 'nav',
    icon: Route,
    defaults: () => ({
      props: {
        buttonText: 'Bắt đầu hướng dẫn',
        autoStart: false,
        steps: [{ target: 'buoc-1', title: 'Chào mừng!', text: 'Đây là điểm đầu tiên của tour. Đặt CSS ID cho phần tử đích ở tab Nâng cao.' }],
      },
      styles: {},
    }),
    contentControls: [
      { type: 'text', prop: 'buttonText', label: 'Nút bắt đầu (trống = ẩn)' },
      { type: 'toggle', prop: 'autoStart', label: 'Tự chạy lần đầu vào trang' },
      {
        type: 'list',
        prop: 'steps',
        label: 'Các bước (coach marks)',
        itemLabel: 'Bước',
        fields: [{ key: 'target', label: 'CSS ID phần tử đích', type: 'text' }, { key: 'title', label: 'Tiêu đề', type: 'text' }, { key: 'text', label: 'Nội dung', type: 'textarea' }],
      },
    ],
    styleGroups: ['effects'],
    Render: ({ node, attrs, mode }) => {
      const steps = items<{ target?: string; title?: string; text?: string }>(node.props.steps).map((s) => ({ target: safeId(s.target), title: text(s.title), text: text(s.text) }))
      return (
        <div {...attrs} className={attrs.className + ' b-tour'} data-tour={JSON.stringify(steps)} data-tour-auto={bool(node.props.autoStart) && mode === 'live' ? '' : undefined}>
          {text(node.props.buttonText) && (
            <button type="button" className="b-button b-tour-start" data-tour-start="">
              {text(node.props.buttonText)}
            </button>
          )}
          {mode === 'editor' && (
            <EditorOnly label={`Product tour – ${steps.length} bước (chỉ chạy trên trang thật)`}>
              <ol className="b-tour-list">
                {steps.map((s, i) => (
                  <li key={i}>
                    <b>{s.title || `Bước ${i + 1}`}</b> → #{s.target || '?'}: {s.text}
                  </li>
                ))}
              </ol>
            </EditorOnly>
          )}
        </div>
      )
    },
  },
]

export { ContainerRender }
