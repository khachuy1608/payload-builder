'use client'

import { ChevronDown, ChevronRight, ExternalLink, Monitor, Palette, MousePointer2, Plus, Smartphone, Tablet, Trash2, ArrowUp, ArrowDown, Unlink, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ContentControl, StyleField } from '@/builder/controls'
import { STYLE_GROUPS } from '@/builder/controls'
import { refBlockId } from '@/builder/refs'
import { sanitizeRichText } from '@/builder/sanitize'
import { getBlock } from '@/builder/registry'
import { COLOR_TOKEN_LABELS } from '@/builder/theme'
import { findNode, genId, getAncestors } from '@/builder/tree'
import type { AdvancedProps, BuilderNode, Device, MediaValue, StyleMap } from '@/builder/types'
import { slugify } from '@/lib/slug'
import { nodeLabel } from './labels'
import { MediaPicker } from './MediaPicker'
import { RichToolbar } from './RichToolbar'
import { type BlockScope, effectiveTheme, useEditor } from './store'

type Tab = 'content' | 'style' | 'advanced'

export function RightPanel() {
  const selectedId = useEditor((s) => s.selectedId)
  const root = useEditor((s) => s.root)
  const node = selectedId ? findNode(root, selectedId) : null
  const [tab, setTab] = useState<Tab>('content')
  // chọn sang loại phần tử khác thì quay về tab Nội dung (giống Elementor)
  const [lastType, setLastType] = useState(node?.type)
  if (node && node.type !== lastType) {
    setLastType(node.type)
    setTab('content')
  }

  if (!node) {
    return (
      <aside className="ed-right">
        <div className="ed-empty">
          <MousePointer2 size={28} strokeWidth={1.5} />
          <p>Chọn một phần tử trên trang để chỉnh sửa.</p>
          <button className="ed-btn" onClick={() => useEditor.getState().select('root')}>
            Cài đặt trang
          </button>
        </div>
      </aside>
    )
  }

  const def = getBlock(node.type)
  const ancestors = getAncestors(root, node.id)
  const kind = useEditor.getState().kind

  return (
    <aside className="ed-right">
      <header className="ed-right-head">
        <div className="ed-crumbs">
          {ancestors.slice(-3).map((a) => (
            <button key={a.id} onClick={() => useEditor.getState().select(a.id)}>
              {a.type === 'root' && kind === 'block' ? 'Block' : getBlock(a.type)?.label} ›
            </button>
          ))}
        </div>
        <div className="ed-right-title">
          {def && <def.icon size={18} />}
          <strong>{node.type === 'blockRef' ? nodeLabel(node) : node.type === 'root' && kind === 'block' ? 'Cài đặt block' : (def?.label ?? node.type)}</strong>
        </div>
      </header>
      <div className="ed-tabs ed-tabs--small">
        {(['content', 'style', 'advanced'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
            {t === 'content' ? 'Nội dung' : t === 'style' ? 'Kiểu' : 'Nâng cao'}
          </button>
        ))}
      </div>
      <div className="ed-right-body" key={node.id + tab}>
        {tab === 'content' && <ContentTab node={node} />}
        {tab === 'style' && <StyleTab node={node} />}
        {tab === 'advanced' && <AdvancedTab node={node} />}
      </div>
    </aside>
  )
}

// ======================= Content =======================

function ContentTab({ node }: { node: BuilderNode }) {
  const def = getBlock(node.type)
  const controls = def?.contentControls ?? []
  if (!controls.length) return <p className="ed-hint">Phần tử này không có nội dung để chỉnh. Xem tab “Kiểu”.</p>
  return (
    <div className="ed-fields">
      {controls.map((c, i) => (
        <ContentField key={i} node={node} control={c} />
      ))}
    </div>
  )
}

