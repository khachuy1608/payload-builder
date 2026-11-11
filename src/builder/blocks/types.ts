import type { ComponentType, ReactNode } from 'react'
import type { ContentControl } from '../controls'
import type { BuilderNode, NodeStyles } from '../types'

export type RenderMode = 'editor' | 'live'

export interface NodeAttrs {
  className: string
  id?: string
  'data-node-id'?: string
  'data-node-type'?: string
  'data-empty'?: ''
  /** Phần tử thuộc một My Block liên kết (chỉ trong editor): 'root' = gốc của block, '' = bên trong */
  'data-linked'?: 'root' | ''
}

export interface RenderProps {
  node: BuilderNode
  attrs: NodeAttrs
  children?: ReactNode
  mode: RenderMode
}

export type BlockCategory = 'layout' | 'basic' | 'media'

export interface BlockDefinition {
  type: string
  label: string
  category: BlockCategory
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  /** Giá trị khởi tạo khi kéo block mới vào trang */
  defaults: () => { props: Record<string, unknown>; styles: NodeStyles; children?: BuilderNode[] }
  contentControls: ContentControl[]
  /** id các nhóm trong STYLE_GROUPS */
  styleGroups: string[]
  /** Cho phép double-click để sửa chữ trực tiếp trên canvas. rich = HTML inline (đậm/nghiêng/link) */
  inlineEdit?: { prop: string; multiline?: boolean; rich?: boolean }
  Render: ComponentType<RenderProps>
}
