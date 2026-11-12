/**
 * Media: Xem file – PDF (trình xem của trình duyệt), Excel/CSV (bảng, nhiều sheet), Word .docx (HTML),
 * ảnh, video, âm thanh, văn bản; loại khác hiện thẻ file + nút tải xuống.
 * Bảng tính / Word / văn bản: server đọc file trong thư viện Media (/api/builder/file-preview), Runtime dựng.
 */
import { FileText } from 'lucide-react'
import { canConvertToPdf, canPreviewOnServer, FILE_KIND_LABEL, type FileKind, fileKindOf, fileNameFromUrl, formatBytes } from '../../files'
import type { MediaValue } from '../../types'
import { bool, Icon, num, Placeholder, text } from '../helpers'
import type { BlockDefinition } from '../types'

const KIND_ICON: Record<FileKind, string> = {
  pdf: 'fileText',
  sheet: 'grid',
  csv: 'grid',
  doc: 'fileText',
  slides: 'monitor',
  image: 'image',
  video: 'video',
  audio: 'music',
  text: 'file',
  archive: 'folder',
  other: 'file',
}

/** src hợp lệ: file trong thư viện (/api/media/file/…) hoặc URL https */
function safeFileSrc(v: string): string {
  const s = v.trim()
  if (/^\/api\/media\/file\/[^\s"'<>?#]+$/.test(s)) return s
  return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : ''
}

export const FILE_BLOCKS: BlockDefinition[] = [
  {
    type: 'fileViewer',
    label: 'Xem file (PDF, Excel, Word…)',
    category: 'media',
    icon: FileText,
    defaults: () => ({
      props: { file: null, url: '', title: '', height: '640', showBar: true, download: true, header: true },
      styles: { desktop: { width: '100%' } },
    }),
    contentControls: [
      { type: 'media', prop: 'file', label: 'File từ thư viện (PDF, Excel, Word, CSV…)', accept: 'file' },
      { type: 'url', prop: 'url', label: 'Hoặc URL file (https)', placeholder: 'https://…/tai-lieu.pdf' },
      { type: 'text', prop: 'title', label: 'Tên hiển thị (trống = tên file)' },
      { type: 'number', prop: 'height', label: 'Chiều cao khung xem (px)', min: 200, max: 2000 },
      { type: 'toggle', prop: 'showBar', label: 'Thanh tên file và nút' },
      { type: 'toggle', prop: 'download', label: 'Cho tải xuống' },
      {
        type: 'toggle',
        prop: 'header',
        label: 'Bảng tính: dòng đầu là tiêu đề cột',
        help: 'PDF, ảnh, video xem trực tiếp. Excel (.xlsx), CSV, Word (.docx), .txt trong thư viện hiện thành bảng / văn bản ngay trên trang. Loại khác (PowerPoint, .xls cũ, .zip…) hiện nút tải xuống.',
      },
    ],
    styleGroups: ['size', 'spacing', 'border', 'effects', 'position'],
    Render: ({ node, attrs, mode }) => {
      const media = node.props.file && typeof node.props.file === 'object' ? (node.props.file as MediaValue) : null
      const src = safeFileSrc(media?.url ?? '') || safeFileSrc(text(node.props.url))
      if (!src) return mode === 'editor' ? <Placeholder attrs={attrs} label="Chọn file (PDF, Excel, Word, CSV…) ở panel bên phải" icon={FileText} /> : null
      const fileName = media?.filename || fileNameFromUrl(src)
      const kind = fileKindOf(fileName, media?.mimeType ?? '')
      const name = text(node.props.title) || fileName
      const size = formatBytes(media?.filesize)
      const local = src.startsWith('/api/media/file/')
      const viaServer = local && canPreviewOnServer(fileName, media?.mimeType ?? '')
      // PowerPoint, .xls/.doc cũ, OpenDocument: máy chủ có LibreOffice thì runtime thay thẻ tải xuống bằng bản PDF
      const viaPdf = local && canConvertToPdf(fileName, media?.mimeType ?? '')
      const height = Math.max(200, Math.min(2000, num(node.props.height, 640)))
      const allowDownload = bool(node.props.download, true)
      const inline = kind === 'pdf' || kind === 'image' || kind === 'video' || kind === 'audio' || viaServer
      let body: React.ReactNode
      if (kind === 'pdf') body = <iframe className="b-file-frame" src={`${src}#view=FitH`} title={name} loading="lazy" />
      else if (kind === 'image')
        // eslint-disable-next-line @next/next/no-img-element
        body = <img className="b-file-img" src={src} alt={media?.alt || name} loading="lazy" />
      else if (kind === 'video') body = <video className="b-file-media" src={src} controls preload="metadata" />
      else if (kind === 'audio') body = <audio className="b-file-audio" src={src} controls preload="metadata" />
      else if (viaServer) body = <div key={src} className="b-file-view" data-file-mount="" data-header={bool(node.props.header, true) ? '1' : '0'} aria-live="polite" />
      else
        body = (
          <div className="b-file-card">
            <span className="b-file-card-ico" aria-hidden>
              <Icon name={KIND_ICON[kind]} size={36} />
            </span>
            <p>
              <b>{FILE_KIND_LABEL[kind]}</b> – {viaPdf ? 'đang kiểm tra bản xem trước…' : 'trình duyệt không xem trực tiếp được loại file này;'} tải xuống để mở.
            </p>
            <a className="b-button" href={src} download={allowDownload ? fileName : undefined} target={allowDownload ? undefined : '_blank'} rel="noopener noreferrer">
              <Icon name="download" size={16} /> Tải xuống
            </a>
          </div>
        )
      return (
        <div {...attrs} className={`${attrs.className} b-file b-file--${kind}`} data-file-viewer="" data-src={viaServer || viaPdf ? src : undefined} data-file-convert={viaPdf ? '' : undefined} data-file-height={viaPdf ? height : undefined}>
          {bool(node.props.showBar, true) && (
            <div className="b-file-bar">
              <span className="b-file-ico" aria-hidden>
                <Icon name={KIND_ICON[kind]} size={18} />
              </span>
              <span className="b-file-meta">
                <b title={name}>{name}</b>
                <span>{[FILE_KIND_LABEL[kind], size].filter(Boolean).join(' · ')}</span>
              </span>
              <span className="b-file-actions">
                <a href={src} target="_blank" rel="noopener noreferrer" title="Mở trong tab mới">
                  <Icon name="external" size={16} />
                  <span>Mở</span>
                </a>
                {allowDownload && (
                  <a href={src} download={fileName} title="Tải xuống">
                    <Icon name="download" size={16} />
                    <span>Tải xuống</span>
                  </a>
                )}
              </span>
            </div>
          )}
          <div className={`b-file-body${inline ? '' : ' b-file-body--card'}`} style={inline && kind !== 'image' && kind !== 'audio' ? { height } : undefined}>
            {body}
            {/* canvas editor: lớp chắn để bấm vào khung PDF/video vẫn chọn được block */}
            {mode === 'editor' && (kind === 'pdf' || kind === 'video') && <span className="b-file-shield" aria-hidden />}
          </div>
        </div>
      )
    },
  },
]