function ContentField({ node, control }: { node: BuilderNode; control: ContentControl }) {
  const update = (value: unknown, coalesce = true) =>
    useEditor.getState().updateProps(node.id, { [(control as { prop: string }).prop]: value }, coalesce ? `props:${node.id}:${(control as { prop: string }).prop}` : undefined)

  switch (control.type) {
    case 'custom':
      if (control.component === 'tabs') return <TabsManager node={node} />
      if (control.component === 'blockRef') return <BlockRefPanel node={node} />
      return <PageSettings />
    case 'text':
    case 'url':
      return (
        <Field label={control.label} help={control.help}>
          <input
            className="ed-input"
            value={String(node.props[control.prop] ?? '')}
            placeholder={control.placeholder}
            onChange={(e) => update(e.target.value)}
          />
        </Field>
      )
    case 'richtext':
      return (
        <Field label={control.label} help={control.help ?? 'Đậm, nghiêng, gạch chân, liên kết. Enter để xuống dòng.'}>
          <RichTextField value={String(node.props[control.prop] ?? '')} onChange={(v) => update(v)} />
        </Field>
      )
    case 'textarea':
    case 'code':
      return (
        <Field label={control.label} help={control.help}>
          <textarea
            className={`ed-input ed-textarea${control.type === 'code' ? ' ed-code' : ''}`}
            rows={control.type === 'code' ? 8 : 4}
            spellCheck={control.type !== 'code'}
            value={String(node.props[control.prop] ?? '')}
            placeholder={control.placeholder}
            onChange={(e) => update(e.target.value)}
          />
        </Field>
      )
    case 'select':
      return (
        <Field label={control.label}>
          <select className="ed-input" value={String(node.props[control.prop] ?? '')} onChange={(e) => update(e.target.value, false)}>
            {control.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      )
    case 'toggle':
      return (
        <label className="ed-toggle">
          <input type="checkbox" checked={node.props[control.prop] === true} onChange={(e) => update(e.target.checked, false)} />
          <span className="ed-toggle-ui" />
          {control.label}
        </label>
      )
    case 'media':
      return <MediaField label={control.label} value={(node.props[control.prop] as MediaValue | null) ?? null} onChange={(v) => update(v, false)} />
  }
}

/** Ô soạn rich text (contentEditable) – không điều khiển hoàn toàn để con trỏ không bị nhảy khi gõ */
function RichTextField({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const last = useRef<string | null>(null)
  useEffect(() => {
    if (ref.current && value !== last.current) {
      ref.current.innerHTML = sanitizeRichText(value)
      last.current = value
    }
  }, [value])
  const emit = () => {
    if (!ref.current) return
    const html = sanitizeRichText(ref.current.innerHTML)
    last.current = html
    onChange(html)
  }
  return (
    <div className="ed-rich">
      <RichToolbar
        compact
        exec={(cmd, v) => {
          ref.current?.focus()
          document.execCommand(cmd, false, v)
          emit()
        }}
      />
      <div
        ref={ref}
        className="ed-input ed-rich-area"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            document.execCommand('insertLineBreak')
            emit()
          }
        }}
      />
    </div>
  )
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="ed-field">
      <span className="ed-label">{label}</span>
      {children}
      {help && <span className="ed-help">{help}</span>}
    </label>
  )
}

