# Payload Page Builder (P0 → P5 + UI Kit + Data Binding)

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
- **Gợi ý kiểu (presets)** – tab **✦ Gợi ý** ở panel phải: thư viện biến thể của chính phần tử đang chọn (render thật với nội dung hiện có), bấm để áp dụng, hoàn tác được. Có sẵn cho mọi loại block (Button 23 kiểu: đặc/viền/mờ/pill/gradient/kính/CTA/có icon trước-sau/chỉ icon…), Button có icon (34 icon nội bộ). "Lưu kiểu này" ghi kiểu hiện tại thành **Gợi ý của tôi** (collection `style-presets`, riêng tôi / dùng chung).
- **Trang động & người dùng** – trang mẫu theo slug (`/slug/<giá trị>` bind cả trang vào bản ghi), phân trang/tìm kiếm/lọc thật qua tham số URL, điều kiện hiển thị theo đăng nhập hoặc theo trường, `{{user.*}}`, Sign-in Form đăng nhập thật và `#logout`.
- **Data Binding** – block chứa khai báo **nguồn dữ liệu** (collection, danh sách/một bản ghi, lọc, sắp xếp, giới hạn); ô nhập nào cũng có nút ⚡ chèn `{{truong}}`; block **Danh sách dữ liệu** lặp phần tử mẫu cho từng bản ghi. Collection nào cũng dùng được chỉ bằng một khai báo `custom.builder` (whitelist trường công khai). Canvas hiện dữ liệu thật, trang công khai render phía server và tự làm mới cache khi dữ liệu đổi.
- **UI Kit (theo namethatui.com)** – 36 block UI mới (header/navbar có hamburger, carousel, accordion, card, bento, masonry, marquee, breadcrumbs, pagination, steps, toggle group, bottom navigation, floating button, scrollspy, waffle menu, submenu/cascader/drill-down, overflow menu, command palette, product tour, data table, pie/donut chart, timeline, avatar group, status dot, chat bubble, badge/chip/pill/tag, progress/spinner, skeleton, empty state, alert/callout/banner, toast, modal/drawer/sheet, popover/dropdown/tooltip/hover card, lightbox, form + form field, sign-in form) và hệ **hiệu ứng** chọn được cho mọi phần tử (scroll reveal, spring/easing, hover highlight/lift/spotlight, text scramble/typewriter/rotating words/shimmer, parallax, stacking cards, hide-on-scroll header, sticky/fixed, truncation, scrim, focus ring).
- **P5** – **Hoàn thiện**: rich text cho Paragraph (đậm/nghiêng/gạch chân/link, thanh công cụ nổi khi sửa trực tiếp), menu chuột phải trên canvas và cây Cấu trúc, kéo thả trực tiếp phần tử trên canvas không cần tay cầm, lịch sử phiên bản trong editor (xem trước, khôi phục, hoàn tác được), cache trang công khai + làm mới tự động khi xuất bản/sửa block/theme.
- **P4** – **Themes**: collection `themes` (màu, font, bo góc, kiểu nút, link Google Fonts) với 4 preset chỉ đọc, nhân bản thành My Theme để chỉnh; global `site-settings` chọn theme của site, trang có thể ghi đè; hộp thoại *Quản lý theme* trong editor xem thử ngay trên canvas; bộ chọn màu lấy token theo theme đang dùng.

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
5. Bấm **Cài đặt trang** (khi chưa chọn phần tử nào) → **Quản lý theme…** để đổi theme của site hoặc ghi đè theme cho trang.

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

## Themes (P4)

