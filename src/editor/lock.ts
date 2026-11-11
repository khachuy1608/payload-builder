'use client'

/**
 * Khoá tài liệu khi nhiều người cùng sửa, dùng chính collection `payload-locked-documents` của Payload
 * (admin của Payload cũng dùng nó, nên admin và Visual Builder nhìn thấy khoá của nhau).
 * - Mở editor: nếu người khác đang giữ khoá còn hiệu lực -> chỉ xem (có thể chiếm quyền).
 * - Giữ khoá bằng nhịp tim mỗi 60s (Payload coi khoá quá 300s là hết hạn).
 * - Payload XOÁ khoá sau mỗi lần update, nên sau khi lưu phải lấy lại khoá.
 * - Lưu gửi `overrideLock=false` để server cũng từ chối khi khoá thuộc người khác (HTTP 423).
 */
import { useEditor } from './store'

export const LOCK_DURATION_MS = 300_000
export const LOCK_HEARTBEAT_MS = 60_000
const COLLECTION = 'payload-locked-documents'

export interface LockHolder {
  name: string
  email: string
  since: string
}

interface LockDoc {
  id: string | number
  updatedAt: string
  createdAt: string
  user?: { relationTo: string; value: string | number | { id: string | number; email?: string; name?: string } } | null
}

const idOf = (v: unknown): string => (v && typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

function lockCollection(): 'pages' | 'my-blocks' {
  return useEditor.getState().kind === 'block' ? 'my-blocks' : 'pages'
}

async function findLock(): Promise<LockDoc | null> {
  const s = useEditor.getState()
  const q = new URLSearchParams({
    'where[document.relationTo][equals]': lockCollection(),
    'where[document.value][equals]': s.pageId,
    sort: '-updatedAt',
    limit: '1',
    depth: '1',
  })
  const res = await fetch(`/api/${COLLECTION}?${q}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Không kiểm tra được khoá (${res.status})`)
  const { docs } = (await res.json()) as { docs: LockDoc[] }
  return docs[0] ?? null
}

async function createLock(): Promise<string> {
  const s = useEditor.getState()
  const num = (v: string) => (/^\d+$/.test(v) ? Number(v) : v)
  const res = await fetch(`/api/${COLLECTION}?depth=0`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document: { relationTo: lockCollection(), value: num(s.pageId) }, user: { relationTo: 'users', value: num(s.userId ?? '') } }),
  })
  if (!res.ok) throw new Error(`Không tạo được khoá (${res.status})`)
  return String((await res.json()).doc.id)
}

async function deleteLock(id: string, keepalive = false): Promise<void> {
  await fetch(`/api/${COLLECTION}/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include', keepalive }).catch(() => undefined)
}

/** Gia hạn khoá: trả về false nếu khoá không còn (bị xoá sau khi lưu / bị chiếm) */
async function touchLock(id: string): Promise<boolean> {
  const s = useEditor.getState()
  const res = await fetch(`/api/${COLLECTION}/${encodeURIComponent(id)}?depth=0`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: { relationTo: 'users', value: /^\d+$/.test(s.userId ?? '') ? Number(s.userId) : s.userId } }),
  })
  return res.ok
}

function holderOf(doc: LockDoc): LockHolder {
  const u = doc.user?.value
  const obj = u && typeof u === 'object' ? u : null
  return { name: obj?.name || obj?.email || 'người dùng khác', email: obj?.email ?? '', since: doc.createdAt }
}

/** Thế hệ khoá: releaseLock() tăng lên để lần lấy khoá đang dở biết mình đã bị huỷ (StrictMode mount 2 lần, rời trang) */
let generation = 0
/** Các thao tác khoá chạy tuần tự để không tạo 2 bản ghi song song */
let chain: Promise<unknown> = Promise.resolve()

/**
 * Lấy khoá cho tài liệu đang mở. `force` = chiếm quyền (xoá khoá của người khác).
 * Cập nhật store.lock và trả về trạng thái.
 */
export function acquireLock(force = false): Promise<'owned' | 'locked'> {
  const gen = generation
  const run = chain.then(() => doAcquire(force, gen))
  chain = run.catch(() => undefined)
  return run
}

async function doAcquire(force: boolean, gen: number): Promise<'owned' | 'locked'> {
  const s = useEditor.getState()
  if (!s.userId || !s.pageId) return 'owned'
  if (s.readOnly) {
    // chỉ xem (viewer / block của người khác): không giữ khoá, chỉ xem ai đang sửa
    const existing = await findLock().catch(() => null)
    if (existing && idOf(existing.user?.value) !== s.userId) {
      useEditor.getState().setLock({ state: 'locked', by: holderOf(existing) })
      return 'locked'
    }
    useEditor.getState().setLock({ state: 'off' })
    return 'owned'
  }
  if (gen !== generation) return 'owned' // đã rời trang trong lúc chờ
  try {
    const existing = await findLock()
    if (existing) {
      const other = idOf(existing.user?.value) !== s.userId
      const fresh = Date.now() - new Date(existing.updatedAt).getTime() <= LOCK_DURATION_MS
      if (other && fresh && !force) {
        useEditor.getState().setLock({ state: 'locked', by: holderOf(existing) })
        return 'locked'
      }
      // khoá của mình, khoá hết hạn hoặc chiếm quyền: thay bằng khoá mới
      await deleteLock(String(existing.id))
    }
    const lockId = await createLock()
    if (gen !== generation) {
      // bị huỷ trong lúc tạo (unmount): trả khoá ngay để không để lại khoá mồ côi
      await deleteLock(lockId)
      return 'owned'
    }
    useEditor.getState().setLock({ state: 'owned', lockId })
    return 'owned'
  } catch (err) {
    useEditor.getState().setLock({ state: 'error', message: (err as Error).message })
    return 'owned'
  }
}

/** Nhịp tim: gia hạn khoá; nếu khoá biến mất thì lấy lại (có thể phát hiện người khác đã chiếm) */
export async function heartbeatLock(): Promise<void> {
  const lock = useEditor.getState().lock
  if (lock.state !== 'owned' || !lock.lockId) return
  if (!(await touchLock(lock.lockId))) await acquireLock()
}

/** Thả khoá khi rời editor (keepalive để kịp gửi khi đóng tab) */
export function releaseLock(): void {
  generation++
  const lock = useEditor.getState().lock
  if (lock.state === 'owned' && lock.lockId) {
    useEditor.getState().setLock({ state: 'off' })
    void deleteLock(lock.lockId, true)
  }
}
