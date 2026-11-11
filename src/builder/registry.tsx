/**
 * BLOCK REGISTRY – nguồn sự thật duy nhất cho mọi block.
 * Mỗi block định nghĩa một lần: giá trị mặc định, control, nhóm style và component Render.
 * Editor (canvas) và front-end dùng chung `Render`, nên trang thật giống hệt canvas.
 *
 * Thêm block mới: khai báo schema trong ./schema.ts rồi thêm một mục vào BLOCKS bên dưới.
 */
import {
  AlignLeft,
  Columns3,
  Database,
  FileText,
  Heading as HeadingIcon,
  Image as ImageIcon,
  LayoutTemplate,
  Minus,
  MousePointerClick,
  PanelTop,
  Shapes,
  Square,
  Youtube,
} from 'lucide-react'
import { FEEDBACK_BLOCKS } from './blocks/defs/feedback'
import { FORM_BLOCKS } from './blocks/defs/forms'
import { LAYOUT_BLOCKS } from './blocks/defs/layout'
import { Icon, ICON_OPTIONS, num, parseYouTubeId, safeHref, srcSetOf } from './blocks/helpers'
import type { BlockDefinition, RenderProps } from './blocks/types'
import { TabsRender } from './blocks/TabsRender'
import type { RefError } from './refs'
import { richHasBlock, sanitizeRichText, sanitizeSvg } from './sanitize'
import { genId } from './tree'
import type { BlockRefProps, BuilderNode, MediaValue } from './types'

// ---------- helpers ----------

const text = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
export { parseYouTubeId, safeHref }

function Placeholder({ attrs, label, icon: Icon }: { attrs: RenderProps['attrs']; label: string; icon: BlockDefinition['icon'] }) {
  return (
    <div {...attrs} className={attrs.className + ' bld-ph'}>
      <Icon size={28} strokeWidth={1.5} />
      <span>{label}</span>
    </div>
  )
}

const ContainerRender = ({ attrs, children }: RenderProps) => <div {...attrs}>{children}</div>

const CONTAINER_GROUPS = ['layout', 'size', 'spacing', 'background', 'border', 'effects', 'position', 'child']
const TEXT_GROUPS = ['typography', 'spacing', 'size', 'background', 'border', 'effects', 'position', 'child']

// ---------- block definitions ----------

