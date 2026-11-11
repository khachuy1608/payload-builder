'use client'

/**
 * State của Visual Editor: cây node, lựa chọn, thiết bị, lịch sử undo/redo, kéo thả, lưu.
 * Dùng zustand + immer: mỗi thao tác tạo cây mới nhưng chia sẻ các nhánh không đổi,
 * nên lịch sử chỉ là mảng các root cũ (rẻ) và RenderNode memo chỉ render lại nhánh bị sửa.
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { type PageLayout, type SiteParts } from '@/builder/siteParts'
import type { Role } from '@/lib/access'
import type { CommentDoc, PresenceUser } from './api'
import { BLOCK_REF_TYPE, type BlockLookup, expandRef, reachesBlock, refBlockId } from '@/builder/refs'
import { getBlock } from '@/builder/registry'
import { canContain, getSchema } from '@/builder/schema'
import { autoBind, type DataMap, type DataRecord, type SourceInfo } from '@/builder/data'
import { applyPreset as applyPresetToNode, type BlockPreset } from '@/builder/presets'
import { defaultTheme, type ThemeTokens } from '@/builder/theme'
import {
  cloneWithNewIds,
  findNode,
  findParent,
  genId,
  insertNode,
  isInSubtree,
  moveNode,
  removeNode,
} from '@/builder/tree'
import type { BuilderNode, Device, DropTarget, MediaValue, StyleBucket, StyleState } from '@/builder/types'

export type DragPayload =
  | { kind: 'new'; blockType: string }
  | { kind: 'move'; nodeId: string }
  /** Kéo một My Block từ thư viện. blockType = 'blockRef' (liên kết) hoặc type gốc của block (bản sao) – để kiểm tra chỗ thả */
  | { kind: 'block'; blockId: string; linked: boolean; blockType: string }

/** Editor đang sửa một trang hay bản gốc của một My Block */
export type EditorKind = 'page' | 'block'
export type BlockScope = 'private' | 'shared'
export type InsertMode = 'copy' | 'linked'

/** Một My Block trong thư viện (đã chuẩn hoá từ doc của collection my-blocks) */
export type BlockKind = 'block' | 'page'
export interface MyBlock {
  id: string
  name: string
  scope: BlockScope
  /** 'page': mẫu trang (cây là root), không hiện trong thư viện block */
  kind: BlockKind
  owner: string | null
  tree: BuilderNode
  thumbnail: MediaValue | null
  updatedAt: string
}

export interface PageSeoState {
  metaTitle: string
  metaDescription: string
  ogImage: MediaValue | null
  noIndex: boolean
  canonical: string
}

export type LockState =
  | { state: 'checking' | 'off' }
  | { state: 'owned'; lockId: string }
  | { state: 'locked'; by: { name: string; email: string; since: string } }
  | { state: 'error'; message: string }

export const blockLookup = (blocks: Record<string, MyBlock>): BlockLookup => (id) => blocks[id]?.tree

/** Một theme trong thư viện (đã chuẩn hoá từ doc của collection themes) */
export interface ThemeDoc {
  id: string
  name: string
  isPreset: boolean
  owner: string | null
  tokens: ThemeTokens
  updatedAt: string
}

