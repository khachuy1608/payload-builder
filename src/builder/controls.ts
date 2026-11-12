/**
 * Mô tả các control trong panel thuộc tính (thuần dữ liệu).
 * Editor đọc các mô tả này để tự sinh UI – thêm block mới không cần viết UI riêng.
 */

export interface Option {
  label: string
  value: string
}

/** Trường con trong một control dạng danh sách (menu, breadcrumb, slide…) */
export interface ListField {
  key: string
  label: string
  type: 'text' | 'url' | 'textarea' | 'toggle' | 'select' | 'media' | 'number' | 'color'
  options?: Option[]
  placeholder?: string
}

export type ContentControl =
  | { type: 'text' | 'textarea' | 'url' | 'code' | 'richtext'; prop: string; label: string; placeholder?: string; help?: string }
  | { type: 'select'; prop: string; label: string; options: Option[]; help?: string }
  | { type: 'toggle'; prop: string; label: string; help?: string }
  | { type: 'media'; prop: string; label: string }
  | { type: 'number'; prop: string; label: string; min?: number; max?: number; step?: number; help?: string }
  | { type: 'color'; prop: string; label: string }
  /** Bộ chọn icon có tìm kiếm (toàn bộ ICONS) */
  | { type: 'icon'; prop: string; label: string; help?: string }
  /** Danh sách mục lặp lại: mỗi mục là object với các trường `fields` */
  | { type: 'list'; prop: string; label: string; itemLabel?: string; fields: ListField[]; max?: number; help?: string }
  | { type: 'custom'; component: 'tabs' | 'page' | 'blockRef' | 'children' | 'data' | 'textStyle' }

export type StyleFieldKind = 'unit' | 'select' | 'color' | 'text' | 'box'

export interface StyleField {
  /** Thuộc tính CSS camelCase. Với kind 'box' là tiền tố, ví dụ 'padding' -> paddingTop/Right/Bottom/Left */
  key: string
  label: string
  kind: StyleFieldKind
  options?: Option[]
  placeholder?: string
  /** Chỉ hiện khi điều kiện đúng (dựa trên style đã tính) */
  showIf?: (resolved: Record<string, string>) => boolean
}

export interface StyleGroup {
  id: string
  label: string
  fields: StyleField[]
}

const opt = (...pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }))

const isFlex = (s: Record<string, string>) => s.display === 'flex' || s.display === 'inline-flex'
const isGrid = (s: Record<string, string>) => s.display === 'grid'

