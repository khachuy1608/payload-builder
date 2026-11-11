'use client'

/**
 * Hộp thoại "Quản lý theme": danh sách preset + My Themes, nhân bản preset, chỉnh token (xem trực tiếp trên canvas),
 * đặt theme cho site hoặc ghi đè cho trang đang sửa.
 */
import { Check, Copy, Loader2, Lock, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  BUTTON_TOKEN_LABELS,
  COLOR_KEYS,
  COLOR_TOKEN_LABELS,
  FONT_KEYS,
  FONT_PRESETS,
  FONT_TOKEN_LABELS,
  RADIUS_KEYS,
  RADIUS_TOKEN_LABELS,
  type ThemeTokens,
  normalizeTheme,
} from '@/builder/theme'
import { createTheme, deleteTheme, setSiteTheme, updateTheme } from './api'
import { type ThemeDoc, useEditor } from './store'

export function ThemeDialog() {
  const themes = useEditor((s) => s.themes)
  const siteThemeId = useEditor((s) => s.siteThemeId)
  const pageThemeId = useEditor((s) => s.pageThemeId)
  const kind = useEditor((s) => s.kind)
  const userId = useEditor((s) => s.userId)
  const status = useEditor((s) => s.themesStatus)
  const s = useEditor.getState

  const [selectedId, setSelectedId] = useState<string | null>(pageThemeId ?? siteThemeId)
  const [draft, setDraft] = useState<{ name: string; tokens: ThemeTokens } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const list = useMemo(() => Object.values(themes).sort((a, b) => a.name.localeCompare(b.name)), [themes])
  const presets = list.filter((t) => t.isPreset)
  const mine = list.filter((t) => !t.isPreset)
  const selected = selectedId ? themes[selectedId] : undefined
  const editable = !!selected && !selected.isPreset && (selected.owner === null || selected.owner === userId)

  // chọn theme -> nạp bản nháp + xem thử trên canvas
  useEffect(() => {
    if (!selected) {
      setDraft(null)
      s().setThemePreview(null)
      return
    }
    setDraft({ name: selected.name, tokens: structuredClone(selected.tokens) })
    setDirty(false)
    s().setThemePreview(selected.tokens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.updatedAt])

  const close = () => {
    if (dirty && !confirm('Bỏ các thay đổi chưa lưu của theme?')) return
    s().openThemeDialog(false)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty])

  const patch = (fn: (t: ThemeTokens) => void) => {
    if (!draft) return
    const tokens = structuredClone(draft.tokens)
    fn(tokens)
    setDraft({ ...draft, tokens })
    setDirty(true)
    s().setThemePreview(normalizeTheme(tokens, draft.tokens))
  }

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try {
      await fn()
    } catch (err) {
      s().toast('error', (err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const duplicate = (t: ThemeDoc) =>
    run('dup', async () => {
      const created = await createTheme(`${t.name} (bản sao)`, t.tokens)
      s().upsertTheme(created)
      setSelectedId(created.id)
      s().toast('success', `Đã tạo “${created.name}”. Giờ bạn có thể chỉnh nó.`)
    })

  const save = () =>
    run('save', async () => {
      if (!selected || !draft) return
      const name = draft.name.trim() || selected.name
      const updated = await updateTheme(selected.id, name, normalizeTheme(draft.tokens, selected.tokens))
      s().upsertTheme(updated)
      setDirty(false)
      s().toast('success', 'Đã lưu theme. Trang nào dùng theme này sẽ đổi theo.')
    })

  const useForSite = (t: ThemeDoc) =>
    run('site', async () => {
      await setSiteTheme(t.id)
      s().setSiteThemeId(t.id)
      s().toast('success', `“${t.name}” là theme của site.`)
    })

  const remove = (t: ThemeDoc) =>
    run('del', async () => {
      if (!confirm(`Xoá theme “${t.name}”? Trang/site đang dùng sẽ quay về theme mặc định.`)) return
      await deleteTheme(t.id)
      s().removeTheme(t.id)
      if (selectedId === t.id) setSelectedId(s().siteThemeId)
      s().toast('success', 'Đã xoá theme.')
    })

  const Row = ({ t }: { t: ThemeDoc }) => (
    <button className={`ed-theme-row${selectedId === t.id ? ' is-active' : ''}`} onClick={() => (dirty && !confirm('Bỏ thay đổi chưa lưu?') ? null : setSelectedId(t.id))}>
      <span className="ed-theme-swatches">
        {['primary', 'secondary', 'accent', 'surface'].map((k) => (
          <i key={k} style={{ background: t.tokens.colors[k] }} />
        ))}
      </span>
      <span className="ed-theme-name">
        {t.name}
        {t.isPreset && <Lock size={11} />}
      </span>
      {siteThemeId === t.id && <span className="ed-chip">Site</span>}
      {pageThemeId === t.id && <span className="ed-chip">Trang này</span>}
    </button>
  )

  return (
    <div className="ed-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="ed-modal ed-modal--lg" role="dialog" aria-label="Quản lý theme">
        <header className="ed-modal-head">
          <strong>Quản lý theme</strong>
          <span className="ed-help">Màu, font, bo góc và kiểu nút cho cả site. Chọn một theme để xem thử ngay trên canvas.</span>
          <button className="ed-icon-btn" onClick={close} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        <div className="ed-theme-layout">
          <aside className="ed-theme-list">
            {status === 'loading' && <Loader2 size={16} className="ed-spin" />}
            <span className="ed-label">Preset</span>
            {presets.map((t) => (
              <Row key={t.id} t={t} />
            ))}
            <span className="ed-label" style={{ marginTop: 10 }}>
              My Themes
            </span>
            {mine.map((t) => (
              <Row key={t.id} t={t} />
            ))}
            {!mine.length && status === 'ready' && <span className="ed-help">Chưa có. Chọn một preset rồi bấm “Nhân bản”.</span>}
          </aside>

          <section className="ed-theme-editor">
            {!selected || !draft ? (
              <p className="ed-hint">Chọn một theme bên trái.</p>
            ) : (
              <>
                <div className="ed-row ed-theme-actions">
                  <button className="ed-btn ed-btn--primary" disabled={busy !== null || siteThemeId === selected.id} onClick={() => useForSite(selected)}>
                    {siteThemeId === selected.id ? <Check size={14} /> : null} {siteThemeId === selected.id ? 'Đang là theme của site' : 'Dùng cho cả site'}
                  </button>
                  {kind === 'page' && (
                    <button className="ed-btn" disabled={busy !== null} onClick={() => s().setPageTheme(pageThemeId === selected.id ? null : selected.id)}>
                      {pageThemeId === selected.id ? 'Bỏ ghi đè cho trang này' : 'Chỉ dùng cho trang này'}
                    </button>
                  )}
                  <button className="ed-btn" disabled={busy !== null} onClick={() => duplicate(selected)}>
                    <Copy size={14} /> Nhân bản
                  </button>
                  {editable && (
                    <button className="ed-btn" disabled={busy !== null} onClick={() => remove(selected)} title="Xoá theme">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {!editable && (
                  <p className="ed-hint" style={{ margin: '0 0 4px' }}>
                    {selected.isPreset ? 'Preset chỉ đọc. Bấm “Nhân bản” để tạo My Theme và chỉnh thoải mái.' : 'Theme của người khác – chỉ xem.'}
                  </p>
                )}
                <fieldset className="ed-theme-fields" disabled={!editable}>
                  <label className="ed-field">
                    <span className="ed-label">Tên theme</span>
                    <input className="ed-input" value={draft.name} onChange={(e) => (setDraft({ ...draft, name: e.target.value }), setDirty(true))} />
                  </label>

                  <span className="ed-label ed-theme-h">Màu</span>
                  <div className="ed-theme-grid">
                    {COLOR_KEYS.map((k) => (
                      <label key={k} className="ed-theme-color">
                        <input type="color" value={/^#[0-9a-f]{6}$/i.test(draft.tokens.colors[k]) ? draft.tokens.colors[k] : '#000000'} onChange={(e) => patch((t) => (t.colors[k] = e.target.value))} />
                        <span>
                          <b>{COLOR_TOKEN_LABELS[k]}</b>
                          <input className="ed-input" value={draft.tokens.colors[k]} onChange={(e) => patch((t) => (t.colors[k] = e.target.value))} />
                        </span>
                      </label>
                    ))}
                  </div>

                  <span className="ed-label ed-theme-h">Font</span>
                  {FONT_KEYS.map((k) => (
                    <div key={k} className="ed-sfield">
                      <span className="ed-label">{FONT_TOKEN_LABELS[k]}</span>
                      <div className="ed-row">
                        <select className="ed-input" value={FONT_PRESETS.some((f) => f.value === draft.tokens.fonts[k]) ? draft.tokens.fonts[k] : '__custom'} onChange={(e) => e.target.value !== '__custom' && patch((t) => (t.fonts[k] = e.target.value))}>
                          {FONT_PRESETS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                          <option value="__custom">Tuỳ chỉnh…</option>
                        </select>
                        <input className="ed-input" value={draft.tokens.fonts[k]} onChange={(e) => patch((t) => (t.fonts[k] = e.target.value))} />
                      </div>
                    </div>
                  ))}
                  <label className="ed-field">
                    <span className="ed-label">Stylesheet font ngoài (https, ví dụ Google Fonts)</span>
                    <input className="ed-input" placeholder="https://fonts.googleapis.com/css2?family=Inter&display=swap" value={draft.tokens.fontUrl ?? ''} onChange={(e) => patch((t) => (t.fontUrl = e.target.value))} />
                  </label>

                  <span className="ed-label ed-theme-h">Bo góc</span>
                  <div className="ed-row">
                    {RADIUS_KEYS.map((k) => (
                      <label key={k} className="ed-field" style={{ flex: 1 }}>
                        <span className="ed-help">{RADIUS_TOKEN_LABELS[k]}</span>
                        <input className="ed-input" value={draft.tokens.radius[k]} onChange={(e) => patch((t) => (t.radius[k] = e.target.value))} />
                      </label>
                    ))}
                  </div>

                  <span className="ed-label ed-theme-h">Kiểu nút</span>
                  <div className="ed-row">
                    <label className="ed-field" style={{ flex: 1 }}>
                      <span className="ed-help">{BUTTON_TOKEN_LABELS.radius}</span>
                      <input className="ed-input" value={draft.tokens.button.radius} onChange={(e) => patch((t) => (t.button.radius = e.target.value))} />
                    </label>
                    <label className="ed-field" style={{ flex: 1 }}>
                      <span className="ed-help">{BUTTON_TOKEN_LABELS.weight}</span>
                      <select className="ed-input" value={draft.tokens.button.weight} onChange={(e) => patch((t) => (t.button.weight = e.target.value))}>
                        {['400', '500', '600', '700', '800'].map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="ed-field" style={{ flex: 1 }}>
                      <span className="ed-help">{BUTTON_TOKEN_LABELS.transform}</span>
                      <select className="ed-input" value={draft.tokens.button.transform} onChange={(e) => patch((t) => (t.button.transform = e.target.value))}>
                        <option value="none">Bình thường</option>
                        <option value="uppercase">IN HOA</option>
                        <option value="capitalize">Viết Hoa Đầu</option>
                      </select>
                    </label>
                  </div>
                </fieldset>
              </>
            )}
          </section>
        </div>
        <footer className="ed-modal-foot ed-modal-foot--right">
          {dirty && <span className="ed-help" style={{ marginRight: 'auto' }}>Đang xem thử thay đổi trên canvas – chưa lưu.</span>}
          <button className="ed-btn" onClick={close}>
            Đóng
          </button>
          <button className="ed-btn ed-btn--primary" disabled={!editable || !dirty || busy !== null} onClick={save}>
            {busy === 'save' && <Loader2 size={15} className="ed-spin" />} Lưu theme
          </button>
        </footer>
      </div>
    </div>
  )
}
