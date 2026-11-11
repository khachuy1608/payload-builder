'use client'

/**
 * Tab "Gợi ý": thư viện biến thể của phần tử đang chọn. Mỗi biến thể = chính node đó với preset áp dụng,
 * render bằng cùng renderer + theme trong MỘT iframe; bấm vào biến thể để áp dụng (hoàn tác được).
 * Gồm preset có sẵn (src/builder/presets.ts) và "Gợi ý của tôi" (collection style-presets).
 */
import { Bookmark, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { compileTreeCss } from '@/builder/css'
import { resolveData } from '@/builder/data'
import { applyPreset, type BlockPreset, getPresets } from '@/builder/presets'
import { resolveRefs } from '@/builder/refs'
import { getBlock } from '@/builder/registry'
import { RenderNode } from '@/builder/Renderer'
import { getSchema } from '@/builder/schema'
import { BASE_CSS, themeToCss } from '@/builder/theme'
import type { BuilderNode } from '@/builder/types'
import { createMyPreset, deleteMyPreset, listMyPresets, type MyPreset } from './api'
import { handleShortcut } from './shortcuts'
import { type BlockScope, blockLookup, effectiveTheme, useEditor } from './store'

const DOC = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>${BASE_CSS}html,body{overflow-x:hidden;background:transparent}body{padding:4px 6px 12px}.bld-root{min-height:0}
.pg-item{border:1px solid #e4e6eb;border-radius:8px;margin:0 0 8px;background:#fff;cursor:pointer;overflow:hidden;transition:border-color .15s,box-shadow .15s}
.pg-item:hover{border-color:#4f46e5;box-shadow:0 2px 10px rgba(79,70,229,.15)}
.pg-item.is-active{border-color:#4f46e5;box-shadow:inset 0 0 0 1px #4f46e5}
.pg-head{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 10px;font:11px/1.3 system-ui,sans-serif;color:#4b5466;background:#f7f8fa;border-bottom:1px solid #eef0f3}
.pg-group{font:600 11px/1.3 system-ui,sans-serif;color:#8a93a5;text-transform:uppercase;letter-spacing:.06em;margin:10px 2px 6px}
.pg-body{padding:12px;display:flex;justify-content:center;align-items:center;min-height:52px;overflow:hidden}
.pg-body.is-wide>*{width:100%}
.pg-body.is-zoom{zoom:.5;padding:16px}
.pg-body [data-fx-reveal]{opacity:1}
</style></head><body><div id="m"></div></body></html>`

const WIDE = new Set(['div', 'flexbox', 'card', 'masonry', 'bento', 'marquee', 'carousel', 'accordion', 'header', 'dataList', 'form', 'dataTable', 'timeline', 'steps', 'alert', 'skeleton', 'emptyState', 'signInForm', 'searchBox', 'tabs', 'lightbox', 'bottomNav', 'breadcrumbs', 'pagination', 'scrollspy', 'chart', 'slide', 'tab', 'formField', 'progress', 'youtube', 'image'])
const ZOOM = new Set(['div', 'flexbox', 'card', 'masonry', 'bento', 'carousel', 'accordion', 'header', 'dataList', 'form', 'signInForm', 'emptyState', 'dataTable', 'chart', 'timeline', 'tabs', 'lightbox', 'bento', 'slide', 'marquee'])

export function PresetGallery({ node }: { node: BuilderNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [mine, setMine] = useState<MyPreset[] | null>(null)
  const [applied, setApplied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const blocks = useEditor((s) => s.blocks)
  const dataCache = useEditor((s) => s.dataCache)
  const theme = useEditor(effectiveTheme)
  const userId = useEditor((s) => s.userId)
  const builtin = getPresets(node.type)
  const all = useMemo(() => [...(mine ?? []), ...builtin], [mine, builtin])

  useEffect(() => {
    setMine(null)
    listMyPresets(node.type)
      .then(setMine)
      .catch(() => setMine([]))
  }, [node.type])

  const attach = () => {
    const doc = iframeRef.current?.contentDocument
    const m = doc?.getElementById('m')
    if (m && doc?.readyState === 'complete') setMount(m)
  }
  useEffect(() => {
    if (!mount) attach()
  })

  // biến thể = node với preset áp dụng; id khác nhau để CSS không trùng
  const variants = useMemo(
    () =>
      all.map((p, i) => {
        const base = applyPreset(node, p)
        const withId: BuilderNode = { ...base, id: `pv${i}` }
        const resolved = resolveData(resolveRefs(withId, blockLookup(blocks)), (id) => dataCache[id === `pv${i}` ? node.id : id])
        return { preset: p, node: resolved }
      }),
    [all, node, blocks, dataCache],
  )
  const css = useMemo(() => themeToCss(theme) + variants.map((v) => compileTreeCss(v.node)).join('\n'), [variants, theme])

  // click trong iframe -> áp dụng
  useEffect(() => {
    if (!mount) return
    const doc = mount.ownerDocument
    const onClick = (e: MouseEvent) => {
      e.preventDefault()
      const item = (e.target as HTMLElement).closest<HTMLElement>('.pg-item')
      const id = item?.dataset.preset
      const preset = id ? all.find((p) => p.id === id) : undefined
      if (preset) {
        useEditor.getState().applyPreset(node.id, preset)
        setApplied(preset.id)
      }
    }
    doc.addEventListener('click', onClick, true)
    doc.addEventListener('keydown', handleShortcut) // Ctrl+Z… vẫn hoạt động khi focus nằm trong iframe gợi ý
    return () => {
      doc.removeEventListener('click', onClick, true)
      doc.removeEventListener('keydown', handleShortcut)
    }
  }, [mount, all, node.id])

  // chiều cao iframe theo nội dung
  useEffect(() => {
    if (!mount) return
    const frame = iframeRef.current
    const ro = new ResizeObserver(() => {
      if (frame) frame.style.height = `${mount.ownerDocument.body.scrollHeight + 8}px`
    })
    ro.observe(mount)
    return () => ro.disconnect()
  }, [mount])

  const save = async () => {
    const name = prompt('Tên gợi ý (kiểu hiện tại của phần tử này):', `${getBlock(node.type)?.label ?? node.type} của tôi`)
    if (!name) return
    const shared = confirm('Dùng chung cho mọi editor? (Huỷ = riêng tôi)')
    setSaving(true)
    try {
      const def = getBlock(node.type)
      const contentProps = new Set(['text', 'href', 'media', 'data', 'show', 'fx', 'items', 'links', 'cssId', 'cssClass', 'hide', 'blockId', 'name', 'condHidden', 'newTab', 'title', 'tag'])
      const props = Object.fromEntries(Object.entries(node.props).filter(([k, v]) => !contentProps.has(k) && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')))
      const created = await createMyPreset({ name, blockType: node.type, scope: (shared ? 'shared' : 'private') as BlockScope, props, styles: node.styles })
      setMine((m) => [created, ...(m ?? [])])
      useEditor.getState().toast('success', `Đã lưu gợi ý “${name}” cho ${def?.label ?? node.type}.`)
    } catch (err) {
      useEditor.getState().toast('error', `Lưu gợi ý thất bại: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }
  const remove = async (p: MyPreset) => {
    if (!confirm(`Xoá gợi ý “${p.label}”?`)) return
    try {
      await deleteMyPreset(p.docId)
      setMine((m) => (m ?? []).filter((x) => x.docId !== p.docId))
    } catch (err) {
      useEditor.getState().toast('error', (err as Error).message)
    }
  }

  const groups = [...new Set(all.map((p) => p.group ?? 'Gợi ý'))]
  const wide = WIDE.has(node.type)
  const zoom = ZOOM.has(node.type) || !!getSchema(node.type)?.isContainer

  return (
    <div className="ed-presets">
      <div className="ed-row" style={{ padding: '10px 12px 0' }}>
        <span className="ed-help" style={{ flex: 1 }}>
          {all.length} gợi ý cho <b>{getBlock(node.type)?.label}</b>. Bấm để áp dụng (Ctrl+Z hoàn tác); chữ, link, ảnh giữ nguyên.
        </span>
        <button className="ed-btn" title="Lưu kiểu hiện tại của phần tử thành gợi ý để dùng lại" disabled={saving} onClick={save}>
          {saving ? <Loader2 size={14} className="ed-spin" /> : <Bookmark size={14} />} Lưu kiểu này
        </button>
      </div>
      {mine && mine.length > 0 && (
        <div className="ed-presets-mine">
          {mine.map((p) => (
            <span key={p.docId} className="ed-chip">
              {p.label}
              {p.scope === 'shared' && ' · chung'}
              {(p.owner === null || p.owner === userId) && (
                <button className="ed-chip-x" title="Xoá gợi ý" onClick={() => remove(p)}>
                  <Trash2 size={11} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {!all.length && <p className="ed-hint">Chưa có gợi ý cho loại này. Chỉnh kiểu rồi bấm “Lưu kiểu này”.</p>}
      <iframe ref={iframeRef} title="Gợi ý" srcDoc={DOC} className="ed-presets-frame" onLoad={attach} />
      {mount &&
        createPortal(
          <>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            {groups.map((g) => (
              <div key={g}>
                <div className="pg-group">{g}</div>
                {variants
                  .filter((v) => (v.preset.group ?? 'Gợi ý') === g)
                  .map((v) => (
                    <div key={v.preset.id} className={`pg-item${applied === v.preset.id ? ' is-active' : ''}`} data-preset={v.preset.id} title="Bấm để áp dụng">
                      <div className="pg-head">
                        <span>{v.preset.label}</span>
                        {applied === v.preset.id && <span style={{ color: '#4f46e5' }}>Đã áp dụng</span>}
                      </div>
                      <div className={`pg-body${wide ? ' is-wide' : ''}${zoom ? ' is-zoom' : ''}`}>
                        <RenderNode node={v.node} mode="live" />
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </>,
          mount,
        )}
    </div>
  )
}
