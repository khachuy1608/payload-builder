/**
 * Block "Xem file": nhận dạng loại file, định dạng dung lượng, đọc CSV. Thuần dữ liệu – dùng chung client/server.
 */

export type FileKind = 'pdf' | 'sheet' | 'csv' | 'doc' | 'slides' | 'image' | 'video' | 'audio' | 'text' | 'archive' | 'other'

/** Kiểu MIME được phép tải lên thư viện Media ngoài ảnh/video (tài liệu cho block Xem file) */
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'text/plain',
  'text/tab-separated-values',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/zip',
]

/** Thuộc tính accept của ô chọn file khi tải tài liệu */
export const DOCUMENT_ACCEPT = '.pdf,.csv,.tsv,.txt,.xlsx,.xls,.ods,.docx,.doc,.odt,.pptx,.ppt,.zip,image/*,video/*'

const EXT_KIND: Record<string, FileKind> = {
  pdf: 'pdf',
  xlsx: 'sheet',
  xlsm: 'sheet',
  xls: 'sheet',
  ods: 'sheet',
  csv: 'csv',
  tsv: 'csv',
  docx: 'doc',
  doc: 'doc',
  odt: 'doc',
  rtf: 'doc',
  pptx: 'slides',
  ppt: 'slides',
  odp: 'slides',
  txt: 'text',
  md: 'text',
  json: 'text',
  log: 'text',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
}

export function fileExt(name: string): string {
  const m = /\.([a-z0-9]{1,5})(?:$|[?#])/i.exec(name.trim())
  return m ? m[1].toLowerCase() : ''
}

/** Loại file theo đuôi (ưu tiên) hoặc MIME */
export function fileKindOf(name: string, mime = ''): FileKind {
  const byExt = EXT_KIND[fileExt(name)]
  if (byExt) return byExt
  const m = mime.toLowerCase()
  if (m === 'application/pdf') return 'pdf'
  if (m.startsWith('image/')) return 'image'
  if (m.startsWith('video/')) return 'video'
  if (m.startsWith('audio/')) return 'audio'
  if (m.includes('spreadsheet') || m.includes('excel')) return 'sheet'
  if (m === 'text/csv' || m === 'text/tab-separated-values') return 'csv'
  if (m.includes('wordprocessing') || m === 'application/msword' || m.includes('opendocument.text')) return 'doc'
  if (m.includes('presentation') || m.includes('powerpoint')) return 'slides'
  if (m.startsWith('text/') || m === 'application/json') return 'text'
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)) return 'image'
  if (/\.(mp4|webm|mov)$/i.test(name)) return 'video'
  return 'other'
}

/** Xem trước được bằng bảng / HTML do server đọc (xlsx, csv, docx, txt). .xls/.ods/.doc cũ chỉ tải xuống. */
export function canPreviewOnServer(name: string, mime = ''): boolean {
  const kind = fileKindOf(name, mime)
  const ext = fileExt(name)
  if (kind === 'sheet') return ext === 'xlsx' || ext === 'xlsm' || (!ext && mime.includes('openxmlformats'))
  if (kind === 'doc') return ext === 'docx' || (!ext && mime.includes('wordprocessingml'))
  return kind === 'csv' || kind === 'text'
}

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  pdf: 'PDF',
  sheet: 'Bảng tính',
  csv: 'CSV',
  doc: 'Văn bản',
  slides: 'Trình chiếu',
  image: 'Ảnh',
  video: 'Video',
  audio: 'Âm thanh',
  text: 'Văn bản thuần',
  archive: 'File nén',
  other: 'File',
}

export function formatBytes(n: unknown): string {
  const v = typeof n === 'number' ? n : Number(n)
  if (!isFinite(v) || v <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let x = v
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024
    i++
  }
  return `${x >= 10 || i === 0 ? Math.round(x) : x.toFixed(1).replace('.', ',')} ${units[i]}`
}

/** Tên file từ URL (bỏ query, giải mã %xx) */
export function fileNameFromUrl(url: string): string {
  const path = url.split(/[?#]/)[0]
  const last = path.slice(path.lastIndexOf('/') + 1)
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

/**
 * Đọc CSV/TSV (RFC 4180: ngoặc kép, "" trong ô, xuống dòng trong ô). Tự đoán dấu phân cách , ; hoặc tab.
 * Giới hạn số dòng/cột để không làm nặng trang.
 */
export function parseCsv(input: string, maxRows = 1000, maxCols = 50): { rows: string[][]; truncated: boolean } {
  const text = input.replace(/^﻿/, '')
  const nl = text.search(/\r?\n/)
  const firstLine = nl < 0 ? text : text.slice(0, nl)
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 }
  for (const ch of firstLine) if (ch in counts) counts[ch]++
  const [best, hits] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const sep = hits > 0 ? best : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let truncated = false
  const pushRow = () => {
    row.push(cell)
    cell = ''
    if (row.length > 1 || row[0] !== '') rows.push(row.slice(0, maxCols))
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
      continue
    }
    if (ch === '"' && cell === '') quoted = true
    else if (ch === sep) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      pushRow()
      if (rows.length >= maxRows) {
        truncated = i < text.length - 1
        return { rows, truncated }
      }
    } else cell += ch
  }
  if (cell !== '' || row.length) pushRow()
  return { rows, truncated }
}
