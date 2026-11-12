/** Bảng phím tắt dùng cho hộp “Phím tắt” và chú thích trong menu */
export const SHORTCUT_GROUPS: { title: string; items: { keys: string; label: string }[] }[] = [
  {
    title: 'Lưu & xuất bản',
    items: [
      { keys: 'Ctrl + S', label: 'Lưu nháp' },
      { keys: 'Ctrl + Z', label: 'Hoàn tác' },
      { keys: 'Ctrl + Shift + Z / Ctrl + Y', label: 'Làm lại' },
    ],
  },
  {
    title: 'Phần tử',
    items: [
      { keys: 'Ctrl + D', label: 'Nhân bản' },
      { keys: 'Ctrl + C / Ctrl + V', label: 'Sao chép / dán' },
      { keys: 'Ctrl + G', label: 'Bọc trong Div' },
      { keys: 'Ctrl + Shift + G', label: 'Bỏ bọc' },
      { keys: 'Delete / Backspace', label: 'Xoá' },
      { keys: 'Esc', label: 'Bỏ chọn / đóng hộp thoại' },
      { keys: 'Nhấp đúp', label: 'Sửa chữ trực tiếp' },
      { keys: 'Chuột phải', label: 'Menu ngữ cảnh' },
      { keys: 'Nhấn giữ + kéo', label: 'Di chuyển trên canvas' },
    ],
  },
  {
    title: 'Sửa chữ (Paragraph)',
    items: [
      { keys: 'Ctrl + B / I / U', label: 'Đậm / nghiêng / gạch chân' },
      { keys: 'Enter', label: 'Xuống dòng' },
      { keys: 'Ctrl + Enter', label: 'Xong' },
    ],
  },
  {
    title: 'Khác',
    items: [
      { keys: 'E / V / C', label: 'Chế độ chuột: Chỉnh sửa / Xem (tương tác như trang thật) / Bình luận' },
      { keys: '?', label: 'Hộp phím tắt này' },
      { keys: 'Ctrl + Enter (ô bình luận)', label: 'Gửi bình luận' },
      { keys: 'Shift + kéo tay cầm', label: 'Bước 8px' },
    ],
  },
]
