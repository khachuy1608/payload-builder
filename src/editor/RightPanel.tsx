'use client'

import { ChevronDown, ChevronRight, Database, ExternalLink, EyeOff, Globe, Monitor, Palette, Play, Sparkles, Zap, MousePointer2, Plus, Smartphone, Tablet, Trash2, ArrowUp, ArrowDown, Unlink, X, ClipboardPaste, Copy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ContentControl, ListField, StyleField } from '@/builder/controls'
import { STYLE_GROUPS } from '@/builder/controls'
import { type DataFilter, type DataSource, FILTER_OPS, SHOW_OPS, type ShowCondition, type SourceInfo, dataSourceOf, fieldPaths, normalizeDataSource, showOf } from '@/builder/data'
import { EASING_OPTIONS, type FxProps, HOVER_OPTIONS, REVEAL_OPTIONS, TEXT_FX_OPTIONS, DEFAULT_SPRING, springEasing } from '@/builder/effects'
import { canContain, getSchema } from '@/builder/schema'
import { refBlockId } from '@/builder/refs'
import { sanitizeRichText } from '@/builder/sanitize'
import { BLOCKS, getBlock } from '@/builder/registry'
import { COLOR_TOKEN_LABELS, tokenOptionsFor } from '@/builder/theme'
import { SITE_PART_LABELS, type SitePart, sitePartOf } from '@/builder/siteParts'
import { CLICK_ACTIONS, type ClickAction, type ClickProps, canHaveClick } from '@/builder/click'
import { cssToStyles } from '@/builder/cssImport'
import { findNode, genId, getAncestors, walk } from '@/builder/tree'
import type { AdvancedProps, BuilderNode, Device, MediaValue, StyleMap } from '@/builder/types'
import { slugify } from '@/lib/slug'
import { Icon, ICON_LABELS, ICONS } from '@/builder/blocks/helpers'
import { nodeLabel } from './labels'
import { Floating } from './Floating'
import { LinkPicker } from './LinkPicker'
import { MediaPicker } from './MediaPicker'
import { PresetGallery } from './PresetGallery'
import { RichToolbar } from './RichToolbar'
import { setSitePart } from './api'
import { type BlockScope, createNodeFromBlock, effectiveTheme, useEditor } from './store'

type Tab = 'content' | 'style' | 'advanced' | 'presets'

export function RightPanel() {
  const selectedId = useEditor((s) => s.selectedId)
  const root = useEditor((s) => s.root)
  const node = selectedId ? findNode(root, selectedId) : null
  const sitePart = sitePartOf(selectedId)
  const [tab, setTab] = useState<Tab>('content')
  // chọn sang loại phần tử khác thì quay về tab Nội dung (giống Elementor)
  const [lastType, setLastType] = useState(node?.type)
  if (node && node.type !== lastType) {
    setLastType(node.type)
    setTab('content')
  }

  if (sitePart) return <SitePartPanel part={sitePart} />
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
        {(['content', 'style', 'advanced', ...(node.type !== 'root' && node.type !== 'blockRef' ? (['presets'] as Tab[]) : [])] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
            {t === 'content' ? 'Nội dung' : t === 'style' ? 'Kiểu' : t === 'advanced' ? 'Nâng cao' : '✦ Gợi ý'}
          </button>
        ))}
      </div>
      <div className="ed-right-body" key={node.id + tab}>
        {tab === 'content' && <ContentTab node={node} />}
        {tab === 'style' && <StyleTab node={node} />}
        {tab === 'advanced' && <AdvancedTab node={node} />}
        {tab === 'presets' && <PresetGallery node={node} />}
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
      if (control.component === 'children') return <p className="ed-hint" style={{ margin: 0 }}>Nội dung bên trong là các phần tử con – kéo block vào hoặc chọn trong cây Cấu trúc.</p>
      if (control.component === 'data') return <DataSourcePanel node={node} />
      if (control.component === 'textStyle') return <TextStyleField node={node} />
      return <PageSettings />
    case 'text':
    case 'url':
      return (
        <Field
          label={control.label}
          help={control.help}
          picker={
            <span className="ed-pickers">
              {control.type === 'url' && <LinkPicker onPick={(href) => update(href, false)} />}
              <BindPicker node={node} onPick={(t) => update(control.type === 'url' ? String(node.props[control.prop] ?? '') + t : appendTemplate(String(node.props[control.prop] ?? ''), t), false)} />
            </span>
          }
        >
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
        <Field label={control.label} help={control.help ?? 'Đậm, nghiêng, gạch chân, liên kết. Enter để xuống dòng.'} picker={<BindPicker node={node} onPick={(t) => update(appendTemplate(String(node.props[control.prop] ?? ''), t), false)} />}>
          <RichTextField value={String(node.props[control.prop] ?? '')} onChange={(v) => update(v)} />
        </Field>
      )
    case 'textarea':
    case 'code':
      return (
        <Field label={control.label} help={control.help} picker={control.type === 'textarea' ? <BindPicker node={node} onPick={(t) => update(appendTemplate(String(node.props[control.prop] ?? ''), t), false)} /> : undefined}>
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
    case 'icon':
      return (
        <Field label={control.label} help={control.help}>
          <IconPicker value={String(node.props[control.prop] ?? '')} onChange={(v) => update(v, false)} />
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
    case 'media': {
      const raw = node.props[control.prop]
      if (typeof raw === 'string' && raw)
        return (
          <Field label={control.label} picker={<BindPicker node={node} onPick={(t) => update(t, false)} />}>
            <div className="ed-row">
              <code className="ed-code-chip">{raw}</code>
              <button className="ed-btn" onClick={() => update(null, false)}>
                Gỡ
              </button>
            </div>
            <span className="ed-help">Ảnh lấy từ dữ liệu.</span>
          </Field>
        )
      return <MediaField label={control.label} value={(raw as MediaValue | null) ?? null} onChange={(v) => update(v, false)} picker={<BindPicker node={node} onPick={(t) => update(t, false)} />} />
    }
    case 'number':
      return (
        <Field label={control.label} help={control.help}>
          <input
            className="ed-input"
            type="number"
            min={control.min}
            max={control.max}
            step={control.step}
            value={node.props[control.prop] == null ? '' : String(node.props[control.prop])}
            onChange={(e) => update(e.target.value === '' ? null : Number(e.target.value))}
          />
        </Field>
      )
    case 'color':
      return (
        <Field label={control.label}>
          <ColorInput value={String(node.props[control.prop] ?? '')} placeholder="" onChange={(v) => update(v)} />
        </Field>
      )
    case 'list':
      return <ListEditor node={node} control={control} />
  }
}

