/**
 * beforeLogin / afterLogin của trang đăng nhập admin:
 * - LoginAside: khối thương hiệu bên trái (desktop) + tiêu đề phía trên form
 * - LoginFooter: liên kết về trang web và bản quyền
 */
import type { Payload } from 'payload'
import { BrandMark, siteBrand } from './Brand'

type Props = { payload?: Payload }

const FEATURES = [
  { title: 'Kéo thả trực quan', text: 'Dựng trang bằng block, chỉnh responsive từng thiết bị.' },
  { title: 'Dữ liệu thật từ CMS', text: 'Bài viết, sản phẩm, sự kiện… gắn thẳng vào trang.' },
  { title: 'Cộng tác & xuất bản', text: 'Bình luận, lịch sử phiên bản, lên lịch xuất bản.' },
]

export async function LoginAside({ payload }: Props) {
  const { name, logo } = await siteBrand(payload)
  return (
    <>
      <aside className="pb-login-aside" aria-hidden="true">
        <div className="pb-login-aside__glow" />
        <div className="pb-login-aside__grid" />
        <div className="pb-login-aside__inner">
          <div className="pb-login-aside__brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt="" /> : <BrandMark size={36} />}
            <span>{name}</span>
          </div>
          <div>
            <h2 className="pb-login-aside__title">
              Dựng website đẹp,
              <br />
              <span>nhanh như kéo thả.</span>
            </h2>
            <ul className="pb-login-aside__list">
              {FEATURES.map((f) => (
                <li key={f.title}>
                  <span className="pb-login-aside__check">✓</span>
                  <span>
                    <b>{f.title}</b>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {/* khung xem thử trang trang trí */}
          <div className="pb-login-aside__mock">
            <span className="pb-mock-bar">
              <i />
              <i />
              <i />
            </span>
            <span className="pb-mock-hero" />
            <span className="pb-mock-row">
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>
      </aside>
      <header className="pb-login-head">
        <h1>Đăng nhập</h1>
        <p>Chào mừng trở lại! Đăng nhập để quản lý và dựng trang cho {name}.</p>
      </header>
    </>
  )
}

export async function LoginFooter({ payload }: Props) {
  const { name } = await siteBrand(payload)
  return (
    <footer className="pb-login-foot">
      <a href="/" className="pb-login-foot__back">
        ← Về trang web
      </a>
      <span>
        © {new Date().getFullYear()} {name}
      </span>
    </footer>
  )
}
