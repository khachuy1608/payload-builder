'use client'

import { useEffect, useRef } from 'react'
import { collectDataNodes, projectRecord } from '@/builder/data'
import { collectRefIds, resolveRefs } from '@/builder/refs'
import type { PageLayout, SiteParts } from '@/builder/siteParts'
import type { Role } from '@/lib/access'
import type { PageContent } from '@/builder/types'
import { fetchData, fetchSources, getMyBlock, heartbeatPresence, leavePresence, listComments, refreshBlockLibrary, refreshThemes } from './api'
import { Canvas } from './Canvas'
import { ContextMenu } from './ContextMenu'
import { HistoryDialog } from './HistoryDialog'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'
import { SaveBlockDialog } from './SaveBlockDialog'
import { TemplateDialog } from './TemplateDialog'
import { ThemeDialog } from './ThemeDialog'
import { LockBanner, useDocumentLock } from './LockBanner'
import { handleShortcut } from './shortcuts'
import { type BlockScope, blockLookup, type EditorKind, type SaveStatus, useEditor } from './store'
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
  /** Ghi đè theme của trang (kind = page) */
  pageThemeId?: string | null
  template?: { collection: string; field: string } | null
  seo?: Partial<import('./store').PageSeoState>
  siteParts?: SiteParts
  layout?: Partial<PageLayout>
  role?: Role
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
      pageThemeId: initial.pageThemeId ?? null,
      template: initial.template ?? null,
      seo: initial.seo,
      siteParts: initial.siteParts,
      layout: initial.layout,
      role: initial.role,
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
  useDocumentLock()
  useDataSync()
  usePresence()
  useComments()
  const saveBlockFor = useEditor((s) => s.saveBlockFor)
  const themeDialog = useEditor((s) => s.themeDialog)
  const historyDialog = useEditor((s) => s.historyDialog)
  const templateDialog = useEditor((s) => s.templateDialog)
  // trang mới (trống) -> gợi ý chọn mẫu
  useEffect(() => {
    const s = useEditor.getState()
    if (s.kind === 'page' && !s.readOnly && !s.root.children?.length) s.openTemplateDialog(true)
  }, [])

  return (
    <div className="ed">
      <TopBar />
      <LockBanner />
      <div className="ed-main">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>
      {saveBlockFor && <SaveBlockDialog nodeId={saveBlockFor} />}
      {themeDialog && <ThemeDialog />}
      {historyDialog && <HistoryDialog />}
      {templateDialog && <TemplateDialog />}
      <ContextMenu />
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
    void refreshThemes()
    let last = Date.now()
    const onFocus = () => {
      if (Date.now() - last < 3000) return
      last = Date.now()
      void refreshBlockLibrary()
      if (!useEditor.getState().themeDialog) void refreshThemes()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const inflight = useRef(new Set<string>())
  useEffect(() => {
    if (blocksStatus !== 'ready') return
    const s = useEditor.getState()
    const ids = new Set(collectRefIds(root))
    for (const id of [s.siteParts.header, s.siteParts.footer]) if (id) ids.add(id)
    for (const id of ids) {
      if (s.blocks[id] || s.missingBlocks[id] || inflight.current.has(id)) continue
      inflight.current.add(id)
      getMyBlock(id)
        .then((block) => (block ? useEditor.getState().upsertBlock(block) : useEditor.getState().markMissingBlock(id)))
        .catch(() => useEditor.getState().markMissingBlock(id))
        .finally(() => inflight.current.delete(id))
    }
  }, [root, blocksStatus])
}

/**
 * Nguồn dữ liệu: nạp danh sách nguồn một lần; mỗi khi cây đổi, node nào có nguồn mà khai báo thay đổi
 * (so theo JSON) thì lấy lại dữ liệu qua REST (debounce) để canvas hiện bản ghi thật.
 */
function useDataSync() {
  const root = useEditor((s) => s.root)
  const blocks = useEditor((s) => s.blocks)
  const last = useRef<Record<string, string>>({})
  useEffect(() => {
    fetchSources()
      .then((list) => {
        useEditor.getState().setSources(list)
        // người đang đăng nhập cho {{user.*}} – chỉ giữ trường công khai như trang thật
        const expose = list.find((x) => x.slug === 'users')?.fields.map((f) => f.name) ?? ['id', 'name']
        return fetch('/api/users/me?depth=1', { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : null))
          .then((me) => useEditor.getState().setCurrentUser(me?.user ? projectRecord(me.user, expose) : null))
      })
      .catch(() => useEditor.getState().toast('error', 'Không tải được danh sách nguồn dữ liệu.'))
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => {
      const nodes = collectDataNodes(resolveRefs(root, blockLookup(blocks)))
      const s = useEditor.getState()
      for (const { id, source } of nodes) {
        const key = JSON.stringify(source)
        if (last.current[id] === key) continue
        last.current[id] = key
        const info = s.sources.find((x) => x.slug === source.collection)
        fetchData(source, info)
          .then((result) => useEditor.getState().setData(id, result))
          .catch((err) => {
            useEditor.getState().setData(id, { records: [], total: 0, page: 1, totalPages: 1, limit: 1 })
            useEditor.getState().toast('error', `Nguồn dữ liệu "${source.collection}": ${(err as Error).message}`)
          })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [root, blocks])
}

/** Hiện diện: nhịp 10s, rời khi đóng tab */
function usePresence() {
  useEffect(() => {
    const s = useEditor.getState()
    const room = `${s.kind}:${s.pageId}`
    const beat = () => heartbeatPresence(room).then((others) => useEditor.getState().setPresence(others)).catch(() => undefined)
    void beat()
    const timer = setInterval(beat, PRESENCE_MS)
    const onHide = () => leavePresence(room)
    window.addEventListener('pagehide', onHide)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', onHide)
      leavePresence(room)
    }
  }, [])
}

/** Bình luận của trang: nạp khi mở, nạp lại khi quay về tab */
function useComments() {
  useEffect(() => {
    const s = useEditor.getState()
    if (s.kind !== 'page') return
    const load = () => listComments(s.pageId).then((list) => useEditor.getState().setComments(list)).catch(() => undefined)
    void load()
    let last = Date.now()
    const onFocus = () => {
      if (Date.now() - last < 3000) return
      last = Date.now()
      void load()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])
}

const PRESENCE_MS = 10_000

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
