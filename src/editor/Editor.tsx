'use client'

import { useEffect, useRef } from 'react'
import type { PageContent } from '@/builder/types'
import { Canvas } from './Canvas'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'
import { handleShortcut } from './shortcuts'
import { type SaveStatus, useEditor } from './store'
import { TopBar } from './TopBar'

export interface EditorInitial {
  id: string
  title: string
  slug: string
  status: SaveStatus
  content: PageContent
}

export function Editor({ initial }: { initial: EditorInitial }) {
  const ready = useRef(false)
  if (!ready.current) {
    // khởi tạo đồng bộ trước lần render đầu để canvas không nháy trang rỗng
    useEditor.getState().init({
      pageId: initial.id,
      title: initial.title,
      slug: initial.slug,
      status: initial.status,
      root: initial.content.root,
    })
    ready.current = true
  }

  useEffect(() => {
    window.addEventListener('keydown', handleShortcut)
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('keydown', handleShortcut)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [])

  return (
    <div className="ed">
      <TopBar />
      <div className="ed-main">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>
      <Toasts />
    </div>
  )
}

function Toasts() {
  const toasts = useEditor((s) => s.toasts)
  return (
    <div className="ed-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`ed-toast ed-toast--${t.kind}`} onClick={() => useEditor.getState().dismissToast(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
