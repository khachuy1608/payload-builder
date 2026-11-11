import { getBlock } from '@/builder/registry'
import { richToPlain } from '@/builder/sanitize'
import type { BuilderNode } from '@/builder/types'

/** Nhãn ngắn của một node để hiện ở Cấu trúc, thanh công cụ và panel phải */
export function nodeLabel(node: BuilderNode): string {
  const def = getBlock(node.type)
  if (node.type === 'tab') return `Tab: ${String(node.props.title ?? '')}`
  if (node.type === 'blockRef') return `Block: ${String(node.props.name || '#' + String(node.props.blockId ?? ''))}`
  if (node.type === 'heading' || node.type === 'button') return `${def?.label}: ${String(node.props.text ?? '').slice(0, 24)}`
  if (node.type === 'paragraph') return `${def?.label}: ${richToPlain(node.props.text).slice(0, 24)}`
  return def?.label ?? node.type
}
