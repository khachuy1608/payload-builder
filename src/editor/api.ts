'use client'

import type { BuilderNode, PageContent } from '@/builder/types'
import { type MediaAccept, mediaWhereQuery } from '@/builder/files'
import type { MediaValue } from '@/builder/types'
import { normalizeTheme, type ThemeTokens } from '@/builder/theme'
import { genId } from '@/builder/tree'
import { normalizeContent, validateBlockTree, validateContent } from '@/builder/validate'
import { acquireLock } from './lock'
import { type BlockKind, type BlockScope, type MyBlock, type SaveStatus, type ThemeDoc, useEditor } from './store'

/** id quan hệ gửi lên Payload: số nếu là số (Postgres serial) */
/** ?locale= của ngôn ngữ đang sửa cho các request đọc/ghi nội dung localized */
const loc = () => `locale=${encodeURIComponent(useEditor.getState().locale || 'vi')}`

const relValue = (id: string | null) => (id == null ? null : /^\d+$/.test(id) ? Number(id) : id)

async function readError(res: Response): Promise<string> {
  if (res.status === 423) return 'Tài liệu đang được người khác sửa (bị khoá). Tải lại trang để xem ai đang giữ khoá hoặc chiếm quyền sửa.'
  try {
    const body = await res.json()
    const first = body?.errors?.[0]
    const fieldMsg = first?.data?.errors?.map((e: { message: string }) => e.message).join(', ')
    return fieldMsg || first?.message || body?.message || `Lỗi ${res.status}`
  } catch {
    return `Lỗi ${res.status}`
  }
}

/** Lưu trang qua REST API của Payload. publish=false: tạo bản nháp, không ảnh hưởng bản đã xuất bản */
export async function savePage(publish: boolean): Promise<boolean> {
  const s = useEditor.getState()
  if (s.kind === 'block') return saveBlock()
  if (s.saving) return false
  s.setSaving(true)
  const content: PageContent = { version: 1, root: s.root }
  try {
    // overrideLock=false: Payload từ chối (423) nếu người khác đang giữ khoá
    const res = await fetch(`/api/pages/${s.pageId}?depth=0&overrideLock=false&${loc()}${publish ? '' : '&draft=true'}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: s.title,
        slug: s.slug,
        content,
        theme: relValue(s.pageThemeId),
        templateCollection: s.template?.collection ?? null,
        templateField: s.template?.field ?? 'id',
        layout: { hideHeader: s.layout.hideHeader, hideFooter: s.layout.hideFooter },
        versionNote: s.versionNote.trim() || null,
        seo: { metaTitle: s.seo.metaTitle || null, metaDescription: s.seo.metaDescription || null, ogImage: s.seo.ogImage ? relValue(String(s.seo.ogImage.id)) : null, noIndex: s.seo.noIndex, canonical: s.seo.canonical || null },
        _status: publish ? 'published' : 'draft',
      }),
    })
    if (!res.ok) throw new Error(await readError(res))
    const { doc } = await res.json()
    if (doc?.slug && doc.slug !== s.slug) useEditor.getState().setMeta({ slug: doc.slug })
    useEditor.getState().markSaved(publish ? 'published' : 'draft')
    useEditor.getState().setVersionNote('')
    useEditor.getState().toast('success', publish ? 'Đã xuất bản.' : 'Đã lưu bản nháp.')
    void acquireLock() // Payload xoá khoá sau mỗi lần update -> lấy lại
    return true
  } catch (err) {
    useEditor.getState().setSaving(false)
    useEditor.getState().toast('error', `Lưu thất bại: ${(err as Error).message}`)
    void acquireLock() // 423: cập nhật băng rôn "đang được X sửa"
    return false
  }
}

export interface MediaDoc {
  id: string | number
  url: string
  alt?: string
  filename?: string
  width?: number
  height?: number
  mimeType?: string
  filesize?: number
  sizes?: MediaValue['sizes']
}

export function toMediaValue(doc: MediaDoc): MediaValue {
  return { id: doc.id, url: doc.url, alt: doc.alt ?? '', width: doc.width, height: doc.height, mimeType: doc.mimeType, ...(doc.filename ? { filename: doc.filename } : {}), ...(doc.filesize ? { filesize: doc.filesize } : {}), ...(doc.sizes ? { sizes: doc.sizes } : {}) }
}

/** Thư viện media theo trang; `accept` lọc đúng loại (ảnh / video / tài liệu) ngay từ server */
export async function listMedia(page = 1, accept?: MediaAccept): Promise<{ docs: MediaDoc[]; hasNextPage: boolean }> {
  const filter = accept ? `&${mediaWhereQuery(accept)}` : ''
  const res = await fetch(`/api/media?limit=40&page=${page}&sort=-createdAt&depth=0${filter}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function uploadMedia(file: File, alt: string): Promise<MediaDoc> {
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt }))
  const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body: form })
  if (!res.ok) throw new Error(await readError(res))
  const { doc } = await res.json()
  return doc
}

