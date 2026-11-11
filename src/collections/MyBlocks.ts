import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { collectRefIds, reachesBlock } from '../builder/refs'
import { ContentValidationError, validateBlockTree, validateContent } from '../builder/validate'
import { canEdit, loggedIn, ownerOrAdmin } from '../lib/access'
import { loadBlockTrees } from '../lib/blocks'
import { revalidatePages } from '../lib/revalidate'

/**
 * Chủ sở hữu (hoặc admin) được sửa/xoá; block không có chủ (seed) thì editor nào cũng sửa được.
 * Mọi người đã đăng nhập đều ĐỌC được mọi block (kể cả private) để trang có dùng block của người khác
 * vẫn hiển thị trong editor; `scope` chỉ quyết định block có hiện trong thư viện của người khác hay không.
 */

export const MyBlocks: CollectionConfig = {
  slug: 'my-blocks',
  labels: { singular: 'My Block', plural: 'My Blocks' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'scope', 'owner', 'updatedAt'],
    description: 'Phần tử/vùng đã dựng trong Visual Builder được lưu lại để dùng ở nhiều trang (bản sao hoặc liên kết).',
  },
  access: {
    read: loggedIn,
    create: canEdit,
    update: ownerOrAdmin,
    delete: ownerOrAdmin,
  },
  fields: [
    { name: 'name', label: 'Tên block', type: 'text', required: true, maxLength: 120 },
    {
      name: 'scope',
      label: 'Phạm vi',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: [
        { label: 'Riêng tôi', value: 'private' },
        { label: 'Dùng chung (mọi editor)', value: 'shared' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'kind',
      label: 'Loại',
      type: 'select',
      required: true,
      defaultValue: 'block',
      options: [
        { label: 'Block (một phần tử)', value: 'block' },
        { label: 'Mẫu trang (cả trang)', value: 'page' },
      ],
      admin: { position: 'sidebar', description: 'Mẫu trang được dùng khi tạo trang mới trong Visual Builder.' },
    },
    {
      name: 'owner',
      label: 'Chủ sở hữu',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'thumbnail',
      label: 'Ảnh thu nhỏ (tuỳ chọn)',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar', description: 'Để trống thì editor tự dựng preview từ nội dung block.' },
    },
    {
      name: 'builder',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/OpenBuilderButton#OpenBuilderButton' },
      },
    },
    {
      name: 'tree',
      label: 'Nội dung block (JSON từ Visual Builder)',
      type: 'json',
      required: true,
      admin: { hidden: true },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePages()
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidatePages()
        return doc
      },
    ],
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (!data) return data
        // chủ sở hữu gán lúc tạo, không đổi khi sửa
        if (operation === 'create') data.owner = req.user?.id ?? null
        else if ('owner' in data) delete data.owner

        if ('tree' in data && data.tree != null) {
          const kind = data.kind ?? originalDoc?.kind ?? 'block'
          try {
            // mẫu trang: cây là root (nhiều phần tử); block: đúng một phần tử
            data.tree = kind === 'page' ? validateContent({ version: 1, root: data.tree }).root : validateBlockTree(data.tree)
          } catch (err) {
            if (err instanceof ContentValidationError) throw new APIError(err.message, 400, undefined, true)
            throw err
          }
          // chặn vòng lặp: block không được (trực tiếp hay gián tiếp) liên kết tới chính nó
          const selfId = operation === 'update' ? String(originalDoc?.id ?? '') : ''
          const refs = collectRefIds(data.tree)
          if (selfId && refs.size) {
            const trees = await loadBlockTrees(req.payload, refs, req)
            if (refs.has(selfId) || reachesBlock(data.tree, selfId, (id) => trees.get(id))) {
              throw new APIError('Block không thể chứa liên kết tới chính nó (vòng lặp tham chiếu).', 400, undefined, true)
            }
          }
        }
        return data
      },
    ],
  },
}