/** Theme hiệu lực trên canvas: bản xem thử (đang chỉnh trong hộp thoại) -> ghi đè của trang -> theme site -> mặc định */
export function effectiveTheme(s: Pick<EditorState, 'themePreview' | 'themes' | 'pageThemeId' | 'siteThemeId'>): ThemeTokens {
  if (s.themePreview) return s.themePreview
  const id = s.pageThemeId ?? s.siteThemeId
  return (id && s.themes[id]?.tokens) || defaultTheme
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface DropIndicator extends DropTarget {
  rect: Rect
  /** 'line' = vạch chèn giữa các phần tử, 'box' = tô cả vùng chứa rỗng */
  variant: 'line' | 'box'
}

export type SaveStatus = 'draft' | 'published'

export interface Toast {
  id: number
  kind: 'success' | 'error' | 'info'
  message: string
}

const HISTORY_LIMIT = 100
const COALESCE_MS = 800

export interface EditorState {
  kind: EditorKind
  /** id trang (kind = page) hoặc id block (kind = block) */
  pageId: string
  title: string
  slug: string
  status: SaveStatus
  /** Phạm vi của block đang sửa (kind = block) */
  scope: BlockScope
  /** Block của người khác: chỉ xem */
  readOnly: boolean
  userId: string | null
  root: BuilderNode

  /** Thư viện My Blocks (mọi block đọc được), key = id */
  blocks: Record<string, MyBlock>
  blocksStatus: 'idle' | 'loading' | 'ready' | 'error'
  /** Block được trang tham chiếu nhưng không tải được (đã xoá…) */
  missingBlocks: Record<string, true>
  insertMode: InsertMode
  /** Đang mở hộp thoại "Lưu thành My Block" cho node này */
  saveBlockFor: string | null

  /** Thư viện theme, key = id */
  themes: Record<string, ThemeDoc>
  themesStatus: 'idle' | 'loading' | 'ready' | 'error'
  /** Theme trong site-settings */
  siteThemeId: string | null
  /** Ghi đè theme của trang đang sửa (null = theo site) */
  pageThemeId: string | null
  /** Token đang xem thử khi chỉnh theme trong hộp thoại (không lưu) */
  themePreview: ThemeTokens | null
  themeDialog: boolean

  /** Menu chuột phải (toạ độ theo cửa sổ editor) */
  contextMenu: { x: number; y: number; nodeId: string } | null
  historyDialog: boolean
  templateDialog: boolean

  /** Khoá tài liệu (xem lock.ts): owned = mình giữ khoá, locked = người khác đang sửa */
  lock: LockState

  /** Trang mẫu động: collection + trường khớp URL (null = trang thường) */
  template: { collection: string; field: string } | null
  /** SEO của trang */
  seo: PageSeoState
  /** Header/footer toàn site (id My Block trong Cài đặt site) và tuỳ chọn ẩn của trang này */
  siteParts: SiteParts
  layout: PageLayout
  /** Ghi chú cho lần lưu/xuất bản kế tiếp (lưu cùng phiên bản) */
  versionNote: string
  publishMenu: boolean
  /** Vai trò của người đang dùng editor */
  role: Role
  /** Ngôn ngữ đang sửa (Payload localization) */
  locale: string
  /** Người khác đang mở cùng tài liệu */
  presence: PresenceUser[]
  comments: CommentDoc[]
  /** Nguồn dữ liệu có thể bind (từ /api/builder/sources) */
  sources: SourceInfo[]
  /** Bản ghi đã nạp theo id node có nguồn (canvas dùng để hiện dữ liệu thật) */
  dataCache: DataMap
  /** Người đang đăng nhập (đã lọc trường công khai) cho {{user.*}} trên canvas */
  currentUser: DataRecord | null
  /** Xem thử canvas như khách (chưa đăng nhập) */
  previewAsGuest: boolean

  selectedId: string | null
  hoveredId: string | null
  editingId: string | null
  device: Device
  styleState: StyleState
  leftTab: 'elements' | 'navigator' | 'blocks' | 'comments'

  past: BuilderNode[]
  future: BuilderNode[]
  lastHistoryKey: string | null
  lastHistoryAt: number

  dirty: boolean
  saving: boolean
  toasts: Toast[]

  drag: DragPayload | null
  drop: DropIndicator | null
  clipboard: BuilderNode | null
}

export interface EditorActions {
  init(data: {
    kind: EditorKind
    pageId: string
    title: string
    slug: string
    status: SaveStatus
    root: BuilderNode
    scope?: BlockScope
    readOnly?: boolean
    userId: string | null
    pageThemeId?: string | null
    template?: { collection: string; field: string } | null
    seo?: Partial<PageSeoState>
    siteParts?: SiteParts
    layout?: Partial<PageLayout>
    role?: Role
    locale?: string
  }): void
  setPresence(list: PresenceUser[]): void
  setComments(list: CommentDoc[]): void
  setLayout(patch: Partial<PageLayout>): void
  setVersionNote(note: string): void
  openPublishMenu(open: boolean): void
  /** Đổi header/footer toàn site (đã lưu vào Cài đặt site ở api.ts) */
  setSiteParts(parts: SiteParts): void
  setTemplate(template: EditorState['template']): void
  setSeo(patch: Partial<PageSeoState>): void
  select(id: string | null): void
  hover(id: string | null): void
  setEditing(id: string | null): void
  setDevice(device: Device): void
  setStyleState(state: StyleState): void
  setLeftTab(tab: EditorState['leftTab']): void
  setMeta(patch: { title?: string; slug?: string; scope?: BlockScope }): void

  // ----- My Blocks -----
  setBlocks(list: MyBlock[]): void
  setBlocksStatus(status: EditorState['blocksStatus']): void
  upsertBlock(block: MyBlock): void
  removeBlock(id: string): void
  markMissingBlock(id: string): void
  setInsertMode(mode: InsertMode): void
  openSaveBlock(id: string | null): void
  /** Chèn My Block từ thư viện: bản sao độc lập hoặc node blockRef liên kết */
  insertMyBlock(blockId: string, linked: boolean, target?: DropTarget): string | null
  /** Thay node (giữ vị trí) bằng node khác – dùng khi thay phần tử bằng liên kết tới block vừa lưu */
  replaceNode(id: string, node: BuilderNode): boolean
  /** Tách blockRef thành bản sao độc lập */
  detach(id: string): void

  // ----- Themes -----
  setThemes(list: ThemeDoc[], siteThemeId: string | null): void
  setThemesStatus(status: EditorState['themesStatus']): void
  upsertTheme(theme: ThemeDoc): void
  removeTheme(id: string): void
  setSiteThemeId(id: string | null): void
  /** Đổi ghi đè theme của trang (ghi vào trang khi lưu) */
  setPageTheme(id: string | null): void
  setThemePreview(tokens: ThemeTokens | null): void
  openThemeDialog(open: boolean): void

  /** Áp dụng gợi ý kiểu lên node (giữ nội dung, hoàn tác được) */
  applyPreset(id: string, preset: BlockPreset): void
  /** Bọc node đang chọn vào một Danh sách dữ liệu (node thành phần tử mẫu, tự gắn trường) */
  wrapInDataList(id: string, collection?: string): string | null
  /** Thay phần tử mẫu của Danh sách dữ liệu bằng node mới (tự gắn trường) */
  setListTemplate(listId: string, template: BuilderNode): void
  setLock(lock: LockState): void
  setSources(sources: SourceInfo[]): void
  setCurrentUser(user: DataRecord | null): void
  setPreviewAsGuest(on: boolean): void
  setData(nodeId: string, records: DataMap[string]): void
  openContextMenu(menu: EditorState['contextMenu']): void
  openHistory(open: boolean): void
  openTemplateDialog(open: boolean): void
  /** Thay toàn bộ nội dung trang bằng mẫu (nhân bản với id mới, hoàn tác được) */
  applyPageTemplate(template: BuilderNode): void
  /** Bọc phần tử trong một Div mới (nhóm) */
  wrapInDiv(id: string): string | null
  /** Bỏ vùng chứa, đưa các con lên thay chỗ nó */
  unwrap(id: string): boolean
  /** Đưa nội dung một phiên bản cũ vào editor như một bước chỉnh sửa (hoàn tác được) */
  restoreVersion(data: { root: BuilderNode; title: string; slug: string }): void

  insertBlock(type: string, target?: DropTarget): string | null
  insertNode(node: BuilderNode, target: DropTarget): boolean
  move(id: string, target: DropTarget): boolean
  remove(id: string): void
  duplicate(id: string): void
  copy(id: string): void
  paste(): void
  updateProps(id: string, patch: Record<string, unknown>, historyKey?: string): void
  setStyle(id: string, key: string, value: string, bucket?: StyleBucket): void
  undo(): void
  redo(): void

  startDrag(payload: DragPayload): void
  setDrop(drop: DropIndicator | null): void
  endDrag(): void
  commitDrop(): void

  setSaving(saving: boolean): void
  markSaved(status: SaveStatus): void
  toast(kind: Toast['kind'], message: string): void
  dismissToast(id: number): void
}

export type Store = EditorState & EditorActions

let toastSeq = 0

/** Có thể đặt node loại `type` (hoặc node `movingId`) vào target không */
export function canDropAt(root: BuilderNode, target: DropTarget, drag: DragPayload): boolean {
  const parent = findNode(root, target.parentId)
  if (!parent) return false
  if (drag.kind === 'new' || drag.kind === 'block') return canContain(parent.type, drag.blockType)
  const moving = findNode(root, drag.nodeId)
  if (!moving || moving.type === 'root') return false
  if (isInSubtree(root, drag.nodeId, target.parentId)) return false
  return canContain(parent.type, moving.type)
}

/** Vị trí chèn mặc định khi bấm (không kéo) một block: vào trong vùng chứa đang chọn, hoặc ngay sau phần tử đang chọn */
export function defaultTarget(root: BuilderNode, selectedId: string | null, type: string): DropTarget | null {
  const candidates: DropTarget[] = []
  if (selectedId) {
    const sel = findNode(root, selectedId)
    if (sel && canContain(sel.type, type)) candidates.push({ parentId: sel.id, index: sel.children?.length ?? 0 })
    let cur = selectedId
    let loc = findParent(root, cur)
    while (loc) {
      candidates.push({ parentId: loc.parent.id, index: loc.index + 1 })
      cur = loc.parent.id
      loc = findParent(root, cur)
    }
  }
  candidates.push({ parentId: root.id, index: root.children?.length ?? 0 })
  return candidates.find((t) => canDropAt(root, t, { kind: 'new', blockType: type })) ?? null
}

export function createNodeFromBlock(type: string): BuilderNode | null {
  const def = getBlock(type)
  if (!def) return null
  const d = def.defaults()
  return { id: genId(), type, props: d.props, styles: d.styles, ...(d.children ? { children: d.children } : {}) }
}

export const useEditor = create<Store>()(
  immer((set, get) => {
    /** Áp dụng một thay đổi lên cây, có ghi lịch sử (gộp các thay đổi liên tiếp cùng key) */
    const commit = (mutate: (root: BuilderNode, state: EditorState) => void, historyKey?: string) => {
      const prev = get()
      const now = Date.now()
      const coalesce = !!historyKey && prev.lastHistoryKey === historyKey && now - prev.lastHistoryAt < COALESCE_MS
      set((s) => {
        if (!coalesce) {
          s.past.push(prev.root)
          if (s.past.length > HISTORY_LIMIT) s.past.shift()
        }
        s.future = []
        mutate(s.root, s)
        s.dirty = true
        s.lastHistoryKey = historyKey ?? null
        s.lastHistoryAt = now
      })
    }

    return {
      kind: 'page',
      pageId: '',
      title: '',
      slug: '',
      status: 'draft',
      scope: 'private',
      readOnly: false,
      userId: null,
      root: { id: 'root', type: 'root', props: {}, styles: {}, children: [] },
      blocks: {},
      blocksStatus: 'idle',
      missingBlocks: {},
      insertMode: 'copy',
      saveBlockFor: null,
      themes: {},
      themesStatus: 'idle',
      siteThemeId: null,
      pageThemeId: null,
      themePreview: null,
      themeDialog: false,
      contextMenu: null,
      historyDialog: false,
      templateDialog: false,
      lock: { state: 'checking' },
      sources: [],
      dataCache: {},
      currentUser: null,
      previewAsGuest: false,
      template: null,
      seo: { metaTitle: '', metaDescription: '', ogImage: null, noIndex: false, canonical: '' },
      siteParts: { header: null, footer: null },
      layout: { hideHeader: false, hideFooter: false },
      versionNote: '',
      publishMenu: false,
      role: 'editor',
      locale: 'vi',
      presence: [],
      comments: [],
      selectedId: null,
      hoveredId: null,
      editingId: null,
      device: 'desktop',
      styleState: 'normal',
      leftTab: 'elements',
      past: [],
      future: [],
      lastHistoryKey: null,
      lastHistoryAt: 0,
      dirty: false,
      saving: false,
      toasts: [],
      drag: null,
      drop: null,
      clipboard: null,

      init: (data) =>
        set((s) => {
          s.kind = data.kind
          s.pageId = data.pageId
          s.title = data.title
          s.slug = data.slug
          s.status = data.status
          s.scope = data.scope ?? 'private'
          s.readOnly = data.readOnly ?? false
          s.userId = data.userId
          s.root = data.root
          s.past = []
          s.future = []
          s.dirty = false
          s.selectedId = null
          s.saveBlockFor = null
          s.pageThemeId = data.pageThemeId ?? null
          s.template = data.template ?? null
          s.seo = { metaTitle: '', metaDescription: '', ogImage: null, noIndex: false, canonical: '', ...(data.seo ?? {}) }
          s.role = data.role ?? 'editor'
          s.locale = data.locale ?? 'vi'
          s.presence = []
          s.comments = []
          s.siteParts = data.siteParts ?? { header: null, footer: null }
          s.layout = { hideHeader: false, hideFooter: false, ...(data.layout ?? {}) }
          s.themePreview = null
          s.themeDialog = false
        }),

      select: (id) =>
        set((s) => {
          s.selectedId = id
        }),
      hover: (id) => {
        if (get().hoveredId !== id)
          set((s) => {
            s.hoveredId = id
          })
      },
      setEditing: (id) =>
        set((s) => {
          s.editingId = id
        }),
      setDevice: (device) =>
        set((s) => {
          s.device = device
        }),
      setStyleState: (state) =>
        set((s) => {
          s.styleState = state
        }),
      setLeftTab: (tab) =>
        set((s) => {
          s.leftTab = tab
        }),
      setMeta: (patch) =>
        set((s) => {
          if (patch.title !== undefined) s.title = patch.title
          if (patch.slug !== undefined) s.slug = patch.slug
          if (patch.scope !== undefined) s.scope = patch.scope
          s.dirty = true
        }),

      // ----- My Blocks -----
      setBlocks: (list) =>
        set((s) => {
          // giữ nguyên object của block chưa đổi để cache triển khai (resolveRefs) và memo của canvas còn hiệu lực
          s.blocks = Object.fromEntries(list.map((b) => [b.id, s.blocks[b.id]?.updatedAt === b.updatedAt ? s.blocks[b.id] : b]))
          for (const id of Object.keys(s.missingBlocks)) if (s.blocks[id]) delete s.missingBlocks[id]
          s.blocksStatus = 'ready'
        }),
      setBlocksStatus: (status) =>
        set((s) => {
          s.blocksStatus = status
        }),
      upsertBlock: (block) =>
        set((s) => {
          s.blocks[block.id] = block
          delete s.missingBlocks[block.id]
        }),
      removeBlock: (id) =>
        set((s) => {
          delete s.blocks[id]
        }),
      markMissingBlock: (id) =>
        set((s) => {
          s.missingBlocks[id] = true
        }),
      setInsertMode: (mode) =>
        set((s) => {
          s.insertMode = mode
        }),
      openSaveBlock: (id) =>
        set((s) => {
          s.saveBlockFor = id
        }),

      insertMyBlock: (blockId, linked, target) => {
        const state = get()
        const block = state.blocks[blockId]
        if (!block) {
          get().toast('error', 'Block chưa tải xong hoặc không còn tồn tại.')
          return null
        }
        // đang sửa bản gốc của block X: không được chèn X hay block nào dẫn tới X (vòng lặp)
        if (state.kind === 'block' && state.pageId && (blockId === state.pageId || reachesBlock(block.tree, state.pageId, blockLookup(state.blocks)))) {
          get().toast('error', 'Không thể chèn: block này tham chiếu tới chính block đang sửa (vòng lặp).')
          return null
        }
        const node: BuilderNode = linked
          ? { id: genId(), type: BLOCK_REF_TYPE, props: { blockId, name: block.name }, styles: {} }
          : cloneWithNewIds(block.tree)
        const t = target ?? defaultTarget(state.root, state.selectedId, node.type)
        if (!t || !canDropAt(state.root, t, { kind: 'new', blockType: node.type })) {
          get().toast('error', 'Không thể đặt block ở vị trí này.')
          return null
        }
        commit((root) => insertNode(root, t, node))
        set((s) => {
          s.selectedId = node.id
        })
        return node.id
      },

      replaceNode: (id, node) => {
        const loc = findParent(get().root, id)
        if (!loc || !canContain(loc.parent.type, node.type)) return false
        commit((root) => {
          const parent = findNode(root, loc.parent.id)
          if (parent?.children) parent.children.splice(loc.index, 1, node)
        })
        set((s) => {
          s.selectedId = node.id
        })
        return true
      },

      // ----- Themes -----
      setThemes: (list, siteThemeId) =>
        set((s) => {
          s.themes = Object.fromEntries(list.map((t) => [t.id, s.themes[t.id]?.updatedAt === t.updatedAt ? s.themes[t.id] : t]))
          s.siteThemeId = siteThemeId
          s.themesStatus = 'ready'
        }),
      setThemesStatus: (status) =>
        set((s) => {
          s.themesStatus = status
        }),
      upsertTheme: (theme) =>
        set((s) => {
          s.themes[theme.id] = theme
        }),
      removeTheme: (id) =>
        set((s) => {
          delete s.themes[id]
          if (s.siteThemeId === id) s.siteThemeId = null
          if (s.pageThemeId === id) s.pageThemeId = null
        }),
      setSiteThemeId: (id) =>
        set((s) => {
          s.siteThemeId = id
        }),
      setPageTheme: (id) =>
        set((s) => {
          s.pageThemeId = id
          s.dirty = true
        }),
      setThemePreview: (tokens) =>
        set((s) => {
          s.themePreview = tokens
        }),
      openThemeDialog: (open) =>
        set((s) => {
          s.themeDialog = open
          if (!open) s.themePreview = null
        }),

      applyPreset: (id, preset) =>
        commit((root) => {
          const loc = findParent(root, id)
          const node = findNode(root, id)
          if (!node) return
          const next = applyPresetToNode(node, preset)
          if (loc) loc.parent.children![loc.index] = next
          else Object.assign(node, next)
        }),
      wrapInDataList: (id, collection) => {
        const state = get()
        const node = findNode(state.root, id)
        const loc = findParent(state.root, id)
        if (!node || !loc || node.type === 'root' || node.type === BLOCK_REF_TYPE) return null
        if (!canContain(loc.parent.type, 'dataList')) {
          get().toast('error', 'Không thể đặt Danh sách dữ liệu ở vị trí này.')
          return null
        }
        const col = collection ?? state.sources[0]?.slug ?? 'users'
        const fields = state.sources.find((x) => x.slug === col)?.fields.map((f) => f.name) ?? ['id', 'name', 'title', 'bio', 'avatar']
        const list: BuilderNode = {
          id: genId(),
          type: 'dataList',
          props: { data: { collection: col, mode: 'list', limit: 8 } },
          styles: { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }, mobile: { gridTemplateColumns: '1fr' } },
          children: [autoBind(structuredClone(node), fields)],
        }
        // phần tử mẫu không nên mang flex-grow/basis của hàng cũ
        const tpl = list.children![0]
        if (tpl.styles.desktop) {
          delete tpl.styles.desktop.flexGrow
          delete tpl.styles.desktop.flexBasis
        }
        commit((root) => {
          const parent = findNode(root, loc.parent.id)
          if (parent?.children) parent.children.splice(loc.index, 1, list)
        })
        set((s) => {
          s.selectedId = list.id
        })
        get().toast('success', `Đã biến thành Danh sách dữ liệu (${col}). Chọn phần tử trong mẫu và bấm ⚡ để đổi trường.`)
        return list.id
      },
      setListTemplate: (listId, template) => {
        const state = get()
        const list = findNode(state.root, listId)
        if (!list || list.type !== 'dataList') return
        const col = (list.props.data as { collection?: string } | undefined)?.collection ?? 'users'
        const fields = state.sources.find((x) => x.slug === col)?.fields.map((f) => f.name) ?? ['id', 'name', 'title', 'bio', 'avatar']
        const next = autoBind(cloneWithNewIds(template), fields)
        commit((root) => {
          const l = findNode(root, listId)
          if (l) l.children = [next]
        })
        set((s) => {
          s.selectedId = next.id
        })
      },
      setLock: (lock) =>
        set((s) => {
          s.lock = lock
        }),
      setPresence: (list) =>
        set((s) => {
          s.presence = list
        }),
      setComments: (list) =>
        set((s) => {
          s.comments = list
        }),
      setVersionNote: (note) =>
        set((s) => {
          s.versionNote = note
        }),
      openPublishMenu: (open) =>
        set((s) => {
          s.publishMenu = open
        }),
      setLayout: (patch) =>
        set((s) => {
          Object.assign(s.layout, patch)
          s.dirty = true
        }),
      setSiteParts: (parts) =>
        set((s) => {
          s.siteParts = parts
        }),
      setSeo: (patch) =>
        set((s) => {
          Object.assign(s.seo, patch)
          s.dirty = true
        }),
      setTemplate: (template) =>
        set((s) => {
          s.template = template
          s.dirty = true
        }),
      setCurrentUser: (user) =>
        set((s) => {
          s.currentUser = user
        }),
      setPreviewAsGuest: (on) =>
        set((s) => {
          s.previewAsGuest = on
        }),
      setSources: (sources) =>
        set((s) => {
          s.sources = sources
        }),
      setData: (nodeId, records) =>
        set((s) => {
          s.dataCache[nodeId] = records
        }),
      openContextMenu: (menu) =>
        set((s) => {
          s.contextMenu = menu
        }),
      openHistory: (open) =>
        set((s) => {
          s.historyDialog = open
        }),
      openTemplateDialog: (open) =>
        set((s) => {
          s.templateDialog = open
        }),
      wrapInDiv: (id) => {
        const state = get()
        const node = findNode(state.root, id)
        const loc = findParent(state.root, id)
        if (!node || !loc || node.type === 'root') return null
        if (!canContain(loc.parent.type, 'div') || !canContain('div', node.type)) {
          get().toast('error', 'Không thể bọc phần tử này trong Div.')
          return null
        }
        const wrapper = createNodeFromBlock('div')!
        wrapper.styles = {}
        wrapper.children = [structuredClone(node)]
        commit((root) => {
          const parent = findNode(root, loc.parent.id)
          if (parent?.children) parent.children.splice(loc.index, 1, wrapper)
        })
        set((s) => {
          s.selectedId = wrapper.id
        })
        return wrapper.id
      },
      unwrap: (id) => {
        const state = get()
        const node = findNode(state.root, id)
        const loc = findParent(state.root, id)
        if (!node || !loc || node.type === 'root' || !getSchema(node.type)?.isContainer) return false
        const kids = node.children ?? []
        if (kids.some((c) => !canContain(loc.parent.type, c.type))) {
          get().toast('error', 'Các phần tử con không thể nằm trực tiếp trong vùng chứa cha.')
          return false
        }
        commit((root) => {
          const parent = findNode(root, loc.parent.id)
          if (parent?.children) parent.children.splice(loc.index, 1, ...kids.map((c) => structuredClone(c)))
        })
        set((s) => {
          s.selectedId = kids[0]?.id ?? loc.parent.id
        })
        return true
      },
      applyPageTemplate: (template) => {
        const next = cloneWithNewIds(template)
        commit((root) => {
          root.children = next.children ?? []
          root.styles = next.styles ?? {}
          root.props = { ...root.props, ...next.props }
        })
        set((s) => {
          s.selectedId = null
        })
      },
      restoreVersion: (data) => {
        commit((_root, state) => {
          state.root = data.root
          state.title = data.title
          state.slug = data.slug
        })
        set((s) => {
          s.selectedId = null
          s.hoveredId = null
        })
      },

      detach: (id) => {
        const state = get()
        const node = findNode(state.root, id)
        const blockId = node ? refBlockId(node) : null
        const tree = blockId ? state.blocks[blockId]?.tree : null
        if (!node || !tree) {
          get().toast('error', 'Chưa tải được bản gốc của block nên không thể tách.')
          return
        }
        // triển khai một cấp rồi cấp id mới: block lồng bên trong vẫn là liên kết
        const copy = cloneWithNewIds(expandRef(node, tree))
        if (get().replaceNode(id, copy)) get().toast('info', 'Đã tách khỏi block gốc. Phần tử này giờ độc lập.')
      },

      insertBlock: (type, target) => {
        const state = get()
        const t = target ?? defaultTarget(state.root, state.selectedId, type)
        const node = createNodeFromBlock(type)
        if (!t || !node) {
          get().toast('error', 'Không thể đặt phần tử ở vị trí này.')
          return null
        }
        if (!canDropAt(state.root, t, { kind: 'new', blockType: type })) return null
        commit((root) => insertNode(root, t, node))
        set((s) => {
          s.selectedId = node.id
        })
        return node.id
      },

      insertNode: (node, target) => {
        const parent = findNode(get().root, target.parentId)
        if (!parent || !canContain(parent.type, node.type)) return false
        commit((root) => insertNode(root, target, node))
        set((s) => {
          s.selectedId = node.id
        })
        return true
      },

      move: (id, target) => {
        const state = get()
        if (!canDropAt(state.root, target, { kind: 'move', nodeId: id })) return false
        // thử trên bản sao trước để không ghi lịch sử rỗng khi thả về đúng chỗ cũ
        const loc = findParent(state.root, id)
        if (loc && loc.parent.id === target.parentId && (loc.index === target.index || loc.index + 1 === target.index)) return false
        commit((root) => {
          moveNode(root, id, target)
        })
        return true
      },

      remove: (id) => {
        if (id === 'root') return
        const loc = findParent(get().root, id)
        if (!loc) return
        commit((root) => {
          removeNode(root, id)
        })
        set((s) => {
          if (s.selectedId && !findNode(s.root, s.selectedId)) {
            const siblings = loc.parent.children ?? []
            s.selectedId = siblings[loc.index + 1]?.id ?? siblings[loc.index - 1]?.id ?? (loc.parent.id === 'root' ? null : loc.parent.id)
            if (s.selectedId && !findNode(s.root, s.selectedId)) s.selectedId = null
          }
          if (s.hoveredId && !findNode(s.root, s.hoveredId)) s.hoveredId = null
        })
      },

      duplicate: (id) => {
        const state = get()
        const node = findNode(state.root, id)
        const loc = findParent(state.root, id)
        if (!node || !loc) return
        const copy = cloneWithNewIds(node)
        commit((root) => insertNode(root, { parentId: loc.parent.id, index: loc.index + 1 }, copy))
        set((s) => {
          s.selectedId = copy.id
        })
      },

      copy: (id) => {
        const node = findNode(get().root, id)
        if (!node || node.type === 'root') return
        set((s) => {
          s.clipboard = structuredClone(node)
        })
        get().toast('info', 'Đã sao chép phần tử.')
      },

      paste: () => {
        const state = get()
        if (!state.clipboard) return
        const copy = cloneWithNewIds(state.clipboard)
        const target = defaultTarget(state.root, state.selectedId, copy.type)
        if (!target) {
          get().toast('error', 'Không thể dán phần tử vào vị trí này.')
          return
        }
        get().insertNode(copy, target)
      },

      updateProps: (id, patch, historyKey) =>
        commit((root) => {
          const node = findNode(root, id)
          if (node) Object.assign(node.props, patch)
        }, historyKey),

      setStyle: (id, key, value, bucketOverride) => {
        const { device, styleState } = get()
        const bucket: StyleBucket = bucketOverride ?? (styleState === 'hover' ? 'hover' : device)
        commit((root) => {
          const node = findNode(root, id)
          if (!node) return
          node.styles ??= {}
          const map = (node.styles[bucket] ??= {})
          if (value === '') delete map[key]
          else map[key] = value
          if (Object.keys(map).length === 0) delete node.styles[bucket]
        }, `style:${id}:${bucket}:${key}`)
      },

      undo: () => {
        const { past, root } = get()
        if (!past.length) return
        set((s) => {
          s.future.push(root)
          s.root = s.past.pop()!
          s.dirty = true
          s.lastHistoryKey = null
          if (s.selectedId && !findNode(s.root, s.selectedId)) s.selectedId = null
        })
      },

      redo: () => {
        const { future, root } = get()
        if (!future.length) return
        set((s) => {
          s.past.push(root)
          s.root = s.future.pop()!
          s.dirty = true
          s.lastHistoryKey = null
          if (s.selectedId && !findNode(s.root, s.selectedId)) s.selectedId = null
        })
      },

      startDrag: (payload) =>
        set((s) => {
          s.drag = payload
          s.drop = null
        }),
      setDrop: (drop) =>
        set((s) => {
          s.drop = drop
        }),
      endDrag: () =>
        set((s) => {
          s.drag = null
          s.drop = null
        }),
      commitDrop: () => {
        const { drag, drop } = get()
        if (drag && drop) {
          const target = { parentId: drop.parentId, index: drop.index }
          if (drag.kind === 'new') get().insertBlock(drag.blockType, target)
          else if (drag.kind === 'block') get().insertMyBlock(drag.blockId, drag.linked, target)
          else if (get().move(drag.nodeId, target))
            set((s) => {
              s.selectedId = drag.nodeId
            })
        }
        get().endDrag()
      },

      setSaving: (saving) =>
        set((s) => {
          s.saving = saving
        }),
      markSaved: (status) =>
        set((s) => {
          s.status = status
          s.dirty = false
          s.saving = false
        }),
      toast: (kind, message) => {
        const id = ++toastSeq
        set((s) => {
          s.toasts.push({ id, kind, message })
        })
        setTimeout(() => get().dismissToast(id), kind === 'error' ? 6000 : 2500)
      },
      dismissToast: (id) =>
        set((s) => {
          s.toasts = s.toasts.filter((t) => t.id !== id)
        }),
    }
  }),
)
