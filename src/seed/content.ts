import type { Payload } from 'payload'

/** JSON Lexical tối giản: đoạn văn, tiêu đề, danh sách */
const t = (text: string, format = 0) => ({ type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 })
const p = (...children: unknown[]) => ({ type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1, textFormat: 0, textStyle: '' })
const h = (tag: string, text: string) => ({ type: 'heading', tag, children: [t(text)], direction: 'ltr', format: '', indent: 0, version: 1 })
const ul = (...items: string[]) => ({ type: 'list', listType: 'bullet', tag: 'ul', start: 1, children: items.map((x, i) => ({ type: 'listitem', value: i + 1, children: [t(x)], direction: 'ltr', format: '', indent: 0, version: 1 })), direction: 'ltr', format: '', indent: 0, version: 1 })
const quote = (text: string) => ({ type: 'quote', children: [t(text)], direction: 'ltr', format: '', indent: 0, version: 1 })
export const lexical = (...children: unknown[]) => ({ root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } })

/** Dữ liệu mẫu cho các collection nội dung – chỉ tạo khi collection còn trống */
export async function seedContent(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'categories' })
  if (totalDocs > 0) return
  const cat = async (name: string, description: string) => payload.create({ collection: 'categories', data: { name, slug: '', description } as never })
  const tin = await cat('Tin tức', 'Cập nhật mới nhất')
  const huongDan = await cat('Hướng dẫn', 'Cách dùng từng tính năng')
  const author = (await payload.find({ collection: 'users', limit: 1, sort: 'createdAt', depth: 0 })).docs[0]

  const posts = [
    { title: 'Ra mắt Visual Builder 2.0', category: tin.id, excerpt: 'Kéo thả, gắn dữ liệu thật và xuất bản trong vài phút.', tags: ['sản phẩm', 'ra mắt'], content: lexical(h('h2', 'Có gì mới'), p(t('Phiên bản mới mang tới '), t('header/footer toàn site', 1), t(', mẫu trang, bình luận và lên lịch xuất bản.')), ul('Mẫu trang có sẵn', 'Tay cầm kéo padding ngay trên canvas', 'Theme với design tokens đầy đủ'), quote('Dựng web nhanh hơn, không cần lập trình.'), p(t('Hãy thử ngay trong trang quản trị.'))) },
    { title: 'Gắn dữ liệu CMS vào trang như thế nào', category: huongDan.id, excerpt: 'Chọn nguồn dữ liệu, bấm ⚡ để gắn trường, lặp bằng Danh sách dữ liệu.', tags: ['hướng dẫn'], content: lexical(h('h2', 'Ba bước'), ul('Chọn block Danh sách dữ liệu và collection', 'Chọn phần tử mẫu, bấm ⚡ để gắn trường', 'Thêm Pagination / Ô tìm kiếm nếu cần'), p(t('Trang mẫu động (ví dụ /bai-viet/<slug>) tự bind toàn bộ nội dung theo bản ghi.'))) },
    { title: 'Tối ưu SEO cho từng trang', category: huongDan.id, excerpt: 'Meta title, Open Graph, sitemap và JSON-LD được sinh tự động.', tags: ['seo'], content: lexical(p(t('Mở '), t('Cài đặt trang → SEO & chia sẻ', 1), t(' để đặt tiêu đề, mô tả và ảnh chia sẻ.')), h('h3', 'Checklist'), ul('Tiêu đề dưới 60 ký tự', 'Mô tả 120–160 ký tự', 'Ảnh OG 1200×630')) },
  ]
  for (const [i, post] of posts.entries()) {
    await payload.create({ collection: 'posts', data: { title: post.title, slug: '', excerpt: post.excerpt, category: post.category, author: author?.id ?? null, publishedAt: new Date(Date.now() - i * 86400000).toISOString(), readingMinutes: 3 + i, tags: post.tags.map((tag) => ({ tag })), content: post.content, published: true } as never })
  }
  const products = [
    { name: 'Gói Cơ bản', price: 0, summary: '1 site, block cơ bản, hỗ trợ cộng đồng.', sku: 'BASIC', featured: false },
    { name: 'Gói Chuyên nghiệp', price: 299000, salePrice: 249000, summary: 'Không giới hạn trang, theme & My Blocks, hỗ trợ ưu tiên.', sku: 'PRO', featured: true },
    { name: 'Gói Doanh nghiệp', price: 1990000, summary: 'Nhiều site, SSO, SLA 99.9%.', sku: 'ENT', featured: false },
  ]
  for (const pr of products) {
    await payload.create({ collection: 'products', data: { ...pr, slug: '', category: tin.id, inStock: true, published: true, description: lexical(h('h3', 'Bao gồm'), ul('Visual Builder đầy đủ', 'Cập nhật trọn đời', 'Hỗ trợ qua email')) } as never })
  }
  const events = [
    { title: 'Workshop: Dựng landing page trong 1 giờ', location: 'Online (Zoom)', summary: 'Thực hành từ mẫu trang tới xuất bản.', days: 7, price: 0, capacity: 100 },
    { title: 'Gặp gỡ người dùng Page Builder', location: 'Hà Nội', summary: 'Chia sẻ case study và lộ trình sản phẩm.', days: 21, price: 150000, capacity: 60 },
  ]
  for (const ev of events) {
    const start = new Date(Date.now() + ev.days * 86400000)
    await payload.create({ collection: 'events', data: { title: ev.title, slug: '', location: ev.location, summary: ev.summary, startAt: start.toISOString(), endAt: new Date(start.getTime() + 2 * 3600000).toISOString(), price: ev.price, capacity: ev.capacity, published: true, description: lexical(p(t(ev.summary)), ul('Đăng ký trước để giữ chỗ', 'Có ghi hình cho người đăng ký')) } as never })
  }
  const faqs = [
    ['Tôi có cần biết lập trình không?', 'Không. Mọi thứ dựng bằng kéo thả; lập trình viên có thể mở rộng block khi cần.'],
    ['Dữ liệu lưu ở đâu?', 'Trong Postgres qua Payload CMS; ảnh ở thư mục media hoặc S3.'],
    ['Có hỗ trợ đa ngôn ngữ không?', 'Có, bật localization trong Payload và chọn ngôn ngữ ngay trong builder.'],
    ['Làm sao để nhân bản site?', 'Dùng npm run export / import để chuyển toàn bộ trang, block, theme và media.'],
  ]
  for (const [i, [q, a]] of faqs.entries()) await payload.create({ collection: 'faqs', data: { question: q, order: i, published: true, answer: lexical(p(t(a))) } as never })
  const testimonials = [
    ['Lan Phạm', 'Trưởng phòng Marketing', 'Nova Retail', 'Team marketing tự dựng landing page mà không cần chờ dev. Tiết kiệm cả tuần mỗi chiến dịch.', 5],
    ['Minh Trần', 'Founder', 'Studio M', 'Theme đổi một chạm, block dùng lại được giữa các site. Đúng thứ agency cần.', 5],
    ['Huy Nguyễn', 'Product Manager', 'FinTechX', 'Gắn dữ liệu thật từ CMS vào trang là tính năng ăn tiền nhất.', 4],
  ]
  for (const [name, role, company, quoteText, rating] of testimonials) await payload.create({ collection: 'testimonials', data: { name, role, company, quote: quoteText, rating, published: true } as never })
  const team = [
    ['Nguyễn An', 'CEO & Founder', 'Hơn 10 năm xây dựng sản phẩm cho SMB.'],
    ['Trần Bình', 'CTO', 'Kiến trúc hệ thống, mê open source.'],
    ['Lê Chi', 'Trưởng nhóm thiết kế', 'Design system và trải nghiệm người dùng.'],
  ]
  for (const [i, [name, role, bio]] of team.entries()) await payload.create({ collection: 'team-members', data: { name, slug: '', role, bio, order: i, published: true, links: [{ label: 'LinkedIn', url: 'https://linkedin.com' }] } as never })
  payload.logger.info('Đã tạo dữ liệu mẫu: danh mục, bài viết, sản phẩm, sự kiện, FAQ, cảm nhận, đội ngũ.')
}
