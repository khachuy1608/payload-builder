/**
 * Form: Form Field (label, placeholder, helper, error), Switch / Checkbox / Radio, Combobox, Multi-select,
 * Date Picker, Time Field, Resize Handle (textarea), Sign-in Form. Bài gửi được lưu vào collection `form-submissions`
 * (blocks/Runtime.tsx gửi fetch JSON).
 */
import { FormInput, LogIn, TextCursorInput } from 'lucide-react'
import { genId } from '../../tree'
import type { BuilderNode } from '../../types'
import { bool, EditorOnly, Icon, items, num, safeHref, text } from '../helpers'
import type { BlockDefinition } from '../types'

const node = (type: string, props: Record<string, unknown>, styles: BuilderNode['styles'] = {}): BuilderNode => ({ id: genId(), type, props, styles })

const FIELD_TYPES = [
  { value: 'text', label: 'Văn bản' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Số điện thoại' },
  { value: 'number', label: 'Số' },
  { value: 'password', label: 'Mật khẩu (có nút mắt)' },
  { value: 'textarea', label: 'Đoạn văn (textarea, có Resize Handle)' },
  { value: 'select', label: 'Chọn một (select)' },
  { value: 'multiselect', label: 'Multi-select (chọn nhiều)' },
  { value: 'combobox', label: 'Combobox / Autocomplete' },
  { value: 'checkbox', label: 'Checkbox (chọn nhiều, độc lập)' },
  { value: 'radio', label: 'Radio (chọn một trong nhóm)' },
  { value: 'switch', label: 'Switch (bật/tắt)' },
  { value: 'date', label: 'Date Picker' },
  { value: 'time', label: 'Time Field' },
  { value: 'datetime', label: 'Ngày & giờ' },
]

const slug = (v: unknown) => text(v).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

export const FORM_BLOCKS: BlockDefinition[] = [
  {
    type: 'form',
    label: 'Form',
    category: 'form',
    icon: FormInput,
    defaults: () => ({
      props: { name: 'lien-he', submitText: 'Gửi', successMessage: 'Cảm ơn bạn! Chúng tôi đã nhận được thông tin.', action: '' },
      styles: { desktop: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' } },
      children: [
        node('formField', { type: 'text', label: 'Họ tên', name: 'ho-ten', placeholder: 'Nguyễn Văn A', required: true }),
        node('formField', { type: 'email', label: 'Email', name: 'email', placeholder: 'ban@vidu.com', help: 'Chúng tôi chỉ dùng để liên hệ lại.', required: true }),
        node('formField', { type: 'textarea', label: 'Lời nhắn', name: 'loi-nhan', placeholder: 'Bạn cần gì?', resizable: true }),
        node('formField', { type: 'switch', label: 'Nhận bản tin hàng tháng', name: 'ban-tin' }),
      ],
    }),
    contentControls: [
      { type: 'text', prop: 'name', label: 'Tên form (để lọc bài gửi trong admin)' },
      { type: 'text', prop: 'submitText', label: 'Chữ nút gửi' },
      { type: 'textarea', prop: 'successMessage', label: 'Thông báo sau khi gửi' },
      { type: 'url', prop: 'action', label: 'Gửi tới URL khác (tuỳ chọn)', help: 'Để trống: lưu vào Form submissions của site (xem ở admin).' },
      { type: 'custom', component: 'children' },
    ],
    styleGroups: ['layout', 'size', 'spacing', 'background', 'border', 'effects', 'position', 'child'],
    Render: ({ node, attrs, children, mode }) => (
      <form {...attrs} className={`${attrs.className} b-form`} data-form={slug(node.props.name) || 'form'} data-form-action={safeHref(node.props.action) ?? ''} data-form-success={text(node.props.successMessage)} method="post" noValidate>
        {children}
        {/* honeypot chống spam */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="b-form-hp" aria-hidden="true" />
        <div className="b-form-actions">
          <button type="submit" className="b-button b-form-submit">
            {text(node.props.submitText, 'Gửi')}
          </button>
        </div>
        <p className="b-form-msg" role="status" aria-live="polite" hidden />
      </form>
    ),
  },
  {
    type: 'formField',
    label: 'Form Field',
    category: 'form',
    icon: TextCursorInput,
    defaults: () => ({ props: { type: 'text', label: 'Nhãn', name: '', placeholder: '', help: '', error: '', required: false, options: [{ label: 'Lựa chọn 1' }, { label: 'Lựa chọn 2' }], resizable: true, showError: false }, styles: {} }),
    contentControls: [
      { type: 'select', prop: 'type', label: 'Loại', options: FIELD_TYPES },
      { type: 'text', prop: 'label', label: 'Nhãn (label)' },
      { type: 'text', prop: 'name', label: 'Tên trường (name)', help: 'Để trống sẽ tạo từ nhãn.' },
      { type: 'text', prop: 'placeholder', label: 'Placeholder' },
      { type: 'text', prop: 'help', label: 'Dòng trợ giúp (helper text)' },
      { type: 'text', prop: 'error', label: 'Thông báo lỗi khi bỏ trống', placeholder: 'Trường này là bắt buộc' },
      { type: 'toggle', prop: 'required', label: 'Bắt buộc (*)' },
      { type: 'toggle', prop: 'showError', label: 'Xem thử trạng thái lỗi' },
      { type: 'toggle', prop: 'resizable', label: 'Cho kéo đổi cỡ (textarea)' },
      { type: 'list', prop: 'options', label: 'Lựa chọn (select, radio, checkbox, combobox…)', itemLabel: 'Lựa chọn', fields: [{ key: 'label', label: 'Nhãn', type: 'text' }] },
    ],
    styleGroups: ['typography', 'size', 'spacing', 'effects', 'child'],
    inlineEdit: { prop: 'label' },
    Render: ({ node, attrs }) => {
      const type = text(node.props.type, 'text')
      const name = slug(node.props.name) || slug(node.props.label) || 'field'
      const id = `f-${node.id}`
      const label = text(node.props.label)
      const required = bool(node.props.required)
      const opts = items<{ label?: string }>(node.props.options).map((o) => text(o.label)).filter(Boolean)
      const help = text(node.props.help)
      const error = text(node.props.error, 'Trường này là bắt buộc')
      const showError = bool(node.props.showError)
      const common = { id, name, required, placeholder: text(node.props.placeholder) || undefined, 'aria-describedby': help ? `${id}-help` : undefined, 'aria-invalid': showError || undefined }
      const star = required && <span className="b-field-req" aria-hidden> *</span>
      const foot = (
        <>
          {help && (
            <span className="b-field-help" id={`${id}-help`}>
              {help}
            </span>
          )}
          <span className="b-field-error" data-field-error="" hidden={!showError}>
            {error}
          </span>
        </>
      )
      // nhóm checkbox / radio / switch
      if (type === 'checkbox' || type === 'radio') {
        const list = opts.length ? opts : [label]
        return (
          <fieldset {...attrs} className={`${attrs.className} b-field b-field--${type}${showError ? ' is-error' : ''}`} data-field="" data-required={required || undefined}>
            {opts.length > 0 && (
              <legend className="b-field-label">
                {label}
                {star}
              </legend>
            )}
            {list.map((o, i) => (
              <label key={i} className="b-choice">
                <input type={type} name={name} value={o} required={required && type === 'radio'} />
                <span className="b-choice-box" aria-hidden />
                <span>
                  {o}
                  {!opts.length && star}
                </span>
              </label>
            ))}
            {foot}
          </fieldset>
        )
      }
      if (type === 'switch')
        return (
          <div {...attrs} className={`${attrs.className} b-field b-field--switch`} data-field="">
            <label className="b-switch">
              <input type="checkbox" role="switch" name={name} id={id} />
              <span className="b-switch-track" aria-hidden />
              <span>
                {label}
                {star}
              </span>
            </label>
            {foot}
          </div>
        )
      let control: React.ReactNode
      if (type === 'textarea') control = <textarea {...common} rows={4} className={`b-input${bool(node.props.resizable, true) ? ' b-input--resize' : ''}`} />
      else if (type === 'select')
        control = (
          <select {...common} className="b-input">
            <option value="">{text(node.props.placeholder) || 'Chọn…'}</option>
            {opts.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )
      else if (type === 'multiselect')
        control = (
          <div className="b-multi" data-multiselect="">
            <select {...common} multiple className="b-input b-multi-native" size={Math.min(5, Math.max(2, opts.length))}>
              {opts.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <div className="b-multi-chips" data-multi-chips="" aria-hidden />
          </div>
        )
      else if (type === 'combobox')
        control = (
          <div className="b-combobox" data-combobox="">
            <input {...common} type="text" className="b-input" role="combobox" aria-autocomplete="list" aria-expanded="false" autoComplete="off" list={`${id}-list`} />
            <datalist id={`${id}-list`}>
              {opts.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
        )
      else if (type === 'password')
        control = (
          <div className="b-input-wrap">
            <input {...common} type="password" className="b-input" autoComplete="current-password" />
            <button type="button" className="b-input-eye" data-toggle-password="" aria-label="Hiện/ẩn mật khẩu">
              <Icon name="eye" size={18} />
            </button>
          </div>
        )
      else control = <input {...common} type={type === 'datetime' ? 'datetime-local' : type} className="b-input" />
      return (
        <div {...attrs} className={`${attrs.className} b-field b-field--${type}${showError ? ' is-error' : ''}`} data-field="" data-required={required || undefined}>
          <label className="b-field-label" htmlFor={id}>
            {label}
            {star}
          </label>
          {control}
          {foot}
        </div>
      )
    },
  },
  {
    type: 'signInForm',
    label: 'Sign-in Form',
    category: 'form',
    icon: LogIn,
    defaults: () => ({
      props: { title: 'Đăng nhập', providers: [{ label: 'Tiếp tục với Google' }, { label: 'Tiếp tục với Apple' }], showRemember: true, forgotText: 'Quên mật khẩu?', forgotHref: '#', submitText: 'Đăng nhập', action: '', footerText: 'Chưa có tài khoản?', footerLinkText: 'Đăng ký', footerHref: '#' },
      styles: { desktop: { maxWidth: '400px', padding: '28px', backgroundColor: 'var(--color-background)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-lg)' } },
    }),
    contentControls: [
      { type: 'text', prop: 'title', label: 'Tiêu đề' },
      { type: 'list', prop: 'providers', label: 'Nút “Tiếp tục với…”', itemLabel: 'Nhà cung cấp', fields: [{ key: 'label', label: 'Nhãn', type: 'text' }, { key: 'href', label: 'Link', type: 'url' }] },
      { type: 'toggle', prop: 'showRemember', label: 'Ô “Ghi nhớ đăng nhập”' },
      { type: 'text', prop: 'forgotText', label: 'Link quên mật khẩu' },
      { type: 'url', prop: 'forgotHref', label: 'Link quên mật khẩu (URL)' },
      { type: 'text', prop: 'submitText', label: 'Nút đăng nhập' },
      { type: 'url', prop: 'action', label: 'URL xử lý đăng nhập (action)', help: 'Để trống: đăng nhập vào tài khoản của site này (Payload users) và tải lại trang. Đặt URL để POST tới hệ thống khác.' },
      { type: 'text', prop: 'footerText', label: 'Chân form' },
      { type: 'text', prop: 'footerLinkText', label: 'Link chân form' },
      { type: 'url', prop: 'footerHref', label: 'URL chân form' },
    ],
    styleGroups: ['typography', 'size', 'spacing', 'background', 'border', 'effects', 'position', 'child'],
    inlineEdit: { prop: 'title' },
    Render: ({ node, attrs, mode }) => {
      const providers = items<{ label?: string; href?: string }>(node.props.providers)
      const action = safeHref(node.props.action)
      const id = node.id
      return (
        <form {...attrs} className={`${attrs.className} b-signin`} method="post" action={action} data-signin={action ? undefined : ''}>
          <h3 className="b-signin-title">{text(node.props.title)}</h3>
          {providers.length > 0 && (
            <>
              <div className="b-signin-providers">
                {providers.map((p, i) => (
                  <a key={i} className="b-button b-button--ghost b-signin-provider" href={safeHref(p.href) ?? '#'}>
                    {text(p.label)}
                  </a>
                ))}
              </div>
              <div className="b-signin-or">
                <span>hoặc</span>
              </div>
            </>
          )}
          <div className="b-field">
            <label className="b-field-label" htmlFor={`${id}-email`}>
              Email
            </label>
            <input id={`${id}-email`} className="b-input" type="email" name="email" autoComplete="username" required placeholder="ban@vidu.com" />
          </div>
          <div className="b-field">
            <label className="b-field-label" htmlFor={`${id}-pass`}>
              Mật khẩu
            </label>
            <div className="b-input-wrap">
              <input id={`${id}-pass`} className="b-input" type="password" name="password" autoComplete="current-password" required />
              <button type="button" className="b-input-eye" data-toggle-password="" aria-label="Hiện/ẩn mật khẩu">
                <Icon name="eye" size={18} />
              </button>
            </div>
          </div>
          <div className="b-signin-row">
            {bool(node.props.showRemember, true) && (
              <label className="b-choice">
                <input type="checkbox" name="remember" />
                <span className="b-choice-box" aria-hidden />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            )}
            {text(node.props.forgotText) && <a href={safeHref(node.props.forgotHref) ?? '#'}>{text(node.props.forgotText)}</a>}
          </div>
          <button type="submit" className="b-button b-signin-submit">
            {text(node.props.submitText, 'Đăng nhập')}
          </button>
          {(text(node.props.footerText) || text(node.props.footerLinkText)) && (
            <p className="b-signin-foot">
              {text(node.props.footerText)} <a href={safeHref(node.props.footerHref) ?? '#'}>{text(node.props.footerLinkText)}</a>
            </p>
          )}
          {mode === 'editor' && !action && <EditorOnly label="Đăng nhập vào tài khoản của site (Payload users). Dùng link #logout để đăng xuất.">{null}</EditorOnly>}
        </form>
      )
    },
  },
]

export const FIELD_TYPE_VALUES = FIELD_TYPES.map((f) => f.value)
export const numFields = num
