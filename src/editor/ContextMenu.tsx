'use client'

import { ArrowUp, BookmarkPlus, ClipboardPaste, Copy, CopyPlus, Settings2, Trash2, Unlink } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { canSaveAsBlock } from '@/builder/schema'
import { findNode, findParent } from '@/builder/tree'
import { nodeLabel } from './labels'
import { useEditor } from './store'

interface Item {
  label: string
  icon: typeof Copy
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  run: () => void
}

/** Menu chuột phải cho phần tử trên canvas và trong cây Cấu trúc */
export function ContextMenu() {
  const menu = useEditor((s) => s.contextMenu)
  const root = useEditor((s) => s.root)
  const clipboard = useEditor((s) => s.clipboard)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const s = useEditor.getState
  const close = () => s().openContextMenu(null)

  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('blur', close)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('blur', close)
      window.removeEventListener('resize', close)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu])

  // giữ menu trong màn hình
  useLayoutEffect(() => {
    if (!menu || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ x: Math.min(menu.x, window.innerWidth - r.width - 8), y: Math.min(menu.y, window.innerHeight - r.height - 8) })
  }, [menu])

  if (!menu) return null
  const node = findNode(root, menu.nodeId)
  if (!node) return null
  const parent = findParent(root, node.id)?.parent
  const isRoot = node.type === 'root'
  const act = (fn: () => void) => () => {
    close()
    fn()
  }

  const items: (Item | 'sep')[] = isRoot
    ? [
        { label: 'Dán', icon: ClipboardPaste, shortcut: 'Ctrl+V', disabled: !clipboard, run: act(() => s().paste()) },
        { label: 'Cài đặt trang', icon: Settings2, run: act(() => s().select('root')) },
      ]
    : [
        { label: 'Chọn phần tử cha', icon: ArrowUp, disabled: !parent, run: act(() => parent && s().select(parent.id)) },
        { label: 'Nhân bản', icon: CopyPlus, shortcut: 'Ctrl+D', run: act(() => s().duplicate(node.id)) },
        { label: 'Sao chép', icon: Copy, shortcut: 'Ctrl+C', run: act(() => s().copy(node.id)) },
        { label: 'Dán', icon: ClipboardPaste, shortcut: 'Ctrl+V', disabled: !clipboard, run: act(() => s().paste()) },
        'sep',
        ...(canSaveAsBlock(node.type) ? [{ label: 'Lưu thành My Block', icon: BookmarkPlus, run: act(() => s().openSaveBlock(node.id)) } as Item] : []),
        ...(node.type === 'blockRef' ? [{ label: 'Tách khỏi block gốc', icon: Unlink, run: act(() => s().detach(node.id)) } as Item] : []),
        'sep',
        { label: 'Xoá', icon: Trash2, shortcut: 'Delete', danger: true, run: act(() => s().remove(node.id)) },
      ]

  return (
    <div ref={ref} className="ed-ctx" role="menu" style={{ left: pos?.x ?? menu.x, top: pos?.y ?? menu.y, visibility: pos ? 'visible' : 'hidden' }}>
      <div className="ed-ctx-title">{nodeLabel(node)}</div>
      {items.map((it, i) =>
        it === 'sep' ? (
          <div key={i} className="ed-ctx-sep" />
        ) : (
          <button key={it.label} role="menuitem" className={`ed-ctx-item${it.danger ? ' is-danger' : ''}`} disabled={it.disabled} onClick={it.run}>
            <it.icon size={14} />
            <span>{it.label}</span>
            {it.shortcut && <kbd>{it.shortcut}</kbd>}
          </button>
        ),
      )}
    </div>
  )
}
