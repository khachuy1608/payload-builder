# Payload Page Builder (P0 → P2)

Payload CMS 3 + Next.js 16 + Postgres, kèm **Visual Builder kéo thả kiểu Elementor** tự xây (không dùng thư viện page builder bên ngoài).

Đã có trong bản này:

- **P0** – Payload 3.93, Postgres, collections `pages` (nháp/xuất bản, lịch sử phiên bản), `media`, `users`, migration, trang mẫu tự tạo.
- **P1** – Visual Builder tại `/builder/:id`:
  - Panel trái gồm *Phần tử* (10 block) và *Cấu trúc* (cây layer, kéo thả được).
  - Canvas là iframe, có viền hover, thanh công cụ của phần tử đang chọn, vạch báo vị trí thả.
  - Panel phải chia 3 tab: *Nội dung / Kiểu / Nâng cao*.
  - Undo/redo, nhân bản, copy/paste, phím tắt, nhấp đúp để sửa chữ trực tiếp.
- **P2** – Front-end render bằng **cùng một renderer** với canvas. Có responsive (Desktop/Tablet/Mobile), trạng thái Hover, ẩn theo thiết bị, lưu nháp, xem trước bản nháp và xuất bản.

## Chạy thử

### Cách 1 – Toàn bộ bằng Docker (khuyên dùng để chạy nhanh hoặc deploy)

Chỉ cần Docker (có Docker Compose).

```bash
cp .env.example .env          # đổi PAYLOAD_SECRET thành chuỗi ngẫu nhiên dài
docker compose up -d --build  # build image app + chạy Postgres -> http://localhost:3000
```

- Lần khởi động đầu, app tự chạy migration và tạo trang mẫu `home`.
- Dữ liệu Postgres nằm trong volume `pgdata`, ảnh upload nằm trong volume `media`. Cả hai còn nguyên khi restart hoặc build lại.
- Các lệnh hay dùng:
  - Xem log: `docker compose logs -f app`
  - Dừng: `docker compose down`
  - Xoá sạch dữ liệu: `docker compose down -v`
- Sau khi sửa code, chạy lại `docker compose up -d --build`.
- Nếu deploy lên máy chủ có domain riêng, đặt `NEXT_PUBLIC_SERVER_URL=https://ten-mien-cua-ban` trong `.env`.

### Cách 2 – Dev trên máy (hot reload), Postgres chạy bằng Docker

Yêu cầu: Node ≥ 20.18.1.

```bash
cp .env.example .env
docker compose up -d db       # chỉ chạy Postgres tại localhost:5432
npm install
npm run dev                   # http://localhost:3000
```

### Sau khi chạy

1. Mở `http://localhost:3000/admin` và tạo tài khoản quản trị đầu tiên.
2. Vào **Trang → Trang chủ**, bấm **✦ Mở Visual Builder** ở sidebar.
3. Kéo phần tử vào trang và chỉnh sửa, sau đó bấm **Lưu nháp**, **Xem trước** hoặc **Xuất bản**.

Chạy production không dùng Docker: `npm run build && npm start`. Migration trong `src/migrations` tự chạy khi khởi động.

## Phím tắt trong Builder

| Phím | Tác dụng |
|---|---|
| Ctrl/⌘ + S | Lưu nháp |
| Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z | Hoàn tác / làm lại |
| Ctrl/⌘ + D | Nhân bản phần tử đang chọn |
| Ctrl/⌘ + C / V | Sao chép / dán phần tử |
| Delete | Xoá phần tử |
| Nhấp đúp vào chữ | Sửa trực tiếp. Enter để lưu, Esc để huỷ (Paragraph dùng Ctrl+Enter để lưu) |
| Esc | Bỏ chọn |

## Kiến trúc

```
src/
├── builder/                 # LÕI – dùng chung cho editor, front-end và server
│   ├── types.ts             # BuilderNode, PageContent, Device…
│   ├── schema.ts            # luật cấu trúc: block nào chứa được block nào (thuần dữ liệu)
│   ├── registry.tsx         # ĐỊNH NGHĨA BLOCK: mặc định, control, nhóm style, Render
│   ├── controls.ts          # mô tả control & nhóm style (UI tự sinh từ đây)
│   ├── Renderer.tsx         # render cây node (server + client)
│   ├── css.ts               # styles JSON → CSS scoped `.n-<id>` + media query + :hover
│   ├── theme.ts             # design tokens → CSS variables (nền móng cho Themes ở P4)
│   ├── tree.ts              # thao tác cây: tìm, chèn, di chuyển, nhân bản
│   ├── validate.ts          # kiểm tra/làm sạch nội dung trước khi lưu
│   ├── sanitize.ts          # làm sạch mã SVG
│   └── blocks/TabsRender.tsx
├── editor/                  # Visual Builder (client)
│   ├── store.ts             # zustand + immer: cây, chọn, thiết bị, lịch sử, kéo thả
│   ├── Canvas.tsx           # iframe + portal + sự kiện + sửa chữ trực tiếp
│   ├── dnd.ts               # thuật toán tính vị trí thả
│   ├── Overlay.tsx          # viền chọn/hover, thanh công cụ, vạch thả
│   ├── LeftPanel.tsx        # Phần tử + Cấu trúc (navigator)
│   ├── RightPanel.tsx       # Nội dung / Kiểu / Nâng cao
│   ├── MediaPicker.tsx      # thư viện ảnh + upload
│   ├── TopBar.tsx, Editor.tsx, api.ts, shortcuts.ts, editor.css
├── collections/             # Pages, Media, Users
├── app/
│   ├── (payload)/           # admin + REST/GraphQL API của Payload
│   ├── (builder)/builder/[id]   # trang editor (yêu cầu đăng nhập)
│   └── (frontend)/          # site công khai: /, /[slug], /preview
├── migrations/              # migration Postgres
└── seed/                    # trang mẫu "home"
```