- **Token:** `colors` (8 màu), `fonts` (tiêu đề/nội dung/mono), `radius` (sm/md/lg), `button` (bo góc, độ đậm, kiểu chữ) và `fontUrl` (stylesheet font ngoài, chỉ nhận https). Chúng thành CSS variables `--color-*`, `--font-*`, `--radius-*`, `--button-*` (src/builder/theme.ts). Block Button và CSS nền dùng `var(--button-*)` nên đổi theme là đổi kiểu nút cả site.
- **Preset:** 4 theme chỉ đọc được seed (Indigo, Ocean, Sunset, Mono). Người dùng bấm **Nhân bản** để có My Theme rồi chỉnh (ô màu, font gợi ý hoặc font stack tuỳ chỉnh, link Google Fonts). Chỉ seed mới tạo được preset; API luôn ép `isPreset=false` với người dùng.
- **Áp dụng:** global **Cài đặt site** chọn theme của site; field *Ghi đè theme* trên trang (hoặc ô *Theme* trong Cài đặt trang của editor) ghi đè riêng cho trang đó. Thứ tự ưu tiên khi render: ghi đè của trang → theme site → mặc định (src/lib/themes.ts). Xoá theme đang dùng thì tự quay về bậc tiếp theo.
- **Editor:** hộp thoại *Quản lý theme* xem thử ngay trên canvas khi chọn hoặc chỉnh theme (chưa lưu thì không ảnh hưởng gì). Bộ chọn màu trong tab Kiểu hiện đúng màu token của theme đang dùng. Mọi giá trị token được làm sạch (`normalizeTheme`) trước khi phát CSS.

## Hoàn thiện (P5)

- **Rich text:** Paragraph lưu HTML đã làm sạch bằng `sanitizeRichText` (chỉ `b/strong/i/em/u/s/a/br/code/ul/ol/li`, link chỉ http(s)/mailto/tel) ở cả hook lưu lẫn lúc render; văn bản thuần cũ hiển thị như trước. Nhấp đúp để sửa trực tiếp: thanh công cụ nổi B/I/U/S/Link/danh sách, Ctrl+B/I/U, Enter xuống dòng (trong danh sách: mục mới), Ctrl+Enter xong. Panel phải có ô soạn tương tự. Paragraph có danh sách render bằng `div` để HTML hợp lệ.
- **Menu chuột phải:** trên canvas và cây Cấu trúc: chọn cha, nhân bản, sao chép/dán, lưu thành My Block, tách block liên kết, xoá.
- **Kéo thả trực tiếp:** nhấn giữ một phần tử trên canvas và kéo quá 6px là bắt đầu di chuyển (vẫn dùng thuật toán thả hiện có), Esc để huỷ. Tay cầm trên thanh công cụ và kéo từ panel vẫn hoạt động.
- **Lịch sử phiên bản:** nút 🕘 ở thanh trên liệt kê các bản nháp/xuất bản của Payload, xem trước và *Khôi phục vào editor* như một bước chỉnh sửa (Ctrl+Z hoàn tác được); trang chỉ đổi khi bạn Lưu nháp/Xuất bản.
- **Google Fonts:** trong *Quản lý theme*, mỗi font chọn từ font hệ thống, ~55 Google Fonts theo nhóm (sans/serif/display/mono) hoặc stack tuỳ chỉnh, có dòng chữ mẫu. Chọn Google Font thì link stylesheet tự sinh từ các font đang dùng (`buildGoogleFontsUrl`); dán link tuỳ chỉnh (Typekit…) thì giữ nguyên, có nút *Tạo lại từ Google Fonts*.
- **Khoá khi nhiều người cùng sửa:** dùng collection `payload-locked-documents` sẵn có của Payload (admin cũng dùng, nên admin và builder thấy khoá của nhau). Mở editor là giữ khoá, gia hạn mỗi 60s, thả khi rời trang (`pagehide` + `keepalive`); Payload coi khoá quá 300s là hết hạn. Người thứ hai thấy băng rôn "đang được X sửa", nút lưu bị vô hiệu, có *Kiểm tra lại* và *Chiếm quyền sửa*. Lưu gửi `overrideLock=false` nên server trả 423 nếu khoá thuộc người khác; vì Payload xoá khoá sau mỗi update, editor tự lấy lại khoá sau khi lưu.
- **Cache:** trang công khai đọc từ `unstable_cache` theo tag `pages`; hook `afterChange`/`afterDelete` của Pages, My Blocks, Themes và Site Settings gọi `revalidateTag` (hết hạn ngay) kèm `revalidatePath` của trang. Draft mode luôn đọc bản nháp mới nhất, không cache.