// ======================= My Blocks =======================

export interface MyBlockDoc {
  id: string | number
  name: string
  scope: BlockScope
  kind?: BlockKind
  owner?: string | number | { id: string | number } | null
  tree: unknown
  thumbnail?: MediaDoc | string | number | null
  updatedAt: string
}

/** Chuẩn hoá doc từ API thành MyBlock dùng trong editor; null nếu cây dữ liệu hỏng */
export function toMyBlock(doc: MyBlockDoc): MyBlock | null {
  const kind: BlockKind = doc.kind === 'page' ? 'page' : 'block'
  let tree: BuilderNode
  try {
    // mẫu trang: cây là root của trang; block thường: một phần tử
    tree = kind === 'page' ? validateContent({ version: 1, root: doc.tree }).root : validateBlockTree(doc.tree)
  } catch {
    return null
  }
  const owner = doc.owner == null ? null : typeof doc.owner === 'object' ? String(doc.owner.id) : String(doc.owner)
  const thumb = doc.thumbnail && typeof doc.thumbnail === 'object' && doc.thumbnail.url ? toMediaValue(doc.thumbnail) : null
  return { id: String(doc.id), name: doc.name, scope: doc.scope === 'shared' ? 'shared' : 'private', kind, owner, tree, thumbnail: thumb, updatedAt: doc.updatedAt }
}

export async function listMyBlocks(): Promise<MyBlock[]> {
  const res = await fetch(`/api/my-blocks?limit=300&depth=1&sort=-updatedAt&${loc()}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  const { docs } = (await res.json()) as { docs: MyBlockDoc[] }
  return docs.map(toMyBlock).filter((b): b is MyBlock => b !== null)
}

/** Lấy một block theo id; null nếu không tồn tại / không có quyền */
export async function getMyBlock(id: string): Promise<MyBlock | null> {
  const res = await fetch(`/api/my-blocks/${encodeURIComponent(id)}?depth=1&${loc()}`, { credentials: 'include' })
  if (res.status === 404 || res.status === 403) return null
  if (!res.ok) throw new Error(await readError(res))
  return toMyBlock(await res.json())
}

export async function createMyBlock(data: { name: string; scope: BlockScope; tree: BuilderNode; kind?: BlockKind }): Promise<MyBlock> {
  const res = await fetch(`/api/my-blocks?depth=1&${loc()}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readError(res))
  const { doc } = await res.json()
  const block = toMyBlock(doc)
  if (!block) throw new Error('Dữ liệu block trả về không hợp lệ.')
  return block
}