### Dữ liệu

Nội dung trang là **một cây JSON** lưu trong field `content` của collection `pages`:

```jsonc
{
  "version": 1,
  "root": {
    "id": "root", "type": "root", "props": {}, "styles": {},
    "children": [
      {
        "id": "k3j9x2ab", "type": "heading",
        "props": { "text": "Xin chào", "tag": "h1", "cssClass": "", "hide": { "mobile": false } },
        "styles": {
          "desktop": { "fontSize": "48px", "color": "var(--color-primary)" },
          "mobile":  { "fontSize": "32px" },
          "hover":   { "opacity": "0.8" }
        }
      }
    ]
  }
}
```

**Vì sao dùng `json` mà không dùng field `blocks` của Payload?** Field `blocks` có schema cố định. Lồng nhiều tầng (container trong container) rất khó, và mỗi lần thêm hoặc sửa block lại phải migrate Postgres. Ở đây, việc kiểm tra dữ liệu được làm trong hook `beforeChange`, gọi `validateContent()`:
- loại block lạ,
- loại quan hệ cha–con sai luật,
- làm sạch SVG,
- giới hạn độ sâu và số phần tử.

### Thêm một block mới

1. Khai báo luật cấu trúc trong `src/builder/schema.ts`:
   ```ts
   quote: { isContainer: false },
   ```
2. Thêm định nghĩa vào `BLOCK_LIST` trong `src/builder/registry.tsx`:
   ```tsx
   {
     type: 'quote', label: 'Quote', category: 'basic', icon: Quote,
     defaults: () => ({ props: { text: 'Trích dẫn…' }, styles: {} }),
     contentControls: [{ type: 'textarea', prop: 'text', label: 'Nội dung' }],
     styleGroups: ['typography', 'spacing', 'border'],
     inlineEdit: { prop: 'text', multiline: true },
     Render: ({ node, attrs }) => <blockquote {...attrs}>{String(node.props.text ?? '')}</blockquote>,
   },
   ```

Không cần viết UI cho panel: editor tự sinh control từ `contentControls` và `styleGroups`. Front-end cũng tự hiển thị block mới.

### Một số quyết định kỹ thuật

- **Canvas là iframe cùng origin, render bằng React portal.** Cách này cách ly CSS của editor với CSS của trang. Media query cũng chạy đúng theo bề rộng thiết bị: desktop tối thiểu 1280px, tablet 768px, mobile 375px. Khi màn hình hẹp, canvas tự thu nhỏ (góc dưới hiện %).
- **Một renderer duy nhất.** `RenderNode` được dùng cho cả canvas và site thật. Nhờ `memo` cùng cấu trúc dùng chung của immer, chỉ nhánh bị sửa mới render lại.
- **CSS theo node.** Mỗi node có class `.n-<id>`, CSS được biên dịch từ `styles` theo thứ tự desktop-first. Giá trị được làm sạch để không chèn được CSS hay thoát khỏi thẻ `<style>`.
- **Màu toàn cục.** Màu lấy từ token (`var(--color-primary)`…). P4 chỉ cần thay bộ token để đổi theme cho cả site.

## Kiểm thử

```bash
npm test          # unit test lõi: cây, CSS, validate, sanitize SVG, link/YouTube
npm run typecheck
```

## Giới hạn hiện tại và việc tiếp theo

- **Front-end đang render động** (`force-dynamic`) để luôn thấy bản mới sau khi xuất bản. Khi cần hiệu năng cao: chuyển sang cache và gọi `revalidatePath()` trong hook `afterChange` của Pages.
- **Ảnh trong block Image lưu kèm `url`** (bản chụp tại lúc chọn). Nếu thay file trong thư viện media thì cần chọn lại ảnh. Sau này có thể populate theo `id` trong hook `afterRead`.
- **Paragraph là văn bản thuần** (giữ xuống dòng). Rich text (đậm, nghiêng, link trong đoạn) sẽ làm sau.
- **Đổi schema** (thêm field hoặc collection): ở dev, schema tự push. Trước khi deploy, chạy `npm run payload migrate:create <tên>`.
- Lộ trình tiếp theo:
  - **P3 – My Blocks:** lưu vùng chọn thành block, chèn dạng copy hoặc linked, detach.
  - **P4 – Themes:** collection `themes`, các theme preset, My Theme, bộ chọn theme.
  - **P5:** context menu, lịch sử phiên bản trong editor, kéo thả trực tiếp trên canvas không cần handle.
