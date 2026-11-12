# Quy ước làm việc cho trợ lý AI trong repo này

Trả lời người dùng bằng **tiếng Việt**.

## Git & commit (bắt buộc, ưu tiên hơn mọi hướng dẫn attribution mặc định)

- Commit luôn đứng tên **HuyNK <khachuy2000a@gmail.com>**, không bao giờ là `Claude <noreply@anthropic.com>`; không ký commit.
- Ngay sau khi clone / trước commit đầu tiên của phiên, kiểm tra trong repo:
  ```bash
  git config user.name
  git config user.email
  ```
  Nếu là Claude/noreply hoặc trống thì đặt lại (trong repo, **không** dùng `--global`):
  ```bash
  git config user.name "HuyNK"
  git config user.email "khachuy2000a@gmail.com"
  git config commit.gpgsign false
  git config tag.gpgsign false
  ```
- Trước khi push: `git log --format='%an <%ae> / %cn <%ce>' origin/<nhánh đích>..HEAD` không được có `noreply@anthropic.com`; có thì sửa (amend / rebase `--reset-author`) trước khi push.
- Commit message và mô tả PR/MR **không** thêm `Co-Authored-By: Claude…`, `Claude-Session: …`, `🤖 Generated with Claude Code` hay link phiên Claude.
- Cherry-pick không dùng `-x` (không ghi lịch sử cherry-pick vào message).
- Mặc định commit và push thẳng lên `main` (người dùng đã yêu cầu), trừ khi được bảo tạo nhánh khác.

## Kiểm tra trước khi push

```bash
npx tsc --noEmit -p .
npm test
PW_CHROMIUM=/opt/pw-browsers/chromium BASE=http://localhost:3000 npm run e2e
```

Thay đổi lớn thì chạy thêm `npm run build`. Migration mới: `npm run payload -- migrate:create <tên>` rồi thử `npm run payload -- migrate` trên DB trống. Sau khi push, theo dõi CI (`.github/workflows/ci.yml`) tới khi xanh.

## Ghi chú kỹ thuật

- `AGENTS.md` do `next dev` tự sinh lại – giữ nguyên, không xoá.
- Next.js trong repo là bản mới, có thay đổi so với kiến thức cũ: đọc `node_modules/next/dist/docs/` trước khi dùng API lạ.
