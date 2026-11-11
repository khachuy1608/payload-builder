/**
 * Renderer dùng chung cho front-end (Server Component) và canvas của editor (client).
 * Không dùng hook nên chạy được ở cả hai phía.
 */
import { memo } from 'react'
import { BuilderRuntime } from './blocks/Runtime'
import type { NodeAttrs, RenderMode } from './blocks/types'
import { compileTreeCss } from './css'
import { normalizeFx } from './effects'
import type { BlockLookup } from './refs'
import { resolveRefs } from './refs'
import { getBlock } from './registry'
import { getSchema, ID_PATTERN } from './schema'
import { defaultTheme, type ThemeTokens, themeToCss } from './theme'
import type { AdvancedProps, BuilderNode, PageContent } from './types'

const CLASS_PATTERN = /^[A-Za-z_-][A-Za-z0-9_-]*$/

function buildAttrs(node: BuilderNode, mode: RenderMode): NodeAttrs {
  const adv = node.props as AdvancedProps
  const classes = [`n-${node.id}`, `b-${node.type}`]
  for (const c of String(adv.cssClass ?? '').split(/\s+/)) if (CLASS_PATTERN.test(c)) classes.push(c)
  const attrs: NodeAttrs = { className: classes.join(' ') }
  if (adv.cssId && CLASS_PATTERN.test(adv.cssId)) attrs.id = adv.cssId
  const fx = normalizeFx((node.props as { fx?: unknown }).fx)
  if (fx) {
    if (fx.reveal) {
      attrs['data-fx-reveal'] = fx.reveal
      if (fx.once === false) attrs['data-fx-once'] = 'false'
    }
    if (fx.text) {
      attrs['data-fx-text'] = fx.text
      if (fx.words) attrs['data-fx-words'] = fx.words
    }
    if (fx.parallax) attrs['data-fx-parallax'] = String(fx.parallax)
    if (fx.hideOnScroll) attrs['data-fx-hide'] = ''
    if (fx.hover === 'spotlight') attrs['data-fx-hover'] = 'spotlight'
  }
  if (mode === 'editor') {
    if (node.linked === 'inner') {
      // phần tử bên trong block liên kết: không có data-node-id nên bấm/kéo vào đâu cũng trỏ về cả block
      attrs['data-linked'] = ''
      return attrs
    }
    attrs['data-node-id'] = node.id
    attrs['data-node-type'] = node.linked === 'root' ? 'blockRef' : node.type
    if (node.linked === 'root') attrs['data-linked'] = 'root'
    else if (getSchema(node.type)?.isContainer && !node.children?.length) attrs['data-empty'] = ''
  }
  return attrs
}

function RenderNodeInner({ node, mode }: { node: BuilderNode; mode: RenderMode }) {
  if (!ID_PATTERN.test(node.id)) return null
  const def = getBlock(node.type)
  if (!def) {
    return mode === 'editor' ? (
      <div data-node-id={node.id} className="bld-ph">
        Block không xác định: {node.type}
      </div>
    ) : null
  }
  const children = node.children?.map((child) => <RenderNode key={child.id} node={child} mode={mode} />)
  // Block sửa chữ trực tiếp: đổi key khi chữ đổi để React dựng lại DOM mà contentEditable đã chạm vào
  const key = def.inlineEdit ? `${node.id}:${String(node.props[def.inlineEdit.prop] ?? '')}` : node.id
  return (
    <def.Render key={key} node={node} attrs={buildAttrs(node, mode)} mode={mode}>
      {children}
    </def.Render>
  )
}

/** memo theo tham chiếu node: immer giữ nguyên object không đổi nên chỉ nhánh bị sửa mới render lại */
export const RenderNode = memo(RenderNodeInner)

/**
 * Render cả trang. `blocks` là cây gốc của các My Block được tham chiếu (xem lib/blocks.ts);
 * các node blockRef được triển khai trước khi biên dịch CSS và render.
 * `theme` là token hiệu lực của trang (lib/themes.ts) – phát thành CSS variables ngay tại đây.
 */
export function PageRenderer({
  content,
  mode = 'live',
  blocks,
  theme = defaultTheme,
}: {
  content: PageContent
  mode?: RenderMode
  blocks?: Map<string, BuilderNode> | BlockLookup
  theme?: ThemeTokens
}) {
  const lookup: BlockLookup = typeof blocks === 'function' ? blocks : (id) => blocks?.get(id)
  const root = resolveRefs(content.root, lookup)
  const css = compileTreeCss(root)
  return (
    <>
      {theme.fontUrl && <link rel="stylesheet" href={theme.fontUrl} />}
      <style data-builder-theme="" dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />
      <style data-builder-css="" dangerouslySetInnerHTML={{ __html: css }} />
      <RenderNode node={root} mode={mode} />
      <BuilderRuntime mode={mode} />
    </>
  )
}
