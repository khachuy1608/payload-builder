/**
 * Mẫu trang có sẵn: cây root dựng từ các block trong registry. Khi áp dụng, editor nhân bản với id mới.
 * Người dùng có thể lưu trang đang dựng thành mẫu riêng (my-blocks với kind = 'page').
 */
import { getBlock } from './registry'
import { genId } from './tree'
import type { BuilderNode, NodeStyles } from './types'

export interface PageTemplate {
  id: string
  name: string
  description: string
  root: BuilderNode
}

/** Node theo default của block + ghi đè props/styles (styles gộp theo từng thiết bị) */
function n(type: string, props: Record<string, unknown> = {}, styles: NodeStyles = {}, children?: BuilderNode[]): BuilderNode {
  const d = getBlock(type)?.defaults() ?? { props: {}, styles: {} }
  const merged: NodeStyles = { ...d.styles }
  for (const k of Object.keys(styles) as (keyof NodeStyles)[]) merged[k] = { ...(d.styles[k] ?? {}), ...(styles[k] ?? {}) }
  return { id: genId(), type, props: { ...d.props, ...props }, styles: merged, ...(children ? { children } : d.children ? { children: d.children } : {}) }
}

const root = (children: BuilderNode[]): BuilderNode => ({ id: 'root', type: 'root', props: {}, styles: {}, children })

const section = (children: BuilderNode[], extra: Record<string, string> = {}, mobile: Record<string, string> = {}): BuilderNode =>
  n('div', {}, { desktop: { padding: '72px 24px', maxWidth: '1120px', margin: '0 auto', ...extra }, mobile: { padding: '48px 16px', ...mobile } }, children)

const heading = (text: string, tag = 'h2', extra: Record<string, string> = {}) => n('heading', { text, tag }, { desktop: { fontSize: tag === 'h1' ? '48px' : tag === 'h2' ? '32px' : '20px', fontWeight: '700', ...extra }, mobile: tag === 'h1' ? { fontSize: '32px' } : {} })
const para = (text: string, extra: Record<string, string> = {}) => n('paragraph', { text }, { desktop: { color: 'var(--color-muted)', fontSize: '17px', ...extra } })
const button = (text: string, href = '#', extra: Record<string, string> = {}) => n('button', { text, href }, { desktop: extra })

