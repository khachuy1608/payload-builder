/**
 * Gợi ý kiểu (style presets) cho từng loại block: thư viện biến thể người dùng xem và bấm để áp dụng.
 * Preset chỉ đổi `styles` (desktop + hover) và vài prop về hình thức (icon…), giữ nguyên nội dung (chữ, link, ảnh).
 * Thêm preset: thêm một mục vào PRESETS[type].
 */
import type { BuilderNode, NodeStyles, StyleMap } from './types'

export interface BlockPreset {
  id: string
  label: string
  /** Prop hình thức (icon, iconPosition…) – gộp vào props hiện có */
  props?: Record<string, unknown>
  styles: NodeStyles
  /** Nhóm hiển thị trong thư viện */
  group?: string
}

const btn = (id: string, label: string, desktop: StyleMap, hover?: StyleMap, props?: Record<string, unknown>, group = 'Kiểu nút'): BlockPreset => ({
  id,
  label,
  group,
  props: { icon: '', iconPosition: 'left', ...props },
  styles: { desktop: { padding: '12px 24px', transition: 'all .2s ease', ...desktop }, ...(hover ? { hover } : {}) },
})
const PRIMARY = { backgroundColor: 'var(--color-primary)', color: '#ffffff' }

export const PRESETS: Record<string, BlockPreset[]> = {
  button: [
    btn('primary', 'Đặc (primary)', PRIMARY, { opacity: '0.88' }),
    btn('secondary', 'Phụ (secondary)', { backgroundColor: 'var(--color-secondary)', color: '#ffffff' }, { opacity: '0.88' }),
    btn('accent', 'Nhấn (accent)', { backgroundColor: 'var(--color-accent)', color: '#1f2937' }, { opacity: '0.9' }),
    btn('outline', 'Viền (outline)', { backgroundColor: 'transparent', color: 'var(--color-primary)', borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--color-primary)' }, { backgroundColor: 'var(--color-primary)', color: '#ffffff' }),
    btn('ghost', 'Mờ (ghost)', { backgroundColor: 'transparent', color: 'var(--color-primary)' }, { backgroundColor: 'var(--color-surface)' }),
    btn('soft', 'Mềm (soft)', { backgroundColor: 'color-mix(in srgb, var(--color-primary) 14%, transparent)', color: 'var(--color-primary)' }, { backgroundColor: 'color-mix(in srgb, var(--color-primary) 22%, transparent)' }),
    btn('link', 'Dạng link', { backgroundColor: 'transparent', color: 'var(--color-primary)', padding: '0', textDecoration: 'underline', textUnderlineOffset: '4px' }, { color: 'var(--color-secondary)' }),
    btn('pill', 'Viên thuốc (pill)', { ...PRIMARY, borderRadius: '999px', padding: '12px 28px' }, { transform: 'translateY(-2px)', boxShadow: '0 10px 24px color-mix(in srgb, var(--color-primary) 35%, transparent)' }),
    btn('gradient', 'Gradient', { backgroundImage: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: '#ffffff', borderRadius: '999px', padding: '12px 28px' }, { opacity: '0.9' }),
    btn('dark', 'Tối', { backgroundColor: '#111827', color: '#ffffff' }, { backgroundColor: '#1f2937' }),
    btn('light', 'Sáng', { backgroundColor: '#ffffff', color: 'var(--color-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }, { backgroundColor: 'var(--color-surface)' }),
    btn('glass', 'Kính (glass)', { backgroundColor: 'rgba(255,255,255,.25)', color: 'var(--color-secondary)', backdropFilter: 'blur(8px)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,.5)' }, { backgroundColor: 'rgba(255,255,255,.4)' }),
    btn('lift', 'Nâng + bóng', { ...PRIMARY, boxShadow: '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)' }, { transform: 'translateY(-3px)', boxShadow: '0 12px 28px color-mix(in srgb, var(--color-primary) 40%, transparent)' }),
    btn('cta', 'CTA lớn', { ...PRIMARY, padding: '18px 40px', fontSize: '18px', borderRadius: '12px' }, { opacity: '0.9' }, {}, 'Kích cỡ'),
    btn('small', 'Nhỏ', { ...PRIMARY, padding: '7px 14px', fontSize: '13px' }, { opacity: '0.9' }, {}, 'Kích cỡ'),
    btn('block', 'Toàn chiều rộng', { ...PRIMARY, width: '100%', padding: '14px 24px' }, { opacity: '0.9' }, {}, 'Kích cỡ'),
    btn('icon-right', 'Icon mũi tên sau', PRIMARY, { gap: '12px' }, { icon: 'arrowRight', iconPosition: 'right' }, 'Có icon'),
    btn('icon-left', 'Icon trước chữ', { backgroundColor: 'transparent', color: 'var(--color-primary)', borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--color-primary)' }, { backgroundColor: 'var(--color-primary)', color: '#ffffff' }, { icon: 'download', iconPosition: 'left' }, 'Có icon'),
    btn('icon-play', 'Phát video', { backgroundColor: '#ffffff', color: 'var(--color-secondary)', borderRadius: '999px', boxShadow: '0 4px 16px rgba(0,0,0,.12)', padding: '12px 24px' }, { transform: 'scale(1.03)' }, { icon: 'play', iconPosition: 'left' }, 'Có icon'),
    btn('icon-only', 'Chỉ icon (tròn)', { ...PRIMARY, borderRadius: '999px', padding: '12px', width: '48px', height: '48px' }, { transform: 'scale(1.08)' }, { icon: 'arrowUpRight', iconPosition: 'only', iconSize: '22' }, 'Có icon'),
    btn('icon-ghost-round', 'Icon mờ vuông', { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', padding: '10px', width: '44px', height: '44px', borderRadius: 'var(--radius-md)' }, { backgroundColor: 'var(--color-border)' }, { icon: 'heart', iconPosition: 'only', iconSize: '20' }, 'Có icon'),
    btn('icon-cart', 'Giỏ hàng', { backgroundColor: 'var(--color-accent)', color: '#1f2937', borderRadius: '999px' }, { opacity: '0.9' }, { icon: 'cart', iconPosition: 'left' }, 'Có icon'),
    btn('icon-external', 'Mở liên kết ngoài', { backgroundColor: 'transparent', color: 'var(--color-primary)', padding: '0', fontWeight: '600' }, { textDecoration: 'underline' }, { icon: 'external', iconPosition: 'right', iconSize: '16' }, 'Có icon'),
  ],
  heading: [
    { id: 'hero', label: 'Hero lớn', group: 'Tiêu đề', styles: { desktop: { fontSize: '56px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.02em' }, mobile: { fontSize: '36px' } } },
    { id: 'section', label: 'Tiêu đề mục', group: 'Tiêu đề', styles: { desktop: { fontSize: '32px', fontWeight: '700', lineHeight: '1.2' }, mobile: { fontSize: '26px' } } },
    { id: 'sub', label: 'Tiêu đề nhỏ', group: 'Tiêu đề', styles: { desktop: { fontSize: '20px', fontWeight: '600' } } },
    { id: 'eyebrow', label: 'Eyebrow (nhãn in hoa)', group: 'Nhấn', styles: { desktop: { fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)' } } },
    { id: 'gradient', label: 'Chữ gradient', group: 'Nhấn', styles: { desktop: { fontSize: '48px', fontWeight: '800', backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', backgroundClip: 'text', color: 'transparent', display: 'inline-block' } } },
    { id: 'underline', label: 'Gạch chân màu nhấn', group: 'Nhấn', styles: { desktop: { fontSize: '32px', fontWeight: '700', display: 'inline-block', paddingBottom: '8px', borderBottom: '4px solid var(--color-accent)' } } },
    { id: 'centered', label: 'Căn giữa, rộng vừa', group: 'Bố cục', styles: { desktop: { fontSize: '40px', fontWeight: '800', textAlign: 'center', maxWidth: '720px', margin: '0 auto' } } },
    { id: 'muted', label: 'Mờ nhẹ', group: 'Nhấn', styles: { desktop: { fontSize: '24px', fontWeight: '500', color: 'var(--color-muted)' } } },
  ],
  paragraph: [
    { id: 'lead', label: 'Đoạn mở (lead)', styles: { desktop: { fontSize: '20px', lineHeight: '1.6', color: 'var(--color-muted)' } } },
    { id: 'body', label: 'Thân bài', styles: { desktop: { fontSize: '16px', lineHeight: '1.7' } } },
    { id: 'small', label: 'Nhỏ, mờ', styles: { desktop: { fontSize: '14px', color: 'var(--color-muted)' } } },
    { id: 'quote', label: 'Trích dẫn', styles: { desktop: { fontSize: '20px', fontStyle: 'italic', paddingLeft: '20px', borderLeft: '4px solid var(--color-primary)', color: 'var(--color-secondary)' } } },
    { id: 'highlight', label: 'Ô nổi bật', styles: { desktop: { padding: '16px 20px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' } } },
    { id: 'centered', label: 'Căn giữa, rộng vừa', styles: { desktop: { fontSize: '18px', textAlign: 'center', maxWidth: '640px', margin: '0 auto', color: 'var(--color-muted)' } } },
  ],
  image: [
    { id: 'rounded', label: 'Bo góc', styles: { desktop: { width: '100%', borderRadius: 'var(--radius-lg)' } } },
    { id: 'circle', label: 'Tròn (avatar)', styles: { desktop: { width: '120px', height: '120px', borderRadius: '999px', objectFit: 'cover' } } },
    { id: 'shadow', label: 'Đổ bóng', styles: { desktop: { width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 40px rgba(15,23,42,.15)' } } },
    { id: 'framed', label: 'Khung viền', styles: { desktop: { width: '100%', padding: '8px', backgroundColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' } } },
    { id: 'cover', label: 'Phủ khung 16:9', styles: { desktop: { width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 'var(--radius-md)' } } },
    { id: 'zoom', label: 'Phóng khi rê chuột', styles: { desktop: { width: '100%', borderRadius: 'var(--radius-md)', transition: 'transform .3s ease' }, hover: { transform: 'scale(1.03)' } } },
  ],
  card: [
    { id: 'elevated', label: 'Nổi (bóng)', styles: { desktop: { backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px rgba(15,23,42,.08)', overflow: 'hidden', transition: 'transform .2s, box-shadow .2s' }, hover: { transform: 'translateY(-4px)', boxShadow: '0 20px 40px rgba(15,23,42,.14)' } } },
    { id: 'outlined', label: 'Viền mảnh', styles: { desktop: { backgroundColor: 'var(--color-background)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' } } },
    { id: 'flat', label: 'Phẳng (nền phụ)', styles: { desktop: { backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' } } },
    { id: 'accent', label: 'Viền trái màu nhấn', styles: { desktop: { backgroundColor: 'var(--color-background)', borderLeft: '4px solid var(--color-primary)', borderRadius: 'var(--radius-md)', boxShadow: '0 1px 3px rgba(0,0,0,.08)', overflow: 'hidden' } } },
    { id: 'dark', label: 'Tối', styles: { desktop: { backgroundColor: 'var(--color-secondary)', color: '#ffffff', borderRadius: 'var(--radius-lg)', overflow: 'hidden' } } },
    { id: 'glass', label: 'Kính', styles: { desktop: { backgroundColor: 'rgba(255,255,255,.55)', backdropFilter: 'blur(12px)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,.7)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' } } },
    { id: 'horizontal', label: 'Ảnh bên trái', props: { mediaPosition: 'left' }, styles: { desktop: { backgroundColor: 'var(--color-background)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' } } },
  ],
}

const SECTION: BlockPreset[] = [
  { id: 'section', label: 'Section chuẩn', group: 'Section', styles: { desktop: { padding: '80px 24px' }, mobile: { padding: '48px 16px' } } },
  { id: 'section-surface', label: 'Dải nền phụ', group: 'Section', styles: { desktop: { padding: '80px 24px', backgroundColor: 'var(--color-surface)' }, mobile: { padding: '48px 16px' } } },
  { id: 'section-dark', label: 'Dải nền tối', group: 'Section', styles: { desktop: { padding: '80px 24px', backgroundColor: 'var(--color-secondary)', color: '#ffffff' }, mobile: { padding: '48px 16px' } } },
  { id: 'section-gradient', label: 'Dải gradient', group: 'Section', styles: { desktop: { padding: '96px 24px', backgroundImage: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, #fff), color-mix(in srgb, var(--color-accent) 12%, #fff))' }, mobile: { padding: '56px 16px' } } },
  { id: 'container', label: 'Khung giữa (1120px)', group: 'Khung', styles: { desktop: { maxWidth: '1120px', margin: '0 auto', padding: '0 24px' } } },
  { id: 'narrow', label: 'Khung hẹp (720px)', group: 'Khung', styles: { desktop: { maxWidth: '720px', margin: '0 auto', padding: '0 24px' } } },
  { id: 'box', label: 'Hộp viền bo', group: 'Khung', styles: { desktop: { padding: '24px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-background)' } } },
  { id: 'box-shadow', label: 'Hộp nổi', group: 'Khung', styles: { desktop: { padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-background)', boxShadow: '0 10px 30px rgba(15,23,42,.08)' } } },
]
PRESETS.div = SECTION
PRESETS.flexbox = [
  { id: 'row-center', label: 'Hàng ngang, căn giữa', group: 'Flex', styles: { desktop: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' } } },
  { id: 'row-between', label: 'Hàng ngang, dàn hai đầu', group: 'Flex', styles: { desktop: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }, mobile: { flexDirection: 'column', alignItems: 'stretch' } } },
  { id: 'col-center', label: 'Cột dọc, căn giữa', group: 'Flex', styles: { desktop: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' } } },
  { id: 'grid-3', label: 'Lưới 3 cột', group: 'Flex', styles: { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }, tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: '1fr' } } },
  { id: 'grid-2', label: 'Hai cột 50/50', group: 'Flex', styles: { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '32px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr' } } },
  ...SECTION.map((p) => ({ ...p, styles: { ...p.styles, desktop: { display: 'flex', flexDirection: 'column', gap: '16px', ...p.styles.desktop } } })),
]

/** Helper ngắn: preset chủ yếu đổi prop biến thể, kèm style tuỳ chọn */
const P = (id: string, label: string, props: Record<string, unknown> = {}, styles: NodeStyles = {}, group?: string): BlockPreset => ({ id, label, props, styles, ...(group ? { group } : {}) })
const SURFACE_BOX: StyleMap = { padding: '20px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }
const WHITE_CARD: StyleMap = { padding: '20px', backgroundColor: 'var(--color-background)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' }

Object.assign(PRESETS, {
  tabs: [
    P('underline', 'Gạch chân (mặc định)', { variant: 'underline' }),
    P('pills', 'Pills rời', { variant: 'pills' }),
    P('segmented', 'Segmented control', { variant: 'segmented' }),
    P('vertical', 'Dọc (tab bên trái)', { variant: 'vertical' }),
    P('boxed', 'Trong hộp', { variant: 'underline' }, { desktop: WHITE_CARD }),
  ],
  svg: [
    P('small-primary', 'Nhỏ, màu chính', {}, { desktop: { width: '32px', height: '32px', color: 'var(--color-primary)' } }),
    P('large-accent', 'Lớn, màu nhấn', {}, { desktop: { width: '72px', height: '72px', color: 'var(--color-accent)' } }),
    P('circle', 'Trong vòng tròn', {}, { desktop: { width: '56px', height: '56px', padding: '14px', color: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', borderRadius: '999px' } }),
    P('square', 'Trong ô vuông tối', {}, { desktop: { width: '56px', height: '56px', padding: '14px', color: '#ffffff', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-md)' } }),
    P('muted', 'Mờ', {}, { desktop: { width: '40px', height: '40px', color: 'var(--color-muted)' } }),
  ],
  youtube: [
    P('full', 'Toàn chiều rộng', {}, { desktop: { width: '100%' } }),
    P('rounded', 'Bo góc + bóng', {}, { desktop: { width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(15,23,42,.18)' } }),
    P('narrow', 'Hẹp, căn giữa', {}, { desktop: { width: '100%', maxWidth: '720px', margin: '0 auto', borderRadius: 'var(--radius-md)', overflow: 'hidden' } }),
    P('framed', 'Khung viền', {}, { desktop: { width: '100%', padding: '8px', backgroundColor: '#ffffff', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' } }),
    P('autoplay', 'Tự phát (tắt tiếng)', { autoplay: true, controls: false }, { desktop: { width: '100%' } }),
  ],
  divider: [
    P('thin', 'Mảnh', { variant: 'rule' }, { desktop: { height: '1px', width: '100%', backgroundColor: 'var(--color-border)', margin: '16px 0' } }),
    P('thick', 'Dày màu chính', { variant: 'rule' }, { desktop: { height: '4px', width: '64px', backgroundColor: 'var(--color-primary)', margin: '16px 0', borderRadius: '999px' } }),
    P('dotted', 'Chấm', { variant: 'decorative' }, { desktop: { height: '0', width: '100%', borderTop: '2px dotted var(--color-border)', margin: '16px 0' } }),
    P('labeled', 'Có chữ “hoặc”', { variant: 'labeled', label: 'hoặc' }, { desktop: { margin: '16px 0' } }),
    P('centered', 'Ngắn căn giữa', { variant: 'rule' }, { desktop: { height: '2px', width: '80px', backgroundColor: 'var(--color-accent)', margin: '24px auto' } }),
    P('vertical', 'Dọc', { variant: 'vertical' }, { desktop: { width: '1px', backgroundColor: 'var(--color-border)', margin: '0 16px' } }),
  ],
  dataList: [
    P('grid-4', 'Lưới 4 cột', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }, tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: '1fr' } }),
    P('grid-3', 'Lưới 3 cột', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }, mobile: { gridTemplateColumns: '1fr' } }),
    P('grid-2', 'Lưới 2 cột', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' }, mobile: { gridTemplateColumns: '1fr' } }),
    P('list', 'Danh sách dọc', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px' } }),
    P('scroll', 'Cuộn ngang', {}, { desktop: { display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' } }),
  ],
  masonry: [P('2', '2 cột', { columns: '2', gap: '16' }), P('3', '3 cột', { columns: '3', gap: '16' }), P('4', '4 cột sát', { columns: '4', gap: '8' }), P('airy', '3 cột thoáng', { columns: '3', gap: '32' })],
  bento: [P('4', '4 cột (mặc định)', { columns: '4', rowHeight: '140', gap: '16' }), P('3', '3 cột cao', { columns: '3', rowHeight: '200', gap: '20' }), P('6', '6 cột dày', { columns: '6', rowHeight: '100', gap: '12' }), P('dark', 'Nền tối', { columns: '4' }, { desktop: { padding: '24px', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-lg)' } })],
  marquee: [P('slow', 'Chậm', { speed: '40' }), P('fast', 'Nhanh', { speed: '12' }), P('reverse', 'Ngược chiều', { direction: 'right', speed: '25' }), P('band', 'Dải nền tối', { speed: '25' }, { desktop: { padding: '20px 0', backgroundColor: 'var(--color-secondary)', color: '#ffffff' } }), P('nopause', 'Không dừng khi rê', { pauseOnHover: false })],
  carousel: [P('dots', 'Chỉ chấm', { showArrows: false, showDots: true, perView: '1' }), P('arrows', 'Chỉ mũi tên', { showArrows: true, showDots: false, perView: '1' }), P('2', '2 slide/lần', { perView: '2', showDots: true }), P('3', '3 slide/lần', { perView: '3', showArrows: true, showDots: false }), P('auto', 'Tự chạy 4 giây', { autoplay: true, interval: '4' }), P('rounded', 'Bo góc + bóng', {}, { desktop: { borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(15,23,42,.14)' } })],
  accordion: [P('single', 'Mở một mục', { single: true }), P('multiple', 'Mở nhiều mục', { single: false }), P('boxed', 'Trong hộp', { single: true }, { desktop: { ...WHITE_CARD, padding: '8px 20px' } }), P('surface', 'Nền phụ', { single: true }, { desktop: { ...SURFACE_BOX, padding: '8px 20px' } })],
  header: [P('plain', 'Mảnh, dính trên', { sticky: true }, { desktop: { backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)', padding: '0 24px' } }), P('shadow', 'Bóng nhẹ', { sticky: true }, { desktop: { backgroundColor: 'var(--color-background)', boxShadow: '0 2px 12px rgba(15,23,42,.08)', padding: '0 24px' } }), P('dark', 'Tối', { sticky: true }, { desktop: { backgroundColor: 'var(--color-secondary)', color: '#ffffff', padding: '0 24px' } }), P('glass', 'Kính mờ', { sticky: true }, { desktop: { backgroundColor: 'rgba(255,255,255,.75)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,.06)', padding: '0 24px' } }), P('static', 'Không dính', { sticky: false }, { desktop: { backgroundColor: 'var(--color-background)', padding: '0 24px' } })],
  breadcrumbs: [P('slash', 'Gạch chéo', { separator: '/' }), P('chevron', 'Chevron', { separator: '›' }), P('arrow', 'Mũi tên', { separator: '→' }), P('pill', 'Trong viên', { separator: '›' }, { desktop: { display: 'inline-block', padding: '8px 14px', backgroundColor: 'var(--color-surface)', borderRadius: '999px' } })],
  pagination: [P('numbers', 'Số trang', { variant: 'numbers', showPrevNext: true }), P('compact', 'Số, không Trước/Sau', { variant: 'numbers', showPrevNext: false }), P('dots', 'Chấm', { variant: 'dots' }), P('center', 'Căn giữa', { variant: 'numbers' }, { desktop: { justifyContent: 'center', margin: '24px 0' } })],
  steps: [P('horizontal', 'Ngang', { orientation: 'horizontal' }), P('vertical', 'Dọc', { orientation: 'vertical' }), P('boxed', 'Trong hộp', { orientation: 'horizontal' }, { desktop: WHITE_CARD }), P('small', 'Nhỏ', { orientation: 'horizontal' }, { desktop: { fontSize: '13px' } })],
  toggleGroup: [P('segmented', 'Segmented', { variant: 'segmented' }), P('pills', 'Pills', { variant: 'pills' }), P('large', 'Segmented lớn', { variant: 'segmented' }, { desktop: { fontSize: '16px' } })],
  bottomNav: [P('inline', 'Trong dòng', { fixed: false }), P('fixed', 'Cố định dưới màn hình', { fixed: true }), P('dark', 'Tối', { fixed: false }, { desktop: { backgroundColor: 'var(--color-secondary)', color: '#ffffff', borderTop: '0' } })],
  floatingButton: [P('top', 'Lên đầu trang', { variant: 'backToTop', position: 'right' }), P('fab', 'FAB (+)', { variant: 'fab', position: 'right' }), P('chat', 'Chat launcher', { variant: 'chat', position: 'right' }), P('left', 'Góc trái', { variant: 'fab', position: 'left' })],
  scrollspy: [P('sticky', 'Dính', { sticky: true }), P('inline', 'Không dính', { sticky: false }), P('boxed', 'Trong hộp', { sticky: true }, { desktop: { ...SURFACE_BOX, padding: '16px' } })],
  searchBox: [P('default', 'Mặc định', { buttonText: 'Tìm' }), P('pill', 'Viên thuốc', { buttonText: '' }, { desktop: { maxWidth: '480px' } }), P('hero', 'Hero lớn', { buttonText: 'Tìm kiếm' }, { desktop: { maxWidth: '640px', margin: '0 auto', fontSize: '18px' } }), P('compact', 'Gọn (chỉ icon)', { buttonText: '', showTotal: false }, { desktop: { maxWidth: '320px' } })],
  waffleMenu: [P('default', 'Mặc định', {}), P('boxed', 'Nút có viền', {}, { desktop: { borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' } })],
  cascadingMenu: [P('submenu', 'Submenu (rê chuột)', { variant: 'submenu' }), P('cascader', 'Cascader (cột)', { variant: 'cascader' }), P('drilldown', 'Drill-down (quay lại)', { variant: 'drilldown' })],
  overflowMenu: [P('kebab', 'Kebab ⋮', { variant: 'kebab' }), P('meatballs', 'Meatballs ⋯', { variant: 'meatballs' }), P('boxed', 'Nút có viền', { variant: 'kebab' }, { desktop: { borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' } })],
  commandPalette: [P('default', 'Mặc định', {}), P('wide', 'Nút rộng', {}, { desktop: { width: '100%' } })],
  productTour: [P('button', 'Có nút bắt đầu', { autoStart: false, buttonText: 'Bắt đầu hướng dẫn' }), P('auto', 'Tự chạy lần đầu', { autoStart: true, buttonText: '' })],
  dataTable: [P('striped', 'Sọc', { striped: true, compact: false }), P('plain', 'Trơn', { striped: false, compact: false }), P('compact', 'Gọn', { striped: true, compact: true }), P('boxed', 'Trong hộp', { striped: true }, { desktop: { ...WHITE_CARD, padding: '0', overflow: 'hidden' } })],
  chart: [P('donut', 'Donut', { variant: 'donut', showLegend: true }), P('pie', 'Pie', { variant: 'pie', showLegend: true }), P('small', 'Nhỏ, không chú giải', { variant: 'donut', size: '120', showLegend: false }), P('large', 'Lớn', { variant: 'donut', size: '280', showLegend: true })],
  timeline: [P('default', 'Mặc định', {}), P('compact', 'Gọn', {}, { desktop: { fontSize: '13px', gap: '10px' } }), P('boxed', 'Trong hộp', {}, { desktop: { ...WHITE_CARD } })],
  avatarGroup: [P('sm', 'Nhỏ', { size: '28', max: '5' }), P('md', 'Vừa', { size: '36', max: '4' }), P('lg', 'Lớn', { size: '48', max: '3' }), P('xl', 'Rất lớn', { size: '64', max: '3' })],
  avatar: [P('circle', 'Tròn 64', { shape: 'circle', size: '64' }), P('circle-lg', 'Tròn lớn 120', { shape: 'circle', size: '120' }), P('rounded', 'Bo góc', { shape: 'rounded', size: '64' }), P('square', 'Vuông nhỏ', { shape: 'square', size: '40' }), P('ring', 'Viền màu chính', { shape: 'circle', size: '72' }, { desktop: { borderWidth: '3px', borderStyle: 'solid', borderColor: 'var(--color-primary)', padding: '2px' } })],
  statusDot: [P('online', 'Online', { status: 'online', showLabel: true, label: 'Trực tuyến' }), P('away', 'Away', { status: 'away', showLabel: true, label: 'Vắng mặt' }), P('busy', 'Busy', { status: 'busy', showLabel: true, label: 'Bận' }), P('live', 'LIVE nhấp nháy', { status: 'live', showLabel: true, label: 'LIVE', pulse: true }), P('dot', 'Chỉ chấm', { status: 'online', showLabel: false })],
  chatBubble: [P('them', 'Người khác', { side: 'them', status: 'none' }), P('me', 'Tôi', { side: 'me', status: 'read' }), P('me-sent', 'Tôi – đã gửi', { side: 'me', status: 'sent' })],
  badge: [P('pill-success', 'Pill xanh lá', { variant: 'pill', color: 'success', dot: true }), P('pill-warning', 'Pill cảnh báo', { variant: 'pill', color: 'warning', dot: true }), P('pill-error', 'Pill lỗi', { variant: 'pill', color: 'error', dot: true }), P('chip', 'Chip xoá được', { variant: 'chip', color: 'primary', removable: true }), P('tag', 'Tag phân loại', { variant: 'tag', color: 'neutral' }), P('badge', 'Badge số đếm', { variant: 'badge', color: 'error', count: '7' }), P('tag-info', 'Tag xanh dương', { variant: 'tag', color: 'info' })],
  progress: [P('bar', 'Thanh', { variant: 'bar', indeterminate: false, showValue: true }), P('bar-thin', 'Thanh mảnh', { variant: 'bar', showValue: false, label: '' }, { desktop: { fontSize: '0' } }), P('bar-indet', 'Thanh chạy liên tục', { variant: 'bar', indeterminate: true }), P('ring', 'Vòng', { variant: 'ring', size: '64', showValue: true }), P('ring-lg', 'Vòng lớn', { variant: 'ring', size: '120', showValue: true }), P('spinner', 'Spinner', { variant: 'spinner', size: '32', label: '' })],
  skeleton: [P('text', 'Dòng chữ', { variant: 'text', lines: '3' }), P('avatar', 'Avatar + chữ', { variant: 'avatar' }), P('card', 'Thẻ', { variant: 'card', lines: '2' }), P('image', 'Khối ảnh', { variant: 'image' }), P('static', 'Không lấp lánh', { variant: 'card', animated: false })],
  emptyState: [P('default', 'Mặc định', {}, { desktop: { padding: '48px 24px', textAlign: 'center' } }), P('boxed', 'Trong hộp nền phụ', {}, { desktop: { ...SURFACE_BOX, padding: '48px 24px', textAlign: 'center' } }), P('dashed', 'Viền đứt', {}, { desktop: { padding: '40px 24px', textAlign: 'center', borderWidth: '2px', borderStyle: 'dashed', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' } }), P('compact', 'Gọn, không nút', { buttonText: '' }, { desktop: { padding: '24px', textAlign: 'center' } })],
  alert: [P('info', 'Inline – thông tin', { variant: 'inline', severity: 'info' }), P('success', 'Inline – thành công', { variant: 'inline', severity: 'success' }), P('warning', 'Inline – cảnh báo', { variant: 'inline', severity: 'warning' }), P('error', 'Inline – lỗi', { variant: 'inline', severity: 'error' }), P('callout', 'Callout', { variant: 'callout', severity: 'info' }), P('banner', 'Banner toàn chiều rộng', { variant: 'banner', severity: 'warning' })],
  toast: [P('bottom', 'Dưới giữa', { position: 'bottom-center', severity: 'neutral' }), P('success', 'Thành công, dưới phải', { position: 'bottom-right', severity: 'success' }), P('error', 'Lỗi, trên giữa', { position: 'top-center', severity: 'error' }), P('load', 'Hiện khi vào trang', { trigger: 'load', position: 'bottom-center' }), P('undo', 'Có nút Hoàn tác', { actionText: 'Hoàn tác' })],
  dialog: [P('modal', 'Modal giữa', { variant: 'modal' }), P('drawer-right', 'Drawer phải', { variant: 'drawer', side: 'right' }), P('drawer-left', 'Drawer trái', { variant: 'drawer', side: 'left' }), P('sheet', 'Sheet từ dưới', { variant: 'sheet' }), P('modal-nofoot', 'Modal không nút huỷ', { variant: 'modal', closeText: '' })],
  popover: [P('popover', 'Popover', { variant: 'popover' }), P('dropdown', 'Dropdown menu', { variant: 'dropdown' }), P('tooltip', 'Tooltip', { variant: 'tooltip' }), P('hovercard', 'Hover card', { variant: 'hovercard' }), P('top', 'Popover phía trên', { variant: 'popover', placement: 'top' })],
  lightbox: [P('3', '3 cột', { columns: '3', gap: '8' }), P('2', '2 cột rộng', { columns: '2', gap: '16' }), P('4', '4 cột sát', { columns: '4', gap: '4' }), P('5', '5 cột', { columns: '5', gap: '6' })],
  form: [P('stacked', 'Dọc, hẹp', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' } }), P('card', 'Trong hộp', {}, { desktop: { ...WHITE_CARD, padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '560px' } }), P('surface', 'Nền phụ', {}, { desktop: { ...SURFACE_BOX, padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '560px' } }), P('two-col', 'Hai cột', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px 20px', maxWidth: '720px' }, mobile: { gridTemplateColumns: '1fr' } }), P('wide', 'Toàn chiều rộng', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '14px' } })],
  formField: [P('text', 'Văn bản', { type: 'text' }), P('email', 'Email', { type: 'email' }), P('textarea', 'Đoạn văn', { type: 'textarea' }), P('select', 'Chọn một', { type: 'select' }), P('combobox', 'Combobox', { type: 'combobox' }), P('multiselect', 'Chọn nhiều', { type: 'multiselect' }), P('checkbox', 'Checkbox', { type: 'checkbox' }), P('radio', 'Radio', { type: 'radio' }), P('switch', 'Switch', { type: 'switch' }), P('date', 'Date picker', { type: 'date' }), P('time', 'Time field', { type: 'time' }), P('password', 'Mật khẩu', { type: 'password' }), P('required', 'Bắt buộc (*)', { required: true })],
  signInForm: [P('card', 'Hộp viền', {}, { desktop: { ...WHITE_CARD, padding: '28px', maxWidth: '400px' } }), P('flat', 'Phẳng, không viền', {}, { desktop: { maxWidth: '400px' } }), P('dark', 'Tối', {}, { desktop: { padding: '28px', maxWidth: '400px', backgroundColor: 'var(--color-secondary)', color: '#ffffff', borderRadius: 'var(--radius-lg)' } }), P('centered', 'Căn giữa trang', {}, { desktop: { ...WHITE_CARD, padding: '32px', maxWidth: '420px', margin: '0 auto', boxShadow: '0 20px 50px rgba(15,23,42,.1)' } }), P('no-provider', 'Không nút mạng xã hội', { providers: [] }, { desktop: { ...WHITE_CARD, padding: '28px', maxWidth: '400px' } })],
  slide: [P('center', 'Căn giữa', {}, { desktop: { padding: '64px 24px', minHeight: '260px', textAlign: 'center' } }), P('dark', 'Nền tối', {}, { desktop: { padding: '64px 24px', minHeight: '260px', backgroundColor: 'var(--color-secondary)', color: '#ffffff' } }), P('surface', 'Nền phụ', {}, { desktop: { padding: '64px 24px', minHeight: '260px', backgroundColor: 'var(--color-surface)' } })],
  tab: [P('plain', 'Mặc định', {}, { desktop: { padding: '16px 0' } }), P('boxed', 'Trong hộp', {}, { desktop: { ...WHITE_CARD, marginTop: '12px' } })],
  accordionItem: [P('open', 'Mở sẵn', { open: true }), P('closed', 'Đóng', { open: false })],
})

export function getPresets(type: string): BlockPreset[] {
  return PRESETS[type] ?? []
}

/**
 * Áp dụng preset lên node: thay desktop + hover (và tablet/mobile nếu preset có), giữ nguyên các bucket khác,
 * gộp prop hình thức, giữ nội dung.
 */
export function applyPreset(node: BuilderNode, preset: BlockPreset): BuilderNode {
  const styles: NodeStyles = { ...node.styles }
  const hasLook = !!preset.styles.desktop && Object.keys(preset.styles.desktop).length > 0
  if (hasLook) {
    // preset định nghĩa hình thức: thay hẳn desktop + hover (tablet/mobile của người dùng giữ nguyên trừ khi preset có)
    styles.desktop = { ...preset.styles.desktop }
    if (preset.styles.hover) styles.hover = { ...preset.styles.hover }
    else delete styles.hover
  }
  if (preset.styles.tablet) styles.tablet = { ...preset.styles.tablet }
  if (preset.styles.mobile) styles.mobile = { ...preset.styles.mobile }
  return { ...node, props: { ...node.props, ...(preset.props ?? {}) }, styles }
}
