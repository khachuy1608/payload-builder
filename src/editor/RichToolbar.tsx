'use client'

import { Bold, Italic, Link2, List, ListOrdered, Strikethrough, Underline, Unlink } from 'lucide-react'

export type RichExec = (command: string, value?: string) => void

/**
 * Thanh công cụ rich text dùng chung cho sửa trực tiếp trên canvas và ô soạn ở panel phải.
 * onMouseDown preventDefault để không làm mất vùng chọn / focus của contentEditable.
 */
export function RichToolbar({ exec, compact }: { exec: RichExec; compact?: boolean }) {
  const items: { cmd: string; title: string; icon: typeof Bold; arg?: () => string | null }[] = [
    { cmd: 'bold', title: 'Đậm (Ctrl+B)', icon: Bold },
    { cmd: 'italic', title: 'Nghiêng (Ctrl+I)', icon: Italic },
    { cmd: 'underline', title: 'Gạch chân (Ctrl+U)', icon: Underline },
    { cmd: 'strikeThrough', title: 'Gạch ngang', icon: Strikethrough },
    { cmd: 'createLink', title: 'Chèn liên kết', icon: Link2, arg: () => prompt('Địa chỉ liên kết (https://…)') },
    { cmd: 'unlink', title: 'Bỏ liên kết', icon: Unlink },
    { cmd: 'insertUnorderedList', title: 'Danh sách chấm', icon: List },
    { cmd: 'insertOrderedList', title: 'Danh sách số', icon: ListOrdered },
  ]
  return (
    <span className={`ed-rich-bar${compact ? ' ed-rich-bar--compact' : ''}`} onMouseDown={(e) => e.preventDefault()}>
      {items.map((it) => (
        <button
          key={it.cmd}
          type="button"
          className="ed-tool"
          title={it.title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const arg = it.arg ? it.arg() : undefined
            if (it.arg && !arg) return
            exec(it.cmd, arg ?? undefined)
          }}
        >
          <it.icon size={13} />
        </button>
      ))}
    </span>
  )
}