/** Control dạng danh sách mục lặp lại (menu, breadcrumb, slide, cột bảng…) */
function ListEditor({ node, control }: { node: BuilderNode; control: Extract<ContentControl, { type: 'list' }> }) {
  const s = useEditor.getState
  const items = (Array.isArray(node.props[control.prop]) ? (node.props[control.prop] as Record<string, unknown>[]) : []).map((it) => (it && typeof it === 'object' ? it : {}))
  const save = (next: Record<string, unknown>[], key?: string) => s().updateProps(node.id, { [control.prop]: next }, key)
  const setField = (i: number, key: string, value: unknown) => {
    const next = items.map((it, j) => (j === i ? { ...it, [key]: value } : it))
    save(next, `list:${node.id}:${control.prop}:${i}:${key}`)
  }
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items]
    const [it] = next.splice(i, 1)
    next.splice(i + dir, 0, it)
    save(next)
  }
  const blank = () => Object.fromEntries(control.fields.map((f) => [f.key, f.type === 'toggle' ? false : f.type === 'media' ? null : f.type === 'number' ? null : f.options?.[0]?.value ?? '']))
  return (
    <div className="ed-field">
      <span className="ed-label">{control.label}</span>
      {control.help && <span className="ed-help">{control.help}</span>}
      <div className="ed-list ed-list--cards">
        {items.map((it, i) => (
          <div key={i} className="ed-list-card">
            <div className="ed-list-card-head">
              <span className="ed-help">
                {control.itemLabel ?? 'Mục'} {i + 1}
              </span>
              <button className="ed-icon-btn" title="Lên" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp size={13} />
              </button>
              <button className="ed-icon-btn" title="Xuống" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown size={13} />
              </button>
              <button className="ed-icon-btn" title="Xoá mục" onClick={() => save(items.filter((_, j) => j !== i))}>
                <Trash2 size={13} />
              </button>
            </div>
            {control.fields.map((f) => (
              <ListFieldControl key={f.key} field={f} value={it[f.key]} onChange={(v) => setField(i, f.key, v)} />
            ))}
          </div>
        ))}
      </div>
      <button className="ed-btn" disabled={!!control.max && items.length >= control.max} onClick={() => save([...items, blank()])}>
        <Plus size={14} /> Thêm {control.itemLabel?.toLowerCase() ?? 'mục'}
      </button>
    </div>
  )
}

function ListFieldControl({ field, value, onChange }: { field: ListField; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case 'toggle':
      return (
        <label className="ed-toggle">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <span className="ed-toggle-ui" />
          {field.label}
        </label>
      )
    case 'select':
      return (
        <label className="ed-field">
          <span className="ed-help">{field.label}</span>
          <select className="ed-input" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )
    case 'media':
      return <MediaField label={field.label} value={(value as MediaValue | null) ?? null} onChange={onChange} />
    case 'number':
      return (
        <label className="ed-field">
          <span className="ed-help">{field.label}</span>
          <input className="ed-input" type="number" value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
        </label>
      )
    case 'color':
      return (
        <div className="ed-field">
          <span className="ed-help">{field.label}</span>
          <ColorInput value={String(value ?? '')} placeholder="" onChange={onChange} />
        </div>
      )
    case 'textarea':
      return (
        <label className="ed-field">
          <span className="ed-help">{field.label}</span>
          <textarea className="ed-input ed-textarea" rows={2} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </label>
      )
    case 'url':
      return (
        <div className="ed-field-wrap">
          <span className="ed-field-pickers">
            <LinkPicker onPick={(href) => onChange(href)} />
          </span>
          <label className="ed-field">
            <span className="ed-help">{field.label}</span>
            <input className="ed-input" value={String(value ?? '')} placeholder={field.placeholder ?? '/duong-dan hoặc https://…'} onChange={(e) => onChange(e.target.value)} />
          </label>
        </div>
      )
    default:
      return (
        <label className="ed-field">
          <span className="ed-help">{field.label}</span>
          <input className="ed-input" value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </label>
      )
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
            const anchor = document.getSelection()?.anchorNode
            const inList = !!(anchor && (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement)?.closest('li'))
            if (inList) return // trình duyệt tự tạo mục mới
            e.preventDefault()
            document.execCommand('insertLineBreak')
            emit()
          }
        }}
      />
    </div>
  )
}

function Field({ label, help, picker, children }: { label: string; help?: string; picker?: React.ReactNode; children: React.ReactNode }) {
  const body = (
    <label className="ed-field">
      <span className="ed-label ed-label--row">{label}</span>
      {children}
      {help && <span className="ed-help">{help}</span>}
    </label>
  )
  if (!picker) return body
  // nút chọn (🔗 ⚡) nằm ngoài <label>: bấm nhãn/ô nhập không kích hoạt nhầm nút đầu tiên trong label
  return (
    <div className="ed-field-wrap">
      <span className="ed-field-pickers">{picker}</span>
      {body}
    </div>
  )
}

/** Nối {{trường}} vào chữ đang có, tự thêm dấu cách */
function appendTemplate(current: string, template: string): string {
  return current && !/\s$/.test(current) ? `${current} ${template}` : current + template
}

/** Nguồn dữ liệu gần nhất bao quanh node (chính nó hoặc tổ tiên) */
function useDataContext(node: BuilderNode): { source: DataSource; info?: SourceInfo; ownerId: string } | null {
  const root = useEditor((s) => s.root)
  const sources = useEditor((s) => s.sources)
  const chain = [...getAncestors(root, node.id), node].reverse()
  for (const n of chain) {
    const source = dataSourceOf(n)
    if (source) return { source, info: sources.find((x) => x.slug === source.collection), ownerId: n.id }
  }
  return null
}

/** Nút ⚡ chèn {{trường}} từ nguồn dữ liệu bao quanh */
function BindPicker({ node, onPick }: { node: BuilderNode; onPick: (template: string) => void }) {
  const ctx = useDataContext(node)
  const usersInfo = useEditor((s) => s.sources.find((x) => x.slug === 'users'))
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  if (!ctx && !usersInfo) return null
  const paths = ctx?.info ? fieldPaths(ctx.info) : []
  const userPaths = usersInfo ? fieldPaths(usersInfo) : []
  return (
    <span className="ed-bind">
      <button ref={btnRef} type="button" className="ed-bind-btn" aria-expanded={open} data-action="bind-picker" title={ctx ? `Lấy từ dữ liệu: ${ctx.info?.label ?? ctx.source.collection}` : 'Lấy từ người đang đăng nhập'} onClick={(e) => (e.preventDefault(), setOpen((o) => !o))}>
        <Zap size={12} />
      </button>
      {open && (
        <Floating anchor={btnRef} onClose={() => setOpen(false)} width={290} className="ed-bind-pop">
        <span className="ed-bind-list" onMouseDown={(e) => e.preventDefault()}>
          {ctx && (
            <>
              <span className="ed-label">Trường của {ctx.info?.label ?? ctx.source.collection}</span>
              {paths.map((p) => (
                <button key={p.path} type="button" className="ed-token" onClick={() => (onPick(`{{${p.path}}}`), setOpen(false))}>
                  {p.label} <code>{`{{${p.path}}}`}</code>
                </button>
              ))}
              <button type="button" className="ed-token" onClick={() => (onPick('{{index}}'), setOpen(false))}>
                Số thứ tự <code>{'{{index}}'}</code>
              </button>
            </>
          )}
          {userPaths.length > 0 && (
            <>
              <span className="ed-label">Người đang đăng nhập</span>
              {userPaths.map((p) => (
                <button key={'u' + p.path} type="button" className="ed-token" onClick={() => (onPick(`{{user.${p.path}}}`), setOpen(false))}>
                  {p.label} <code>{`{{user.${p.path}}}`}</code>
                </button>
              ))}
            </>
          )}
        </span>
        </Floating>
      )}
    </span>
  )
}

