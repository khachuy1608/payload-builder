/**
 * Block dữ liệu, phản hồi & lớp phủ. Tên theo namethatui.com: Data Table, Pie/Donut Chart, Timeline, Avatar Group,
 * Status Dot, Chat Bubble, Badge/Chip/Pill/Tag, Progress Ring/Spinner/Bar, Skeleton, Empty State,
 * Inline Alert/Callout/Banner, Toast, Modal/Drawer/Sheet, Popover/Dropdown/Tooltip/Hover Card, Lightbox.
 */
import {
  AlertTriangle,
  BellRing,
  Bot,
  Circle,
  CircleDashed,
  Images,
  Inbox,
  Loader,
  MessageSquare,
  PanelRightOpen,
  PieChart,
  Table2,
  Tag,
  UserCircle2,
  Users,
  Waypoints,
} from 'lucide-react'
import { genId } from '../../tree'
import type { BuilderNode, MediaValue } from '../../types'
import { bool, EditorOnly, Icon, items, num, safeColor, safeHref, text } from '../helpers'
import type { BlockDefinition } from '../types'

const node = (type: string, props: Record<string, unknown>, styles: BuilderNode['styles'] = {}, children?: BuilderNode[]): BuilderNode => ({ id: genId(), type, props, styles, ...(children ? { children } : {}) })
const BOX_GROUPS = ['typography', 'size', 'spacing', 'background', 'border', 'effects', 'position', 'child']
const CONTAINER_GROUPS = ['layout', 'size', 'spacing', 'background', 'border', 'effects', 'position', 'child']

const COLOR_OPTIONS = [
  { value: 'primary', label: 'Chính' },
  { value: 'neutral', label: 'Trung tính' },
  { value: 'success', label: 'Thành công (xanh lá)' },
  { value: 'warning', label: 'Cảnh báo (vàng)' },
  { value: 'error', label: 'Lỗi (đỏ)' },
  { value: 'info', label: 'Thông tin (xanh dương)' },
]

