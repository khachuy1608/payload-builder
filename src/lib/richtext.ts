import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { sanitizeContentHtml } from '../builder/sanitize'

/** Giá trị có phải JSON của Lexical (richText) không */
export function isLexical(value: unknown): value is SerializedEditorState {
  return !!value && typeof value === 'object' && !Array.isArray(value) && (value as { root?: { type?: string } }).root?.type === 'root'
}

/** Lexical JSON -> HTML đã làm sạch (dùng cho {{content}} trong block Rich content / Paragraph) */
export function lexicalToHtml(value: unknown): string {
  if (!isLexical(value)) return ''
  try {
    return sanitizeContentHtml(convertLexicalToHTML({ data: value, disableContainer: true }))
  } catch {
    return ''
  }
}

/** Văn bản thuần (cho tóm tắt tự động / tìm kiếm) */
export function lexicalToText(value: unknown): string {
  return lexicalToHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
