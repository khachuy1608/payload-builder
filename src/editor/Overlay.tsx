'use client'

/**
 * Lớp phủ vẽ phía trên iframe: viền hover, viền chọn + thanh công cụ, vạch chỉ vị trí thả.
 * Toạ độ đọc bằng getBoundingClientRect trong iframe mỗi frame (rAF) nên luôn đúng khi cuộn/đổi layout.
 */
import { ArrowUp, BookmarkPlus, Copy, Database, Eye, EyeOff, ExternalLink, GripVertical, Trash2, Unlink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getBlock } from '@/builder/registry'
import { canSaveAsBlock } from '@/builder/schema'
import { SITE_PART_LABELS, sitePartNode, sitePartOf } from '@/builder/siteParts'
import { findNode, findParent } from '@/builder/tree'
import { type ViewStateInfo, viewStateInfo } from '@/builder/viewState'
import { nodeLabel } from './labels'
import { RichToolbar } from './RichToolbar'
import { type Rect, useEditor } from './store'

interface Boxes {
  hover: Rect | null
  selected: Rect | null
  /** padding đã tính (px) của phần tử đang chọn – để đặt tay cầm */
  pad: { t: number; r: number; b: number; l: number } | null
}

type HandleKind = 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft' | 'width' | 'height'

/** Tay cầm kéo: padding 4 phía (thanh ở mép trong), rộng (mép phải), cao (mép dưới). Kéo ghi style theo thiết bị đang chọn. */
function Handles({ doc, id, rect, pad }: { doc: Document; id: string; rect: Rect; pad: NonNullable<Boxes['pad']> }) {
  const [live, setLive] = useState<{ kind: HandleKind; value: number } | null>(null)
  const start = (kind: HandleKind) => (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    // khung có thể bị thu nhỏ (transform scale) -> quy đổi delta chuột về px của canvas
    const overlay = el.closest('.ed-overlay') as HTMLElement
    const scale = overlay ? overlay.getBoundingClientRect().width / (overlay.offsetWidth || 1) : 1
    const origin = { x: e.clientX, y: e.clientY }
    const base = kind === 'width' ? rect.w : kind === 'height' ? rect.h : kind === 'paddingTop' ? pad.t : kind === 'paddingRight' ? pad.r : kind === 'paddingBottom' ? pad.b : pad.l
    const sign = kind === 'paddingRight' || kind === 'paddingLeft' ? (kind === 'paddingLeft' ? 1 : -1) : kind === 'paddingBottom' ? -1 : 1
    const axis = kind === 'width' || kind === 'paddingLeft' || kind === 'paddingRight' ? 'x' : 'y'
    const move = (ev: PointerEvent) => {
      const delta = ((axis === 'x' ? ev.clientX - origin.x : ev.clientY - origin.y) / scale) * (kind === 'width' || kind === 'height' ? 1 : sign)
      const value = Math.max(0, Math.round((base + delta) / (ev.shiftKey ? 8 : 1)) * (ev.shiftKey ? 8 : 1))
      setLive({ kind, value })
      useEditor.getState().setStyle(id, kind, `${value}px`)
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      setLive(null)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }
  const LABEL: Record<HandleKind, string> = { paddingTop: 'Lề trong trên', paddingRight: 'Lề trong phải', paddingBottom: 'Lề trong dưới', paddingLeft: 'Lề trong trái', width: 'Rộng', height: 'Cao' }
  const big = rect.w > 60 && rect.h > 24
  return (
    <>
      {big && (
        <>
          <span className="ed-handle ed-handle--pad ed-handle--y" style={{ left: rect.w / 2 - 14, top: pad.t - 2 }} title="Kéo: lề trong trên (Shift: bước 8px)" onPointerDown={start('paddingTop')} data-handle="paddingTop" />
          <span className="ed-handle ed-handle--pad ed-handle--y" style={{ left: rect.w / 2 - 14, top: rect.h - pad.b - 3 }} title="Kéo: lề trong dưới" onPointerDown={start('paddingBottom')} data-handle="paddingBottom" />
          <span className="ed-handle ed-handle--pad ed-handle--x" style={{ top: rect.h / 2 - 14, left: pad.l - 2 }} title="Kéo: lề trong trái" onPointerDown={start('paddingLeft')} data-handle="paddingLeft" />
          <span className="ed-handle ed-handle--pad ed-handle--x" style={{ top: rect.h / 2 - 14, left: rect.w - pad.r - 3 }} title="Kéo: lề trong phải" onPointerDown={start('paddingRight')} data-handle="paddingRight" />
        </>
      )}
      <span className="ed-handle ed-handle--size ed-handle--x" style={{ top: rect.h / 2 - 14, left: rect.w - 4 }} title="Kéo: chiều rộng" onPointerDown={start('width')} data-handle="width" />
      <span className="ed-handle ed-handle--size ed-handle--y" style={{ left: rect.w / 2 - 14, top: rect.h - 4 }} title="Kéo: chiều cao" onPointerDown={start('height')} data-handle="height" />
      {live && (
        <span className="ed-handle-tip">
          {LABEL[live.kind]}: {live.value}px
        </span>
      )}
    </>
  )
}

function padOf(doc: Document, id: string | null): Boxes['pad'] {
  if (!id) return null
  const el = doc.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null
  if (!el) return null
  const cs = doc.defaultView!.getComputedStyle(el)
  return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 }
}

