'use client'

import { FileText, Loader2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DOCUMENT_ACCEPT, FILE_KIND_LABEL, fileKindOf, formatBytes } from '@/builder/files'
import type { MediaValue } from '@/builder/types'
import { listMedia, type MediaDoc, toMediaValue, uploadMedia } from './api'

/** accept = 'file': tải lên/chọn tài liệu (PDF, Excel, Word…) – file không phải ảnh hiện dạng thẻ */
export function MediaPicker({ onPick, onClose, accept = 'image' }: { onPick: (m: MediaValue) => void; onClose: () => void; accept?: 'image' | 'file' }) {
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
    listMedia(page)
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
  }, [page])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onUpload = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
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
      <div className="ed-modal" role="dialog" aria-label="Thư viện media">
        <header className="ed-modal-head">
          <strong>Thư viện media</strong>
          <button className="ed-btn ed-btn--primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={15} className="ed-spin" /> : <Upload size={15} />} {accept === 'file' ? 'Tải file lên' : 'Tải ảnh lên'}
          </button>
          <input ref={fileRef} type="file" accept={accept === 'file' ? DOCUMENT_ACCEPT : 'image/*'} hidden onChange={(e) => onUpload(e.target.files)} />
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
          {!loading && !docs.length && <p className="ed-hint">{accept === 'file' ? 'Chưa có file. Bấm “Tải file lên” (PDF, Excel, Word, CSV…) hoặc kéo thả vào đây.' : 'Chưa có ảnh. Bấm “Tải ảnh lên” hoặc kéo thả file vào đây.'}</p>}
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
