'use client'

/**
 * Lớp phủ vẽ phía trên iframe: viền hover, viền chọn + thanh công cụ, vạch chỉ vị trí thả.
 * Toạ độ đọc bằng getBoundingClientRect trong iframe mỗi frame (rAF) nên luôn đúng khi cuộn/đổi layout.
 */
import { ArrowUp, BookmarkPlus, Copy, GripVertical, Trash2, Unlink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { canSaveAsBlock } from '@/builder/schema'
import { findNode, findParent } from '@/builder/tree'
import { nodeLabel } from './labels'
import { type Rect, useEditor } from './store'

interface Boxes {
  hover: Rect | null
  selected: Rect | null
}

function measure(doc: Document, id: string | null): Rect | null {
  if (!id) return null
  const el = doc.querySelector(`[data-node-id="${id}"]`)
  if (!el || (el as HTMLElement).offsetParent === null && id !== 'root') return null
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

const same = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h)

export function Overlay({ doc }: { doc: Document }) {
  const hoveredId = useEditor((s) => s.hoveredId)
  const selectedId = useEditor((s) => s.selectedId)
  const editingId = useEditor((s) => s.editingId)
  const drag = useEditor((s) => s.drag)
  const drop = useEditor((s) => s.drop)
  const root = useEditor((s) => s.root)
  const [boxes, setBoxes] = useState<Boxes>({ hover: null, selected: null })

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const next = { hover: measure(doc, hoveredId), selected: measure(doc, selectedId) }
      setBoxes((prev) => (same(prev.hover, next.hover) && same(prev.selected, next.selected) ? prev : next))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [doc, hoveredId, selectedId])

  const selectedNode = selectedId ? findNode(root, selectedId) : null
  const hoverNode = hoveredId && hoveredId !== selectedId ? findNode(root, hoveredId) : null
  const s = useEditor.getState()

  return (
    <div className="ed-overlay">
      {boxes.hover && hoverNode && !drag && (
        <div className={`ed-box ed-box--hover${hoverNode.type === 'blockRef' ? ' ed-box--linked' : ''}`} style={rectStyle(boxes.hover)}>
          <span className="ed-box-tag">{nodeLabel(hoverNode)}</span>
        </div>
      )}

      {boxes.selected && selectedNode && (
        <div
          className={`ed-box ed-box--selected${editingId ? ' is-editing' : ''}${selectedNode.type === 'blockRef' ? ' ed-box--linked' : ''}`}
          style={rectStyle(boxes.selected)}
        >
          {!drag && !editingId && selectedNode.type !== 'root' && (
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
              <span className="ed-toolbar-label">{nodeLabel(selectedNode)}</span>
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
