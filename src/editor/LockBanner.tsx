'use client'

import { Loader2, Lock, RefreshCw, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { acquireLock, heartbeatLock, LOCK_HEARTBEAT_MS, releaseLock } from './lock'
import { useEditor } from './store'

/** Lấy khoá khi mở editor, gia hạn định kỳ, thả khi rời trang */
export function useDocumentLock() {
  useEffect(() => {
    void acquireLock()
    const timer = setInterval(() => void heartbeatLock(), LOCK_HEARTBEAT_MS)
    const onHide = () => releaseLock()
    window.addEventListener('pagehide', onHide)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', onHide)
      releaseLock()
    }
  }, [])
}

/** Băng rôn khi tài liệu đang được người khác sửa: chỉ xem, có thể kiểm tra lại hoặc chiếm quyền */
export function LockBanner() {
  const lock = useEditor((s) => s.lock)
  const kind = useEditor((s) => s.kind)
  const [busy, setBusy] = useState(false)
  if (lock.state === 'error') {
    return (
      <div className="ed-lock ed-lock--warn">
        <ShieldAlert size={16} />
        <span>Không kiểm tra được khoá tài liệu ({lock.message}). Người khác có thể đang cùng sửa.</span>
      </div>
    )
  }
  if (lock.state !== 'locked') return null
  const since = new Date(lock.by.since)
  const run = async (force: boolean) => {
    if (force && !confirm(`Chiếm quyền sửa từ ${lock.by.name}? Thay đổi chưa lưu của họ sẽ không lưu được nữa.`)) return
    setBusy(true)
    const result = await acquireLock(force)
    setBusy(false)
    if (result === 'owned') useEditor.getState().toast('success', force ? 'Bạn đã chiếm quyền sửa.' : 'Khoá đã được thả, bạn có thể sửa.')
  }
  return (
    <div className="ed-lock" role="status">
      <Lock size={16} />
      <span>
        {kind === 'block' ? 'Block' : 'Trang'} này đang được <b>{lock.by.name}</b>
        {lock.by.email && lock.by.name !== lock.by.email ? ` (${lock.by.email})` : ''} sửa
        {isNaN(since.getTime()) ? '' : ` từ ${since.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}. Bạn đang ở chế độ chỉ xem: thay đổi sẽ không lưu được.
      </span>
      <button className="ed-btn" disabled={busy} onClick={() => run(false)}>
        {busy ? <Loader2 size={14} className="ed-spin" /> : <RefreshCw size={14} />} Kiểm tra lại
      </button>
      <button className="ed-btn ed-btn--danger" disabled={busy} onClick={() => run(true)}>
        Chiếm quyền sửa
      </button>
    </div>
  )
}