function MediaField({ label, value, onChange }: { label: string; value: MediaValue | null; onChange: (v: MediaValue | null) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="ed-field">
      <span className="ed-label">{label}</span>
      <div className="ed-media-field">
        {value?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="" />
        ) : (
          <div className="ed-media-empty">Chưa chọn ảnh</div>
        )}
        <div className="ed-row">
          <button className="ed-btn ed-btn--primary" onClick={() => setOpen(true)}>
            {value ? 'Đổi ảnh' : 'Chọn ảnh'}
          </button>
          {value && (
            <button className="ed-btn" onClick={() => onChange(null)}>
              Gỡ
            </button>
          )}
        </div>
      </div>
      {open && (
        <MediaPicker
          onClose={() => setOpen(false)}
          onPick={(m) => {
            onChange(m)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

function TabsManager({ node }: { node: BuilderNode }) {
  const s = useEditor.getState()
  const tabs = node.children ?? []
  return (
    <div className="ed-field">
      <span className="ed-label">Các tab</span>
      <div className="ed-list">
        {tabs.map((t, i) => (
          <div key={t.id} className="ed-list-row">
            <input
              className="ed-input"
              value={String(t.props.title ?? '')}
              onChange={(e) => s.updateProps(t.id, { title: e.target.value }, `props:${t.id}:title`)}
            />
            <button className="ed-icon-btn" title="Lên" disabled={i === 0} onClick={() => s.move(t.id, { parentId: node.id, index: i - 1 })}>
              <ArrowUp size={14} />
            </button>
            <button className="ed-icon-btn" title="Xuống" disabled={i === tabs.length - 1} onClick={() => s.move(t.id, { parentId: node.id, index: i + 2 })}>
              <ArrowDown size={14} />
            </button>
            <button className="ed-icon-btn" title="Xoá tab" disabled={tabs.length <= 1} onClick={() => { s.remove(t.id); s.select(node.id) }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        className="ed-btn"
        onClick={() => {
          s.insertNode(
            { id: genId(), type: 'tab', props: { title: `Tab ${tabs.length + 1}` }, styles: { desktop: { padding: '16px 0' } }, children: [] },
            { parentId: node.id, index: tabs.length },
          )
        }}
      >
        <Plus size={14} /> Thêm tab
      </button>
      <Field label="Tab mở sẵn">
        <select
          className="ed-input"
          value={String(node.props.defaultIndex ?? '0')}
          onChange={(e) => s.updateProps(node.id, { defaultIndex: e.target.value })}
        >
          {tabs.map((t, i) => (
            <option key={t.id} value={String(i)}>
              {String(t.props.title || `Tab ${i + 1}`)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

/** Panel Nội dung của node blockRef: thông tin bản gốc, mở sửa, tách */
function BlockRefPanel({ node }: { node: BuilderNode }) {
  const blockId = refBlockId(node)
  const block = useEditor((s) => (blockId ? s.blocks[blockId] : undefined))
  const missing = useEditor((s) => (blockId ? !!s.missingBlocks[blockId] : true))
  const userId = useEditor((s) => s.userId)
  const mine = !!block && (block.owner === null || block.owner === userId)
  const s = useEditor.getState()
  return (
    <div className="ed-fields">
      {block ? (
        <div className="ed-field">
          <span className="ed-label">Liên kết tới block</span>
          <div className="ed-ref-card">
            <strong>{block.name}</strong>
            <span className="ed-help">
              {block.scope === 'shared' ? 'Dùng chung' : 'Riêng tư'} · {mine ? 'của bạn' : 'của người khác'} · gốc là {getBlock(block.tree.type)?.label}
            </span>
          </div>
        </div>
      ) : (
        <p className="ed-error" style={{ margin: 0 }}>
          {missing ? 'Không tìm thấy bản gốc (có thể đã bị xoá). Trang thật sẽ bỏ qua phần tử này.' : 'Đang tải bản gốc…'}
        </p>
      )}
      <p className="ed-help">
        Phần tử liên kết chỉ đọc trên trang này. Muốn đổi nội dung hãy sửa bản gốc (mọi trang dùng nó cùng cập nhật), hoặc tách ra thành bản sao độc lập.
      </p>
      <div className="ed-row">
        {block && (
          <a className="ed-btn" href={`/builder/block/${block.id}`} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> {mine ? 'Sửa bản gốc' : 'Xem bản gốc'}
          </a>
        )}
        <button className="ed-btn" disabled={!block} onClick={() => s.detach(node.id)}>
          <Unlink size={14} /> Tách
        </button>
      </div>
      <p className="ed-hint" style={{ margin: 0 }}>
        Tab “Kiểu” cho phép ghi đè lề, kích thước… của riêng vị trí này mà không ảnh hưởng bản gốc.
      </p>
    </div>
  )
}

/** Cài đặt bản gốc của block (kind = block): tên và phạm vi */
function BlockSettings() {
  const title = useEditor((s) => s.title)
  const scope = useEditor((s) => s.scope)
  const readOnly = useEditor((s) => s.readOnly)
  const setMeta = useEditor((s) => s.setMeta)
  return (
    <div className="ed-fields">
      <Field label="Tên block">
        <input className="ed-input" value={title} disabled={readOnly} onChange={(e) => setMeta({ title: e.target.value })} />
      </Field>
      <Field label="Phạm vi">
        <select className="ed-input" value={scope} disabled={readOnly} onChange={(e) => setMeta({ scope: e.target.value as BlockScope })}>
          <option value="private">Riêng tôi</option>
          <option value="shared">Dùng chung (mọi editor đều thấy)</option>
        </select>
      </Field>
      <p className="ed-hint">Block gồm đúng một phần tử gốc. Nếu thêm nhiều phần tử ở cấp cao nhất, khi lưu chúng sẽ được gói trong một Div.</p>
    </div>
  )
}

function PageSettings() {
  const kind = useEditor((s) => s.kind)
  const title = useEditor((s) => s.title)
  const slug = useEditor((s) => s.slug)
  const setMeta = useEditor((s) => s.setMeta)
  if (kind === 'block') return <BlockSettings />
  return (
    <div className="ed-fields">
      <Field label="Tiêu đề trang">
        <input className="ed-input" value={title} onChange={(e) => setMeta({ title: e.target.value })} />
      </Field>
      <Field label="Đường dẫn (slug)" help={slug === 'home' ? 'Đây là trang chủ (/)' : `/${slug}`}>
        <input className="ed-input" value={slug} onChange={(e) => setMeta({ slug: e.target.value })} onBlur={(e) => setMeta({ slug: slugify(e.target.value) })} />
      </Field>
      <ThemeField />
      <p className="ed-hint">Màu nền, font và lề của cả trang chỉnh ở tab “Kiểu”.</p>
    </div>
  )
}

/** Chọn theme cho trang: theo site hoặc ghi đè */
function ThemeField() {
  const themes = useEditor((s) => s.themes)
  const siteThemeId = useEditor((s) => s.siteThemeId)
  const pageThemeId = useEditor((s) => s.pageThemeId)
  const list = Object.values(themes).sort((a, b) => Number(b.isPreset) - Number(a.isPreset) || a.name.localeCompare(b.name))
  const siteName = (siteThemeId && themes[siteThemeId]?.name) || 'Mặc định'
  return (
    <div className="ed-field">
      <span className="ed-label">Theme</span>
      <select className="ed-input" value={pageThemeId ?? ''} onChange={(e) => useEditor.getState().setPageTheme(e.target.value || null)}>
        <option value="">Theo cài đặt site ({siteName})</option>
        {list.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.isPreset ? ' (preset)' : ''}
          </option>
        ))}
      </select>
      <button className="ed-btn" onClick={() => useEditor.getState().openThemeDialog(true)}>
        <Palette size={14} /> Quản lý theme…
      </button>
      <span className="ed-help">Ghi đè chỉ áp dụng cho trang này. Theme của cả site đổi trong “Quản lý theme”.</span>
    </div>
  )
}

// ======================= Style =======================

const DEVICE_META: { id: Device; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
]

/** Style hiệu lực hiện tại và phần "kế thừa" (để hiện làm placeholder) */
function useResolved(node: BuilderNode) {
  const device = useEditor((s) => s.device)
  const styleState = useEditor((s) => s.styleState)
  return useMemo(() => {
    const st = node.styles ?? {}
    const chain: StyleMap[] = [st.desktop ?? {}]
    if (device !== 'desktop') chain.push(st.tablet ?? {})
    if (device === 'mobile') chain.push(st.mobile ?? {})
    const bucket = styleState === 'hover' ? 'hover' : device
    const own: StyleMap = (styleState === 'hover' ? st.hover : st[device]) ?? {}
    const inherited: StyleMap = Object.assign({}, ...(styleState === 'hover' ? chain : chain.slice(0, -1)))
    const resolved: StyleMap = { ...inherited, ...own }
    return { own, inherited, resolved, bucket }
  }, [node.styles, device, styleState])
}

function StyleTab({ node }: { node: BuilderNode }) {
  const def = getBlock(node.type)
  const device = useEditor((s) => s.device)
  const styleState = useEditor((s) => s.styleState)
  const { own, inherited, resolved } = useResolved(node)
  const [open, setOpen] = useState<Record<string, boolean>>({ [def?.styleGroups[0] ?? '']: true })

  return (
    <div>
      <div className="ed-style-bar">
        <div className="ed-seg">
          {DEVICE_META.map((d) => (
            <button key={d.id} title={d.label} className={device === d.id ? 'is-active' : ''} onClick={() => useEditor.getState().setDevice(d.id)}>
              <d.icon size={14} />
            </button>
          ))}
        </div>
        <div className="ed-seg">
          <button className={styleState === 'normal' ? 'is-active' : ''} onClick={() => useEditor.getState().setStyleState('normal')}>
            Thường
          </button>
          <button className={styleState === 'hover' ? 'is-active' : ''} onClick={() => useEditor.getState().setStyleState('hover')}>
            Hover
          </button>
        </div>
      </div>
      <p className="ed-hint ed-hint--tight">
        Đang sửa: <b>{styleState === 'hover' ? 'Hover (mọi thiết bị)' : DEVICE_META.find((d) => d.id === device)?.label}</b>
        {device !== 'desktop' && styleState === 'normal' && ' – ô trống sẽ kế thừa từ màn hình lớn hơn'}
      </p>
      {(def?.styleGroups ?? []).map((gid) => {
        const group = STYLE_GROUPS[gid]
        if (!group) return null
        const isOpen = !!open[gid]
        const setCount = group.fields.filter((f) => (f.kind === 'box' ? SIDES.some((sd) => own[f.key + sd] || own[f.key]) : own[f.key])).length
        return (
          <section key={gid} className="ed-group">
            <button className="ed-group-title" onClick={() => setOpen((o) => ({ ...o, [gid]: !o[gid] }))}>
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {group.label}
              {setCount > 0 && <span className="ed-dot" title="Có giá trị được đặt" />}
            </button>
            {isOpen && (
              <div className="ed-fields">
                {group.fields
                  .filter((f) => !f.showIf || f.showIf(resolved))
                  .map((f) => (
                    <StyleFieldControl key={f.key} node={node} field={f} own={own} inherited={inherited} />
                  ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const
const SIDE_LABELS = { Top: 'Trên', Right: 'Phải', Bottom: 'Dưới', Left: 'Trái' }

function StyleFieldControl({ node, field, own, inherited }: { node: BuilderNode; field: StyleField; own: StyleMap; inherited: StyleMap }) {
  const set = (key: string, value: string) => useEditor.getState().setStyle(node.id, key, value)
  const value = own[field.key] ?? ''
  const placeholder = inherited[field.key] ?? field.placeholder ?? ''

  const reset = value ? (
    <button className="ed-reset" title="Đặt lại" onClick={() => set(field.key, '')}>
      <X size={12} />
    </button>
  ) : null

  switch (field.kind) {
    case 'unit':
    case 'text':
      return (
        <div className="ed-sfield">
          <span className="ed-label">{field.label}</span>
          <div className="ed-input-wrap">
            <input className="ed-input" value={value} placeholder={placeholder} onChange={(e) => set(field.key, e.target.value)} />
            {reset}
          </div>
        </div>
      )
    case 'select':
      return (
        <div className="ed-sfield">
          <span className="ed-label">{field.label}</span>
          <div className="ed-input-wrap">
            <select className="ed-input" value={value} onChange={(e) => set(field.key, e.target.value)}>
              <option value="">{placeholder ? `Kế thừa (${field.options?.find((o) => o.value === placeholder)?.label ?? placeholder})` : 'Mặc định'}</option>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )
    case 'color':
      return (
        <div className="ed-sfield">
          <span className="ed-label">{field.label}</span>
          <ColorInput value={value} placeholder={placeholder} onChange={(v) => set(field.key, v)} />
        </div>
      )
    case 'box': {
      const short = own[field.key] ?? ''
      const shortPh = inherited[field.key] ?? ''
      return (
        <div className="ed-sfield ed-sfield--box">
          <span className="ed-label">{field.label}</span>
          <div className="ed-input-wrap">
            <input className="ed-input" value={short} placeholder={shortPh || 'Tất cả cạnh, vd: 16px 24px'} onChange={(e) => set(field.key, e.target.value)} />
            {short && (
              <button className="ed-reset" title="Đặt lại" onClick={() => set(field.key, '')}>
                <X size={12} />
              </button>
            )}
          </div>
          <div className="ed-box-grid">
            {SIDES.map((side) => (
              <label key={side}>
                <input
                  className="ed-input"
                  value={own[field.key + side] ?? ''}
                  placeholder={inherited[field.key + side] ?? '–'}
                  onChange={(e) => set(field.key + side, e.target.value)}
                />
                <span>{SIDE_LABELS[side]}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }
  }
}

function ColorInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const theme = useEditor(effectiveTheme)
  const shown = value || placeholder
  const tokenMatch = shown.match(/^var\(--color-([a-z]+)\)$/)
  const preview = tokenMatch ? theme.colors[tokenMatch[1]] : shown
  const hex = /^#[0-9a-f]{6}$/i.test(preview) ? preview : '#000000'
  return (
    <div className="ed-color">
      <div className="ed-input-wrap">
        <button className="ed-swatch" style={{ background: preview || 'transparent' }} onClick={() => setOpen((o) => !o)} aria-label="Chọn màu" />
        <input
          className="ed-input"
          value={tokenMatch && value ? `● ${COLOR_TOKEN_LABELS[tokenMatch[1]] ?? tokenMatch[1]}` : value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.startsWith('● ') ? value : e.target.value)}
          onFocus={(e) => tokenMatch && value && e.target.select()}
        />
        {value && (
          <button className="ed-reset" title="Đặt lại" onClick={() => onChange('')}>
            <X size={12} />
          </button>
        )}
      </div>
      {open && (
        <div className="ed-popover">
          <span className="ed-label">Màu toàn cục (theme)</span>
          <div className="ed-tokens">
            {Object.entries(theme.colors).map(([k, v]) => (
              <button
                key={k}
                className={`ed-token${value === `var(--color-${k})` ? ' is-active' : ''}`}
                title={COLOR_TOKEN_LABELS[k] ?? k}
                onClick={() => {
                  onChange(`var(--color-${k})`)
                  setOpen(false)
                }}
              >
                <span style={{ background: v }} />
                {COLOR_TOKEN_LABELS[k] ?? k}
              </button>
            ))}
          </div>
          <span className="ed-label">Màu tuỳ chỉnh</span>
          <div className="ed-row">
            <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} />
            <button className="ed-btn" onClick={() => onChange('transparent')}>
              Trong suốt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ======================= Advanced =======================

function AdvancedTab({ node }: { node: BuilderNode }) {
  const props = node.props as AdvancedProps
  const update = (patch: Partial<AdvancedProps>, key?: string) => useEditor.getState().updateProps(node.id, patch, key)
  return (
    <div className="ed-fields">
      <Field label="CSS ID" help="Dùng cho liên kết neo, ví dụ #lien-he">
        <input className="ed-input" value={props.cssId ?? ''} onChange={(e) => update({ cssId: e.target.value.replace(/[^A-Za-z0-9_-]/g, '') }, `adv:${node.id}:id`)} />
      </Field>
      <Field label="CSS class" help="Nhiều class cách nhau bằng dấu cách">
        <input className="ed-input" value={props.cssClass ?? ''} onChange={(e) => update({ cssClass: e.target.value }, `adv:${node.id}:class`)} />
      </Field>
      {node.type !== 'root' && (
        <div className="ed-field">
          <span className="ed-label">Ẩn trên thiết bị</span>
          {DEVICE_META.map((d) => (
            <label key={d.id} className="ed-toggle">
              <input
                type="checkbox"
                checked={!!props.hide?.[d.id]}
                onChange={(e) => update({ hide: { ...props.hide, [d.id]: e.target.checked } })}
              />
              <span className="ed-toggle-ui" />
              <d.icon size={14} /> {d.label}
            </label>
          ))}
          <span className="ed-help">Trong editor phần tử bị ẩn sẽ biến mất khi xem ở thiết bị tương ứng.</span>
        </div>
      )}
      <p className="ed-hint">ID phần tử: <code>{node.id}</code></p>
    </div>
  )
}