export async function updateMyBlock(id: string, data: Partial<{ name: string; scope: BlockScope; tree: BuilderNode }>, respectLock = false): Promise<MyBlock> {
  const res = await fetch(`/api/my-blocks/${encodeURIComponent(id)}?depth=1&${loc()}${respectLock ? '&overrideLock=false' : ''}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readError(res))
  const { doc } = await res.json()
  const block = toMyBlock(doc)
  if (!block) throw new Error('Dữ liệu block trả về không hợp lệ.')
  return block
}

export async function deleteMyBlock(id: string): Promise<void> {
  const res = await fetch(`/api/my-blocks/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
}

/** Nạp thư viện vào store (gọi khi mở editor, khi quay lại tab, sau khi lưu block) */
export async function refreshBlockLibrary(): Promise<void> {
  const s = useEditor.getState()
  if (s.blocksStatus === 'loading') return
  s.setBlocksStatus('loading')
  try {
    s.setBlocks(await listMyBlocks())
  } catch (err) {
    useEditor.getState().setBlocksStatus('error')
    useEditor.getState().toast('error', `Không tải được thư viện My Blocks: ${(err as Error).message}`)
  }
}

/**
 * Lưu bản gốc của block đang sửa (kind = block). Canvas là root chứa đúng một phần tử;
 * nếu người dùng thêm nhiều phần tử ở cấp cao nhất thì gói chúng vào một Div.
 */
export async function saveBlock(): Promise<boolean> {
  const s = useEditor.getState()
  if (s.saving) return false
  const kids = s.root.children ?? []
  if (!kids.length) {
    s.toast('error', 'Block đang trống. Hãy thêm ít nhất một phần tử.')
    return false
  }
  const tree: BuilderNode = kids.length === 1 ? kids[0] : { id: genId(), type: 'div', props: {}, styles: {}, children: kids }
  if (tree.type === 'blockRef') {
    s.toast('error', 'Block không thể chỉ gồm một liên kết tới block khác. Hãy tách nó ra hoặc bọc trong một Div.')
    return false
  }
  s.setSaving(true)
  try {
    const block = await updateMyBlock(s.pageId, { name: s.title.trim() || 'Block chưa đặt tên', scope: s.scope, tree }, true)
    useEditor.getState().upsertBlock(block)
    useEditor.getState().markSaved('published')
    useEditor.getState().toast('success', 'Đã lưu block. Các trang dùng liên kết sẽ tự cập nhật.')
    void acquireLock()
    return true
  } catch (err) {
    useEditor.getState().setSaving(false)
    useEditor.getState().toast('error', `Lưu thất bại: ${(err as Error).message}`)
    void acquireLock()
    return false
  }
}

// ======================= Themes =======================

export interface ThemeApiDoc {
  id: string | number
  name: string
  isPreset?: boolean | null
  owner?: string | number | { id: string | number } | null
  updatedAt: string
  [key: string]: unknown
}

export function toThemeDoc(doc: ThemeApiDoc): ThemeDoc {
  const owner = doc.owner == null ? null : typeof doc.owner === 'object' ? String(doc.owner.id) : String(doc.owner)
  return { id: String(doc.id), name: doc.name, isPreset: !!doc.isPreset, owner, tokens: normalizeTheme(doc), updatedAt: doc.updatedAt }
}

/** Token -> body gửi lên collection themes (group field phẳng) */
function themeBody(name: string, tokens: ThemeTokens) {
  return { name, colors: tokens.colors, fonts: tokens.fonts, radius: tokens.radius, button: tokens.button, spacing: tokens.spacing, text: tokens.text, shadow: tokens.shadow, layout: tokens.layout, textStyles: tokens.textStyles, fontUrl: tokens.fontUrl ?? null }
}

export async function listThemes(): Promise<ThemeDoc[]> {
  const res = await fetch('/api/themes?limit=100&depth=0&sort=name', { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  const { docs } = (await res.json()) as { docs: ThemeApiDoc[] }
  return docs.map(toThemeDoc)
}

export async function getSiteThemeId(): Promise<string | null> {
  const res = await fetch('/api/globals/site-settings?depth=0', { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  const doc = await res.json()
  const t = doc?.theme
  return t == null ? null : String(typeof t === 'object' ? t.id : t)
}

/** Chọn My Block làm header/footer toàn site (ghi vào Cài đặt site) */
export async function setSitePart(part: 'header' | 'footer', blockId: string | null): Promise<void> {
  const res = await fetch('/api/globals/site-settings', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [part]: relValue(blockId) }),
  })
  if (!res.ok) throw new Error(await readError(res))
  const s = useEditor.getState()
  s.setSiteParts({ ...s.siteParts, [part]: blockId })
}

export async function setSiteTheme(id: string | null): Promise<void> {
  const res = await fetch('/api/globals/site-settings?depth=0', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: relValue(id) }),
  })
  if (!res.ok) throw new Error(await readError(res))
}

export async function createTheme(name: string, tokens: ThemeTokens): Promise<ThemeDoc> {
  const res = await fetch('/api/themes?depth=0', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(themeBody(name, tokens)),
  })
  if (!res.ok) throw new Error(await readError(res))
  return toThemeDoc((await res.json()).doc)
}

export async function updateTheme(id: string, name: string, tokens: ThemeTokens): Promise<ThemeDoc> {
  const res = await fetch(`/api/themes/${encodeURIComponent(id)}?depth=0`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(themeBody(name, tokens)),
  })
  if (!res.ok) throw new Error(await readError(res))
  return toThemeDoc((await res.json()).doc)
}

