'use client'

import { savePage } from './api'
import { useEditor } from './store'

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  if (!t) return false
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
}

/** Phím tắt dùng chung cho cửa sổ editor và iframe canvas */
export function handleShortcut(e: KeyboardEvent) {
  const s = useEditor.getState()
  const mod = e.metaKey || e.ctrlKey
  const key = e.key.toLowerCase()

  if (mod && key === 's') {
    e.preventDefault()
    void savePage(false)
    return
  }
  if (isTyping(e) || s.editingId) return

  if (mod && key === 'z' && !e.shiftKey) {
    e.preventDefault()
    s.undo()
  } else if (mod && ((key === 'z' && e.shiftKey) || key === 'y')) {
    e.preventDefault()
    s.redo()
  } else if (mod && key === 'd' && s.selectedId) {
    e.preventDefault()
    s.duplicate(s.selectedId)
  } else if (mod && key === 'g' && s.selectedId && s.selectedId !== 'root') {
    e.preventDefault()
    if (e.shiftKey) s.unwrap(s.selectedId)
    else s.wrapInDiv(s.selectedId)
  } else if (mod && key === 'c' && s.selectedId) {
    s.copy(s.selectedId)
  } else if (mod && key === 'v') {
    s.paste()
  } else if ((key === 'delete' || key === 'backspace') && s.selectedId && s.selectedId !== 'root') {
    e.preventDefault()
    s.remove(s.selectedId)
  } else if (key === 'escape') {
    s.select(null)
  }
}
