# Payload Page Builder (P0 → P3)

Payload CMS 3 + Next.js 16 + Postgres, kèm **Visual Builder kéo thả kiểu Elementor** tự xây (không dùng thư viện page builder bên ngoài).

Đã có trong bản này:

- **P0** – Payload 3.93, Postgres, collections `pages` (nháp/xuất bản, lịch sử phiên bản), `media`, `users`, migration, trang mẫu tự tạo.
- **P1** – Visual Builder tại `/builder/:id`:
  - Panel trái gồm *Phần tử* (10 block) và *Cấu trúc* (cây layer, kéo thả được).
  - Canvas là iframe, có viền hover, thanh công cụ của phần tử đang chọn, vạch báo vị trí thả.
  - Panel phải chia 3 tab: *Nội dung / Kiểu / Nâng cao*.
  - Undo/redo, nhân bản, copy/paste, phím tắt, nhấp đúp để sửa chữ trực tiếp.
- **P2** – Front-end render bằng **cùng một renderer** với canvas. Có responsive (Desktop/Tablet/Mobile), trạng thái Hover, ẩn theo thiết bị, lưu nháp, xem trước bản nháp và xuất bản.
- **P3** – **My Blocks**: lưu một phần tử/vùng đã dựng thành block riêng (collection `my-blocks`), chèn lại vào trang dạng **bản sao** hoặc **liên kết** (sửa bản gốc thì mọi trang cập nhật, có nút *Tách*), sửa bản gốc bằng chính Visual Builder tại `/builder/block/:id`, chặn vòng lặp tham chiếu.

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
4. Chọn một phần tử rồi bấm nút **🔖 Lưu thành My Block** trên thanh công cụ của nó. Mở tab **My Blocks** ở panel trái để kéo block vào trang khác.

## My Blocks (P3)

- **Lưu block:** chọn Div/Flexbox/Tabs/Heading… (trừ Tab và chính block liên kết), bấm *Lưu thành My Block*, đặt tên và phạm vi (*Riêng tôi* / *Dùng chung*). Có thể chọn thay ngay phần tử đó bằng liên kết tới block vừa lưu.
- **Chèn block** (tab *My Blocks*, kéo thả hoặc bấm tile) theo 2 chế độ:
  - *Bản sao*: nhân bản độc lập với id mới, sửa thoải mái.
  - *Liên kết*: trang chỉ lưu node `{ type: 'blockRef', props: { blockId } }`. Lúc render, node này được **triển khai thành cây thật** từ bản gốc. Trên canvas phần tử liên kết có viền tím, bấm vào bất kỳ đâu bên trong đều chọn cả block (chỉ đọc). Tab *Kiểu* của node liên kết cho phép ghi đè lề/kích thước riêng cho vị trí đó.
