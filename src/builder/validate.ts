/**
 * Kiểm tra & làm sạch cây nội dung trước khi lưu (hook beforeChange của Pages).
 * Không tin dữ liệu từ client: loại type lạ, id sai định dạng, quan hệ cha-con sai luật.
 */
import { BLOCK_REF_TYPE, refBlockId } from './refs'
import { canContain, canSaveAsBlock, getSchema, ID_PATTERN, MAX_DEPTH, MAX_NODES } from './schema'
import { sanitizeRichText, sanitizeSvg } from './sanitize'
import type { BuilderNode, NodeStyles, PageContent, StyleMap } from './types'
import { createEmptyContent } from './tree'

export class ContentValidationError extends Error {}

const STYLE_BUCKETS = ['desktop', 'tablet', 'mobile', 'hover'] as const

function cleanStyleMap(input: unknown): StyleMap | undefined {
  if (!input || typeof input !== 'object') return undefined
  const out: StyleMap = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (/^[a-zA-Z]{1,40}$/.test(k) && (typeof v === 'string' || typeof v === 'number')) {
      const s = String(v).slice(0, 500)
      if (s !== '') out[k] = s
    }
  }
  return Object.keys(out).length ? out : undefined
}

function cleanStyles(input: unknown): NodeStyles {
  const out: NodeStyles = {}
  if (!input || typeof input !== 'object') return out
  for (const bucket of STYLE_BUCKETS) {
    const map = cleanStyleMap((input as Record<string, unknown>)[bucket])
    if (map) out[bucket] = map
  }
  return out
}

export function validateContent(input: unknown): PageContent {
  if (input == null) return createEmptyContent()
  const content = input as Partial<PageContent>
  if (typeof content !== 'object' || !content.root || content.root.type !== 'root') {
    throw new ContentValidationError('Nội dung trang không hợp lệ: thiếu node root.')
  }

  const seen = new Set<string>()
  let count = 0

  const visit = (raw: BuilderNode, parentType: string | null, depth: number): BuilderNode | null => {
    if (!raw || typeof raw !== 'object') return null
    if (depth > MAX_DEPTH) throw new ContentValidationError(`Cây lồng quá sâu (tối đa ${MAX_DEPTH} cấp).`)
    if (++count > MAX_NODES) throw new ContentValidationError(`Trang có quá nhiều phần tử (tối đa ${MAX_NODES}).`)

    const schema = getSchema(raw.type)
    if (!schema) return null // bỏ block không còn tồn tại
    if (parentType && !canContain(parentType, raw.type)) return null
    if (!ID_PATTERN.test(raw.id) || seen.has(raw.id)) {
      throw new ContentValidationError(`Id phần tử không hợp lệ hoặc bị trùng: ${String(raw.id)}`)
    }
    seen.add(raw.id)

    const props: Record<string, unknown> =
      raw.props && typeof raw.props === 'object' && !Array.isArray(raw.props) ? { ...raw.props } : {}
    if (raw.type === 'svg') props.code = sanitizeSvg(props.code)
    if (raw.type === 'paragraph') props.text = sanitizeRichText(props.text)
    if (raw.type === BLOCK_REF_TYPE) {
      // blockRef chỉ giữ id block và tên hiển thị; cờ `linked`/`refError` của cây render không bao giờ được lưu
      const blockId = refBlockId({ ...raw, props })
      if (!blockId) return null
      props.blockId = blockId
      props.name = typeof props.name === 'string' ? props.name.slice(0, 120) : ''
      delete props.refError
    }

    const node: BuilderNode = { id: raw.id, type: raw.type, props, styles: cleanStyles(raw.styles) }
    if (schema.isContainer) {
      node.children = (Array.isArray(raw.children) ? raw.children : [])
        .map((c) => visit(c, raw.type, depth + 1))
        .filter((c): c is BuilderNode => c !== null)
    }
    return node
  }

  const root = visit(content.root, null, 0)
  if (!root) throw new ContentValidationError('Node root không hợp lệ.')
  return { version: 1, root }
}

/**
 * Kiểm tra & làm sạch cây gốc của một My Block (hook beforeChange của my-blocks).
 * Block là MỘT phần tử (có thể chứa con); gốc không được là root/tab/blockRef.
 */
export function validateBlockTree(input: unknown): BuilderNode {
  const raw = input as Partial<BuilderNode> | null
  if (!raw || typeof raw !== 'object' || typeof raw.type !== 'string') {
    throw new ContentValidationError('Block không hợp lệ: thiếu phần tử gốc.')
  }
  if (!canSaveAsBlock(raw.type)) {
    throw new ContentValidationError(`Không thể lưu phần tử "${raw.type}" thành block.`)
  }
  const content = validateContent({
    version: 1,
    root: { id: 'root', type: 'root', props: {}, styles: {}, children: [raw as BuilderNode] },
  })
  const tree = content.root.children?.[0]
  if (!tree) throw new ContentValidationError('Block không hợp lệ.')
  return tree
}

/** Dùng khi đọc: trả về nội dung rỗng thay vì ném lỗi */
export function normalizeContent(input: unknown): PageContent {
  try {
    return validateContent(input)
  } catch {
    return createEmptyContent()
  }
}
