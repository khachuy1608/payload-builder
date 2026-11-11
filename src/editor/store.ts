'use client'

/**
 * State của Visual Editor: cây node, lựa chọn, thiết bị, lịch sử undo/redo, kéo thả, lưu.
 * Dùng zustand + immer: mỗi thao tác tạo cây mới nhưng chia sẻ các nhánh không đổi,
 * nên lịch sử chỉ là mảng các root cũ (rẻ) và RenderNode memo chỉ render lại nhánh bị sửa.
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { getBlock } from '@/builder/registry'
import { canContain } from '@/builder/schema'
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
import type { BuilderNode, Device, DropTarget, StyleBucket, StyleState } from '@/builder/types'

export type DragPayload = { kind: 'new'; blockType: string } | { kind: 'move'; nodeId: string }

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
  pageId: string
  title: string
  slug: string
  status: SaveStatus
  root: BuilderNode

  selectedId: string | null
  hoveredId: string | null
  editingId: string | null
  device: Device
  styleState: StyleState
  leftTab: 'elements' | 'navigator'

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
  init(data: { pageId: string; title: string; slug: string; status: SaveStatus; root: BuilderNode }): void
  select(id: string | null): void
  hover(id: string | null): void
  setEditing(id: string | null): void
  setDevice(device: Device): void
  setStyleState(state: StyleState): void
  setLeftTab(tab: EditorState['leftTab']): void
  setMeta(patch: { title?: string; slug?: string }): void

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
  if (drag.kind === 'new') return canContain(parent.type, drag.blockType)
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
      pageId: '',
      title: '',
      slug: '',
      status: 'draft',
      root: { id: 'root', type: 'root', props: {}, styles: {}, children: [] },
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
          s.pageId = data.pageId
          s.title = data.title
          s.slug = data.slug
          s.status = data.status
          s.root = data.root
          s.past = []
          s.future = []
          s.dirty = false
          s.selectedId = null
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
          s.dirty = true
        }),

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
