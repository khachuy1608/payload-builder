'use client'

import { CalendarClock, Loader2, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cancelSchedule, createSchedule, listSchedules, savePage, type ScheduledJob } from './api'
import { useEditor } from './store'

const fmt = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}
/** Giá trị cho <input type="datetime-local"> theo giờ địa phương */
const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)

/** Menu cạnh nút Xuất bản: ghi chú phiên bản, lên lịch xuất bản / gỡ xuất bản, danh sách lịch đã đặt */
export function PublishMenu() {
  const pageId = useEditor((s) => s.pageId)
  const note = useEditor((s) => s.versionNote)
  const dirty = useEditor((s) => s.dirty)
  const saving = useEditor((s) => s.saving)
  const lockedByOther = useEditor((s) => s.lock.state === 'locked')
  const close = () => useEditor.getState().openPublishMenu(false)
  const [jobs, setJobs] = useState<ScheduledJob[] | null>(null)
  const [at, setAt] = useState(() => toLocal(new Date(Date.now() + 60 * 60_000)))
  const [type, setType] = useState<'publish' | 'unpublish'>('publish')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = () => listSchedules(pageId).then(setJobs).catch((e) => setError((e as Error).message))
  useEffect(() => {
    void reload()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId])

  const schedule = async () => {
    setBusy(true)
    setError(null)
    try {
      // lịch xuất bản dùng bản nháp mới nhất -> lưu nháp trước nếu đang sửa dở
      if (useEditor.getState().dirty && type === 'publish' && !(await savePage(false))) return
      await createSchedule(pageId, new Date(at), type)
      useEditor.getState().toast('success', `Đã lên lịch ${type === 'publish' ? 'xuất bản' : 'gỡ xuất bản'} lúc ${fmt(new Date(at).toISOString())}.`)
      await reload()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const cancel = async (id: string) => {
    try {
      await cancelSchedule(id)
      setJobs((list) => list?.filter((j) => j.id !== id) ?? null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="ed-pop ed-publish-menu" role="dialog" aria-label="Tuỳ chọn xuất bản">
      <header className="ed-pop-head">
        <strong>Tuỳ chọn xuất bản</strong>
        <button className="ed-icon-btn" onClick={close} aria-label="Đóng">
          <X size={16} />
        </button>
      </header>
      <label className="ed-field">
        <span className="ed-label">Ghi chú phiên bản (lưu cùng lần Lưu nháp / Xuất bản kế tiếp)</span>
        <input className="ed-input" value={note} maxLength={200} placeholder="Ví dụ: đổi banner tháng 12" onChange={(e) => useEditor.getState().setVersionNote(e.target.value)} />
      </label>
      <div className="ed-row">
        <button className="ed-btn" onClick={() => void savePage(false)} disabled={saving || lockedByOther}>
          Lưu nháp
        </button>
        <button className="ed-btn ed-btn--primary" onClick={() => void savePage(true)} disabled={saving || lockedByOther}>
          Xuất bản ngay
        </button>
      </div>
      <hr className="ed-sep" />
      <div className="ed-label">
        <CalendarClock size={13} style={{ verticalAlign: '-2px' }} /> Lên lịch
      </div>
      <div className="ed-row">
        <select className="ed-input" value={type} onChange={(e) => setType(e.target.value as 'publish' | 'unpublish')} style={{ width: 130 }}>
          <option value="publish">Xuất bản</option>
          <option value="unpublish">Gỡ xuất bản</option>
        </select>
        <input className="ed-input" type="datetime-local" value={at} min={toLocal(new Date())} onChange={(e) => setAt(e.target.value)} style={{ flex: 1 }} />
        <button className="ed-btn" onClick={() => void schedule()} disabled={busy || lockedByOther}>
          {busy ? <Loader2 size={14} className="ed-spin" /> : null} Đặt lịch
        </button>
      </div>
      <span className="ed-help">{dirty ? 'Đang có thay đổi chưa lưu: khi đặt lịch xuất bản, bản nháp sẽ được lưu trước.' : 'Đến giờ, bản nháp mới nhất được xuất bản tự động (kiểm tra mỗi phút).'}</span>
      {error && <p className="ed-error">{error}</p>}
      {jobs === null && !error && <Loader2 size={14} className="ed-spin" />}
      {jobs?.map((j) => (
        <div key={j.id} className="ed-sched" data-job={j.id}>
          <span className={`ed-badge ed-badge--${j.type === 'publish' ? 'ok' : 'warn'}`}>{j.type === 'publish' ? 'Xuất bản' : 'Gỡ'}</span>
          <span>{fmt(j.waitUntil)}</span>
          <button className="ed-icon-btn" title="Huỷ lịch" onClick={() => void cancel(j.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {jobs && !jobs.length && <span className="ed-help">Chưa có lịch nào.</span>}
    </div>
  )
}
