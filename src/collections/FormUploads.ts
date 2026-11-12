import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { loggedIn } from '../lib/access'

const MAX_BYTES = 10 * 1024 * 1024

/**
 * File khách gửi kèm form (trường loại "Tệp"): ai cũng tải lên được (giới hạn loại/kích thước), chỉ nhân sự CMS đọc.
 * Bài gửi (form-submissions) lưu đường dẫn file trong data.
 */
export const FormUploads: CollectionConfig = {
  slug: 'form-uploads',
  labels: { singular: 'File đính kèm form', plural: 'File đính kèm form' },
  admin: { group: 'Khách hàng & Form', description: 'File do khách tải lên qua block Form.' },
  access: { create: () => true, read: loggedIn, update: () => false, delete: loggedIn },
  upload: {
    staticDir: 'media/form-uploads',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip'],
    disableLocalStorage: false,
  },
  fields: [{ name: 'form', label: 'Form', type: 'text', maxLength: 80 }],
  hooks: {
    beforeValidate: [
      ({ req, operation }) => {
        if (operation === 'create' && req.file && req.file.size > MAX_BYTES) throw new APIError('File tối đa 10MB.', 400, undefined, true)
      },
    ],
  },
}
