'use client'

import { FileText, Loader2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FILE_KIND_LABEL, fileKindOf, formatBytes, MEDIA_ACCEPT_INPUT, type MediaAccept, mediaMatches } from '@/builder/files'
import type { MediaValue } from '@/builder/types'
import { listMedia, type MediaDoc, toMediaValue, uploadMedia } from './api'

const KIND_TEXT: Record<MediaAccept, { title: string; upload: string; empty: string; wrong: string }> = {
  image: { title: 'Thư viện ảnh', upload: 'Tải ảnh lên', empty: 'Chưa có ảnh. Bấm “Tải ảnh lên” hoặc kéo thả file vào đây.', wrong: 'Ô này chỉ nhận ảnh.' },
  video: { title: 'Thư viện video', upload: 'Tải video lên', empty: 'Chưa có video. Bấm “Tải video lên” (mp4, webm) hoặc kéo thả vào đây.', wrong: 'Ô này chỉ nhận video mp4 / webm.' },
  file: {
    title: 'Thư viện tài liệu',
    upload: 'Tải tài liệu lên',
    empty: 'Chưa có tài liệu. Bấm “Tải tài liệu lên” (PDF, Excel, Word, CSV…) hoặc kéo thả vào đây.',
    wrong: 'Ô này chỉ nhận tài liệu: PDF, Excel, Word, PowerPoint, CSV, TXT, ZIP.',
  },
}

/**
 * Thư viện media chỉ liệt kê và chỉ cho tải lên đúng loại ô chọn cần (`accept`): ảnh, video hoặc tài liệu.
 * Lọc ngay từ server (where mimeType) và kiểm tra lại khi tải lên / kéo thả.
 */
export function MediaPicker({ onPick, onClose, accept = 'image' }: { onPick: (m: MediaValue) => void; onClose: () => void; accept?: MediaAccept }) {
  const text = KIND_TEXT[accept]
  const [docs, setDocs] = useState<MediaDoc[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    listMedia(page, accept)
      .then((res) => {
        if (!alive) return
        setDocs((d) => (page === 1 ? res.docs : [...d, ...res.docs]))
        setHasMore(res.hasNextPage)
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [page, accept])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onUpload = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    // trình duyệt không chặn kéo thả theo accept: tự kiểm tra loại trước khi tải lên
    if (!mediaMatches(accept, file.type || guessMime(file.name))) {
      setError(text.wrong)
      return
    }
    setUploading(true)
    setError(null)
    try {
      const doc = await uploadMedia(file, file.name.replace(/\.[^.]+$/, ''))
      onPick(toMediaValue(doc))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="ed-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ed-modal" role="dialog" aria-label={text.title} data-media-accept={accept}>
        <header className="ed-modal-head">
          <strong>{text.title}</strong>
          <button className="ed-btn ed-btn--primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={15} className="ed-spin" /> : <Upload size={15} />} {text.upload}
          </button>
          <input ref={fileRef} type="file" accept={MEDIA_ACCEPT_INPUT[accept]} hidden onChange={(e) => onUpload(e.target.files)} />
          <button className="ed-icon-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        {error && <p className="ed-error">{error}</p>}
        <div
          className="ed-media-grid"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onUpload(e.dataTransfer.files)
          }}
        >
          {docs.map((d) => (
            <button key={d.id} className="ed-media-item" onClick={() => onPick(toMediaValue(d))} title={d.filename}>
              {d.mimeType && !d.mimeType.startsWith('image/') ? (
                <span className="ed-media-file" data-kind={fileKindOf(d.filename ?? '', d.mimeType)}>
                  <FileText size={22} />
                  <b>{d.filename}</b>
                  <span>{[FILE_KIND_LABEL[fileKindOf(d.filename ?? '', d.mimeType)], formatBytes(d.filesize)].filter(Boolean).join(' · ')}</span>
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.url} alt={d.alt ?? ''} />
              )}
            </button>
          ))}
          {!loading && !docs.length && <p className="ed-hint">{text.empty}</p>}
        </div>
        <footer className="ed-modal-foot">
          {loading && <Loader2 size={16} className="ed-spin" />}
          {hasMore && !loading && (
            <button className="ed-btn" onClick={() => setPage((p) => p + 1)}>
              Tải thêm
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

/** MIME theo đuôi file khi trình duyệt không cho biết (thường gặp với .csv, .docx kéo thả trên Windows) */
const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  txt: 'text/plain',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  odt: 'application/vnd.oasis.opendocument.text',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  zip: 'application/zip',
  mp4: 'video/mp4',
  webm: 'video/webm',
}
function guessMime(name: string): string {
  return EXT_MIME[name.split('.').pop()?.toLowerCase() ?? ''] ?? ''
}
