/**
 * Renderer dùng chung cho front-end (Server Component) và canvas của editor (client).
 * Không dùng hook nên chạy được ở cả hai phía.
 */
import { memo } from 'react'
import type { NodeAttrs, RenderMode } from './blocks/types'
import { compileTreeCss } from './css'
import { getBlock } from './registry'
import { getSchema, ID_PATTERN } from './schema'
import type { AdvancedProps, BuilderNode, PageContent } from './types'

const CLASS_PATTERN = /^[A-Za-z_-][A-Za-z0-9_-]*$/

function buildAttrs(node: BuilderNode, mode: RenderMode): NodeAttrs {
  const adv = node.props as AdvancedProps
  const classes = [`n-${node.id}`, `b-${node.type}`]
  for (const c of String(adv.cssClass ?? '').split(/\s+/)) if (CLASS_PATTERN.test(c)) classes.push(c)
  const attrs: NodeAttrs = { className: classes.join(' ') }
  if (adv.cssId && CLASS_PATTERN.test(adv.cssId)) attrs.id = adv.cssId
  if (mode === 'editor') {
    attrs['data-node-id'] = node.id
    attrs['data-node-type'] = node.type
    if (getSchema(node.type)?.isContainer && !node.children?.length) attrs['data-empty'] = ''
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

export function PageRenderer({ content, mode = 'live' }: { content: PageContent; mode?: RenderMode }) {
  const css = compileTreeCss(content.root)
  return (
    <>
      <style data-builder-css="" dangerouslySetInnerHTML={{ __html: css }} />
      <RenderNode node={content.root} mode={mode} />
    </>
  )
}
