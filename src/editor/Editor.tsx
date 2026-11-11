'use client'

import { useEffect, useRef } from 'react'
import { collectRefIds } from '@/builder/refs'
import type { PageContent } from '@/builder/types'
import { getMyBlock, refreshBlockLibrary } from './api'
import { Canvas } from './Canvas'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'
import { SaveBlockDialog } from './SaveBlockDialog'
import { handleShortcut } from './shortcuts'
import { type BlockScope, type EditorKind, type SaveStatus, useEditor } from './store'
import { TopBar } from './TopBar'

export interface EditorInitial {
  kind: EditorKind
  id: string
  title: string
  slug: string
  status: SaveStatus
  content: PageContent
  scope?: BlockScope
  readOnly?: boolean
  userId: string | null
}

export function Editor({ initial }: { initial: EditorInitial }) {
  const ready = useRef(false)
  if (!ready.current) {
    // khởi tạo đồng bộ trước lần render đầu để canvas không nháy trang rỗng
    useEditor.getState().init({
      kind: initial.kind,
      pageId: initial.id,
      title: initial.title,
      slug: initial.slug,
      status: initial.status,
      root: initial.content.root,
      scope: initial.scope,
      readOnly: initial.readOnly,
      userId: initial.userId,
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

  useBlockLibrary()
  const saveBlockFor = useEditor((s) => s.saveBlockFor)

  return (
    <div className="ed">
      <TopBar />
      <div className="ed-main">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>
      {saveBlockFor && <SaveBlockDialog nodeId={saveBlockFor} />}
      <Toasts />
    </div>
  )
}

/**
 * Thư viện My Blocks: nạp khi mở editor, nạp lại khi quay về tab (người dùng có thể vừa sửa bản gốc ở tab khác).
 * Block được trang tham chiếu nhưng không có trong thư viện (đã xoá…) sẽ được thử tải riêng rồi đánh dấu thiếu.
 */
function useBlockLibrary() {
  const root = useEditor((s) => s.root)
  const blocksStatus = useEditor((s) => s.blocksStatus)

  useEffect(() => {
    void refreshBlockLibrary()
    let last = Date.now()
    const onFocus = () => {
      if (Date.now() - last < 3000) return
      last = Date.now()
      void refreshBlockLibrary()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const inflight = useRef(new Set<string>())
  useEffect(() => {
    if (blocksStatus !== 'ready') return
    const s = useEditor.getState()
    for (const id of collectRefIds(root)) {
      if (s.blocks[id] || s.missingBlocks[id] || inflight.current.has(id)) continue
      inflight.current.add(id)
      getMyBlock(id)
        .then((block) => (block ? useEditor.getState().upsertBlock(block) : useEditor.getState().markMissingBlock(id)))
        .catch(() => useEditor.getState().markMissingBlock(id))
        .finally(() => inflight.current.delete(id))
    }
  }, [root, blocksStatus])
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