export const STYLE_GROUPS: Record<string, StyleGroup> = {
  layout: {
    id: 'layout',
    label: 'Bố cục',
    fields: [
      {
        key: 'display',
        label: 'Hiển thị',
        kind: 'select',
        options: opt(['block', 'Block'], ['flex', 'Flex'], ['grid', 'Grid'], ['inline-block', 'Inline block'], ['inline-flex', 'Inline flex']),
      },
      {
        key: 'flexDirection',
        label: 'Hướng',
        kind: 'select',
        options: opt(['row', 'Ngang →'], ['column', 'Dọc ↓'], ['row-reverse', 'Ngang ←'], ['column-reverse', 'Dọc ↑']),
        showIf: isFlex,
      },
      {
        key: 'justifyContent',
        label: 'Căn trục chính',
        kind: 'select',
        options: opt(
          ['flex-start', 'Đầu'], ['center', 'Giữa'], ['flex-end', 'Cuối'],
          ['space-between', 'Dàn đều (between)'], ['space-around', 'Dàn đều (around)'], ['space-evenly', 'Dàn đều (evenly)'],
        ),
        showIf: (s) => isFlex(s) || isGrid(s),
      },
      {
        key: 'alignItems',
        label: 'Căn trục phụ',
        kind: 'select',
        options: opt(['stretch', 'Kéo giãn'], ['flex-start', 'Đầu'], ['center', 'Giữa'], ['flex-end', 'Cuối'], ['baseline', 'Baseline']),
        showIf: (s) => isFlex(s) || isGrid(s),
      },
      {
        key: 'flexWrap',
        label: 'Xuống dòng',
        kind: 'select',
        options: opt(['nowrap', 'Không'], ['wrap', 'Có']),
        showIf: isFlex,
      },
      { key: 'gap', label: 'Khoảng cách', kind: 'unit', placeholder: '16px', showIf: (s) => isFlex(s) || isGrid(s) },
      {
        key: 'gridTemplateColumns',
        label: 'Cột lưới',
        kind: 'text',
        placeholder: 'repeat(3, 1fr)',
        showIf: isGrid,
      },
    ],
  },
  child: {
    id: 'child',
    label: 'Trong flex cha',
    fields: [
      { key: 'flexGrow', label: 'Grow', kind: 'unit', placeholder: '0' },
      { key: 'flexShrink', label: 'Shrink', kind: 'unit', placeholder: '1' },
      { key: 'flexBasis', label: 'Basis', kind: 'unit', placeholder: 'auto' },
      { key: 'gridColumn', label: 'Cột (grid)', kind: 'text', placeholder: 'span 2' },
      { key: 'gridRow', label: 'Hàng (grid)', kind: 'text', placeholder: 'span 2' },
      {
        key: 'alignSelf',
        label: 'Tự căn',
        kind: 'select',
        options: opt(['auto', 'Tự động'], ['flex-start', 'Đầu'], ['center', 'Giữa'], ['flex-end', 'Cuối'], ['stretch', 'Kéo giãn']),
      },
    ],
  },
  size: {
    id: 'size',
    label: 'Kích thước',
    fields: [
      { key: 'width', label: 'Rộng', kind: 'unit', placeholder: 'auto' },
      { key: 'maxWidth', label: 'Rộng tối đa', kind: 'unit', placeholder: 'none' },
      { key: 'height', label: 'Cao', kind: 'unit', placeholder: 'auto' },
      { key: 'minHeight', label: 'Cao tối thiểu', kind: 'unit', placeholder: '0' },
    ],
  },
  spacing: {
    id: 'spacing',
    label: 'Khoảng cách',
    fields: [
      { key: 'margin', label: 'Lề ngoài (margin)', kind: 'box' },
      { key: 'padding', label: 'Lề trong (padding)', kind: 'box' },
    ],
  },
  typography: {
    id: 'typography',
    label: 'Chữ',
    fields: [
      {
        key: 'fontFamily',
        label: 'Font',
        kind: 'select',
        options: opt(['var(--font-heading)', 'Font tiêu đề'], ['var(--font-body)', 'Font nội dung'], ['var(--font-mono)', 'Font mono'], ['inherit', 'Kế thừa']),
      },
      { key: 'fontSize', label: 'Cỡ chữ', kind: 'unit', placeholder: '16px' },
      {
        key: 'fontWeight',
        label: 'Độ đậm',
        kind: 'select',
        options: opt(['300', 'Mảnh (300)'], ['400', 'Thường (400)'], ['500', 'Vừa (500)'], ['600', 'Đậm vừa (600)'], ['700', 'Đậm (700)'], ['800', 'Rất đậm (800)']),
      },
      { key: 'lineHeight', label: 'Giãn dòng', kind: 'unit', placeholder: '1.6' },
      { key: 'letterSpacing', label: 'Giãn chữ', kind: 'unit', placeholder: '0' },
      {
        key: 'textAlign',
        label: 'Căn lề',
        kind: 'select',
        options: opt(['left', 'Trái'], ['center', 'Giữa'], ['right', 'Phải'], ['justify', 'Đều hai bên']),
      },
      {
        key: 'textTransform',
        label: 'Kiểu chữ',
        kind: 'select',
        options: opt(['none', 'Bình thường'], ['uppercase', 'IN HOA'], ['lowercase', 'chữ thường'], ['capitalize', 'Viết Hoa Đầu']),
      },
      { key: 'color', label: 'Màu chữ', kind: 'color' },
      {
        key: 'lineClamp',
        label: 'Giới hạn dòng',
        kind: 'select',
        options: opt(['1', '1 dòng (…)'], ['2', '2 dòng'], ['3', '3 dòng'], ['4', '4 dòng'], ['5', '5 dòng'], ['6', '6 dòng']),
      },
    ],
  },
  position: {
    id: 'position',
    label: 'Vị trí',
    fields: [
      {
        key: 'position',
        label: 'Định vị',
        kind: 'select',
        options: opt(['static', 'Bình thường'], ['relative', 'Relative'], ['sticky', 'Sticky – dính khi cuộn tới'], ['fixed', 'Fixed – cố định trên màn hình'], ['absolute', 'Absolute']),
      },
      { key: 'top', label: 'Trên', kind: 'unit', placeholder: 'auto', showIf: (s) => !!s.position && s.position !== 'static' },
      { key: 'bottom', label: 'Dưới', kind: 'unit', placeholder: 'auto', showIf: (s) => !!s.position && s.position !== 'static' },
      { key: 'left', label: 'Trái', kind: 'unit', placeholder: 'auto', showIf: (s) => !!s.position && s.position !== 'static' },
      { key: 'right', label: 'Phải', kind: 'unit', placeholder: 'auto', showIf: (s) => !!s.position && s.position !== 'static' },
      { key: 'zIndex', label: 'Lớp (z-index)', kind: 'unit', placeholder: '0' },
    ],
  },
  list: {
    id: 'list',
    label: 'Phần tử trong danh sách',
    fields: [
      { key: 'stripeOdd', label: 'Nền phần tử lẻ (1, 3, 5…)', kind: 'color' },
      { key: 'stripeEven', label: 'Nền phần tử chẵn (2, 4, 6…)', kind: 'color' },
      { key: 'stripeHover', label: 'Nền khi rê chuột', kind: 'color' },
    ],
  },
  background: {
    id: 'background',
    label: 'Nền',
    fields: [
      { key: 'backgroundColor', label: 'Màu nền', kind: 'color' },
      { key: 'backgroundImage', label: 'Ảnh / gradient', kind: 'text', placeholder: 'linear-gradient(...)' },
      { key: 'overlayColor', label: 'Lớp phủ (scrim)', kind: 'color' },
    ],
  },
  border: {
    id: 'border',
    label: 'Viền',
    fields: [
      { key: 'borderWidth', label: 'Độ dày', kind: 'unit', placeholder: '0' },
      {
        key: 'borderStyle',
        label: 'Kiểu viền',
        kind: 'select',
        options: opt(['none', 'Không'], ['solid', 'Liền'], ['dashed', 'Gạch'], ['dotted', 'Chấm']),
      },
      { key: 'borderColor', label: 'Màu viền', kind: 'color' },
      { key: 'borderRadius', label: 'Bo góc', kind: 'unit', placeholder: '0' },
    ],
  },
  media: {
    id: 'media',
    label: 'Hiển thị ảnh',
    fields: [
      {
        key: 'objectFit',
        label: 'Cách lấp đầy',
        kind: 'select',
        options: opt(['cover', 'Phủ kín (cover)'], ['contain', 'Vừa khung (contain)'], ['fill', 'Kéo giãn'], ['none', 'Gốc']),
      },
      { key: 'aspectRatio', label: 'Tỉ lệ', kind: 'text', placeholder: '16 / 9' },
    ],
  },
  effects: {
    id: 'effects',
    label: 'Hiệu ứng',
    fields: [
      { key: 'boxShadow', label: 'Đổ bóng', kind: 'text', placeholder: '0 4px 12px rgba(0,0,0,.1)' },
      { key: 'opacity', label: 'Độ mờ', kind: 'unit', placeholder: '1' },
      {
        key: 'overflow',
        label: 'Tràn',
        kind: 'select',
        options: opt(['visible', 'Hiện'], ['hidden', 'Ẩn'], ['auto', 'Cuộn khi cần']),
      },
      { key: 'transition', label: 'Chuyển động', kind: 'text', placeholder: 'all .2s ease' },
      {
        key: 'transitionTimingFunction',
        label: 'Easing',
        kind: 'select',
        options: opt(['ease', 'Ease'], ['linear', 'Linear'], ['ease-in', 'Ease in'], ['ease-out', 'Ease out'], ['ease-in-out', 'Ease in-out'], ['cubic-bezier(0.16, 1, 0.3, 1)', 'Expo out'], ['cubic-bezier(0.34, 1.56, 0.64, 1)', 'Back out'], ['spring', 'Spring (lò xo)']),
      },
      {
        key: 'focusRing',
        label: 'Viền khi focus',
        kind: 'select',
        options: opt(['none', 'Không'], ['default', 'Viền màu chính (2px)'], ['thick', 'Viền dày (3px)'], ['inset', 'Viền bên trong']),
      },
      {
        key: 'cursor',
        label: 'Con trỏ',
        kind: 'select',
        options: opt(['auto', 'Tự động'], ['pointer', 'Bàn tay'], ['grab', 'Nắm'], ['text', 'Chữ'], ['not-allowed', 'Cấm'], ['none', 'Ẩn']),
      },
    ],
  },
}