## Data Binding – trang lấy dữ liệu từ CMS

Repo này là nền để dựng bất kỳ web nào, nên hệ dữ liệu không gắn với collection cụ thể.

**1. Đăng ký nguồn dữ liệu** – trong `CollectionConfig` của collection muốn dùng (ví dụ `src/collections/Users.ts`):

```ts
custom: { builder: { label: 'Người dùng', expose: ['name', 'title', 'bio', 'avatar'] } },
hooks: { afterChange: [({ doc }) => (revalidatePages(), doc)], afterDelete: [({ doc }) => (revalidatePages(), doc)] },
```

- `expose` là **whitelist** các trường được đưa ra trang công khai; server chỉ trả đúng các trường này (email, mật khẩu… không bao giờ lộ) dù trang đọc bằng `overrideAccess`.
- Hook `revalidatePages()` làm mới cache trang khi dữ liệu đổi. Muốn thêm collection mới (bài viết, sản phẩm…) cho web khác: tạo collection như thường lệ của Payload + 2 dòng trên.
- `GET /api/builder/sources` (cần đăng nhập) trả danh sách nguồn và trường để editor dựng bộ chọn.

**2. Trong editor**

- Block chứa (Div, Flexbox, Card, Masonry, Bento, Danh sách dữ liệu) có mục **Lấy dữ liệu từ collection** ở tab Nội dung: chọn collection, chế độ *Danh sách* hay *Một bản ghi* (tìm theo trường = giá trị), số bản ghi, sắp xếp, bộ lọc (bằng / khác / chứa / lớn hơn / nhỏ hơn / có giá trị / thuộc). Panel báo số bản ghi đã nạp và các trường dùng được.
- Mọi ô nhập chữ, link, ảnh của phần tử con có nút **⚡** liệt kê trường của nguồn bao quanh và chèn `{{name}}`, `{{avatar.url}}`, `{{nhom.truong}}`, `{{index}}`, `{{count}}`. Ô ảnh nhận `{{avatar}}` (object upload tự thành ảnh).
- **Danh sách dữ liệu** lặp toàn bộ phần tử con cho từng bản ghi; chỉ bản đầu (mẫu) chọn/sửa được, các bản sao chỉ xem. Block chứa khác có nguồn thì gắn bản ghi đầu tiên vào cây con. Mẫu mặc định: avatar (ảnh hoặc chữ cái đầu) + tên + chức danh, lưới 4/2/1 cột.
- **Render danh sách với block bạn chọn**: (a) chọn phần tử bất kỳ trên trang (thẻ bạn đã dựng, Card, Badge…) rồi bấm nút **🗄 Lặp theo dữ liệu** trên thanh công cụ hoặc menu chuột phải → phần tử được bọc thành Danh sách dữ liệu, các ô chữ/ảnh **tự gắn trường** (heading → `{{name}}`, paragraph → `{{title}}`/`{{bio}}`, ảnh/avatar → `{{avatar}}`); (b) trong panel của Danh sách dữ liệu, mục **Phần tử mẫu** chọn loại block có sẵn hoặc một My Block rồi *Dùng làm mẫu*. Sau đó vẫn chỉnh từng trường bằng ⚡.
- Block **Avatar** (ảnh hoặc chữ cái đầu từ tên, tròn/bo/vuông) dùng cho thẻ người dùng.
- Nguồn dữ liệu nằm trong My Block liên kết vẫn hoạt động (nạp trên cây đã triển khai).

**3. Cách chạy** – `src/builder/data.ts` (thuần dữ liệu: chuẩn hoá nguồn, `buildWhere`, `bindString`, `resolveData`), `src/lib/data.ts` (server: `getSources`, `loadDataForTree`). Thứ tự render: `resolveRefs` → nạp dữ liệu → `resolveData` → biên dịch CSS. Editor nạp qua REST của chính collection (quyền của người đăng nhập) và cũng chỉ giữ trường expose.

