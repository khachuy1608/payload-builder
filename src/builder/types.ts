/**
 * Kiểu dữ liệu cốt lõi của page builder.
 * Nội dung một trang = một cây BuilderNode, lưu trong field `content` (JSON) của collection `pages`.
 */

export type Device = 'desktop' | 'tablet' | 'mobile'
export const DEVICES: Device[] = ['desktop', 'tablet', 'mobile']

/** 'normal' sửa style theo thiết bị đang chọn, 'hover' sửa style khi rê chuột (áp dụng mọi thiết bị) */
export type StyleState = 'normal' | 'hover'

/** Thuộc tính CSS dạng camelCase -> giá trị, ví dụ { fontSize: '24px', color: 'var(--color-primary)' } */
export type StyleMap = Record<string, string>

export interface NodeStyles {
  desktop?: StyleMap
  tablet?: StyleMap
  mobile?: StyleMap
  hover?: StyleMap
}

export type StyleBucket = keyof NodeStyles

export interface BuilderNode {
  id: string
  type: string
  props: Record<string, unknown>
  styles: NodeStyles
  children?: BuilderNode[]
  /**
   * CHỈ có trong cây đã triển khai (resolveRefs), không bao giờ được lưu:
   * 'root'  = phần tử gốc của một My Block liên kết (id = id của node blockRef trên trang),
   * 'inner' = phần tử bên trong block liên kết (chỉ đọc trong editor).
   */
  linked?: 'root' | 'inner'
}

export interface PageContent {
  version: 1
  root: BuilderNode
}

/** Vị trí thả: chèn vào `parentId` tại chỉ số `index` */
export interface DropTarget {
  parentId: string
  index: number
}

/** Thuộc tính "Nâng cao" mà mọi block đều có */
export interface AdvancedProps {
  cssId?: string
  cssClass?: string
  hide?: Partial<Record<Device, boolean>>
  /** Hiệu ứng (xem effects.ts) */
  fx?: import('./effects').FxProps
}

export interface MediaValue {
  id: string | number
  url: string
  alt?: string
  width?: number
  height?: number
  mimeType?: string
}

/** Props của node `blockRef` (My Block dạng liên kết) */
export interface BlockRefProps extends AdvancedProps {
  blockId?: string
  /** Tên block tại lúc chèn – chỉ để hiển thị khi chưa tải được bản gốc */
  name?: string
}
