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
  /** My Block dạng liên kết: triển khai thành cây thật lúc render (xem ./refs.ts). Không hiện ở panel Phần tử. */
  blockRef: { isContainer: false, hidden: true },

  // ---- Bố cục ----
  /** Danh sách dữ liệu: lặp các con cho từng bản ghi của nguồn dữ liệu */
  dataList: { isContainer: true },
  masonry: { isContainer: true },
  bento: { isContainer: true },
  card: { isContainer: true },
  marquee: { isContainer: true },
  carousel: { isContainer: true, allowedChildren: ['slide'] },
  slide: { isContainer: true, allowedParents: ['carousel'], hidden: true },
  accordion: { isContainer: true, allowedChildren: ['accordionItem'] },
  accordionItem: { isContainer: true, allowedParents: ['accordion'], hidden: true },
  // ---- Điều hướng ----
  header: { isContainer: false },
  breadcrumbs: { isContainer: false },
  pagination: { isContainer: false },
  steps: { isContainer: false },
  toggleGroup: { isContainer: false },
  bottomNav: { isContainer: false },
  floatingButton: { isContainer: false },
  scrollspy: { isContainer: false },
  waffleMenu: { isContainer: false },
  cascadingMenu: { isContainer: false },
  overflowMenu: { isContainer: false },
  commandPalette: { isContainer: false },
  productTour: { isContainer: false },
  // ---- Dữ liệu & hiển thị ----
  dataTable: { isContainer: false },
  chart: { isContainer: false },
  timeline: { isContainer: false },
  avatarGroup: { isContainer: false },
  statusDot: { isContainer: false },
  chatBubble: { isContainer: false },
  badge: { isContainer: false },
  progress: { isContainer: false },
  skeleton: { isContainer: false },
  emptyState: { isContainer: false },
  alert: { isContainer: false },
  // ---- Lớp phủ & phản hồi ----
  dialog: { isContainer: true },
  popover: { isContainer: true },
  toast: { isContainer: false },
  lightbox: { isContainer: false },
  // ---- Form ----
  form: { isContainer: true },
  formField: { isContainer: false, allowedParents: ['form'] },
  signInForm: { isContainer: false },
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

/** Phần tử có thể lưu thành My Block không (root, tab và chính blockRef thì không) */
export function canSaveAsBlock(type: string): boolean {
  const schema = BLOCK_SCHEMAS[type]
  return !!schema && type !== 'root' && type !== 'blockRef' && !schema.allowedParents
}

export const MAX_DEPTH = 32
export const MAX_NODES = 5000
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/