const BLOCK_LIST: BlockDefinition[] = [
  {
    type: 'root',
    label: 'Trang',
    category: 'layout',
    icon: FileText,
    defaults: () => ({ props: {}, styles: {}, children: [] }),
    contentControls: [{ type: 'custom', component: 'page' }],
    styleGroups: ['background', 'typography', 'spacing'],
    Render: ({ attrs, children }) => (
      <div {...attrs} className={attrs.className + ' bld-root'}>
        {children}
      </div>
    ),
  },
  {
    type: 'dataList',
    label: 'Danh sách dữ liệu',
    category: 'layout',
    icon: Database,
    defaults: () => ({
      props: { data: { collection: 'users', mode: 'list', limit: 8, sort: 'name' } },
      styles: {
        desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px', padding: '32px 24px', maxWidth: '1120px', margin: '0 auto' },
        tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
        mobile: { gridTemplateColumns: '1fr', padding: '24px 16px' },
      },
      children: [
        {
          id: genId(),
          type: 'div',
          props: {},
          styles: { desktop: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', padding: '24px 16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' } },
          children: [
            { id: genId(), type: 'avatar', props: { media: '{{avatar}}', name: '{{name}}', size: '72', shape: 'circle' }, styles: {} },
            { id: genId(), type: 'heading', props: { text: '{{name}}', tag: 'h3' }, styles: { desktop: { fontSize: '17px', fontWeight: '700' } } },
            { id: genId(), type: 'paragraph', props: { text: '{{title}}' }, styles: { desktop: { color: 'var(--color-muted)', fontSize: '14px' } } },
          ],
        },
      ] as BuilderNode[],
    }),
    contentControls: [
      { type: 'custom', component: 'data' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: CONTAINER_GROUPS,
    Render: ({ node, attrs, children, mode }) => (
      <div {...attrs} className={attrs.className + ' b-data-list'}>
        {children}
        {mode === 'editor' && !node.children?.length && <span className="bld-ph">Kéo phần tử mẫu vào đây – nó sẽ lặp cho từng bản ghi</span>}
      </div>
    ),
  },
  {
    type: 'div',
    label: 'Div Block',
    category: 'layout',
    icon: Square,
    defaults: () => ({ props: {}, styles: { desktop: { padding: '16px' } }, children: [] }),
    contentControls: [{ type: 'custom', component: 'data' }],
    styleGroups: CONTAINER_GROUPS,
    Render: ContainerRender,
  },
  {
    type: 'flexbox',
    label: 'Flexbox',
    category: 'layout',
    icon: Columns3,
    defaults: () => ({
      props: {},
      styles: { desktop: { display: 'flex', flexDirection: 'row', gap: '16px', padding: '16px' }, mobile: { flexDirection: 'column' } },
      children: [],
    }),
    contentControls: [{ type: 'custom', component: 'data' }],
    styleGroups: CONTAINER_GROUPS,
    Render: ContainerRender,
  },
  {
    type: 'tabs',
    label: 'Tabs',
    category: 'layout',
    icon: PanelTop,
    defaults: () => ({
      props: { defaultIndex: '0', variant: 'underline' },
      styles: {},
      children: [1, 2].map((i) => ({
        id: genId(),
        type: 'tab',
        props: { title: `Tab ${i}` },
        styles: { desktop: { padding: '16px 0' } },
        children: [],
      })),
    }),
    contentControls: [
      { type: 'select', prop: 'variant', label: 'Kiểu tab', options: [{ value: 'underline', label: 'Gạch chân' }, { value: 'pills', label: 'Pills rời' }, { value: 'segmented', label: 'Segmented' }, { value: 'vertical', label: 'Dọc' }] },
      { type: 'custom', component: 'tabs' },
    ],
    styleGroups: ['typography', 'spacing', 'size', 'background', 'border', 'child'],
    Render: TabsRender,
  },
  {
    type: 'tab',
    label: 'Tab',
    category: 'layout',
    icon: PanelTop,
    defaults: () => ({ props: { title: 'Tab mới' }, styles: { desktop: { padding: '16px 0' } }, children: [] }),
    contentControls: [{ type: 'text', prop: 'title', label: 'Tiêu đề tab' }],
    styleGroups: ['layout', 'spacing', 'background'],
    Render: ContainerRender,
  },
  {
    type: 'heading',
    label: 'Heading',
    category: 'basic',
    icon: HeadingIcon,
    defaults: () => ({ props: { text: 'Tiêu đề của bạn', tag: 'h2' }, styles: { desktop: { fontSize: '32px', fontWeight: '700' } } }),
    contentControls: [
      { type: 'textarea', prop: 'text', label: 'Nội dung' },
      {
        type: 'select',
        prop: 'tag',
        label: 'Thẻ HTML',
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((t) => ({ value: t, label: t.toUpperCase() })),
      },
      { type: 'custom', component: 'textStyle' },
    ],
    styleGroups: TEXT_GROUPS,
    inlineEdit: { prop: 'text' },
    Render: ({ node, attrs }) => {
      const tag = text(node.props.tag, 'h2')
      const Tag = (/^h[1-6]$/.test(tag) ? tag : 'h2') as 'h2'
      return <Tag {...attrs}>{text(node.props.text)}</Tag>
    },
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    category: 'basic',
    icon: AlignLeft,
    defaults: () => ({
      props: { text: 'Đây là một đoạn văn. Nhấp đúp để sửa trực tiếp, hoặc sửa trong panel bên phải.' },
      styles: {},
    }),
    contentControls: [{ type: 'richtext', prop: 'text', label: 'Nội dung' }, { type: 'custom', component: 'textStyle' }],
    styleGroups: TEXT_GROUPS,
    inlineEdit: { prop: 'text', multiline: true, rich: true },
    // text là HTML đã làm sạch (đậm, nghiêng, link, xuống dòng, danh sách); văn bản thuần cũ vẫn hiển thị như trước
    Render: ({ node, attrs }) => {
      const html = sanitizeRichText(text(node.props.text))
      const Tag = richHasBlock(html) ? 'div' : 'p'
      return <Tag {...attrs} dangerouslySetInnerHTML={{ __html: html }} />
    },
  },
  {
    type: 'button',
    label: 'Button',
    category: 'basic',
    icon: MousePointerClick,
    defaults: () => ({
      props: { text: 'Bấm vào đây', href: '#', newTab: false, icon: '', iconPosition: 'left', iconSize: '18' },
      styles: {
        desktop: {
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          padding: '12px 24px',
          transition: 'opacity .2s ease',
        },
        hover: { opacity: '0.85' },
      },
    }),
    contentControls: [
      { type: 'text', prop: 'text', label: 'Chữ trên nút' },
      { type: 'url', prop: 'href', label: 'Liên kết', placeholder: 'https:// hoặc /duong-dan' },
      { type: 'toggle', prop: 'newTab', label: 'Mở tab mới' },
      { type: 'select', prop: 'icon', label: 'Icon', options: ICON_OPTIONS },
      { type: 'select', prop: 'iconPosition', label: 'Vị trí icon', options: [{ value: 'left', label: 'Trước chữ' }, { value: 'right', label: 'Sau chữ' }, { value: 'only', label: 'Chỉ icon (ẩn chữ)' }] },
      { type: 'number', prop: 'iconSize', label: 'Cỡ icon (px)', min: 10, max: 64 },
      { type: 'custom', component: 'textStyle' },
    ],
    styleGroups: TEXT_GROUPS,
    inlineEdit: { prop: 'text' },
    Render: ({ node, attrs }) => {
      const newTab = node.props.newTab === true
      const icon = text(node.props.icon)
      const pos = text(node.props.iconPosition, 'left')
      const size = num(node.props.iconSize, 18)
      const label = text(node.props.text)
      return (
        <a
          {...attrs}
          className={attrs.className + ' b-button'}
          href={safeHref(node.props.href)}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
          aria-label={icon && pos === 'only' ? label || undefined : undefined}
        >
          {icon && pos !== 'right' && <Icon name={icon} size={size} className="b-button-icon" />}
          {!(icon && pos === 'only') && <span className="b-button-text">{label}</span>}
          {icon && pos === 'right' && <Icon name={icon} size={size} className="b-button-icon" />}
        </a>
      )
    },
  },
  {
    type: 'divider',
    label: 'Divider',
    category: 'basic',
    icon: Minus,
    defaults: () => ({
      props: { variant: 'rule', label: 'hoặc' },
      styles: { desktop: { height: '1px', width: '100%', backgroundColor: 'var(--color-border)', margin: '16px 0' } },
    }),
    contentControls: [
      {
        type: 'select',
        prop: 'variant',
        label: 'Loại',
        options: [
          { value: 'rule', label: 'Rule – ngắt chủ đề (<hr>)' },
          { value: 'separator', label: 'Separator – ngăn nhóm điều khiển' },
          { value: 'labeled', label: 'Có chữ ở giữa (vd: “hoặc”)' },
          { value: 'vertical', label: 'Dọc (trong hàng flex)' },
          { value: 'decorative', label: 'Trang trí (không có ngữ nghĩa)' },
        ],
      },
      { type: 'text', prop: 'label', label: 'Chữ ở giữa' },
    ],
    styleGroups: ['size', 'spacing', 'background', 'typography', 'effects', 'child'],
    Render: ({ node, attrs }) => {
      const variant = text(node.props.variant, 'rule')
      if (variant === 'rule') return <hr {...attrs} className={attrs.className + ' b-divider b-divider--rule'} style={{ border: 0 }} />
      if (variant === 'labeled')
        return (
          <div {...attrs} className={attrs.className + ' b-divider b-divider--labeled'} role="separator">
            <span>{text(node.props.label)}</span>
          </div>
        )
      return <div {...attrs} className={`${attrs.className} b-divider b-divider--${variant}`} role={variant === 'decorative' ? 'presentation' : 'separator'} aria-orientation={variant === 'vertical' ? 'vertical' : undefined} />
    },
  },
  {
    type: 'image',
    label: 'Image',
    category: 'media',
    icon: ImageIcon,
    defaults: () => ({ props: { media: null, alt: '', href: '' }, styles: { desktop: { width: '100%' } } }),
    contentControls: [
      { type: 'media', prop: 'media', label: 'Ảnh' },
      { type: 'text', prop: 'alt', label: 'Mô tả ảnh (alt)', help: 'Để trống sẽ dùng alt trong thư viện media' },
      { type: 'url', prop: 'href', label: 'Liên kết khi bấm (tuỳ chọn)' },
    ],
    styleGroups: ['size', 'media', 'spacing', 'border', 'effects', 'child'],
    Render: ({ node, attrs, mode }) => {
      const media = node.props.media && typeof node.props.media === 'object' ? (node.props.media as MediaValue) : null
      if (!media?.url) return mode === 'editor' ? <Placeholder attrs={attrs} label={typeof node.props.media === 'string' ? `Ảnh từ dữ liệu: ${node.props.media}` : 'Chọn ảnh ở panel bên phải'} icon={ImageIcon} /> : null
      const img = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...attrs}
          className={attrs.className}
          src={media.url}
          srcSet={srcSetOf(media)}
          sizes={srcSetOf(media) ? '(max-width: 767px) 100vw, 1200px' : undefined}
          alt={text(node.props.alt) || media.alt || ''}
          width={media.width}
          height={media.height}
          loading="lazy"
          decoding="async"
        />
      )
      const href = safeHref(node.props.href)
      return href && mode === 'live' ? (
        <a href={href} className="b-image-link">
          {img}
        </a>
      ) : (
        img
      )
    },
  },
  {
    type: 'svg',
    label: 'SVG',
    category: 'media',
    icon: Shapes,
    defaults: () => ({
      props: {
        code: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z"/></svg>',
        label: '',
      },
      styles: { desktop: { width: '48px', height: '48px', color: 'var(--color-primary)' } },
    }),
    contentControls: [
      { type: 'code', prop: 'code', label: 'Mã SVG', help: 'Script, sự kiện on* và liên kết ngoài sẽ bị loại bỏ khi lưu.' },
      { type: 'text', prop: 'label', label: 'Nhãn trợ năng (aria-label)' },
    ],
    styleGroups: ['size', 'typography', 'spacing', 'background', 'border', 'effects', 'child'],
    Render: ({ node, attrs, mode }) => {
      const code = sanitizeSvg(node.props.code)
      if (!code) return mode === 'editor' ? <Placeholder attrs={attrs} label="Dán mã SVG" icon={Shapes} /> : null
      const label = text(node.props.label)
      return (
        <span
          {...attrs}
          className={attrs.className + ' b-svg'}
          role={label ? 'img' : undefined}
          aria-label={label || undefined}
          aria-hidden={label ? undefined : true}
          dangerouslySetInnerHTML={{ __html: code }}
        />
      )
    },
  },
  {
    type: 'youtube',
    label: 'YouTube',
    category: 'media',
    icon: Youtube,
    defaults: () => ({ props: { url: '', start: '', autoplay: false, controls: true }, styles: {} }),
    contentControls: [
      { type: 'url', prop: 'url', label: 'Link hoặc ID video', placeholder: 'https://www.youtube.com/watch?v=...' },
      { type: 'text', prop: 'start', label: 'Bắt đầu từ giây' },
      { type: 'toggle', prop: 'autoplay', label: 'Tự phát (tắt tiếng)' },
      { type: 'toggle', prop: 'controls', label: 'Hiện thanh điều khiển' },
    ],
    styleGroups: ['size', 'spacing', 'border', 'effects', 'child'],
    Render: ({ node, attrs, mode }) => {
      const id = parseYouTubeId(node.props.url)
      if (!id) return mode === 'editor' ? <Placeholder attrs={attrs} label="Nhập link YouTube ở panel bên phải" icon={Youtube} /> : null
      const q = new URLSearchParams()
      const start = parseInt(text(node.props.start), 10)
      if (start > 0) q.set('start', String(start))
      if (node.props.autoplay === true) {
        q.set('autoplay', '1')
        q.set('mute', '1')
      }
      if (node.props.controls === false) q.set('controls', '0')
      q.set('rel', '0')
      return (
        <div {...attrs} className={attrs.className + ' b-youtube'}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?${q.toString()}`}
            title="YouTube video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    },
  },
  {
    /**
     * My Block dạng liên kết. Bình thường node này được `resolveRefs()` thay bằng cây thật trước khi render,
     * nên Render ở đây chỉ chạy khi KHÔNG triển khai được (block chưa tải, đã xoá, vòng lặp, lồng quá sâu).
     */
    type: 'blockRef',
    label: 'My Block',
    category: 'basic',
    icon: LayoutTemplate,
    defaults: () => ({ props: { blockId: '', name: '' }, styles: {} }),
    contentControls: [{ type: 'custom', component: 'blockRef' }],
    styleGroups: ['spacing', 'size', 'child', 'effects'],
    Render: ({ node, attrs, mode }) => {
      if (mode !== 'editor') return null
      const props = node.props as BlockRefProps & { refError?: RefError }
      const name = text(props.name) || `#${text(props.blockId)}`
      const label = REF_ERROR_LABELS[props.refError ?? 'missing'].replace('%s', name)
      return <Placeholder attrs={attrs} label={label} icon={LayoutTemplate} />
    },
  },
]

export const REF_ERROR_LABELS: Record<RefError, string> = {
  missing: 'Block "%s" chưa tải được hoặc đã bị xoá',
  cycle: 'Block "%s" tham chiếu vòng lặp – không thể hiển thị',
  depth: 'Block "%s" lồng quá nhiều cấp – không thể hiển thị',
}

export const BLOCKS: Record<string, BlockDefinition> = Object.fromEntries([...BLOCK_LIST, ...LAYOUT_BLOCKS, ...FEEDBACK_BLOCKS, ...FORM_BLOCKS].map((b) => [b.type, b]))

export function getBlock(type: string): BlockDefinition | undefined {
  return BLOCKS[type]
}

export const BLOCK_CATEGORIES: { id: BlockDefinition['category']; label: string }[] = [
  { id: 'layout', label: 'Bố cục' },
  { id: 'basic', label: 'Cơ bản' },
  { id: 'media', label: 'Media' },
  { id: 'nav', label: 'Điều hướng' },
  { id: 'data', label: 'Dữ liệu & hiển thị' },
  { id: 'feedback', label: 'Phản hồi & trạng thái' },
  { id: 'overlay', label: 'Lớp phủ' },
  { id: 'form', label: 'Form' },
]
