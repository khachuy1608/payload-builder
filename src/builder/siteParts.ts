/**
 * Header / footer toàn site: hai My Block (chọn trong Cài đặt site) được chèn tự động vào đầu và cuối mọi trang
 * dưới dạng node blockRef có id cố định. Trang có thể tắt từng phần (pages.layout.hideHeader / hideFooter).
 * Node không được lưu vào nội dung trang – chỉ chèn lúc render (front-end) và lúc hiển thị canvas (editor).
 */
import { BLOCK_REF_TYPE } from './refs'
import type { BuilderNode } from './types'

export const SITE_HEADER_ID = 'site-header'
export const SITE_FOOTER_ID = 'site-footer'

export type SitePart = 'header' | 'footer'
export interface SiteParts {
  header: string | null
  footer: string | null
}
export interface PageLayout {
  hideHeader: boolean
  hideFooter: boolean
}

export const SITE_PART_LABELS: Record<SitePart, string> = { header: 'Header toàn site', footer: 'Footer toàn site' }

export function sitePartOf(id: string | null | undefined): SitePart | null {
  return id === SITE_HEADER_ID ? 'header' : id === SITE_FOOTER_ID ? 'footer' : null
}

export function sitePartNode(part: SitePart, blockId: string): BuilderNode {
  return { id: part === 'header' ? SITE_HEADER_ID : SITE_FOOTER_ID, type: BLOCK_REF_TYPE, props: { blockId }, styles: {} }
}

/** Cây root mới có header/footer toàn site chèn vào (root cũ không bị sửa; không có phần nào thì trả về chính root) */
export function withSiteParts(root: BuilderNode, parts: SiteParts | null | undefined, layout?: Partial<PageLayout> | null): BuilderNode {
  const header = parts?.header && !layout?.hideHeader ? sitePartNode('header', parts.header) : null
  const footer = parts?.footer && !layout?.hideFooter ? sitePartNode('footer', parts.footer) : null
  if (!header && !footer) return root
  return { ...root, children: [...(header ? [header] : []), ...(root.children ?? []), ...(footer ? [footer] : [])] }
}

/** Đọc id block header/footer từ doc site-settings (quan hệ có thể là id hoặc object) */
export function sitePartsFrom(settings: Record<string, unknown> | null | undefined): SiteParts {
  const idOf = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id?: unknown }).id ?? '') || null : String(v))
  return { header: idOf(settings?.header), footer: idOf(settings?.footer) }
}

export function pageLayoutFrom(doc: Record<string, unknown> | null | undefined): PageLayout {
  const l = (doc?.layout ?? {}) as Partial<PageLayout>
  return { hideHeader: !!l.hideHeader, hideFooter: !!l.hideFooter }
}