export async function deleteTheme(id: string): Promise<void> {
  const res = await fetch(`/api/themes/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
}

/** Nạp thư viện theme + theme của site vào store */
export async function refreshThemes(): Promise<void> {
  const s = useEditor.getState()
  if (s.themesStatus === 'loading') return
  s.setThemesStatus('loading')
  try {
    const [list, siteId] = await Promise.all([listThemes(), getSiteThemeId()])
    useEditor.getState().setThemes(list, siteId)
  } catch (err) {
    useEditor.getState().setThemesStatus('error')
    useEditor.getState().toast('error', `Không tải được theme: ${(err as Error).message}`)
  }
}

// ======================= Lịch sử phiên bản =======================

export interface PageVersion {
  id: string
  title: string
  slug: string
  status: SaveStatus
  content: PageContent
  updatedAt: string
  note: string
}

export async function listVersions(pageId: string): Promise<PageVersion[]> {
  const q = new URLSearchParams({ 'where[parent][equals]': pageId, sort: '-updatedAt', limit: '40', depth: '0', locale: useEditor.getState().locale || 'vi' })
  const res = await fetch(`/api/pages/versions?${q}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  const { docs } = (await res.json()) as { docs: { id: string | number; updatedAt: string; version: { title?: string; slug?: string; _status?: string; content?: unknown; versionNote?: string | null } }[] }
  return docs.map((d) => ({
    id: String(d.id),
    title: d.version.title ?? '',
    slug: d.version.slug ?? '',
    status: d.version._status === 'published' ? 'published' : 'draft',
    content: normalizeContent(d.version.content),
    updatedAt: d.updatedAt,
    note: d.version.versionNote ?? '',
  }))
}

// ======================= Lên lịch xuất bản =======================

export interface ScheduledJob {
  id: string
  type: 'publish' | 'unpublish'
  waitUntil: string
}

export async function listSchedules(pageId: string): Promise<ScheduledJob[]> {
  const res = await fetch(`/api/builder/schedule?pageId=${encodeURIComponent(pageId)}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { jobs: ScheduledJob[] }).jobs
}

export async function createSchedule(pageId: string, at: Date, type: 'publish' | 'unpublish'): Promise<ScheduledJob> {
  const res = await fetch('/api/builder/schedule', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId, at: at.toISOString(), type }) })
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { job: ScheduledJob }).job
}

export async function cancelSchedule(jobId: string): Promise<void> {
  const res = await fetch(`/api/builder/schedule/${encodeURIComponent(jobId)}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
}

// ======================= Nguồn dữ liệu (data binding) =======================

import { buildWhere, type DataResult, type DataSource, projectRecord, type SourceInfo } from '@/builder/data'

export async function fetchSources(): Promise<SourceInfo[]> {
  const res = await fetch('/api/builder/sources', { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { sources: SourceInfo[] }).sources
}

/** Lấy bản ghi cho một nguồn dữ liệu qua REST (người dùng đã đăng nhập); chỉ giữ trường công khai như server */
export async function fetchData(source: DataSource, info: SourceInfo | undefined): Promise<DataResult> {
  const limit = source.mode === 'one' ? 1 : (source.limit ?? 12)
  const q = new URLSearchParams({ limit: String(limit), depth: '1', page: '1', locale: useEditor.getState().locale || 'vi' })
  if (source.sort) q.set('sort', source.sort)
  const where = buildWhere(source)
  if (where) q.set('where', JSON.stringify(where))
  const res = await fetch(`/api/${encodeURIComponent(source.collection)}?${q}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  const body = (await res.json()) as { docs: Record<string, unknown>[]; totalDocs: number; totalPages: number; page: number }
  const expose = info ? info.fields.map((f) => f.name) : []
  return { records: body.docs.map((d) => (expose.length ? projectRecord(d, expose) : d)), total: body.totalDocs, totalPages: Math.max(1, body.totalPages), page: body.page ?? 1, limit }
}

// ======================= Gợi ý của tôi (style-presets) =======================

import type { BlockPreset } from '@/builder/presets'
import type { NodeStyles } from '@/builder/types'

export interface MyPreset extends BlockPreset {
  docId: string
  blockType: string
  scope: BlockScope
  owner: string | null
}

function toMyPreset(doc: Record<string, unknown>): MyPreset {
  const owner = doc.owner == null ? null : typeof doc.owner === 'object' ? String((doc.owner as { id: unknown }).id) : String(doc.owner)
  return { id: `my-${doc.id}`, docId: String(doc.id), label: String(doc.name ?? ''), blockType: String(doc.blockType ?? ''), scope: doc.scope === 'shared' ? 'shared' : 'private', owner, props: (doc.props as Record<string, unknown>) ?? {}, styles: (doc.styles as NodeStyles) ?? {}, group: 'Gợi ý của tôi' }
}

export async function listMyPresets(blockType: string): Promise<MyPreset[]> {
  const q = new URLSearchParams({ 'where[blockType][equals]': blockType, limit: '100', depth: '0', sort: '-updatedAt' })
  const res = await fetch(`/api/style-presets?${q}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { docs: Record<string, unknown>[] }).docs.map(toMyPreset)
}

export async function createMyPreset(data: { name: string; blockType: string; scope: BlockScope; props: Record<string, unknown>; styles: NodeStyles }): Promise<MyPreset> {
  const res = await fetch('/api/style-presets?depth=0', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error(await readError(res))
  return toMyPreset((await res.json()).doc)
}

export async function deleteMyPreset(docId: string): Promise<void> {
  const res = await fetch(`/api/style-presets/${encodeURIComponent(docId)}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
}

// ======================= Bình luận & hiện diện =======================

export interface CommentDoc {
  id: string
  nodeId: string
  text: string
  resolved: boolean
  /** Tác giả: tên + ảnh đại diện (ảnh nhỏ nếu có) */
  author: { id: string; name: string; avatar: string | null } | null
  createdAt: string
}

type RawAvatar = { url?: string | null; sizes?: { thumbnail?: { url?: string | null } } } | string | number | null
type RawComment = { id: string | number; nodeId: string; text: string; resolved?: boolean; createdAt: string; author?: { id: string | number; name?: string | null; email?: string; avatar?: RawAvatar } | string | number | null }
const avatarUrl = (a: RawAvatar | undefined): string | null => (a && typeof a === 'object' ? a.sizes?.thumbnail?.url || a.url || null : null)
/**
 * Chỉ lấy các trường cần cho bình luận + tên/ảnh đại diện tác giả (không kéo kèm nội dung trang như depth=1 trước đây)
 */
const COMMENT_QUERY = [
  'depth=2',
  ...['nodeId', 'text', 'resolved', 'createdAt', 'author'].map((f) => `select[${f}]=true`),
  ...['name', 'email', 'avatar'].map((f) => `populate[users][${f}]=true`),
  // url của media được tính từ filename -> phải lấy kèm filename
  'populate[media][url]=true',
  'populate[media][filename]=true',
  'populate[media][sizes]=true',
].join('&')
const toComment = (c: RawComment): CommentDoc => ({
  id: String(c.id),
  nodeId: c.nodeId,
  text: c.text,
  resolved: !!c.resolved,
  author: c.author && typeof c.author === 'object' ? { id: String(c.author.id), name: c.author.name || c.author.email || '', avatar: avatarUrl(c.author.avatar) } : c.author != null ? { id: String(c.author), name: '', avatar: null } : null,
  createdAt: c.createdAt,
})

export async function listComments(pageId: string): Promise<CommentDoc[]> {
  const q = new URLSearchParams({ 'where[page][equals]': pageId, sort: '-createdAt', limit: '200' })
  const res = await fetch(`/api/comments?${q}&${COMMENT_QUERY}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { docs: RawComment[] }).docs.map(toComment)
}

export async function createComment(data: { pageId: string; nodeId: string; text: string }): Promise<CommentDoc> {
  const res = await fetch(`/api/comments?${COMMENT_QUERY}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: relValue(data.pageId), nodeId: data.nodeId, text: data.text }) })
  if (!res.ok) throw new Error(await readError(res))
  return toComment(((await res.json()) as { doc: RawComment }).doc)
}

export async function updateComment(id: string, patch: { resolved?: boolean; text?: string }): Promise<CommentDoc> {
  const res = await fetch(`/api/comments/${encodeURIComponent(id)}?${COMMENT_QUERY}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
  if (!res.ok) throw new Error(await readError(res))
  return toComment(((await res.json()) as { doc: RawComment }).doc)
}

export async function deleteComment(id: string): Promise<void> {
  const res = await fetch(`/api/comments/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(await readError(res))
}

export interface PresenceUser {
  id: string
  name: string
}

/** Gửi nhịp hiện diện; trả về những người khác đang mở cùng tài liệu */
export async function heartbeatPresence(room: string): Promise<PresenceUser[]> {
  const res = await fetch('/api/builder/presence', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room }) })
  if (!res.ok) throw new Error(await readError(res))
  return ((await res.json()) as { others: PresenceUser[] }).others
}

export function leavePresence(room: string): void {
  try {
    fetch('/api/builder/presence', { method: 'POST', credentials: 'include', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room, leave: true }) }).catch(() => undefined)
  } catch {
    /* đang đóng tab */
  }
}