const hero = (title: string, text: string, cta = 'Bắt đầu ngay') =>
  n(
    'flexbox',
    {},
    {
      desktop: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '112px 24px', textAlign: 'center', backgroundImage: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%)' },
      mobile: { padding: '64px 16px' },
    },
    [heading(title, 'h1', { maxWidth: '760px' }), para(text, { maxWidth: '620px', fontSize: '19px' }), n('flexbox', {}, { desktop: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' } }, [button(cta, '#lien-he'), button('Tìm hiểu thêm', '#', { backgroundColor: 'transparent', color: 'var(--color-primary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-primary)' })])],
  )

const feature = (title: string, body: string, icon: string) =>
  n('div', {}, { desktop: { padding: '28px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', flexGrow: '1', flexBasis: '0', transition: 'transform .2s ease' }, hover: { transform: 'translateY(-4px)' } }, [
    n('badge', { variant: 'pill', text: icon, color: 'info', dot: false }, { desktop: { marginBottom: '12px' } }),
    heading(title, 'h3', { marginBottom: '8px' }),
    para(body, { fontSize: '15px' }),
  ])

const features = (items: [string, string, string][]) =>
  n('flexbox', {}, { desktop: { display: 'flex', flexDirection: 'row', gap: '24px' }, mobile: { flexDirection: 'column' } }, items.map(([t, b, i]) => feature(t, b, i)))

const contactForm = () =>
  n('form', { name: 'lien-he' }, { desktop: { margin: '0 auto' } }, [
    n('formField', { type: 'text', label: 'Họ tên', name: 'ho-ten', placeholder: 'Nguyễn Văn A', required: true }),
    n('formField', { type: 'email', label: 'Email', name: 'email', placeholder: 'ban@vidu.com', required: true }),
    n('formField', { type: 'textarea', label: 'Lời nhắn', name: 'loi-nhan', placeholder: 'Bạn cần gì?' }),
  ])

const teamCard = () =>
  n('card', { media: null, href: '' }, { desktop: { padding: '24px', textAlign: 'center' } }, [
    n('avatar', { media: '{{avatar}}', name: '{{name}}', size: '80' }, { desktop: { margin: '0 auto 12px' } }),
    n('heading', { text: '{{name}}', tag: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700' } }),
    n('paragraph', { text: '{{title}}' }, { desktop: { color: 'var(--color-muted)', fontSize: '14px' } }),
  ])

const dataGrid = (collection: string, children: BuilderNode[], limit = 6) =>
  n('dataList', { data: { collection, mode: 'list', limit } }, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }, mobile: { gridTemplateColumns: '1fr' } }, children)

const price = (name: string, amount: string, items: string[], highlight = false) =>
  n('div', {}, { desktop: { padding: '32px', borderRadius: 'var(--radius-lg)', borderWidth: '1px', borderStyle: 'solid', borderColor: highlight ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: highlight ? 'var(--color-surface)' : 'var(--color-background)', flexGrow: '1', flexBasis: '0', display: 'flex', flexDirection: 'column', gap: '12px' } }, [
    heading(name, 'h3'),
    n('heading', { text: amount, tag: 'p' }, { desktop: { fontSize: '40px', fontWeight: '800' } }),
    ...items.map((t) => para('✓ ' + t, { fontSize: '15px' })),
    button('Chọn gói', '#', highlight ? {} : { backgroundColor: 'var(--color-secondary)' }),
  ])

const faq = () =>
  n('accordion', { single: true }, {}, [
    n('accordionItem', { title: 'Tôi có thể đổi mẫu sau khi dựng không?', open: true }, {}, [para('Có. Mẫu chỉ là điểm xuất phát; mọi phần tử đều sửa, kéo thả hoặc xoá được.')]),
    n('accordionItem', { title: 'Nội dung lấy từ đâu?', open: false }, {}, [para('Từ các collection trong Payload: chọn nguồn dữ liệu cho Danh sách dữ liệu rồi gắn trường bằng nút ⚡.')]),
    n('accordionItem', { title: 'Có hỗ trợ mobile không?', open: false }, {}, [para('Mọi kiểu dáng chỉnh riêng cho Desktop, Tablet và Mobile.')]),
  ])

function build(): PageTemplate[] {
  return [
    { id: 'blank', name: 'Trang trống', description: 'Bắt đầu từ đầu.', root: root([]) },
    {
      id: 'landing',
      name: 'Trang đích (landing)',
      description: 'Hero, 3 điểm nổi bật, bảng giá, FAQ và form liên hệ.',
      root: root([
        hero('Dựng website nhanh với Page Builder', 'Kéo thả block, gắn dữ liệu thật từ CMS và xuất bản trong vài phút.'),
        section([heading('Vì sao chọn chúng tôi', 'h2', { textAlign: 'center', marginBottom: '32px' }), features([['Nhanh', 'Dựng trang trong vài phút với block có sẵn.', '⚡'], ['Linh hoạt', 'Kiểu dáng theo từng thiết bị, theme đổi một chạm.', '🎨'], ['Dữ liệu thật', 'Bind trực tiếp từ collection của Payload.', '🗂']])]),
        section([heading('Bảng giá', 'h2', { textAlign: 'center', marginBottom: '32px' }), n('flexbox', {}, { desktop: { display: 'flex', gap: '24px' }, mobile: { flexDirection: 'column' } }, [price('Cơ bản', '0đ', ['1 site', 'Block cơ bản', 'Hỗ trợ cộng đồng']), price('Chuyên nghiệp', '299k/tháng', ['Không giới hạn trang', 'Theme & My Blocks', 'Hỗ trợ ưu tiên'], true), price('Doanh nghiệp', 'Liên hệ', ['Nhiều site', 'SSO', 'SLA'])])], { backgroundColor: 'var(--color-surface)', maxWidth: 'none' }),
        section([heading('Câu hỏi thường gặp', 'h2', { marginBottom: '24px' }), faq()], { maxWidth: '800px' }),
        section([heading('Liên hệ', 'h2', { textAlign: 'center', marginBottom: '8px' }), para('Để lại thông tin, chúng tôi sẽ phản hồi trong 24 giờ.', { textAlign: 'center', marginBottom: '24px' }), contactForm()], { maxWidth: '640px' }),
      ]),
    },
    {
      id: 'about',
      name: 'Giới thiệu & đội ngũ',
      description: 'Câu chuyện, giá trị cốt lõi và danh sách thành viên lấy từ collection người dùng.',
      root: root([
        section([heading('Về chúng tôi', 'h1'), para('Chúng tôi xây dựng công cụ giúp mọi đội ngũ tự dựng website mà không cần lập trình.', { fontSize: '19px', maxWidth: '720px' })], { padding: '96px 24px 48px' }),
        section([features([['Tận tâm', 'Khách hàng là trung tâm của mọi quyết định.', '💙'], ['Minh bạch', 'Giá rõ ràng, không phí ẩn.', '🔎'], ['Bền vững', 'Phát triển lâu dài cùng đối tác.', '🌱']])], { padding: '24px 24px 48px' }),
        section([heading('Đội ngũ', 'h2', { textAlign: 'center', marginBottom: '32px' }), dataGrid('users', [teamCard()])]),
      ]),
    },
    {
      id: 'contact',
      name: 'Liên hệ',
      description: 'Thông tin liên hệ và form gửi về CMS.',
      root: root([
        section([heading('Liên hệ với chúng tôi', 'h1'), para('Điền form bên dưới hoặc gửi email tới hello@example.com.', { fontSize: '19px' })], { padding: '96px 24px 32px', maxWidth: '640px' }),
        section([contactForm()], { padding: '0 24px 96px', maxWidth: '640px' }),
      ]),
    },
    {
      id: 'directory',
      name: 'Danh sách có tìm kiếm',
      description: 'Ô tìm kiếm, lưới bản ghi từ collection và phân trang.',
      root: root([
        section([heading('Thành viên', 'h1', { marginBottom: '16px' }), n('searchBox', { placeholder: 'Tìm theo tên…' }, { desktop: { marginBottom: '24px', maxWidth: '480px' } }), dataGrid('users', [teamCard()], 9), n('pagination', { auto: true }, { desktop: { marginTop: '32px', display: 'flex', justifyContent: 'center' } })]),
      ]),
    },
    {
      id: 'pricing',
      name: 'Bảng giá',
      description: '3 gói dịch vụ và FAQ.',
      root: root([
        section([heading('Chọn gói phù hợp', 'h1', { textAlign: 'center' }), para('Dùng thử miễn phí 14 ngày, không cần thẻ.', { textAlign: 'center', marginBottom: '40px' }), n('flexbox', {}, { desktop: { display: 'flex', gap: '24px' }, mobile: { flexDirection: 'column' } }, [price('Cơ bản', '0đ', ['1 site', 'Block cơ bản', 'Hỗ trợ cộng đồng']), price('Chuyên nghiệp', '299k/tháng', ['Không giới hạn trang', 'Theme & My Blocks', 'Hỗ trợ ưu tiên'], true), price('Doanh nghiệp', 'Liên hệ', ['Nhiều site', 'SSO', 'SLA'])])]),
        section([heading('Câu hỏi thường gặp', 'h2', { marginBottom: '24px' }), faq()], { maxWidth: '800px' }),
      ]),
    },
  ]
}

let cache: PageTemplate[] | null = null
/** Mẫu có sẵn (dựng một lần; id node cố định trong phiên – khi áp dụng sẽ được nhân bản với id mới) */
export function getPageTemplates(): PageTemplate[] {
  return (cache ??= build())
}