export const FEEDBACK_BLOCKS: BlockDefinition[] = [
  // ===================== Dữ liệu =====================
  {
    type: 'dataTable',
    label: 'Data Table',
    category: 'data',
    icon: Table2,
    defaults: () => ({
      props: {
        caption: '',
        columns: [{ label: 'Khách hàng', align: 'left' }, { label: 'Trạng thái', align: 'left' }, { label: 'Số tiền', align: 'right' }],
        rows: [{ cells: 'Northwind | Đã thanh toán | $4,280' }, { cells: 'Acme Co | Quá hạn | $2,940' }, { cells: 'Globex | Chờ | $1,860' }],
        striped: true,
        compact: false,
      },
      styles: {},
    }),
    contentControls: [
      { type: 'text', prop: 'caption', label: 'Chú thích bảng (caption)' },
      { type: 'list', prop: 'columns', label: 'Cột', itemLabel: 'Cột', fields: [{ key: 'label', label: 'Tiêu đề', type: 'text' }, { key: 'align', label: 'Căn', type: 'select', options: [{ value: 'left', label: 'Trái' }, { value: 'center', label: 'Giữa' }, { value: 'right', label: 'Phải' }] }] },
      { type: 'list', prop: 'rows', label: 'Hàng', itemLabel: 'Hàng', help: 'Các ô cách nhau bằng dấu |', fields: [{ key: 'cells', label: 'Các ô', type: 'text', placeholder: 'Ô 1 | Ô 2 | Ô 3' }] },
      { type: 'toggle', prop: 'striped', label: 'Sọc xen kẽ' },
      { type: 'toggle', prop: 'compact', label: 'Gọn' },
    ],
    styleGroups: BOX_GROUPS,
    Render: ({ node, attrs }) => {
      const cols = items<{ label?: string; align?: string }>(node.props.columns)
      const rows = items<{ cells?: string }>(node.props.rows)
      return (
        <div {...attrs} className={`${attrs.className} b-table-wrap`}>
          <table className={`b-table${bool(node.props.striped, true) ? ' b-table--striped' : ''}${bool(node.props.compact) ? ' b-table--compact' : ''}`}>
            {text(node.props.caption) && <caption>{text(node.props.caption)}</caption>}
            <thead>
              <tr>
                {cols.map((c, i) => (
                  <th key={i} scope="col" style={{ textAlign: (text(c.align, 'left') as 'left') }}>
                    {text(c.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {text(r.cells)
                    .split('|')
                    .slice(0, Math.max(cols.length, 1))
                    .map((cell, j) => (
                      <td key={j} style={{ textAlign: (text(cols[j]?.align, 'left') as 'left') }}>
                        {cell.trim()}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
  },
  {
    type: 'chart',
    label: 'Pie / Donut Chart',
    category: 'data',
    icon: PieChart,
    defaults: () => ({
      props: { variant: 'donut', size: '200', showLegend: true, data: [{ label: 'Thiết kế', value: '45', color: '#4f46e5' }, { label: 'Phát triển', value: '35', color: '#06b6d4' }, { label: 'Khác', value: '20', color: '#f59e0b' }] },
      styles: {},
    }),
    contentControls: [
      { type: 'select', prop: 'variant', label: 'Kiểu', options: [{ value: 'pie', label: 'Pie – tròn đặc' }, { value: 'donut', label: 'Donut – vòng rỗng' }] },
      { type: 'number', prop: 'size', label: 'Kích thước (px)', min: 80, max: 600 },
      { type: 'toggle', prop: 'showLegend', label: 'Hiện chú giải' },
      { type: 'list', prop: 'data', label: 'Dữ liệu', itemLabel: 'Phần', fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'value', label: 'Giá trị', type: 'number' }, { key: 'color', label: 'Màu', type: 'color' }] },
    ],
    styleGroups: ['size', 'spacing', 'background', 'border', 'effects', 'position', 'child'],
    Render: ({ node, attrs }) => {
      const data = items<{ label?: string; value?: unknown; color?: string }>(node.props.data).map((d, i) => ({ label: text(d.label), value: Math.max(0, num(d.value)), color: safeColor(d.color, ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'][i % 6]) }))
      const total = data.reduce((a, d) => a + d.value, 0) || 1
      const size = num(node.props.size, 200)
      const donut = text(node.props.variant, 'donut') === 'donut'
      const r = 50
      const cx = 60
      const cy = 60
      let angle = -Math.PI / 2
      const paths = data.map((d) => {
        const a = (d.value / total) * Math.PI * 2
        const x1 = cx + r * Math.cos(angle)
        const y1 = cy + r * Math.sin(angle)
        angle += a
        const x2 = cx + r * Math.cos(angle)
        const y2 = cy + r * Math.sin(angle)
        const large = a > Math.PI ? 1 : 0
        const dPath = d.value / total >= 0.9999 ? `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 -${r * 2},0` : `M${cx},${cy}L${x1},${y1}A${r},${r} 0 ${large},1 ${x2},${y2}Z`
        return { ...d, d: dPath }
      })
      return (
        <div {...attrs} className={`${attrs.className} b-chart`}>
          <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={data.map((d) => `${d.label}: ${Math.round((d.value / total) * 100)}%`).join(', ')}>
            {paths.map((p, i) => (
              <path key={i} d={p.d} fill={p.color}>
                <title>{`${p.label}: ${Math.round((p.value / total) * 100)}%`}</title>
              </path>
            ))}
            {donut && <circle cx={cx} cy={cy} r={r * 0.58} fill="var(--color-background)" />}
          </svg>
          {bool(node.props.showLegend, true) && (
            <ul className="b-chart-legend">
              {data.map((d, i) => (
                <li key={i}>
                  <span style={{ background: d.color }} />
                  {d.label} <b>{Math.round((d.value / total) * 100)}%</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    },
  },
  {
    type: 'timeline',
    label: 'Timeline',
    category: 'data',
    icon: Waypoints,
    defaults: () => ({
      props: {
        items: [
          { time: '09:12', title: 'Đã đặt hàng', text: '3 sản phẩm' },
          { time: '09:13', title: 'Đã thanh toán', text: 'Visa đuôi 4242' },
          { time: '14:40', title: 'Đã gửi', text: 'Rời kho' },
          { time: 'Hôm nay', title: 'Đang giao', text: 'Dự kiến trước 18:00', current: true },
        ],
      },
      styles: {},
    }),
    contentControls: [
      { type: 'list', prop: 'items', label: 'Mốc', itemLabel: 'Mốc', fields: [{ key: 'time', label: 'Thời gian', type: 'text' }, { key: 'title', label: 'Tiêu đề', type: 'text' }, { key: 'text', label: 'Mô tả', type: 'text' }, { key: 'current', label: 'Mốc hiện tại (nổi bật)', type: 'toggle' }] },
    ],
    styleGroups: BOX_GROUPS,
    Render: ({ node, attrs }) => (
      <ol {...attrs} className={`${attrs.className} b-timeline`}>
        {items<{ time?: string; title?: string; text?: string; current?: boolean }>(node.props.items).map((it, i) => (
          <li key={i} className={`b-timeline-item${it.current ? ' is-current' : ''}`}>
            <span className="b-timeline-dot" />
            <span className="b-timeline-time">{text(it.time)}</span>
            <span className="b-timeline-body">
              <b>{text(it.title)}</b>
              {text(it.text) && <span>{text(it.text)}</span>}
            </span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    type: 'avatarGroup',
    label: 'Avatar Group',
    category: 'data',
    icon: Users,
    defaults: () => ({ props: { people: ['AR', 'JT', 'MK', 'DK', 'SP', 'LN'].map((i) => ({ initials: i, name: i, media: null })), max: '4', size: '36' }, styles: {} }),
    contentControls: [
      { type: 'list', prop: 'people', label: 'Thành viên', itemLabel: 'Người', fields: [{ key: 'name', label: 'Tên', type: 'text' }, { key: 'initials', label: 'Chữ cái (khi không có ảnh)', type: 'text' }, { key: 'media', label: 'Ảnh', type: 'media' }] },
      { type: 'number', prop: 'max', label: 'Hiện tối đa (phần còn lại thành +N)', min: 1, max: 20 },
      { type: 'number', prop: 'size', label: 'Kích thước (px)', min: 20, max: 96 },
    ],
    styleGroups: ['spacing', 'effects', 'position', 'child'],
    Render: ({ node, attrs }) => {
      const people = items<{ name?: string; initials?: string; media?: MediaValue | null }>(node.props.people)
      const max = Math.max(1, num(node.props.max, 4))
      const size = num(node.props.size, 36)
      const shown = people.slice(0, max)
      return (
        <div {...attrs} className={`${attrs.className} b-avatars`} style={{ ['--size' as string]: `${size}px` } as React.CSSProperties}>
          {shown.map((p, i) => (
            <span key={i} className="b-avatar" title={text(p.name)}>
              {p.media?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.media.url} alt={text(p.name)} />
              ) : (
                text(p.initials, text(p.name).slice(0, 2)).slice(0, 2).toUpperCase()
              )}
            </span>
          ))}
          {people.length > max && <span className="b-avatar b-avatar--more">+{people.length - max}</span>}
        </div>
      )
    },
  },
  {
    type: 'avatar',
    label: 'Avatar',
    category: 'data',
    icon: UserCircle2,
    defaults: () => ({ props: { media: null, name: 'Nguyễn Văn A', size: '64', shape: 'circle' }, styles: {} }),
    contentControls: [
      { type: 'media', prop: 'media', label: 'Ảnh' },
      { type: 'text', prop: 'name', label: 'Tên (hiện chữ cái đầu khi không có ảnh)' },
      { type: 'number', prop: 'size', label: 'Kích thước (px)', min: 16, max: 320 },
      { type: 'select', prop: 'shape', label: 'Hình', options: [{ value: 'circle', label: 'Tròn' }, { value: 'rounded', label: 'Bo góc' }, { value: 'square', label: 'Vuông' }] },
    ],
    styleGroups: ['spacing', 'border', 'effects', 'position', 'child'],
    Render: ({ node, attrs }) => {
      const media = node.props.media && typeof node.props.media === 'object' ? (node.props.media as MediaValue) : null
      const name = text(node.props.name)
      const size = num(node.props.size, 64)
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
      return (
        <span {...attrs} className={`${attrs.className} b-avatar-one b-avatar-one--${text(node.props.shape, 'circle')}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} title={name || undefined}>
          {media?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt={name || media.alt || ''} loading="lazy" />
          ) : (
            <span aria-hidden>{initials || '?'}</span>
          )}
        </span>
      )
    },
  },
  {
    type: 'statusDot',
    label: 'Status Dot',
    category: 'data',
    icon: Circle,
    defaults: () => ({ props: { status: 'online', label: 'Trực tuyến', showLabel: true, pulse: false }, styles: {} }),
    contentControls: [
      { type: 'select', prop: 'status', label: 'Trạng thái', options: [{ value: 'online', label: 'Online (xanh)' }, { value: 'away', label: 'Away (vàng)' }, { value: 'busy', label: 'Busy (đỏ)' }, { value: 'offline', label: 'Offline (xám)' }, { value: 'live', label: 'Live (đỏ, nhấp nháy)' }] },
      { type: 'text', prop: 'label', label: 'Nhãn' },
      { type: 'toggle', prop: 'showLabel', label: 'Hiện nhãn' },
      { type: 'toggle', prop: 'pulse', label: 'Nhấp nháy' },
    ],
    styleGroups: ['typography', 'spacing', 'effects', 'position', 'child'],
    inlineEdit: { prop: 'label' },
    Render: ({ node, attrs }) => {
      const status = text(node.props.status, 'online')
      return (
        <span {...attrs} className={`${attrs.className} b-status b-status--${status}${bool(node.props.pulse) || status === 'live' ? ' is-pulse' : ''}`}>
          <span className="b-status-dot" aria-hidden />
          {bool(node.props.showLabel, true) && <span className="b-status-label">{text(node.props.label)}</span>}
        </span>
      )
    },
  },
  {
    type: 'chatBubble',
    label: 'Chat Bubble',
    category: 'data',
    icon: MessageSquare,
    defaults: () => ({ props: { side: 'them', text: 'Mình vẫn hẹn 3 giờ chứ?', name: 'Ava', time: '2:41 PM', status: 'none' }, styles: {} }),
    contentControls: [
      { type: 'select', prop: 'side', label: 'Bên', options: [{ value: 'them', label: 'Họ (trái)' }, { value: 'me', label: 'Tôi (phải)' }] },
      { type: 'textarea', prop: 'text', label: 'Nội dung' },
      { type: 'text', prop: 'name', label: 'Tên (bên “họ”)' },
      { type: 'text', prop: 'time', label: 'Thời gian' },
      { type: 'select', prop: 'status', label: 'Trạng thái (bên “tôi”)', options: [{ value: 'none', label: 'Không' }, { value: 'sent', label: 'Đã gửi' }, { value: 'delivered', label: 'Đã nhận' }, { value: 'read', label: 'Đã xem' }] },
    ],
    styleGroups: ['typography', 'spacing', 'effects', 'child'],
    inlineEdit: { prop: 'text', multiline: true },
    Render: ({ node, attrs }) => {
      const me = text(node.props.side) === 'me'
      const status = text(node.props.status, 'none')
      return (
        <div {...attrs} className={`${attrs.className} b-chat b-chat--${me ? 'me' : 'them'}`}>
          {!me && text(node.props.name) && <span className="b-chat-name">{text(node.props.name)}</span>}
          <span className="b-chat-bubble">{text(node.props.text)}</span>
          <span className="b-chat-meta">
            {text(node.props.time)}
            {me && status !== 'none' && <span> · {status === 'sent' ? 'Đã gửi' : status === 'delivered' ? 'Đã nhận' : 'Đã xem'}</span>}
          </span>
        </div>
      )
    },
  },

  // ===================== Phản hồi =====================
  {
    type: 'badge',
    label: 'Badge / Chip / Pill / Tag',
    category: 'feedback',
    icon: Tag,
    defaults: () => ({ props: { variant: 'pill', text: 'Đang hoạt động', color: 'success', count: '', dot: true, removable: false }, styles: {} }),
    contentControls: [
      {
        type: 'select',
        prop: 'variant',
        label: 'Kiểu',
        options: [
          { value: 'badge', label: 'Badge – số đếm trên icon' },
          { value: 'chip', label: 'Chip – có thể bấm/xoá' },
          { value: 'pill', label: 'Pill – trạng thái bo tròn' },
          { value: 'tag', label: 'Tag – nhãn phân loại' },
        ],
      },
      { type: 'text', prop: 'text', label: 'Chữ' },
      { type: 'text', prop: 'count', label: 'Số đếm (badge)' },
      { type: 'select', prop: 'color', label: 'Màu', options: COLOR_OPTIONS },
      { type: 'toggle', prop: 'dot', label: 'Chấm trạng thái (pill)' },
      { type: 'toggle', prop: 'removable', label: 'Nút xoá (chip)' },
    ],
    styleGroups: ['typography', 'spacing', 'background', 'border', 'effects', 'position', 'child'],
    inlineEdit: { prop: 'text' },
    Render: ({ node, attrs }) => {
      const variant = text(node.props.variant, 'pill')
      const color = text(node.props.color, 'primary')
      if (variant === 'badge')
        return (
          <span {...attrs} className={`${attrs.className} b-badge-wrap`}>
            <Icon name="inbox" size={22} />
            <span className={`b-badge-count b-color--${color}`}>{text(node.props.count, '7')}</span>
          </span>
        )
      return (
        <span {...attrs} className={`${attrs.className} b-tag b-tag--${variant} b-color--${color}`}>
          {variant === 'pill' && bool(node.props.dot, true) && <span className="b-tag-dot" />}
          {text(node.props.text)}
          {variant === 'chip' && bool(node.props.removable) && (
            <button type="button" className="b-tag-remove" data-dismiss="" aria-label="Bỏ">
              <Icon name="close" size={12} />
            </button>
          )}
        </span>
      )
    },
  },
  {
    type: 'progress',
    label: 'Progress / Spinner',
    category: 'feedback',
    icon: Loader,
    defaults: () => ({ props: { variant: 'bar', value: '65', max: '100', label: 'Đang tải lên', showValue: true, indeterminate: false, size: '48' }, styles: {} }),
    contentControls: [
      { type: 'select', prop: 'variant', label: 'Kiểu', options: [{ value: 'bar', label: 'Progress Bar' }, { value: 'ring', label: 'Progress Ring' }, { value: 'spinner', label: 'Spinner (chờ vô hạn)' }] },
      { type: 'number', prop: 'value', label: 'Giá trị', min: 0 },
      { type: 'number', prop: 'max', label: 'Tối đa', min: 1 },
      { type: 'text', prop: 'label', label: 'Nhãn' },
      { type: 'toggle', prop: 'showValue', label: 'Hiện %' },
      { type: 'toggle', prop: 'indeterminate', label: 'Không xác định (chạy liên tục)' },
      { type: 'number', prop: 'size', label: 'Kích thước ring/spinner (px)', min: 16, max: 240 },
    ],
    styleGroups: ['typography', 'size', 'spacing', 'effects', 'position', 'child'],
    Render: ({ node, attrs }) => {
      const variant = text(node.props.variant, 'bar')
      const max = Math.max(1, num(node.props.max, 100))
      const value = Math.min(max, Math.max(0, num(node.props.value, 0)))
      const pct = Math.round((value / max) * 100)
      const size = num(node.props.size, 48)
      const indeterminate = bool(node.props.indeterminate) || variant === 'spinner'
      if (variant === 'bar')
        return (
          <div {...attrs} className={`${attrs.className} b-progress`}>
            {(text(node.props.label) || bool(node.props.showValue, true)) && (
              <div className="b-progress-head">
                <span>{text(node.props.label)}</span>
                {bool(node.props.showValue, true) && !indeterminate && <span>{pct}%</span>}
              </div>
            )}
            <div className={`b-progress-track${indeterminate ? ' is-indeterminate' : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={indeterminate ? undefined : value} aria-label={text(node.props.label) || 'Tiến độ'}>
              <div className="b-progress-fill" style={indeterminate ? undefined : { width: `${pct}%` }} />
            </div>
          </div>
        )
      const r = 20
      const c = 2 * Math.PI * r
      return (
        <div {...attrs} className={`${attrs.className} b-ring${indeterminate ? ' is-spinner' : ''}`} role={indeterminate ? 'status' : 'progressbar'} aria-valuenow={indeterminate ? undefined : pct} aria-label={text(node.props.label) || 'Tiến độ'}>
          <svg viewBox="0 0 48 48" width={size} height={size}>
            <circle className="b-ring-track" cx="24" cy="24" r={r} />
            <circle className="b-ring-fill" cx="24" cy="24" r={r} strokeDasharray={c} strokeDashoffset={indeterminate ? c * 0.75 : c * (1 - pct / 100)} />
          </svg>
          {!indeterminate && bool(node.props.showValue, true) && <span className="b-ring-value">{pct}%</span>}
          {text(node.props.label) && <span className="b-ring-label">{text(node.props.label)}</span>}
        </div>
      )
    },
  },
  {
    type: 'skeleton',
    label: 'Skeleton',
    category: 'feedback',
    icon: CircleDashed,
    defaults: () => ({ props: { variant: 'card', lines: '3', animated: true }, styles: {} }),
    contentControls: [
      { type: 'select', prop: 'variant', label: 'Hình dạng', options: [{ value: 'text', label: 'Các dòng chữ' }, { value: 'avatar', label: 'Avatar + 2 dòng' }, { value: 'card', label: 'Thẻ (ảnh + chữ)' }, { value: 'image', label: 'Khối ảnh' }] },
      { type: 'number', prop: 'lines', label: 'Số dòng', min: 1, max: 10 },
      { type: 'toggle', prop: 'animated', label: 'Hiệu ứng lấp lánh' },
    ],
    styleGroups: ['size', 'spacing', 'effects', 'position', 'child'],
    Render: ({ node, attrs }) => {
      const variant = text(node.props.variant, 'card')
      const lines = Math.max(1, num(node.props.lines, 3))
      const Lines = () => (
        <>
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} className="b-skel b-skel-line" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
          ))}
        </>
      )
      return (
        <div {...attrs} className={`${attrs.className} b-skeleton${bool(node.props.animated, true) ? ' is-animated' : ''}`} aria-busy="true" aria-live="polite">
          {variant === 'image' && <span className="b-skel b-skel-image" />}
          {variant === 'card' && (
            <>
              <span className="b-skel b-skel-image" />
              <Lines />
            </>
          )}
          {variant === 'avatar' && (
            <div className="b-skel-row">
              <span className="b-skel b-skel-avatar" />
              <div className="b-skel-col">
                <span className="b-skel b-skel-line" style={{ width: '45%' }} />
                <span className="b-skel b-skel-line" style={{ width: '75%' }} />
              </div>
            </div>
          )}
          {variant === 'text' && <Lines />}
        </div>
      )
    },
  },
  {
    type: 'emptyState',
    label: 'Empty State',
    category: 'feedback',
    icon: Inbox,
    defaults: () => ({ props: { icon: 'inboxEmpty', title: 'Chưa có dự án nào', text: 'Tạo dự án đầu tiên để bắt đầu theo dõi công việc của bạn.', buttonText: 'Dự án mới', buttonHref: '#' }, styles: { desktop: { padding: '48px 24px', textAlign: 'center' } } }),
    contentControls: [
      { type: 'select', prop: 'icon', label: 'Icon', options: ['inboxEmpty', 'search', 'inbox', 'user', 'chat', 'grid'].map((v) => ({ value: v, label: v })) },
      { type: 'text', prop: 'title', label: 'Tiêu đề' },
      { type: 'textarea', prop: 'text', label: 'Mô tả' },
      { type: 'text', prop: 'buttonText', label: 'Nút hành động (trống = ẩn)' },
      { type: 'url', prop: 'buttonHref', label: 'Link nút' },
    ],
    styleGroups: BOX_GROUPS,
    inlineEdit: { prop: 'title' },
    Render: ({ node, attrs }) => (
      <section {...attrs} className={`${attrs.className} b-empty`}>
        <span className="b-empty-icon">
          <Icon name={text(node.props.icon, 'inboxEmpty')} size={40} />
        </span>
        <h3 className="b-empty-title">{text(node.props.title)}</h3>
        {text(node.props.text) && <p className="b-empty-text">{text(node.props.text)}</p>}
        {text(node.props.buttonText) && (
          <a className="b-button b-empty-btn" href={safeHref(node.props.buttonHref) ?? '#'}>
            {text(node.props.buttonText)}
          </a>
        )}
      </section>
    ),
  },
  {
    type: 'alert',
    label: 'Alert / Callout / Banner',
    category: 'feedback',
    icon: AlertTriangle,
    defaults: () => ({ props: { variant: 'inline', severity: 'warning', title: '', text: 'Thẻ của bạn sẽ hết hạn trong 3 ngày.', dismissible: true, buttonText: '', buttonHref: '#' }, styles: {} }),
    contentControls: [
      {
        type: 'select',
        prop: 'variant',
        label: 'Vị trí / kiểu',
        options: [
          { value: 'inline', label: 'Inline Alert – nằm trong nội dung' },
          { value: 'callout', label: 'Callout – ghi chú nổi bật có viền trái' },
          { value: 'banner', label: 'Banner – dải ngang toàn chiều rộng' },
        ],
      },
      { type: 'select', prop: 'severity', label: 'Mức độ', options: [{ value: 'info', label: 'Thông tin' }, { value: 'success', label: 'Thành công' }, { value: 'warning', label: 'Cảnh báo' }, { value: 'error', label: 'Lỗi' }] },
      { type: 'text', prop: 'title', label: 'Tiêu đề (tuỳ chọn)' },
      { type: 'textarea', prop: 'text', label: 'Nội dung' },
      { type: 'text', prop: 'buttonText', label: 'Nút (trống = ẩn)' },
      { type: 'url', prop: 'buttonHref', label: 'Link nút' },
      { type: 'toggle', prop: 'dismissible', label: 'Có nút đóng' },
    ],
    styleGroups: BOX_GROUPS,
    inlineEdit: { prop: 'text', multiline: true },
    Render: ({ node, attrs }) => {
      const sev = text(node.props.severity, 'info')
      return (
        <div {...attrs} className={`${attrs.className} b-alert b-alert--${text(node.props.variant, 'inline')} b-alert--${sev}`} role={sev === 'error' ? 'alert' : 'status'} data-dismissible="">
          <Icon name={sev} size={20} className="b-alert-icon" />
          <div className="b-alert-body">
            {text(node.props.title) && <b className="b-alert-title">{text(node.props.title)}</b>}
            <span>{text(node.props.text)}</span>
          </div>
          {text(node.props.buttonText) && (
            <a className="b-alert-btn" href={safeHref(node.props.buttonHref) ?? '#'}>
              {text(node.props.buttonText)}
            </a>
          )}
          {bool(node.props.dismissible, true) && (
            <button type="button" className="b-alert-close" data-dismiss="" aria-label="Đóng">
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      )
    },
  },
  {
    type: 'toast',
    label: 'Toast (Snackbar)',
    category: 'feedback',
    icon: BellRing,
    defaults: () => ({ props: { trigger: 'button', buttonText: 'Lưu thay đổi', message: 'Đã lưu thay đổi', severity: 'success', position: 'bottom-center', duration: '4', actionText: '' }, styles: {} }),
    contentControls: [
      { type: 'select', prop: 'trigger', label: 'Hiện khi', options: [{ value: 'button', label: 'Bấm nút' }, { value: 'load', label: 'Vào trang (sau 1 giây)' }] },
      { type: 'text', prop: 'buttonText', label: 'Chữ trên nút' },
      { type: 'text', prop: 'message', label: 'Thông điệp' },
      { type: 'select', prop: 'severity', label: 'Mức độ', options: [{ value: 'neutral', label: 'Trung tính' }, { value: 'success', label: 'Thành công' }, { value: 'error', label: 'Lỗi' }] },
      { type: 'select', prop: 'position', label: 'Vị trí', options: [{ value: 'bottom-center', label: 'Dưới giữa' }, { value: 'bottom-right', label: 'Dưới phải' }, { value: 'top-center', label: 'Trên giữa' }, { value: 'top-right', label: 'Trên phải' }] },
      { type: 'number', prop: 'duration', label: 'Tự ẩn sau (giây)', min: 1, max: 60 },
      { type: 'text', prop: 'actionText', label: 'Nút hành động trong toast (vd: Hoàn tác)' },
    ],
    styleGroups: ['typography', 'effects'],
    Render: ({ node, attrs, mode }) => {
      const toast = (
        <div className={`b-toast-el b-toast--${text(node.props.severity, 'neutral')} b-toast--${text(node.props.position, 'bottom-center')}${mode === 'editor' ? ' is-static' : ''}`} role="status" data-toast-el="">
          <span>{text(node.props.message)}</span>
          {text(node.props.actionText) && (
            <button type="button" className="b-toast-action" data-dismiss="">
              {text(node.props.actionText)}
            </button>
          )}
          <button type="button" className="b-toast-close" data-dismiss="" aria-label="Đóng">
            <Icon name="close" size={14} />
          </button>
        </div>
      )
      return (
        <div {...attrs} className={`${attrs.className} b-toast-host`} data-toast="" data-toast-trigger={mode === 'live' ? text(node.props.trigger, 'button') : 'none'} data-toast-duration={num(node.props.duration, 4)}>
          {text(node.props.trigger, 'button') === 'button' && (
            <button type="button" className="b-button" data-toast-open="">
              {text(node.props.buttonText, 'Hiện toast')}
            </button>
          )}
          {mode === 'editor' ? <EditorOnly label="Toast – xem thử (trên trang thật chỉ hiện khi kích hoạt)">{toast}</EditorOnly> : toast}
        </div>
      )
    },
  },

  // ===================== Lớp phủ =====================
  {
    type: 'dialog',
    label: 'Modal / Drawer / Sheet',
    category: 'overlay',
    icon: PanelRightOpen,
    defaults: () => ({
      props: { variant: 'modal', triggerText: 'Mở hộp thoại', title: 'Xoá tệp?', side: 'right', showClose: true, closeText: 'Huỷ' },
      styles: {},
      children: [node('paragraph', { text: 'Hộp thoại chặn mọi thứ phía sau cho tới khi bạn trả lời. Kéo phần tử vào đây để tuỳ biến nội dung.' }, { desktop: { marginBottom: '16px' } }), node('button', { text: 'Xác nhận', href: '#' }, { desktop: { backgroundColor: 'var(--color-primary)', color: '#ffffff', padding: '10px 18px' } })],
    }),
    contentControls: [
      { type: 'select', prop: 'variant', label: 'Kiểu', options: [{ value: 'modal', label: 'Modal Dialog – giữa màn hình' }, { value: 'drawer', label: 'Drawer – trượt từ cạnh' }, { value: 'sheet', label: 'Sheet – trượt từ dưới (mobile)' }] },
      { type: 'select', prop: 'side', label: 'Drawer mở từ', options: [{ value: 'right', label: 'Phải' }, { value: 'left', label: 'Trái' }] },
      { type: 'text', prop: 'triggerText', label: 'Nút mở' },
      { type: 'text', prop: 'title', label: 'Tiêu đề' },
      { type: 'toggle', prop: 'showClose', label: 'Nút đóng (X)' },
      { type: 'text', prop: 'closeText', label: 'Nút huỷ ở chân (trống = ẩn)' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: ['typography', 'background', 'border', 'effects'],
    Render: ({ node, attrs, children, mode }) => {
      const variant = text(node.props.variant, 'modal')
      const body = (
        <div className={`b-dialog-box b-dialog-box--${variant} b-dialog-box--${text(node.props.side, 'right')}`}>
          <div className="b-dialog-head">
            <b>{text(node.props.title)}</b>
            {bool(node.props.showClose, true) && (
              <button type="button" className="b-dialog-x" data-dialog-close="" aria-label="Đóng">
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
          <div className="b-dialog-body">{children}</div>
          {text(node.props.closeText) && (
            <div className="b-dialog-foot">
              <button type="button" className="b-button b-button--ghost" data-dialog-close="">
                {text(node.props.closeText)}
              </button>
            </div>
          )}
        </div>
      )
      return (
        <div {...attrs} className={`${attrs.className} b-dialog-host`}>
          <button type="button" className="b-button" data-dialog-open="">
            {text(node.props.triggerText, 'Mở')}
          </button>
          {mode === 'editor' ? (
            <EditorOnly label={`${variant === 'modal' ? 'Modal' : variant === 'drawer' ? 'Drawer' : 'Sheet'} – nội dung (trên trang thật chỉ hiện khi mở)`}>{body}</EditorOnly>
          ) : (
            <dialog className={`b-dialog-el b-dialog--${variant}`} data-dialog="" aria-label={text(node.props.title) || 'Hộp thoại'}>
              {body}
            </dialog>
          )}
        </div>
      )
    },
  },
  {
    type: 'popover',
    label: 'Popover / Dropdown / Tooltip',
    category: 'overlay',
    icon: Bot,
    defaults: () => ({
      props: { variant: 'popover', triggerText: 'Bộ lọc', tip: 'Cập nhật hôm nay', placement: 'bottom', items: [{ label: 'Đổi tên', href: '#' }, { label: 'Nhân bản', href: '#' }, { label: 'Lưu trữ', href: '#' }] },
      styles: {},
      children: [node('heading', { text: 'Lọc dự án', tag: 'h4' }, { desktop: { fontSize: '14px', fontWeight: '700', marginBottom: '8px' } }), node('paragraph', { text: 'Nội dung popover: kéo phần tử vào đây (toggle, form…).' }, { desktop: { fontSize: '13px' } })],
    }),
    contentControls: [
      {
        type: 'select',
        prop: 'variant',
        label: 'Kiểu',
        options: [
          { value: 'popover', label: 'Popover – bấm mở, nội dung tuỳ ý' },
          { value: 'dropdown', label: 'Dropdown Menu – danh sách hành động' },
          { value: 'tooltip', label: 'Tooltip – chữ ngắn khi rê chuột' },
          { value: 'hovercard', label: 'Hover Card – xem trước khi rê chuột' },
        ],
      },
      { type: 'text', prop: 'triggerText', label: 'Phần tử kích hoạt (chữ)' },
      { type: 'text', prop: 'tip', label: 'Chữ tooltip' },
      { type: 'list', prop: 'items', label: 'Mục dropdown', itemLabel: 'Mục', fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'href', label: 'Link', type: 'url' }] },
      { type: 'select', prop: 'placement', label: 'Vị trí', options: [{ value: 'bottom', label: 'Dưới' }, { value: 'top', label: 'Trên' }] },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: ['typography', 'background', 'border', 'effects', 'position'],
    Render: ({ node, attrs, children, mode }) => {
      const variant = text(node.props.variant, 'popover')
      const hover = variant === 'tooltip' || variant === 'hovercard'
      const content =
        variant === 'tooltip' ? (
          <span className="b-pop-panel b-tooltip" role="tooltip">
            {text(node.props.tip)}
          </span>
        ) : variant === 'dropdown' ? (
          <div className="b-pop-panel b-menu-panel" role="menu">
            {items<{ label?: string; href?: string }>(node.props.items).map((it, i) => (
              <a key={i} role="menuitem" className="b-menu-item" href={safeHref(it.href) ?? '#'}>
                {text(it.label)}
              </a>
            ))}
          </div>
        ) : (
          <div className={`b-pop-panel b-pop-card${variant === 'hovercard' ? ' b-hovercard' : ''}`} role="dialog">
            {children}
          </div>
        )
      return (
        <span {...attrs} className={`${attrs.className} b-pop b-pop--${variant} b-pop--${text(node.props.placement, 'bottom')}${mode === 'editor' ? ' is-open' : ''}`} data-menu={hover ? undefined : ''} data-hover={hover ? '' : undefined}>
          <button type="button" className={variant === 'tooltip' || variant === 'hovercard' ? 'b-pop-trigger-text' : 'b-button b-button--ghost b-pop-trigger'} data-menu-toggle={hover ? undefined : ''} aria-expanded={hover ? undefined : mode === 'editor'}>
            {text(node.props.triggerText)}
            {variant === 'dropdown' && <Icon name="chevronDown" size={14} />}
          </button>
          {content}
        </span>
      )
    },
  },
  {
    type: 'lightbox',
    label: 'Lightbox Gallery',
    category: 'overlay',
    icon: Images,
    defaults: () => ({ props: { images: [], columns: '3', gap: '8' }, styles: {} }),
    contentControls: [
      { type: 'list', prop: 'images', label: 'Ảnh', itemLabel: 'Ảnh', fields: [{ key: 'media', label: 'Ảnh', type: 'media' }, { key: 'caption', label: 'Chú thích', type: 'text' }] },
      { type: 'select', prop: 'columns', label: 'Số cột', options: ['2', '3', '4', '5'].map((v) => ({ value: v, label: v })) },
      { type: 'number', prop: 'gap', label: 'Khoảng cách (px)', min: 0, max: 48 },
    ],
    styleGroups: ['size', 'spacing', 'border', 'effects', 'position', 'child'],
    Render: ({ node, attrs, mode }) => {
      const images = items<{ media?: MediaValue | null; caption?: string }>(node.props.images).filter((it) => it.media?.url)
      if (!images.length)
        return (
          <div {...attrs} className={attrs.className + ' bld-ph'}>
            <Images size={28} strokeWidth={1.5} />
            <span>{mode === 'editor' ? 'Thêm ảnh ở panel bên phải' : ''}</span>
          </div>
        )
      return (
        <div {...attrs} className={`${attrs.className} b-gallery`} data-lightbox="" style={{ gridTemplateColumns: `repeat(${num(node.props.columns, 3)}, minmax(0,1fr))`, gap: num(node.props.gap, 8) }}>
          {images.map((it, i) => (
            <button key={i} type="button" className="b-gallery-item" data-lightbox-item="" data-src={it.media!.url} data-caption={text(it.caption)} aria-label={text(it.caption) || `Ảnh ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.media!.url} alt={text(it.caption) || it.media!.alt || ''} loading="lazy" />
            </button>
          ))}
          {mode === 'live' && (
            <dialog className="b-lightbox-dlg" data-lightbox-dialog="">
              <button type="button" className="b-lightbox-close" data-lightbox-close="" aria-label="Đóng">
                <Icon name="close" size={22} />
              </button>
              <button type="button" className="b-lightbox-nav b-lightbox-prev" data-lightbox-prev="" aria-label="Ảnh trước">
                <Icon name="chevronLeft" size={26} />
              </button>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" data-lightbox-img="" />
                <figcaption data-lightbox-caption="" />
              </figure>
              <button type="button" className="b-lightbox-nav b-lightbox-next" data-lightbox-next="" aria-label="Ảnh sau">
                <Icon name="chevronRight" size={26} />
              </button>
            </dialog>
          )}
        </div>
      )
    },
  },
]