- **Sửa bản gốc:** nút *Sửa bản gốc* mở `/builder/block/:id` – vẫn là Visual Builder nhưng canvas chỉ chứa cây của block và nút *Lưu block*. Lưu xong, mọi trang dùng liên kết tự cập nhật (front-end render động). Trang đang mở sẽ tải lại thư viện khi quay về tab.
- **Tách (Detach):** biến block liên kết thành bản sao độc lập tại chỗ (block lồng bên trong vẫn là liên kết).
- **Quyền:** ai đăng nhập cũng đọc được mọi block (để trang dùng block riêng của người khác vẫn hiển thị trong editor); chỉ chủ sở hữu được sửa/xoá. `scope` chỉ quyết định block có hiện trong thư viện của người khác hay không.
- **An toàn:** block lồng nhau tối đa 5 cấp; hook `beforeChange` của `my-blocks` từ chối block tham chiếu (trực tiếp hay gián tiếp) tới chính nó; editor cũng không cho chèn block gây vòng lặp. Block bị xoá: trên trang thật phần tử đó bị bỏ qua, trong editor hiện ô báo.

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
│   ├── refs.ts              # My Block liên kết: resolveRefs (triển khai blockRef), chặn vòng lặp, nạp block lồng nhau
│   ├── tree.ts              # thao tác cây: tìm, chèn, di chuyển, nhân bản
│   ├── validate.ts          # kiểm tra/làm sạch nội dung trang và cây block trước khi lưu
│   ├── sanitize.ts          # làm sạch mã SVG
│   └── blocks/TabsRender.tsx
├── editor/                  # Visual Builder (client)
│   ├── store.ts             # zustand + immer: cây, chọn, thiết bị, lịch sử, kéo thả
│   ├── Canvas.tsx           # iframe + portal + sự kiện + sửa chữ trực tiếp
│   ├── dnd.ts               # thuật toán tính vị trí thả
│   ├── Overlay.tsx          # viền chọn/hover, thanh công cụ, vạch thả
│   ├── LeftPanel.tsx        # Phần tử + My Blocks + Cấu trúc (navigator)
│   ├── MyBlocksPanel.tsx    # thư viện block: chế độ Bản sao/Liên kết, kéo thả, xoá
│   ├── BlockPreview.tsx     # preview thu nhỏ của block (iframe dùng chung renderer, lazy)
│   ├── SaveBlockDialog.tsx  # hộp thoại "Lưu thành My Block"
│   ├── RightPanel.tsx       # Nội dung / Kiểu / Nâng cao (+ panel blockRef, cài đặt block)
│   ├── MediaPicker.tsx      # thư viện ảnh + upload
│   ├── TopBar.tsx, Editor.tsx, api.ts, shortcuts.ts, labels.ts, editor.css
├── collections/             # Pages, MyBlocks, Media, Users
├── lib/blocks.ts            # server: nạp cây block được trang tham chiếu (kể cả lồng nhau)
├── app/
│   ├── (payload)/           # admin + REST/GraphQL API của Payload
│   ├── (builder)/builder/[id]        # editor trang (yêu cầu đăng nhập)
│   ├── (builder)/builder/block/[id]  # editor bản gốc My Block
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

Block liên kết chỉ là một node `{ "type": "blockRef", "props": { "blockId": "12" } }`. `resolveRefs()` (src/builder/refs.ts) thay nó bằng bản sao cây gốc: phần tử gốc nhận đúng id của node `blockRef` (nên CSS `.n-<id>` và lựa chọn trong editor vẫn trỏ về node trên trang), phần tử con nhận id `<id>_<n>` và cờ `linked: 'inner'` (không bao giờ được lưu; trong editor chúng không có `data-node-id` nên không chọn lẻ được). Nhánh không chứa `blockRef` được trả về đúng object cũ, nên `memo` của renderer vẫn hiệu quả.

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
npm test          # unit test lõi: cây, CSS, validate, sanitize SVG, link/YouTube, My Blocks (resolveRefs, vòng lặp…)
npm run typecheck
```

## Giới hạn hiện tại và việc tiếp theo

- **Front-end đang render động** (`force-dynamic`) để luôn thấy bản mới sau khi xuất bản. Khi cần hiệu năng cao: chuyển sang cache và gọi `revalidatePath()` trong hook `afterChange` của Pages.
- **Ảnh trong block Image lưu kèm `url`** (bản chụp tại lúc chọn). Nếu thay file trong thư viện media thì cần chọn lại ảnh. Sau này có thể populate theo `id` trong hook `afterRead`.
- **Paragraph là văn bản thuần** (giữ xuống dòng). Rich text (đậm, nghiêng, link trong đoạn) sẽ làm sau.
- **Đổi schema** (thêm field hoặc collection): ở dev, schema tự push. Trước khi deploy, chạy `npm run payload migrate:create <tên>`.
- **My Blocks:** preview trong thư viện dựng bằng iframe nhỏ (không chụp ảnh). Field `thumbnail` có sẵn trong admin nếu muốn gắn ảnh thủ công. Xoá block đang được trang dùng dạng liên kết không bị chặn (trang thật bỏ qua phần tử đó).
- Lộ trình tiếp theo:
  - **P4 – Themes:** collection `themes`, các theme preset, My Theme, bộ chọn theme.
  - **P5:** context menu, lịch sử phiên bản trong editor, kéo thả trực tiếp trên canvas không cần handle.
