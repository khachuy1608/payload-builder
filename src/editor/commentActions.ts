'use client'
/** Thao tác bình luận dùng chung cho tab Bình luận và khung bình luận trên canvas (chế độ chuột Bình luận) */
import { createComment, deleteComment, updateComment } from './api'
import { useEditor } from './store'

export async function addComment(nodeId: string, text: string, anchor?: { x: number; y: number } | null): Promise<boolean> {
  const s = useEditor.getState()
  try {
    const c = await createComment({ pageId: s.pageId, nodeId, text: text.trim(), anchor })
    useEditor.getState().setComments([c, ...useEditor.getState().comments])
    return true
  } catch (err) {
    useEditor.getState().toast('error', `Không gửi được: ${(err as Error).message}`)
    return false
  }
}

export async function setCommentResolved(id: string, resolved: boolean): Promise<void> {
  try {
    const c = await updateComment(id, { resolved })
    useEditor.getState().setComments(useEditor.getState().comments.map((x) => (x.id === id ? c : x)))
  } catch (err) {
    useEditor.getState().toast('error', (err as Error).message)
  }
}

export async function removeComment(id: string): Promise<void> {
  if (!confirm('Xoá bình luận này?')) return
  try {
    await deleteComment(id)
    useEditor.getState().setComments(useEditor.getState().comments.filter((x) => x.id !== id))
  } catch (err) {
    useEditor.getState().toast('error', (err as Error).message)
  }
}

export const formatCommentTime = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}