function measure(doc: Document, id: string | null): Rect | null {
  if (!id) return null
  const el = doc.querySelector(`[data-node-id="${id}"]`)
  if (!el || (el as HTMLElement).offsetParent === null && id !== 'root') return null
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

const samePad = (a: Boxes['pad'], b: Boxes['pad']) => a === b || (!!a && !!b && a.t === b.t && a.r === b.r && a.b === b.b && a.l === b.l)
const same = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h)

export function Overlay({ doc }: { doc: Document }) {
  const hoveredId = useEditor((s) => s.hoveredId)
  const selectedId = useEditor((s) => s.selectedId)
  const editingId = useEditor((s) => s.editingId)
  const drag = useEditor((s) => s.drag)
  const drop = useEditor((s) => s.drop)
  const root = useEditor((s) => s.root)
  const [boxes, setBoxes] = useState<Boxes>({ hover: null, selected: null, pad: null })

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const next: Boxes = { hover: measure(doc, hoveredId), selected: measure(doc, selectedId), pad: padOf(doc, selectedId) }
      setBoxes((prev) => (same(prev.hover, next.hover) && same(prev.selected, next.selected) && samePad(prev.pad, next.pad) ? prev : next))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [doc, hoveredId, selectedId])

  const siteParts = useEditor((s) => s.siteParts)
  const comments = useEditor((s) => s.comments)
  const commentCount = (id: string) => comments.filter((c) => !c.resolved && c.nodeId === id).length
  // header/footer toàn site không nằm trong cây của store: dựng node tạm để hiện nhãn/khung
  const nodeOf = (id: string | null) => {
    if (!id) return null
    const part = sitePartOf(id)
    if (part) return siteParts[part] ? sitePartNode(part, siteParts[part]!) : null
    return findNode(root, id)
  }
  const selectedNode = nodeOf(selectedId)
  const hoverNode = hoveredId && hoveredId !== selectedId ? nodeOf(hoveredId) : null
  const selectedPart = sitePartOf(selectedId)
  const s = useEditor.getState()

  return (
    <div className="ed-overlay">
      {boxes.hover && hoverNode && !drag && (
        <div className={`ed-box ed-box--hover${hoverNode.type === 'blockRef' ? ' ed-box--linked' : ''}`} style={rectStyle(boxes.hover)}>
          <span className="ed-box-tag">{sitePartOf(hoverNode.id) ? SITE_PART_LABELS[sitePartOf(hoverNode.id)!] : nodeLabel(hoverNode)}</span>
        </div>
      )}

      {boxes.selected && selectedNode && (
        <div
          className={`ed-box ed-box--selected${editingId ? ' is-editing' : ''}${selectedNode.type === 'blockRef' ? ' ed-box--linked' : ''}`}
          style={rectStyle(boxes.selected)}
        >
          {editingId === selectedNode.id && getBlock(selectedNode.type)?.inlineEdit?.rich && (
            <div className={`ed-toolbar ed-toolbar--rich${boxes.selected.y < 30 ? ' ed-toolbar--inside' : ''}`}>
              <RichToolbar exec={(cmd, value) => doc.execCommand(cmd, false, value)} />
              <span className="ed-toolbar-label">Ctrl+Enter để xong · Esc huỷ</span>
            </div>
          )}
          {selectedPart && !drag && (
            <div className={`ed-toolbar${boxes.selected.y < 30 ? ' ed-toolbar--inside' : ''}`}>
              <span className="ed-toolbar-label">{SITE_PART_LABELS[selectedPart]}</span>
              <a className="ed-tool" title="Sửa bản gốc của block (tab mới)" href={`/builder/block/${siteParts[selectedPart]}`} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
              </a>
              <button className="ed-tool" title="Ẩn trên trang này" onClick={() => s.setLayout(selectedPart === 'header' ? { hideHeader: true } : { hideFooter: true })}>
                <EyeOff size={14} />
              </button>
            </div>
          )}
          {!selectedPart && !drag && !editingId && selectedNode.type !== 'root' && selectedNode.type !== 'blockRef' && boxes.pad && (
            <Handles doc={doc} id={selectedNode.id} rect={boxes.selected} pad={boxes.pad} />
          )}
          {!selectedPart && !drag && !editingId && selectedNode.type !== 'root' && (
            <div className={`ed-toolbar${boxes.selected.y < 30 ? ' ed-toolbar--inside' : ''}`}>
              <span
                className="ed-tool ed-tool--grip"
                draggable
                title="Kéo để di chuyển"
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', selectedNode.id)
                  e.dataTransfer.effectAllowed = 'move'
                  s.startDrag({ kind: 'move', nodeId: selectedNode.id })
                }}
                onDragEnd={() => useEditor.getState().endDrag()}
              >
                <GripVertical size={14} />
              </span>
              <span className="ed-toolbar-label">
                {nodeLabel(selectedNode)}
                {commentCount(selectedNode.id) > 0 && ` · 💬 ${commentCount(selectedNode.id)}`}
              </span>
              {viewStateInfo(selectedNode) && (
                <ViewStateToggle id={selectedNode.id} info={viewStateInfo(selectedNode)!} />
              )}
              {findParent(root, selectedNode.id)?.parent.id !== 'root' && (
                <button className="ed-tool" title="Chọn phần tử cha" onClick={() => s.select(findParent(root, selectedNode.id)!.parent.id)}>
                  <ArrowUp size={14} />
                </button>
              )}
              <button className="ed-tool" title="Nhân bản (Ctrl+D)" onClick={() => s.duplicate(selectedNode.id)}>
                <Copy size={14} />
              </button>
              {canSaveAsBlock(selectedNode.type) && (
                <button className="ed-tool" title="Lưu thành My Block" onClick={() => s.openSaveBlock(selectedNode.id)}>
                  <BookmarkPlus size={14} />
                </button>
              )}
              {selectedNode.type === 'blockRef' && (
                <button className="ed-tool" title="Tách khỏi block gốc (thành bản sao độc lập)" onClick={() => s.detach(selectedNode.id)}>
                  <Unlink size={14} />
                </button>
              )}
              {selectedNode.type !== 'blockRef' && selectedNode.type !== 'dataList' && (
                <button className="ed-tool" title="Lặp theo dữ liệu: dùng phần tử này làm mẫu cho một Danh sách dữ liệu" onClick={() => s.wrapInDataList(selectedNode.id)}>
                  <Database size={14} />
                </button>
              )}
              <button className="ed-tool" title="Xoá (Delete)" onClick={() => s.remove(selectedNode.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {drag && drop && <div className={`ed-drop ed-drop--${drop.variant}`} style={rectStyle(drop.rect)} />}
    </div>
  )
}

function rectStyle(r: Rect) {
  return { transform: `translate(${r.x}px, ${r.y}px)`, width: r.w, height: r.h }
}

/** Nút trên thanh công cụ: đổi nhanh trạng thái xem Đóng / Mở của block tương tác (ghim trên canvas) */
function ViewStateToggle({ id, info }: { id: string; info: ViewStateInfo }) {
  const pinned = useEditor((s) => s.viewStates[id])
  const current = pinned ?? 'open'
  const next = current === 'open' ? 'closed' : 'open'
  return (
    <button
      className={`ed-tool ed-tool--view${current === 'open' ? ' is-active' : ''}`}
      data-view-toggle={current}
      title={`Đang xem: ${info[current]} – bấm để xem “${info[next]}”`}
      aria-label={`Xem trạng thái ${info[next]}`}
      onClick={() => useEditor.getState().setViewState(id, next)}
    >
      {current === 'open' ? <Eye size={14} /> : <EyeOff size={14} />}
    </button>
  )
}
