import type { Payload, PayloadRequest } from 'payload'
import { collectRefIds, loadRefTrees } from '../builder/refs'
import type { BuilderNode, PageContent } from '../builder/types'
import { validateBlockTree } from '../builder/validate'

/** Cây gốc đã làm sạch của một doc my-blocks; null nếu dữ liệu hỏng */
export function normalizeBlockTree(input: unknown): BuilderNode | null {
  try {
    return validateBlockTree(input)
  } catch {
    return null
  }
}

/**
 * Nạp cây gốc của các block theo id (kể cả block lồng nhau) – dùng ở server (render trang, hook kiểm tra vòng lặp).
 * Bỏ qua quyền truy cập: trang công khai phải render được cả block "riêng tôi" của editor khác.
 */
export async function loadBlockTrees(
  payload: Payload,
  ids: Iterable<string>,
  req?: PayloadRequest,
): Promise<Map<string, BuilderNode>> {
  return loadRefTrees(ids, async (batch) => {
    const res = await payload.find({
      collection: 'my-blocks',
      where: { id: { in: batch.map((id) => (/^\d+$/.test(id) ? Number(id) : id)) } },
      depth: 0,
      limit: batch.length,
      pagination: false,
      overrideAccess: true,
      req,
    })
    return res.docs.flatMap((doc) => {
      const tree = normalizeBlockTree(doc.tree)
      return tree ? [{ id: String(doc.id), tree }] : []
    })
  })
}

/** Các block mà nội dung trang tham chiếu tới, sẵn sàng truyền cho PageRenderer */
export async function loadBlocksForContent(payload: Payload, content: PageContent): Promise<Map<string, BuilderNode>> {
  const ids = collectRefIds(content.root)
  return ids.size ? loadBlockTrees(payload, ids) : new Map()
}
