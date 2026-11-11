'use client'

import { ChevronDown, ChevronRight, Layers, LayoutGrid, Search } from 'lucide-react'
import { useState } from 'react'
import { BLOCK_CATEGORIES, BLOCKS, getBlock } from '@/builder/registry'
import { getSchema } from '@/builder/schema'
import { getAncestors } from '@/builder/tree'
import type { BuilderNode, DropTarget } from '@/builder/types'
import { canDropAt, useEditor } from './store'

export function LeftPanel() {
  const tab = useEditor((s) => s.leftTab)
  const setTab = useEditor((s) => s.setLeftTab)
  return (
    <aside className="ed-left">
      <div className="ed-tabs">
        <button className={tab === 'elements' ? 'is-active' : ''} onClick={() => setTab('elements')}>
          <LayoutGrid size={15} /> Phần tử
        </button>
        <button className={tab === 'navigator' ? 'is-active' : ''} onClick={() => setTab('navigator')}>
          <Layers size={15} /> Cấu trúc
        </button>
      </div>
      <div className="ed-left-body">{tab === 'elements' ? <ElementsPanel /> : <Navigator />}</div>
    </aside>
  )
}

// ---------------- Elements ----------------

function ElementsPanel() {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const q = query.trim().toLowerCase()
  const blocks = Object.values(BLOCKS).filter((b) => !getSchema(b.type)?.hidden && (!q || b.label.toLowerCase().includes(q) || b.type.includes(q)))

  return (
    <div className="ed-elements">
      <label className="ed-search">
        <Search size={14} />
        <input placeholder="Tìm phần tử..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {BLOCK_CATEGORIES.map((cat) => {
        const items = blocks.filter((b) => b.category === cat.id)
        if (!items.length) return null
        const isCollapsed = collapsed[cat.id] && !q
        return (
          <section key={cat.id} className="ed-cat">
            <button className="ed-cat-title" onClick={() => setCollapsed((c) => ({ ...c, [cat.id]: !c[cat.id] }))}>
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />} {cat.label}
            </button>
            {!isCollapsed && (
              <div className="ed-grid">
                {items.map((b) => (
                  <button
                    key={b.type}
                    className="ed-tile"
                    draggable
                    title="Kéo vào trang, hoặc bấm để thêm"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', b.type)
                      e.dataTransfer.effectAllowed = 'copy'
                      useEditor.getState().startDrag({ kind: 'new', blockType: b.type })
                    }}
                    onDragEnd={() => useEditor.getState().endDrag()}
                    onClick={() => useEditor.getState().insertBlock(b.type)}
                  >
                    <b.icon size={22} strokeWidth={1.5} />
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )
      })}
      <p className="ed-hint">Mẹo: nhấp đúp vào chữ trên trang để sửa trực tiếp. Ctrl+Z / Ctrl+Shift+Z để hoàn tác / làm lại.</p>
    </div>
  )
}

// ---------------- Navigator (cây layer) ----------------

type Zone = 'before' | 'after' | 'inside'

function Navigator() {
  const root = useEditor((s) => s.root)
  const selectedId = useEditor((s) => s.selectedId)
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const [over, setOver] = useState<{ id: string; zone: Zone } | null>(null)

  // luôn mở các nhánh chứa phần tử đang chọn
  const openPath = new Set(selectedId ? getAncestors(root, selectedId).map((n) => n.id) : [])

  const targetFor = (node: BuilderNode, zone: Zone): DropTarget | null => {
    if (zone === 'inside') return { parentId: node.id, index: node.children?.length ?? 0 }
    const parent = getAncestors(root, node.id).at(-1)
    if (!parent) return null
    const index = parent.children!.findIndex((c) => c.id === node.id)
    return { parentId: parent.id, index: zone === 'after' ? index + 1 : index }
  }

  const onDragOver = (e: React.DragEvent, node: BuilderNode) => {
    const drag = useEditor.getState().drag
    if (!drag) return
    const r = e.currentTarget.getBoundingClientRect()
    const y = (e.clientY - r.top) / r.height
    const container = getSchema(node.type)?.isContainer
    let zone: Zone = container ? (y < 0.25 ? 'before' : y > 0.75 ? 'after' : 'inside') : y < 0.5 ? 'before' : 'after'
    if (node.id === 'root') zone = 'inside'
    const t = targetFor(node, zone)
    if (t && canDropAt(root, t, drag)) {
      e.preventDefault()
      e.stopPropagation()
      if (over?.id !== node.id || over.zone !== zone) setOver({ id: node.id, zone })
    }
  }

  const onDrop = (e: React.DragEvent, node: BuilderNode) => {
    e.preventDefault()
    e.stopPropagation()
    const s = useEditor.getState()
    const t = over && over.id === node.id ? targetFor(node, over.zone) : null
    if (t && s.drag) {
      if (s.drag.kind === 'new') s.insertBlock(s.drag.blockType, t)
      else s.move(s.drag.nodeId, t)
    }
    setOver(null)
    s.endDrag()
  }

  const renderRow = (node: BuilderNode, depth: number) => {
    const def = getBlock(node.type)
    const hasKids = !!node.children?.length
    const open = !closed[node.id] || openPath.has(node.id)
    const label = node.type === 'tab' ? `Tab: ${String(node.props.title ?? '')}` : node.type === 'heading' || node.type === 'button' ? `${def?.label}: ${String(node.props.text ?? '').slice(0, 24)}` : def?.label ?? node.type
    const Icon = def?.icon
    return (
      <div key={node.id}>
        <div
          className={[
            'ed-nav-row',
            selectedId === node.id && 'is-selected',
            over?.id === node.id && `drop-${over.zone}`,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ paddingLeft: 8 + depth * 14 }}
          draggable={node.id !== 'root'}
          onDragStart={(e) => {
            e.stopPropagation()
            e.dataTransfer.setData('text/plain', node.id)
            useEditor.getState().startDrag({ kind: 'move', nodeId: node.id })
          }}
          onDragEnd={() => {
            setOver(null)
            useEditor.getState().endDrag()
          }}
          onDragOver={(e) => onDragOver(e, node)}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => onDrop(e, node)}
          onClick={() => useEditor.getState().select(node.id)}
          onMouseEnter={() => useEditor.getState().hover(node.id)}
          onMouseLeave={() => useEditor.getState().hover(null)}
        >
          <span
            className="ed-nav-caret"
            onClick={(e) => {
              e.stopPropagation()
              setClosed((c) => ({ ...c, [node.id]: open }))
            }}
          >
            {hasKids ? open ? <ChevronDown size={13} /> : <ChevronRight size={13} /> : null}
          </span>
          {Icon && <Icon size={14} strokeWidth={1.75} />}
          <span className="ed-nav-label">{label}</span>
        </div>
        {hasKids && open && node.children!.map((c) => renderRow(c, depth + 1))}
      </div>
    )
  }

  return (
    <div className="ed-nav">
      {renderRow(root, 0)}
      {!root.children?.length && <p className="ed-hint">Trang đang trống.</p>}
    </div>
  )
}
