/**
 * Ràng buộc cấu trúc của từng loại block – thuần dữ liệu, không import React.
 * Dùng chung cho: editor (kiểm tra kéo thả), hook validate phía server, và registry.
 */

export interface BlockSchema {
  /** Có chứa block con được không */
  isContainer: boolean
  /** Nếu có: chỉ những type này được làm con */
  allowedChildren?: string[]
  /** Nếu có: block này chỉ được nằm trong những type này */
  allowedParents?: string[]
  /** Không hiện trong panel Elements (root, tab) */
  hidden?: boolean
}

export const BLOCK_SCHEMAS: Record<string, BlockSchema> = {
  root: { isContainer: true, hidden: true },
  div: { isContainer: true },
  flexbox: { isContainer: true },
  tabs: { isContainer: true, allowedChildren: ['tab'] },
  tab: { isContainer: true, allowedParents: ['tabs'], hidden: true },
  heading: { isContainer: false },
  paragraph: { isContainer: false },
  image: { isContainer: false },
  svg: { isContainer: false },
  button: { isContainer: false },
  youtube: { isContainer: false },
  divider: { isContainer: false },
}

export function getSchema(type: string): BlockSchema | undefined {
  return BLOCK_SCHEMAS[type]
}

/** Block `childType` có được đặt trực tiếp bên trong `parentType` không */
export function canContain(parentType: string, childType: string): boolean {
  const parent = BLOCK_SCHEMAS[parentType]
  const child = BLOCK_SCHEMAS[childType]
  if (!parent || !child || !parent.isContainer) return false
  if (childType === 'root') return false
  if (parent.allowedChildren && !parent.allowedChildren.includes(childType)) return false
  if (child.allowedParents && !child.allowedParents.includes(parentType)) return false
  return true
}

export const MAX_DEPTH = 32
export const MAX_NODES = 5000
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/
