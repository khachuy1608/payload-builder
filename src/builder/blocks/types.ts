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
  /** cập nhật tại chỗ: 'list' = danh sách, 'ctl' = block điều khiển (phân trang, xem thêm, tìm kiếm…) */
  'data-pn'?: 'list' | 'ctl'
  'data-pn-id'?: string
  'data-pn-sig'?: string
  'data-pn-nav'?: 'page' | 'more'
  /** Phần tử thuộc một My Block liên kết (chỉ trong editor): 'root' = gốc của block, '' = bên trong */
  'data-linked'?: 'root' | ''
  'data-fx-reveal'?: string
  'data-fx-once'?: string
  'data-fx-text'?: string
  'data-fx-words'?: string
  'data-fx-parallax'?: string
  'data-fx-hide'?: string
  'data-fx-hover'?: string
  'data-cond-hidden'?: string
  /** Hành động khi bấm (click.ts) */
  'data-click'?: string
  'data-click-href'?: string
  'data-click-target'?: string
  'data-click-newtab'?: string
  role?: string
  tabIndex?: number
  'aria-label'?: string
  style?: Record<string, string>
}

export interface RenderProps {
  node: BuilderNode
  attrs: NodeAttrs
  children?: ReactNode
  mode: RenderMode
}

export type BlockCategory = 'layout' | 'basic' | 'media' | 'nav' | 'data' | 'feedback' | 'overlay' | 'form'

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
