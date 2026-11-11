import type { Payload } from 'payload'
import type { BuilderNode, PageContent } from '../builder/types'

let n = 0
const id = (p: string) => `${p}${++n}`

const node = (
  type: string,
  props: Record<string, unknown>,
  styles: BuilderNode['styles'] = {},
  children?: BuilderNode[],
): BuilderNode => ({ id: id(type.slice(0, 3)), type, props, styles, ...(children ? { children } : {}) })

function feature(title: string, body: string): BuilderNode {
  return node(
    'div',
    {},
    {
      desktop: {
        padding: '24px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        flexGrow: '1',
        flexBasis: '0',
        transition: 'transform .2s ease',
      },
      hover: { transform: 'translateY(-4px)' },
    },
    [
      node('heading', { text: title, tag: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', marginBottom: '8px' } }),
      node('paragraph', { text: body }, { desktop: { color: 'var(--color-muted)' } }),
    ],
  )
}

/** Trang mẫu thể hiện các block cơ bản – tạo một lần khi DB còn trống */
export function demoHomeContent(): PageContent {
  n = 0
  return {
    version: 1,
    root: {
      id: 'root',
      type: 'root',
      props: {},
      styles: {},
      children: [
        node(
          'flexbox',
          {},
          {
            desktop: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              padding: '96px 24px',
              textAlign: 'center',
              backgroundImage: 'linear-gradient(135deg, #eef2ff 0%, #fdf2f8 100%)',
            },
            mobile: { padding: '56px 16px' },
          },
          [
            node('heading', { text: 'Dựng trang bằng kéo thả', tag: 'h1' }, { desktop: { fontSize: '52px', fontWeight: '800', maxWidth: '760px' }, mobile: { fontSize: '34px' } }),
            node(
              'paragraph',
              { text: 'Payload CMS + Visual Builder: chọn block bên trái, kéo vào trang, chỉnh thuộc tính bên phải. Responsive theo từng thiết bị.' },
              { desktop: { fontSize: '19px', color: 'var(--color-muted)', maxWidth: '620px' } },
            ),
            node('button', { text: 'Bắt đầu ngay', href: '/admin', newTab: false }, {
              desktop: {
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                padding: '14px 28px',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                transition: 'opacity .2s ease',
              },
              hover: { opacity: '0.85' },
            }),
          ],
        ),
        node(
          'flexbox',
          {},
          {
            desktop: { display: 'flex', flexDirection: 'row', gap: '24px', padding: '64px 24px', maxWidth: '1120px', margin: '0 auto' },
            mobile: { flexDirection: 'column', padding: '40px 16px' },
          },
          [
            feature('Block dùng chung', 'Mỗi block định nghĩa một lần, dùng cho cả editor và trang thật – thấy gì được nấy.'),
            feature('Responsive', 'Chỉnh style riêng cho Desktop, Tablet, Mobile và trạng thái Hover.'),
            feature('Nháp & xuất bản', 'Lưu nháp thoải mái, xem trước, rồi xuất bản khi sẵn sàng.'),
          ],
        ),
        node('divider', {}, { desktop: { height: '1px', width: '100%', maxWidth: '1120px', backgroundColor: 'var(--color-border)', margin: '0 auto' } }),
        node(
          'div',
          {},
          { desktop: { padding: '64px 24px', maxWidth: '880px', margin: '0 auto' }, mobile: { padding: '40px 16px' } },
          [
            node('heading', { text: 'Tabs mẫu', tag: 'h2' }, { desktop: { fontSize: '28px', fontWeight: '700', marginBottom: '16px' } }),
            node('tabs', { defaultIndex: '0' }, {}, [
              node('tab', { title: 'Giới thiệu' }, { desktop: { padding: '16px 0' } }, [
                node('paragraph', { text: 'Mỗi tab là một vùng chứa: kéo bất kỳ block nào vào đây.' }),
              ]),
              node('tab', { title: 'Tính năng' }, { desktop: { padding: '16px 0' } }, [
                node('paragraph', { text: 'Heading, Paragraph, Image, SVG, Button, YouTube, Divider, Div, Flexbox, Tabs.' }),
              ]),
            ]),
          ],
        ),
      ],
    },
  }
}

export async function seed(payload: Payload) {
  try {
    const { totalDocs } = await payload.count({ collection: 'pages' })
    if (totalDocs > 0) return
    await payload.create({
      collection: 'pages',
      data: { title: 'Trang chủ', slug: 'home', content: demoHomeContent() as unknown as Record<string, unknown>, _status: 'published' },
    })
    payload.logger.info('Đã tạo trang mẫu "home".')
  } catch (err) {
    payload.logger.error({ err }, 'Không tạo được trang mẫu')
  }
}