**4. Trang mẫu động** – trong *Cài đặt trang* bật **Trang mẫu động**, chọn collection và trường khớp URL (mặc định `id`). Trang phục vụ `/<slug>/<giá trị>` (ví dụ `/thanh-vien/12` hoặc `/thanh-vien/Bob%20Tr%E1%BA%A7n` khi khớp theo `name`); toàn bộ trang bind vào bản ghi khớp, không có bản ghi → 404; tiêu đề trang cũng nhận `{{trường}}`. Chọn *Xem thử với bản ghi* để canvas hiện dữ liệu thật. Từ Danh sách dữ liệu, đặt link `/thanh-vien/{{id}}` (nút ⚡ nối vào ô Link) là có trang chi tiết. Route: `src/app/(frontend)/[slug]/[param]/page.tsx`.

**5. Phân trang, tìm kiếm, lọc thật** – ở nguồn dữ liệu chế độ danh sách bật **Nhận tham số URL** và chọn trường tìm kiếm. Trang sẽ đọc `?page=N`, `?q=từ khoá` (like trên các trường đã chọn) và `?<trường>=<giá trị>` (bằng; chỉ trường trong `expose`). Các block điều khiển: **Pagination** (bật *Theo nguồn dữ liệu trên trang* → số trang/trang hiện tại tự tính, link giữ tham số), **Ô tìm kiếm** (form GET `?q=`, giữ từ khoá, hiện số kết quả), **Toggle Group** với *Lọc theo tham số URL* (mỗi lựa chọn là link `?trường=giá trị`, tự đánh dấu mục đang chọn; giá trị trống = bỏ lọc). Trong danh sách có thêm `{{page}}`, `{{totalPages}}`, `{{total}}`. Cache trang theo cả tham số URL; canvas luôn hiện trang 1.

**6. Điều kiện hiển thị & người đang đăng nhập** – tab *Nâng cao* của mọi phần tử có **Hiển thị có điều kiện**: *Mọi người / Chỉ đã đăng nhập / Chỉ khách* và/hoặc điều kiện theo trường (của bản ghi bao quanh hoặc `user.*`): có giá trị, trống, bằng, khác, chứa, lớn hơn, nhỏ hơn. Trang thật bỏ hẳn phần tử bị ẩn; canvas hiện mờ (viền vàng) để vẫn sửa được. `{{user.name}}`, `{{user.avatar.url}}`… dùng được ở mọi nơi (nút ⚡ có nhóm *Người đang đăng nhập*); người dùng lấy từ cookie Payload và chỉ gồm trường `expose` của `users`. *Cài đặt trang → Xem như khách* để thử. **Sign-in Form** để trống `action` sẽ đăng nhập vào `users` của site (cookie) và tải lại trang; link `#logout` đăng xuất. Dữ liệu trang vẫn được cache; chỉ phần render theo người dùng chạy mỗi request.

**Gợi ý bước sau:** đăng ký tài khoản công khai (collection khách hàng riêng, không dùng users admin), dữ liệu theo người dùng (`where owner = {{user.id}}`), sitemap/SEO cho trang mẫu động.

## Gợi ý kiểu (presets)

- Chọn phần tử → tab **✦ Gợi ý**. Mỗi gợi ý là chính phần tử đó với preset áp dụng, render trong một iframe bằng đúng renderer và theme nên thấy ngay với chữ/ảnh của bạn. Bấm để áp dụng; Ctrl+Z hoàn tác. Preset chỉ đổi kiểu (desktop + hover, và tablet/mobile nếu preset có) và prop hình thức (icon, biến thể…), không đụng nội dung, link, ảnh, nguồn dữ liệu.
- Thư viện có sẵn: `src/builder/presets.ts` – mọi loại block đều có ít nhất 2 gợi ý; Button 23 (nhóm Kiểu nút, Kích cỡ, Có icon), Heading 8, Div/Flexbox (section, khung, hộp), Card, Image, Tabs (gạch chân/pills/segmented/dọc), Alert, Badge, Progress, Form, Sign-in… Thêm gợi ý mới chỉ cần thêm một mục vào `PRESETS[type]`.
- **Button có icon**: prop `icon` (34 icon SVG nội bộ trong `blocks/helpers.tsx`), `iconPosition` trước / sau / chỉ icon (tự có `aria-label`), `iconSize`.
- **Gợi ý của tôi**: nút *Lưu kiểu này* lưu styles + prop hình thức của phần tử (bỏ nội dung) vào collection `style-presets` theo loại block, phạm vi riêng tôi / dùng chung; hiện đầu thư viện, chủ sở hữu xoá được.

