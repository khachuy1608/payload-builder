import type { Access, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { collectRefIds, reachesBlock } from '../builder/refs'
import { ContentValidationError, validateBlockTree } from '../builder/validate'
import { loadBlockTrees } from '../lib/blocks'

const loggedIn: Access = ({ req: { user } }) => Boolean(user)

/**
 * Chỉ chủ sở hữu được sửa/xoá. Block không có chủ (tạo bởi seed) thì ai đăng nhập cũng sửa được.
 * Lưu ý: mọi người đã đăng nhập đều ĐỌC được mọi block (kể cả private) để trang có dùng block của người khác
 * vẫn hiển thị trong editor; `scope` chỉ quyết định block có hiện trong thư viện của người khác hay không.
 */
const ownerOnly: Access = ({ req: { user } }) =>
  user ? { or: [{ owner: { equals: user.id } }, { owner: { exists: false } }] } : false

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
    create: loggedIn,
    update: ownerOnly,
    delete: ownerOnly,
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
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (!data) return data
        // chủ sở hữu gán lúc tạo, không đổi khi sửa
        if (operation === 'create') data.owner = req.user?.id ?? null
        else if ('owner' in data) delete data.owner

        if ('tree' in data && data.tree != null) {
          try {
            data.tree = validateBlockTree(data.tree)
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