/** Hiển thị có điều kiện (props.show) – tab Nâng cao */
function ShowPanel({ node }: { node: BuilderNode }) {
  const show = showOf(node) ?? {}
  const ctx = useDataContext(node)
  const usersInfo = useEditor((s) => s.sources.find((x) => x.slug === 'users'))
  const hidden = node.props.condHidden === true
  const set = (patch: Partial<ShowCondition>) => {
    const next: ShowCondition = { ...show, ...patch }
    if (next.auth === 'any') delete next.auth
    if (!next.field) {
      delete next.field
      delete next.op
      delete next.value
    }
    useEditor.getState().updateProps(node.id, { show: Object.keys(next).length ? next : undefined })
  }
  const fieldOptions = [...(ctx?.info ? fieldPaths(ctx.info).map((p) => ({ path: p.path, label: `${ctx.info!.label}: ${p.label}` })) : []), ...(usersInfo ? fieldPaths(usersInfo).map((p) => ({ path: `user.${p.path}`, label: `Người đăng nhập: ${p.label}` })) : [])]
  return (
    <div className="ed-field">
      <span className="ed-label">Hiển thị có điều kiện</span>
      <select className="ed-input" value={show.auth ?? 'any'} onChange={(e) => set({ auth: e.target.value as ShowCondition['auth'] })}>
        <option value="any">Mọi người</option>
        <option value="user">Chỉ khi đã đăng nhập</option>
        <option value="guest">Chỉ khi là khách</option>
      </select>
      <div className="ed-row">
        <select className="ed-input" value={show.field ?? ''} onChange={(e) => set({ field: e.target.value || undefined, op: show.op ?? 'exists' })}>
          <option value="">— không theo trường —</option>
          {fieldOptions.map((f) => (
            <option key={f.path} value={f.path}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      {show.field && (
        <div className="ed-row">
          <select className="ed-input" value={show.op ?? 'exists'} onChange={(e) => set({ op: e.target.value as ShowCondition['op'] })}>
            {SHOW_OPS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {!['exists', 'not_exists'].includes(show.op ?? 'exists') && <input className="ed-input" placeholder="giá trị" value={show.value ?? ''} onChange={(e) => set({ value: e.target.value })} />}
        </div>
      )}
      <span className="ed-help">{hidden ? 'Đang bị ẩn theo điều kiện (canvas hiện mờ để sửa; trang thật không render).' : 'Điều kiện theo bản ghi bao quanh hoặc người đang đăng nhập. Dùng “Xem như khách” ở Cài đặt trang để thử.'}</span>
    </div>
  )
}

/** Chọn block làm phần tử mẫu của Danh sách dữ liệu (loại block có sẵn hoặc My Block) – tự gắn trường */
function TemplatePicker({ node }: { node: BuilderNode }) {
  const blocks = useEditor((s) => s.blocks)
  const [choice, setChoice] = useState('')
  const types = Object.values(BLOCKS).filter((b) => !getSchema(b.type)?.hidden && b.type !== 'dataList' && getSchema('dataList')?.isContainer && canContain('dataList', b.type))
  const myBlocks = Object.values(blocks)
  const current = node.children?.[0]
  const apply = () => {
    if (!choice) return
    let template: BuilderNode | null = null
    if (choice.startsWith('my:')) {
      const b = blocks[choice.slice(3)]
      if (b) template = structuredClone(b.tree)
    } else template = createNodeFromBlock(choice)
    if (template) useEditor.getState().setListTemplate(node.id, template)
  }
  return (
    <div className="ed-field">
      <span className="ed-label">Phần tử mẫu (lặp cho từng bản ghi)</span>
      <span className="ed-help">Hiện tại: {current ? (getBlock(current.type)?.label ?? current.type) : 'chưa có'}. Chọn block khác để thay, các ô chữ/ảnh sẽ tự gắn trường (name, title, avatar…).</span>
      <div className="ed-row">
        <select className="ed-input" value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value="">— chọn block làm mẫu —</option>
          <optgroup label="Block có sẵn">
            {types.map((b) => (
              <option key={b.type} value={b.type}>
                {b.label}
              </option>
            ))}
          </optgroup>
          {myBlocks.length > 0 && (
            <optgroup label="My Blocks">
              {myBlocks.map((b) => (
                <option key={b.id} value={`my:${b.id}`}>
                  {b.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <button className="ed-btn" disabled={!choice} onClick={apply}>
          Dùng làm mẫu
        </button>
      </div>
      <span className="ed-help">Hoặc chọn một phần tử bất kỳ trên trang rồi bấm nút <b>🗄 Lặp theo dữ liệu</b> trên thanh công cụ / menu chuột phải.</span>
    </div>
  )
}

/** Bộ chọn icon: ô tìm kiếm + lưới toàn bộ icon của helpers.ICONS */
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const all = Object.keys(ICONS)
  const needle = q.trim().toLowerCase()
  const list = needle ? all.filter((k) => k.toLowerCase().includes(needle) || (ICON_LABELS[k] ?? '').toLowerCase().includes(needle)) : all
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <div className="ed-iconpicker">
      <button ref={btnRef} type="button" className="ed-input ed-iconpicker-current" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {value ? <Icon name={value} size={16} /> : null}
        <span>{value ? (ICON_LABELS[value] ?? value) : 'Không có icon'}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <Floating anchor={btnRef} onClose={() => setOpen(false)} width={Math.max(260, btnRef.current?.offsetWidth ?? 0)} align="start" className="ed-iconpicker-pop">
          <input className="ed-input" placeholder="Tìm icon… (ví dụ: mũi tên, giỏ, facebook)" value={q} autoFocus onChange={(e) => setQ(e.target.value)} />
          <div className="ed-icon-grid">
            <button type="button" className={`ed-icon-cell${!value ? ' is-active' : ''}`} title="Không có icon" onClick={() => (onChange(''), setOpen(false))}>
              <X size={16} />
            </button>
            {list.map((k) => (
              <button key={k} type="button" className={`ed-icon-cell${value === k ? ' is-active' : ''}`} title={`${ICON_LABELS[k] ?? k} (${k})`} data-icon={k} onClick={() => (onChange(k), setOpen(false))}>
                <Icon name={k} size={18} />
              </button>
            ))}
          </div>
          <span className="ed-help">{list.length} / {all.length} icon</span>
        </Floating>
      )}
    </div>
  )
}

/** Kiểu chữ đặt tên của theme (class .ts-<name>): chọn một kiểu, style riêng của phần tử vẫn ghi đè được */
function TextStyleField({ node }: { node: BuilderNode }) {
  const theme = useEditor(effectiveTheme)
  const value = typeof node.props.textStyle === 'string' ? node.props.textStyle : ''
  const set = (v: string) => useEditor.getState().updateProps(node.id, { textStyle: v || undefined })
  return (
    <Field label="Kiểu chữ (theme)" help="Kiểu chữ đặt tên trong Theme: đổi theme là đổi cả site. Thuộc tính ở tab Kiểu sẽ ghi đè.">
      <select className="ed-input" value={value} onChange={(e) => set(e.target.value)} data-field="textStyle">
        <option value="">— Không dùng —</option>
        {theme.textStyles.map((ts) => (
          <option key={ts.name} value={ts.name}>
            {ts.label} ({ts.name})
          </option>
        ))}
      </select>
    </Field>
  )
}

/** Panel "Nguồn dữ liệu" cho block chứa (control custom: 'data') */
function DataSourcePanel({ node }: { node: BuilderNode }) {
  const sources = useEditor((s) => s.sources)
  const records = useEditor((s) => s.dataCache[node.id]?.records)
  const total = useEditor((s) => s.dataCache[node.id]?.total)
  const source = dataSourceOf(node)
  const root = useEditor((s) => s.root)
  // nằm trong một Danh sách dữ liệu / block có nguồn: nhận bản ghi từ cha, không chọn collection lại
  const ancestorSource = [...getAncestors(root, node.id)].reverse().map((a) => ({ a, src: dataSourceOf(a) })).find((x) => x.src)
  if (ancestorSource && !source) {
    const info = sources.find((x) => x.slug === ancestorSource.src!.collection)
    const label = ancestorSource.a.type === 'dataList' ? 'Danh sách dữ liệu' : (getBlock(ancestorSource.a.type)?.label ?? ancestorSource.a.type)
    return (
      <div className="ed-field ed-data ed-data--inherited">
        <span className="ed-label">
          <Database size={13} /> Dữ liệu từ {label} ({info?.label ?? ancestorSource.src!.collection})
        </span>
        <span className="ed-help">
          Phần tử này nhận dữ liệu của <b>từng bản ghi</b> trong {label} bao quanh, không cần chọn collection. Chọn phần tử con (chữ, ảnh, link) rồi bấm nút <b>⚡</b> cạnh ô nhập để gắn trường: {(info ? fieldPaths(info) : []).map((f) => `{{${f.path}}}`).join(', ') || '—'}.
        </span>
        <button className="ed-btn" onClick={() => useEditor.getState().select(ancestorSource.a.id)}>
          Chọn {label} để đổi collection / bộ lọc
        </button>
      </div>
    )
  }
  const s = useEditor.getState
  const set = (patch: Partial<DataSource>) => s().updateProps(node.id, { data: normalizeDataSource({ ...(source ?? { collection: sources[0]?.slug ?? 'users', mode: 'list', limit: 8 }), ...patch }) })
  const info = sources.find((x) => x.slug === source?.collection)
  const fields = info ? fieldPaths(info) : []
  const filters = source?.filters ?? []
  const setFilters = (next: DataFilter[]) => set({ filters: next })
  return (
    <div className="ed-field ed-data">
      <label className="ed-toggle">
        <input type="checkbox" checked={!!source} onChange={(e) => (e.target.checked ? set({}) : s().updateProps(node.id, { data: undefined }))} />
        <span className="ed-toggle-ui" />
        <Database size={14} /> Lấy dữ liệu từ collection
      </label>
      {!sources.length && <span className="ed-help">Chưa có collection nào khai báo `custom.builder` (xem README).</span>}
      {source && (
        <div className="ed-fields" style={{ padding: 0 }}>
          <Field label="Collection">
            <select className="ed-input" value={source.collection} onChange={(e) => set({ collection: e.target.value, filters: [], sort: undefined, byField: undefined })}>
              {sources.map((x) => (
                <option key={x.slug} value={x.slug}>
                  {x.label} ({x.slug})
                </option>
              ))}
              {!info && <option value={source.collection}>{source.collection}</option>}
            </select>
          </Field>
          <Field label="Chế độ">
            <select className="ed-input" value={source.mode} onChange={(e) => set({ mode: e.target.value as DataSource['mode'] })}>
              <option value="list">Danh sách bản ghi{node.type === 'dataList' ? ' (lặp phần tử mẫu)' : ' (dùng bản ghi đầu)'}</option>
              <option value="one">Một bản ghi</option>
            </select>
          </Field>
          {source.mode === 'one' ? (
            <div className="ed-row">
              <label className="ed-field" style={{ flex: 1 }}>
                <span className="ed-help">Tìm theo trường</span>
                <select className="ed-input" value={source.byField ?? 'id'} onChange={(e) => set({ byField: e.target.value })}>
                  {(info?.fields ?? [{ name: 'id', label: 'ID', type: 'text' }]).map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ed-field" style={{ flex: 1 }}>
                <span className="ed-help">Bằng giá trị</span>
                <input className="ed-input" value={source.byValue ?? ''} onChange={(e) => set({ byValue: e.target.value })} />
              </label>
            </div>
          ) : (
            <div className="ed-row">
              <label className="ed-field" style={{ flex: 1 }}>
                <span className="ed-help">Số bản ghi</span>
                <input className="ed-input" type="number" min={1} max={100} value={source.limit ?? 12} onChange={(e) => set({ limit: Number(e.target.value) })} />
              </label>
              <label className="ed-field" style={{ flex: 2 }}>
                <span className="ed-help">Sắp xếp</span>
                <select className="ed-input" value={source.sort ?? ''} onChange={(e) => set({ sort: e.target.value || undefined })}>
                  <option value="">Mặc định</option>
                  {(info?.fields ?? []).flatMap((f) => [
                    <option key={f.name} value={f.name}>
                      {f.label} ↑
                    </option>,
                    <option key={'-' + f.name} value={'-' + f.name}>
                      {f.label} ↓
                    </option>,
                  ])}
                  <option value="-createdAt">Mới nhất</option>
                  <option value="createdAt">Cũ nhất</option>
                </select>
              </label>
            </div>
          )}
          {info?.ownerField && (
            <div className="ed-field">
              <label className="ed-toggle">
                <input type="checkbox" checked={!!source.ownerOnly} onChange={(e) => set({ ownerOnly: e.target.checked || undefined })} />
                <span className="ed-toggle-ui" />
                Chỉ bản ghi của người đang đăng nhập
              </label>
              <span className="ed-help">Lọc theo trường “{info.ownerField}” = người dùng/khách hàng đang đăng nhập; khách chưa đăng nhập thấy danh sách trống. Phần này render riêng cho từng người (không cache).</span>
            </div>
          )}
          {source.mode === 'list' && (
            <div className="ed-field">
              <label className="ed-toggle">
                <input type="checkbox" checked={!!source.urlParams} onChange={(e) => set({ urlParams: e.target.checked || undefined })} />
                <span className="ed-toggle-ui" />
                Nhận tham số URL (?page, ?q, ?trường=giá trị)
              </label>
              {source.urlParams && (
                <>
                  <span className="ed-help">Trường tìm kiếm cho ?q= (chọn nhiều)</span>
                  <div className="ed-tokens">
                    {(info?.fields ?? []).filter((f) => f.name !== 'id').map((f) => {
                      const on = source.searchFields?.includes(f.name)
                      return (
                        <button key={f.name} className={`ed-token${on ? ' is-active' : ''}`} onClick={() => set({ searchFields: on ? (source.searchFields ?? []).filter((x) => x !== f.name) : [...(source.searchFields ?? []), f.name] })}>
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                  <span className="ed-help">Thêm block Pagination (bật “Theo nguồn dữ liệu”), Ô tìm kiếm và Toggle Group có tham số để điều khiển. Canvas luôn hiện trang 1.</span>
                </>
              )}
            </div>
          )}
          <div className="ed-field">
            <span className="ed-label">Bộ lọc</span>
            {filters.map((f, i) => (
              <div key={i} className="ed-list-card">
                <div className="ed-row">
                  <select className="ed-input" value={f.field} onChange={(e) => setFilters(filters.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))}>
                    {(info?.fields ?? []).map((x) => (
                      <option key={x.name} value={x.name}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                  <select className="ed-input" value={f.op} onChange={(e) => setFilters(filters.map((x, j) => (j === i ? { ...x, op: e.target.value as DataFilter['op'] } : x)))}>
                    {FILTER_OPS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ed-row">
                  <input className="ed-input" value={f.value} placeholder="giá trị" disabled={f.op === 'exists'} onChange={(e) => setFilters(filters.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <button className="ed-icon-btn" title="Bỏ điều kiện" onClick={() => setFilters(filters.filter((_, j) => j !== i))}>
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
            <button className="ed-btn" onClick={() => setFilters([...filters, { field: info?.fields[1]?.name ?? 'id', op: 'equals', value: '' }])}>
              <Plus size={14} /> Thêm điều kiện
            </button>
          </div>
          {node.type === 'dataList' && <TemplatePicker node={node} />}
          <span className="ed-help">
            {records ? `Đã nạp ${records.length}/${total ?? records.length} bản ghi.` : 'Đang nạp…'} Trường dùng được: {fields.map((f) => `{{${f.path}}}`).join(', ') || '—'}. Bấm ⚡ cạnh ô nhập của phần tử con để chèn.
          </span>
        </div>
      )}
    </div>
  )
}

function MediaField({ label, value, onChange, picker }: { label: string; value: MediaValue | null; onChange: (v: MediaValue | null) => void; picker?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="ed-field">
      <span className="ed-label ed-label--row">
        {label}
        {picker}
      </span>
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

/** Header/footer toàn site đang chọn trên canvas: đổi block, ẩn trên trang này, mở bản gốc */
function SitePartPanel({ part }: { part: SitePart }) {
  const siteParts = useEditor((s) => s.siteParts)
  const blocks = useEditor((s) => s.blocks)
  const blockId = siteParts[part]
  const block = blockId ? blocks[blockId] : undefined
  return (
    <aside className="ed-right">
      <header className="ed-right-head">
        <div className="ed-right-title">
          <Globe size={18} />
          <strong>{SITE_PART_LABELS[part]}</strong>
        </div>
      </header>
      <div className="ed-right-body">
        <div className="ed-fields">
          <p className="ed-hint">Phần này được chèn tự động vào mọi trang từ Cài đặt site. Sửa nội dung ở bản gốc của My Block; đổi block tại đây áp dụng cho toàn site.</p>
          <SitePartSelect part={part} />
          {block && (
            <a className="ed-btn" href={`/builder/block/${block.id}`} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Sửa bản gốc “{block.name}”
            </a>
          )}
          <button className="ed-btn" onClick={() => useEditor.getState().setLayout(part === 'header' ? { hideHeader: true } : { hideFooter: true })}>
            <EyeOff size={14} /> Ẩn trên trang này
          </button>
        </div>
      </div>
    </aside>
  )
}

/** Chọn My Block (dùng chung) làm header/footer toàn site – ghi ngay vào Cài đặt site */
function SitePartSelect({ part }: { part: SitePart }) {
  const siteParts = useEditor((s) => s.siteParts)
  const blocks = useEditor((s) => s.blocks)
  const [busy, setBusy] = useState(false)
  const options = Object.values(blocks)
    .filter((b) => b.kind !== 'page')
    .sort((a, b) => a.name.localeCompare(b.name))
  const change = async (id: string) => {
    setBusy(true)
    try {
      await setSitePart(part, id || null)
      useEditor.getState().toast('success', id ? `Đã đặt ${SITE_PART_LABELS[part].toLowerCase()} cho toàn site.` : `Đã bỏ ${SITE_PART_LABELS[part].toLowerCase()}.`)
    } catch (err) {
      useEditor.getState().toast('error', `Không lưu được: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Field label={`Block làm ${SITE_PART_LABELS[part].toLowerCase()}`} help="Nên dùng block “Dùng chung” để mọi editor đều sửa được.">
      <select className="ed-input" value={siteParts[part] ?? ''} disabled={busy} onChange={(e) => void change(e.target.value)}>
        <option value="">— Không có —</option>
        {options.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
            {b.scope === 'shared' ? '' : ' (riêng)'}
          </option>
        ))}
      </select>
    </Field>
  )
}

/** Bố cục trang: bật/tắt header, footer toàn site cho riêng trang này */
function LayoutField() {
  const layout = useEditor((s) => s.layout)
  const siteParts = useEditor((s) => s.siteParts)
  return (
    <details className="ed-group" open>
      <summary className="ed-group-title">Bố cục (header / footer toàn site)</summary>
      <div className="ed-fields">
        {!siteParts.header && !siteParts.footer && <p className="ed-hint">Chưa có header/footer toàn site. Chọn một My Block dùng chung bên dưới hoặc trong Admin → Cài đặt site.</p>}
        <SitePartSelect part="header" />
        <SitePartSelect part="footer" />
        <label className="ed-toggle">
          <input type="checkbox" checked={layout.hideHeader} onChange={(e) => useEditor.getState().setLayout({ hideHeader: e.target.checked })} />
          <span className="ed-toggle-ui" />
          <span>Ẩn header toàn site trên trang này</span>
        </label>
        <label className="ed-toggle">
          <input type="checkbox" checked={layout.hideFooter} onChange={(e) => useEditor.getState().setLayout({ hideFooter: e.target.checked })} />
          <span className="ed-toggle-ui" />
          <span>Ẩn footer toàn site trên trang này</span>
        </label>
      </div>
    </details>
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
      <LayoutField />
      <TemplateField />
      <GuestPreviewField />
      <SeoField />
      <p className="ed-hint">Màu nền, font và lề của cả trang chỉnh ở tab “Kiểu”.</p>
    </div>
  )
}

/** SEO của trang: meta title/description, ảnh OG, noindex, canonical + xem trước kết quả tìm kiếm */
function SeoField() {
  const seo = useEditor((s) => s.seo)
  const title = useEditor((s) => s.title)
  const slug = useEditor((s) => s.slug)
  const [open, setOpen] = useState(false)
  const set = (patch: Partial<typeof seo>) => useEditor.getState().setSeo(patch)
  const shownTitle = seo.metaTitle || title
  return (
    <section className="ed-group" style={{ margin: '0 -12px', borderTop: '1px solid var(--ed-line)' }}>
      <button className="ed-group-title" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        SEO & chia sẻ
        {(seo.metaTitle || seo.metaDescription || seo.ogImage || seo.noIndex) && <span className="ed-dot" />}
      </button>
      {open && (
        <div className="ed-fields">
          <div className="ed-serp">
            <span className="ed-serp-url">{(process.env.NEXT_PUBLIC_SERVER_URL || 'https://site.vn').replace(/^https?:\/\//, '')}/{slug === 'home' ? '' : slug}</span>
            <span className="ed-serp-title">{shownTitle || 'Tiêu đề trang'}</span>
            <span className="ed-serp-desc">{seo.metaDescription || 'Mô tả ngắn sẽ hiện ở đây. Nên 120–160 ký tự.'}</span>
          </div>
          <Field label={`Meta title (${shownTitle.length}/60)`} help="Để trống dùng tiêu đề trang. Trang mẫu động nhận {{trường}}.">
            <input className="ed-input" value={seo.metaTitle} onChange={(e) => set({ metaTitle: e.target.value })} />
          </Field>
          <Field label={`Meta description (${seo.metaDescription.length}/160)`}>
            <textarea className="ed-input ed-textarea" rows={3} value={seo.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} />
          </Field>
          <MediaField label="Ảnh chia sẻ (Open Graph, 1200×630)" value={seo.ogImage} onChange={(v) => set({ ogImage: v })} />
          <Field label="Canonical URL (tuỳ chọn)">
            <input className="ed-input" value={seo.canonical} placeholder="https://…" onChange={(e) => set({ canonical: e.target.value })} />
          </Field>
          <label className="ed-toggle">
            <input type="checkbox" checked={seo.noIndex} onChange={(e) => set({ noIndex: e.target.checked })} />
            <span className="ed-toggle-ui" />
            Không cho máy tìm kiếm lập chỉ mục (noindex)
          </label>
          <span className="ed-help">Tên site, mô tả, logo, favicon và ảnh chia sẻ mặc định đặt ở Admin → Cài đặt site. sitemap.xml và robots.txt tự sinh.</span>
        </div>
      )}
    </section>
  )
}

/** Xem canvas như khách để thử điều kiện đăng nhập và {{user.*}} */
function GuestPreviewField() {
  const on = useEditor((s) => s.previewAsGuest)
  const user = useEditor((s) => s.currentUser)
  return (
    <label className="ed-toggle">
      <input type="checkbox" checked={on} onChange={(e) => useEditor.getState().setPreviewAsGuest(e.target.checked)} />
      <span className="ed-toggle-ui" />
      Xem như khách (chưa đăng nhập){!on && user ? ` – đang xem như ${String(user.name ?? user.id)}` : ''}
    </label>
  )
}

/** Trang mẫu động: phục vụ /slug/<giá trị>, toàn bộ trang bind vào bản ghi khớp */
function TemplateField() {
  const template = useEditor((s) => s.template)
  const sources = useEditor((s) => s.sources)
  const slug = useEditor((s) => s.slug)
  const root = useEditor((s) => s.root)
  const records = useEditor((s) => s.dataCache.root?.records)
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])
  const s = useEditor.getState
  const info = sources.find((x) => x.slug === template?.collection)
  const rootData = (root.props.data ?? {}) as { byValue?: string }

  const apply = (next: { collection: string; field: string } | null, preview?: string) => {
    s().setTemplate(next)
    s().updateProps('root', { data: next ? { collection: next.collection, mode: 'one', byField: next.field, byValue: preview ?? rootData.byValue ?? '' } : undefined })
  }
  // danh sách bản ghi để xem thử
  useEffect(() => {
    if (!template) return setOptions([])
    import('./api').then(({ fetchData }) =>
      fetchData({ collection: template.collection, mode: 'list', limit: 50 }, info)
        .then((res) => setOptions(res.records.map((d) => ({ value: String(d[template.field] ?? ''), label: String(d.name ?? d.title ?? d.label ?? d.id) }))))
        .catch(() => setOptions([])),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.collection, template?.field, info?.slug])

  return (
    <div className="ed-field">
      <label className="ed-toggle">
        <input type="checkbox" checked={!!template} onChange={(e) => apply(e.target.checked ? { collection: sources[0]?.slug ?? 'users', field: 'id' } : null)} />
        <span className="ed-toggle-ui" />
        Trang mẫu động (theo bản ghi)
      </label>
      {template && (
        <>
          <Field label="Collection">
            <select className="ed-input" value={template.collection} onChange={(e) => apply({ collection: e.target.value, field: 'id' }, '')}>
              {sources.map((x) => (
                <option key={x.slug} value={x.slug}>
                  {x.label} ({x.slug})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trường khớp với đoạn cuối URL" help={`Địa chỉ: /${slug}/<giá trị ${template.field}>`}>
            <select className="ed-input" value={template.field} onChange={(e) => apply({ ...template, field: e.target.value }, '')}>
              {(info?.fields ?? [{ name: 'id', label: 'ID', type: 'text' }]).map((f) => (
                <option key={f.name} value={f.name}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Xem thử với bản ghi" help={records?.length ? `Đang hiện: ${String(records[0].name ?? records[0].title ?? records[0].id)}` : 'Chọn một bản ghi để canvas hiện dữ liệu thật.'}>
            <select className="ed-input" value={rootData.byValue ?? ''} onChange={(e) => apply(template, e.target.value)}>
              <option value="">— chọn —</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <span className="ed-help">Mọi ô nhập trên trang có nút ⚡ để chèn trường của bản ghi; tiêu đề trang cũng nhận {'{{trường}}'}.</span>
        </>
      )}
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
      <PasteCss node={node} />
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
      {node.type !== 'root' && <FxPanel node={node} />}
    </div>
  )
}

/** Hiệu ứng (props.fx): xuất hiện khi cuộn, hover, chữ, parallax, xếp chồng, ẩn khi cuộn – áp dụng mọi thiết bị */
function FxPanel({ node }: { node: BuilderNode }) {
  const [open, setOpen] = useState(false)
  const fx = ((node.props as { fx?: FxProps }).fx ?? {}) as FxProps
  const def = getBlock(node.type)
  const isContainer = !!getSchema(node.type)?.isContainer
  const textOptions = def?.inlineEdit ? (def.inlineEdit.rich ? TEXT_FX_OPTIONS.filter((o) => o.value === 'none' || o.value === 'shimmer') : TEXT_FX_OPTIONS) : []
  const set = (patch: Partial<FxProps>, key?: string) => {
    const next: Record<string, unknown> = { ...fx, ...patch }
    for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === 'none' || next[k] === '' || next[k] === false || next[k] === 0) delete next[k]
    useEditor.getState().updateProps(node.id, { fx: Object.keys(next).length ? next : undefined }, key)
  }
  const spring = { ...DEFAULT_SPRING, ...fx.spring }
  const replay = () => {
    const doc = (document.querySelector('iframe.ed-iframe') as HTMLIFrameElement | null)?.contentDocument
    doc?.dispatchEvent(new CustomEvent('bld:replay', { detail: node.id }))
  }
  const count = Object.keys(fx).length
  return (
    <section className="ed-group">
      <button className="ed-group-title" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Sparkles size={13} /> Chuyển động (animation)
        {count > 0 && <span className="ed-dot" title="Có hiệu ứng" />}
      </button>
      {open && (
        <div className="ed-fields">
          <p className="ed-help" style={{ margin: 0 }}>Áp dụng cho mọi thiết bị. Tôn trọng “giảm chuyển động” của hệ điều hành.</p>
          <Field label="Xuất hiện khi cuộn tới (Scroll Reveal)">
            <select className="ed-input" value={fx.reveal ?? 'none'} onChange={(e) => set({ reveal: e.target.value as FxProps['reveal'] })}>
              {REVEAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {fx.reveal && (
            <>
              <Field label="Easing">
                <select className="ed-input" value={fx.easing ?? 'ease'} onChange={(e) => set({ easing: e.target.value === 'ease' ? undefined : e.target.value })}>
                  {EASING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {fx.easing === 'spring' ? (
                <div className="ed-row">
                  {(['stiffness', 'damping', 'mass'] as const).map((k) => (
                    <label key={k} className="ed-field" style={{ flex: 1 }}>
                      <span className="ed-help">{k === 'stiffness' ? 'Độ cứng' : k === 'damping' ? 'Giảm chấn' : 'Khối lượng'}</span>
                      <input className="ed-input" type="number" step={k === 'mass' ? 0.1 : 1} value={spring[k]} onChange={(e) => set({ spring: { ...spring, [k]: Number(e.target.value) } }, `fx:${node.id}:spring:${k}`)} />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="ed-row">
                  <label className="ed-field" style={{ flex: 1 }}>
                    <span className="ed-help">Thời lượng (ms)</span>
                    <input className="ed-input" type="number" min={50} step={50} value={fx.duration ?? 600} onChange={(e) => set({ duration: Number(e.target.value) }, `fx:${node.id}:duration`)} />
                  </label>
                  <label className="ed-field" style={{ flex: 1 }}>
                    <span className="ed-help">Trễ (ms)</span>
                    <input className="ed-input" type="number" min={0} step={50} value={fx.delay ?? 0} onChange={(e) => set({ delay: Number(e.target.value) }, `fx:${node.id}:delay`)} />
                  </label>
                </div>
              )}
              {fx.easing === 'spring' && <span className="ed-help">Thời lượng tự tính theo lò xo: {springEasing(spring).duration} ms.</span>}
              <label className="ed-toggle">
                <input type="checkbox" checked={fx.once !== false} onChange={(e) => set({ once: e.target.checked ? undefined : false })} />
                <span className="ed-toggle-ui" />
                Chỉ chạy lần đầu
              </label>
            </>
          )}
          <Field label="Khi rê chuột (Hover)">
            <select className="ed-input" value={fx.hover ?? 'none'} onChange={(e) => set({ hover: e.target.value as FxProps['hover'] })}>
              {HOVER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {textOptions.length > 0 && (
            <Field label="Hiệu ứng chữ">
              <select className="ed-input" value={fx.text ?? 'none'} onChange={(e) => set({ text: e.target.value as FxProps['text'] })}>
                {textOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {fx.text === 'rotate' && (
            <Field label="Các từ xoay vòng (cách nhau bằng dấu phẩy)">
              <input className="ed-input" value={fx.words ?? ''} placeholder="nhanh, đẹp, dễ dùng" onChange={(e) => set({ words: e.target.value }, `fx:${node.id}:words`)} />
            </Field>
          )}
          <Field label="Parallax khi cuộn" help="0 = tắt. Âm: trôi chậm hơn trang, dương: nhanh hơn.">
            <input className="ed-input" type="number" min={-1} max={1} step={0.1} value={fx.parallax ?? 0} onChange={(e) => set({ parallax: Number(e.target.value) }, `fx:${node.id}:parallax`)} />
          </Field>
          {isContainer && (
            <>
              <label className="ed-toggle">
                <input type="checkbox" checked={!!fx.stack} onChange={(e) => set({ stack: e.target.checked || undefined })} />
                <span className="ed-toggle-ui" />
                Xếp chồng thẻ khi cuộn (Stacking Cards)
              </label>
              {fx.stack && (
                <Field label="Cách mép trên (px)">
                  <input className="ed-input" type="number" min={0} value={fx.stackTop ?? 80} onChange={(e) => set({ stackTop: Number(e.target.value) }, `fx:${node.id}:stackTop`)} />
                </Field>
              )}
            </>
          )}
          <label className="ed-toggle">
            <input type="checkbox" checked={!!fx.hideOnScroll} onChange={(e) => set({ hideOnScroll: e.target.checked || undefined })} />
            <span className="ed-toggle-ui" />
            Ẩn khi cuộn xuống, hiện khi cuộn lên (header)
          </label>
          {fx.hideOnScroll && <span className="ed-help">Kết hợp với Vị trí = Sticky hoặc Fixed để thấy hiệu ứng.</span>}
          {(fx.reveal || (fx.text && fx.text !== 'shimmer')) && (
            <button className="ed-btn" onClick={replay}>
              <Play size={14} /> Xem thử trên canvas
            </button>
          )}
        </div>
      )}
    </section>
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
            {field.kind === 'unit' && <TokenPicker prop={field.key} value={value} onPick={(v) => set(field.key, v)} />}
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
            <TokenPicker prop={field.key} value={short} onPick={(v) => set(field.key, v)} />
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

/** Dropdown token của theme (khoảng cách, cỡ chữ, bóng, bề rộng, bo góc) cho ô đơn vị */
function TokenPicker({ prop, value, onPick }: { prop: string; value: string; onPick: (v: string) => void }) {
  const theme = useEditor(effectiveTheme)
  const options = tokenOptionsFor(prop, theme)
  if (!options.length) return null
  return (
    <select className="ed-token" value={options.some((o) => o.value === value) ? value : ''} title="Dùng token của theme" aria-label="Token" onChange={(e) => e.target.value && onPick(e.target.value)}>
      <option value="">◆</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function ColorInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const theme = useEditor(effectiveTheme)
  const shown = value || placeholder
  const tokenMatch = shown.match(/^var\(--color-([a-z]+)\)$/)
  const preview = tokenMatch ? theme.colors[tokenMatch[1]] : shown
  const hex = /^#[0-9a-f]{6}$/i.test(preview) ? preview : '#000000'
  const wrapRef = useRef<HTMLDivElement>(null)
  return (
    <div className="ed-color">
      <div className="ed-input-wrap" ref={wrapRef}>
        <button className="ed-swatch" style={{ background: preview || 'transparent' }} onClick={() => setOpen((o) => !o)} aria-label="Chọn màu" aria-expanded={open} />
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
        <Floating anchor={wrapRef} onClose={() => setOpen(false)} width={260} align="start" className="ed-color-pop">
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
        </Floating>
      )}
    </div>
  )
}

// ======================= Dán CSS =======================

/** Dán CSS vào phần tử đang chọn: khai báo thuần -> thiết bị/trạng thái đang sửa; luật có :hover / @media -> đúng bucket */
function PasteCss({ node }: { node: BuilderNode }) {
  const device = useEditor((s) => s.device)
  const styleState = useEditor((s) => s.styleState)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [replace, setReplace] = useState(false)
  const fallback = styleState === 'hover' ? 'hover' : device
  const parsed = useMemo(() => (text.trim() ? cssToStyles(text, fallback) : {}), [text, fallback])
  const count = Object.values(parsed).reduce((n, m) => n + Object.keys(m ?? {}).length, 0)
  const apply = () => {
    if (!count) return
    useEditor.getState().mergeStyles(node.id, parsed, replace)
    useEditor.getState().toast('success', `Đã áp ${count} thuộc tính CSS (Ctrl+Z để hoàn tác).`)
    setText('')
    setOpen(false)
  }
  const copy = async () => {
    const lines: string[] = []
    const decl = (m: Record<string, string> | undefined) => Object.entries(m ?? {}).map(([k, v]) => `  ${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}: ${v};`).join('\n')
    const st = node.styles ?? {}
    if (st.desktop) lines.push(`.phan-tu {\n${decl(st.desktop)}\n}`)
    if (st.hover) lines.push(`.phan-tu:hover {\n${decl(st.hover)}\n}`)
    if (st.tablet) lines.push(`@media (max-width: 1024px) {\n.phan-tu {\n${decl(st.tablet)}\n}\n}`)
    if (st.mobile) lines.push(`@media (max-width: 767px) {\n.phan-tu {\n${decl(st.mobile)}\n}\n}`)
    await navigator.clipboard?.writeText(lines.join('\n\n')).catch(() => undefined)
    useEditor.getState().toast('info', lines.length ? 'Đã sao chép CSS của phần tử.' : 'Phần tử chưa có style riêng.')
  }
  return (
    <div className="ed-paste-css">
      <div className="ed-row">
        <button className="ed-btn ed-btn--sm" onClick={() => setOpen((o) => !o)} data-action="paste-css">
          <ClipboardPaste size={13} /> Dán CSS
        </button>
        <button className="ed-btn ed-btn--sm" onClick={() => void copy()}>
          <Copy size={13} /> Sao chép CSS
        </button>
      </div>
      {open && (
        <div className="ed-fields" style={{ marginTop: 8 }}>
          <textarea
            className="ed-input ed-textarea ed-code"
            rows={6}
            spellCheck={false}
            data-field="pasteCssText"
            placeholder={'padding: 24px;\nborder-radius: 16px;\nbox-shadow: 0 10px 30px rgba(0,0,0,.08);\n\nhoặc cả luật: .x { … } .x:hover { … } @media (max-width: 767px) { … }'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <label className="ed-toggle">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            <span className="ed-toggle-ui" />
            <span>Thay toàn bộ style của thiết bị/trạng thái tương ứng (không gộp)</span>
          </label>
          <span className="ed-help">
            {count ? `Nhận ${count} thuộc tính: ${Object.entries(parsed).map(([b, m]) => `${b === 'hover' ? 'Hover' : b === 'desktop' ? 'Desktop' : b === 'tablet' ? 'Tablet' : 'Mobile'} (${Object.keys(m ?? {}).length})`).join(', ')}.` : 'Khai báo không có selector được áp cho thiết bị/trạng thái đang sửa.'}
          </span>
          <button className="ed-btn ed-btn--primary" disabled={!count} onClick={apply}>
            Áp dụng
          </button>
        </div>
      )}
    </div>
  )
}

// ======================= Khi bấm =======================

/** Hành động khi bấm vào cả phần tử: mở liên kết (gắn được {{trường}}), cuộn tới, mở Dialog, hiện Toast */
function ClickPanel({ node }: { node: BuilderNode }) {
  const root = useEditor((s) => s.root)
  const click = (node.props as AdvancedProps).click
  const action = click?.action ?? ''
  const set = (patch: Partial<ClickProps> | null, key?: string) => {
    const next = patch === null ? undefined : ({ ...(click ?? { action: 'link' }), ...patch } as ClickProps)
    useEditor.getState().updateProps(node.id, { click: next }, key)
  }
  // đích: phần tử có CSS ID (cuộn) hoặc block Dialog / Toast (tự gán CSS ID nếu chưa có)
  const targets: { id: string; cssId: string; label: string }[] = []
  walk(root, (n) => {
    if (n.id === node.id || n.type === 'root') return
    const cssId = (n.props as AdvancedProps).cssId ?? ''
    if (action === 'dialog' && n.type !== 'dialog') return
    if (action === 'toast' && n.type !== 'toast') return
    if (action === 'scroll' && !cssId) return
    targets.push({ id: n.id, cssId, label: nodeLabel(n) })
  })
  const pickTarget = (nodeId: string) => {
    const t = targets.find((x) => x.id === nodeId)
    if (!t) return set({ target: undefined })
    let cssId = t.cssId
    if (!cssId) {
      cssId = `${action === 'dialog' ? 'dlg' : 'toast'}-${t.id}`.replace(/[^A-Za-z0-9_-]/g, '')
      useEditor.getState().updateProps(t.id, { cssId })
    }
    set({ target: cssId })
  }
  const current = targets.find((t) => t.cssId && t.cssId === click?.target)
  return (
    <section className="ed-group" style={{ margin: '0 -12px', borderTop: '1px solid var(--ed-line)' }}>
      <div className="ed-fields" style={{ padding: '10px 12px' }}>
        <span className="ed-label">Khi bấm vào phần tử</span>
        <select
          className="ed-input"
          data-field="clickAction"
          value={action}
          onChange={(e) => (e.target.value ? set({ action: e.target.value as ClickAction, ...(e.target.value === click?.action ? {} : { target: undefined }) }) : set(null))}
        >
          <option value="">— Không làm gì —</option>
          {CLICK_ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        {action === 'link' && (
          <>
            <Field
              label="Liên kết"
              help="Bấm 🔗 để chọn trang/bài viết/sự kiện trong web, hoặc gõ /lien-he, #bang-gia, https://… Trong Danh sách dữ liệu bấm ⚡ để ghép trường, ví dụ /thanh-vien/{{id}}."
              picker={
                <span className="ed-pickers">
                  <LinkPicker onPick={(href) => set({ href })} />
                  <BindPicker node={node} onPick={(t) => set({ href: (click?.href ?? '') + t }, undefined)} />
                </span>
              }
            >
              <input className="ed-input" data-field="clickHref" value={click?.href ?? ''} placeholder="/duong-dan hoặc https://…" onChange={(e) => set({ href: e.target.value }, `click:${node.id}:href`)} />
            </Field>
            <label className="ed-toggle">
              <input type="checkbox" checked={!!click?.newTab} onChange={(e) => set({ newTab: e.target.checked || undefined })} />
              <span className="ed-toggle-ui" />
              <span>Mở trong tab mới</span>
            </label>
          </>
        )}
        {(action === 'scroll' || action === 'dialog' || action === 'toast') && (
          <Field
            label={action === 'scroll' ? 'Cuộn tới' : action === 'dialog' ? 'Hộp thoại cần mở' : 'Thông báo cần hiện'}
            help={
              action === 'scroll'
                ? 'Chỉ liệt kê phần tử đã có CSS ID (đặt ở tab Nâng cao của phần tử đích).'
                : `Chọn block ${action === 'dialog' ? 'Dialog' : 'Toast'} trên trang; CSS ID được tự đặt nếu chưa có. Có thể ẩn nút mở mặc định của block đó.`
            }
          >
            <select className="ed-input" data-field="clickTarget" value={current?.id ?? ''} onChange={(e) => pickTarget(e.target.value)}>
              <option value="">— Chọn —</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                  {t.cssId ? ` (#${t.cssId})` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}
        {action && (
          <Field label="Mô tả cho trình đọc màn hình (tuỳ chọn)">
            <input className="ed-input" value={click?.label ?? ''} placeholder="Ví dụ: Xem hồ sơ {{name}}" onChange={(e) => set({ label: e.target.value || undefined }, `click:${node.id}:label`)} />
          </Field>
        )}
        {action && <span className="ed-help">Trên canvas bấm vẫn chỉ để chọn phần tử; bấm “Xem trước” để thử hành động. Nút/link nằm bên trong vẫn hoạt động riêng.</span>}
      </div>
    </section>
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
      {canHaveClick(node.type) && <ClickPanel node={node} />}
      {node.type !== 'root' && <ShowPanel node={node} />}
      <p className="ed-hint">ID phần tử: <code>{node.id}</code></p>
    </div>
  )
}