## UI Kit & hiệu ứng (theo namethatui.com)

Toàn bộ 58 mục nền web của [namethatui.com](https://namethatui.com/?platform=web) được đưa vào builder: mục là **thành phần UI** thành block ở panel *Phần tử* (nhóm Bố cục, Điều hướng, Dữ liệu & hiển thị, Phản hồi & trạng thái, Lớp phủ, Form); mục là **hiệu ứng** thành lựa chọn trong tab *Kiểu* (nhóm *Chuyển động*, *Vị trí*, *Chữ → Giới hạn dòng*, *Nền → Lớp phủ*, *Hiệu ứng → Easing / Viền khi focus*). Drag & Drop là tương tác của chính editor; Tabs và Divider đã có từ trước (Divider thêm biến thể Rule / Separator / có chữ / dọc).

- **Định nghĩa block:** `src/builder/blocks/defs/{layout,feedback,forms}.tsx` – mỗi block vẫn là một mục registry (defaults, controls, styleGroups, Render). Control mới: `list` (danh sách mục lặp lại có trường con), `number`, `color`, `custom: 'children'`.
- **Render tĩnh + Runtime:** block render HTML thuần (server được), phần tương tác (accordion, carousel, drawer, dialog, popover/menu, toast, lightbox, command palette Ctrl+K, product tour, form, toggle group, dismiss, mật khẩu, multi-select chips) do `src/builder/blocks/Runtime.tsx` xử lý qua `data-*` bằng delegated event – chạy cả trên trang thật lẫn canvas. Trong editor, nội dung bị ẩn ở trang thật (modal, popover, toast, command palette, tour) được render mở trong khung “chỉ hiện trong editor” để sửa được.
- **CSS block:** `src/builder/blocks/blocks.css.ts` (dùng token theme). Lưu ý class tự sinh `b-<type>` của mọi node: không đặt CSS cho phần tử con trùng tên type.
- **Hiệu ứng:** `src/builder/effects.ts` – `props.fx` được làm sạch khi lưu, biên dịch CSS trong `css.ts` (keyframes trong `FX_CSS`), JS trong Runtime. **Spring** là mô phỏng lò xo thật (độ cứng / giảm chấn / khối lượng) xuất thành easing `linear()` kèm thời lượng tự tính. Tôn trọng `prefers-reduced-motion`.
- **Form:** block Form gửi JSON tới collection `form-submissions` (khách tạo được, có honeypot, chỉ người đăng nhập đọc) hoặc tới URL `action` riêng; validation JS hiển thị dòng lỗi của Form Field. Sign-in Form chỉ là giao diện, POST tới `action` bạn đặt.

## Phím tắt trong Builder

| Phím | Tác dụng |
|---|---|
| Chuột phải | Menu ngữ cảnh của phần tử |
| Nhấn giữ + kéo | Di chuyển phần tử trên canvas |
| Ctrl/⌘ + B / I / U (khi sửa chữ) | Đậm / nghiêng / gạch chân (Paragraph) |
| Ctrl/⌘ + S | Lưu nháp |
| Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z | Hoàn tác / làm lại |
| Ctrl/⌘ + D | Nhân bản phần tử đang chọn |
| Ctrl/⌘ + C / V | Sao chép / dán phần tử |
| Delete | Xoá phần tử |
| Nhấp đúp vào chữ | Sửa trực tiếp. Enter để lưu, Esc để huỷ (Paragraph: Enter xuống dòng, Ctrl+Enter để lưu) |
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
│   ├── theme.ts             # design tokens → CSS variables, normalizeTheme, 4 preset
│   ├── refs.ts              # My Block liên kết: resolveRefs (triển khai blockRef), chặn vòng lặp, nạp block lồng nhau
│   ├── tree.ts              # thao tác cây: tìm, chèn, di chuyển, nhân bản
│   ├── validate.ts          # kiểm tra/làm sạch nội dung trang và cây block trước khi lưu
│   ├── sanitize.ts          # làm sạch mã SVG và rich text của Paragraph
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
│   ├── ThemeDialog.tsx      # quản lý theme: preset, nhân bản, chỉnh token, xem thử trên canvas
│   ├── PresetGallery.tsx    # tab Gợi ý: biến thể của phần tử đang chọn, lưu/xoá gợi ý của tôi
│   ├── HistoryDialog.tsx    # lịch sử phiên bản: xem trước, khôi phục vào editor
│   ├── ContextMenu.tsx      # menu chuột phải (canvas + cây Cấu trúc)
│   ├── RichToolbar.tsx      # thanh công cụ rich text dùng chung
│   ├── lock.ts, LockBanner.tsx  # khoá tài liệu khi nhiều người cùng sửa
│   ├── RightPanel.tsx       # Nội dung / Kiểu / Nâng cao (+ panel blockRef, cài đặt block)
│   ├── MediaPicker.tsx      # thư viện ảnh + upload
│   ├── TopBar.tsx, Editor.tsx, api.ts, shortcuts.ts, labels.ts, editor.css
├── collections/             # Pages, MyBlocks, Themes, StylePresets, FormSubmissions, Media, Users
├── globals/SiteSettings.ts  # theme đang dùng của site
├── lib/pages.ts             # server: lấy trang (cache theo tag `pages`, draft mode đọc tươi)
├── lib/revalidate.ts        # làm mới cache sau khi xuất bản / sửa block / theme / dữ liệu nguồn
├── lib/data.ts              # server: danh sách nguồn (custom.builder) + nạp bản ghi cho cây (kèm tham số URL)
├── lib/user.ts              # server: người đang đăng nhập đã lọc trường công khai
├── lib/blocks.ts            # server: nạp cây block được trang tham chiếu (kể cả lồng nhau)
├── lib/themes.ts            # server: theme hiệu lực của trang (ghi đè → site → mặc định)
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
- **Màu toàn cục.** Màu lấy từ token (`var(--color-primary)`…); `PageRenderer` phát bộ token của theme hiệu lực ngay trong trang nên đổi theme không cần đụng tới nội dung.

## Kiểm thử

```bash
npm test          # unit test lõi: cây, CSS, validate, sanitize SVG/rich text, link/YouTube, My Blocks (resolveRefs, vòng lặp…), theme
npm run typecheck
```

## Giới hạn hiện tại và việc tiếp theo

- **Cache:** dữ liệu trang được cache (xem P5) nhưng route vẫn render động vì phải kiểm tra draft mode; muốn tĩnh hoàn toàn cần tách preview sang route riêng.
- **Ảnh trong block Image lưu kèm `url`** (bản chụp tại lúc chọn). Nếu thay file trong thư viện media thì cần chọn lại ảnh. Sau này có thể populate theo `id` trong hook `afterRead`.
- **Rich text** gồm định dạng inline và danh sách (chưa có tiêu đề/bảng trong đoạn).
- **Khoá tài liệu**: nếu tab bị đóng đột ngột mà `pagehide` không kịp gửi, khoá tự hết hạn sau 300 giây hoặc người khác bấm *Chiếm quyền sửa*.
- **Đổi schema** (thêm field hoặc collection): ở dev, schema tự push. Trước khi deploy, chạy `npm run payload migrate:create <tên>`.
- **My Blocks:** preview trong thư viện dựng bằng iframe nhỏ (không chụp ảnh). Field `thumbnail` có sẵn trong admin nếu muốn gắn ảnh thủ công. Xoá block đang được trang dùng dạng liên kết không bị chặn (trang thật bỏ qua phần tử đó).
- **Themes:** font ngoài chỉ nạp qua `fontUrl` (một stylesheet); chưa có bộ chọn Google Fonts tích hợp. Theme không có lịch sử phiên bản.
- Gợi ý tiếp theo: xuất/nhập block giữa các site, bảng trong rich text, cộng tác thời gian thực.
