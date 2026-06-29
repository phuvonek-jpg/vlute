# ✦ AI Chat Cá Nhân

Ứng dụng chat AI đơn giản, đẹp, chạy trên máy local và deploy được lên Vercel.  
Hỗ trợ **OpenRouter**, **OpenAI**, và **Google Gemini**.

---

## 🚀 Lộ Trình Học (20 bước)

### Phần 1 — Chuẩn bị môi trường

**Bước 1 · Cài đặt công cụ**
- [Node.js 18+](https://nodejs.org) — runtime chạy JavaScript phía server
- [VS Code](https://code.visualstudio.com) — trình soạn thảo code
- [Git](https://git-scm.com) — quản lý phiên bản

**Bước 2 · Kiểm tra cài đặt thành công**
```bash
node -v   # phải thấy v18.x.x trở lên
npm  -v   # phải thấy 9.x.x trở lên
git  -v   # phải thấy git version ...
```

**Bước 3 · Tạo tài khoản GitHub**
Truy cập [github.com](https://github.com) → Sign up → xác nhận email.

**Bước 4 · Tạo repository mới**
GitHub → New repository → đặt tên `ai-chat` → Public → Create.

**Bước 5 · Kết nối Git với GitHub (HTTPS)**
```bash
git config --global user.name  "Tên của bạn"
git config --global user.email "email@example.com"
```

---

### Phần 2 — Khởi tạo dự án

**Bước 6 · Clone repository về máy**
```bash
git clone https://github.com/<username>/ai-chat.git
cd ai-chat
```

**Bước 7 · Sao chép code dự án vào thư mục**
Đặt các file `index.html`, `server.js`, `package.json`, `.gitignore`, `.env.example` vào thư mục `ai-chat`.

**Bước 8 · Cài dependencies**
```bash
npm install
```

---

### Phần 3 — Lấy API Key

**Bước 9 · Chọn dịch vụ AI**

| Dịch vụ | Link đăng ký | Miễn phí? | Ghi chú |
|---------|-------------|-----------|---------|
| OpenRouter | https://openrouter.ai/keys | ✅ Có | Nhiều model, dễ dùng |
| Google Gemini | https://aistudio.google.com | ✅ Có | Gemini 1.5 Flash miễn phí |
| OpenAI | https://platform.openai.com | ❌ Trả phí | Cần nạp credit |

**Bước 10 · Tạo API key**
- **OpenRouter**: Dashboard → API Keys → Create Key → Copy key bắt đầu `sk-or-…`
- **Gemini**: Google AI Studio → Get API Key → Create → Copy key bắt đầu `AIza…`

---

### Phần 4 — Cấu hình và chạy local

**Bước 11 · Tạo file .env**
```bash
cp .env.example .env
```
Mở file `.env`, thay `NHAP_API_KEY_CUA_BAN_O_DAY` bằng key thật:
```
API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
MODEL=gpt-4o-mini
PORT=3000
```

**Bước 12 · Chạy server**
```bash
npm start
```
Mở trình duyệt: [http://localhost:3000](http://localhost:3000)

**Bước 13 · Test thử**
- Gõ câu hỏi → nhấn Enter
- Hoặc dán nội dung bằng Ctrl+V → Enter
- Click vào bong bóng đáp án để copy

---

### Phần 5 — Đẩy code lên GitHub

**Bước 14 · Kiểm tra file .gitignore**
Đảm bảo `.env` và `node_modules/` có trong `.gitignore` (đã có sẵn).

**Bước 15 · Commit và push**
```bash
git add .
git commit -m "feat: AI chat app v1"
git push origin main
```

---

### Phần 6 — Deploy lên Vercel

**Bước 16 · Tạo tài khoản Vercel**
Truy cập [vercel.com](https://vercel.com) → Sign up with GitHub.

**Bước 17 · Tạo file vercel.json**
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```
Commit và push file này lên GitHub.

**Bước 18 · Import dự án vào Vercel**
Vercel Dashboard → New Project → Import từ GitHub → chọn repo `ai-chat`.

**Bước 19 · Thêm biến môi trường trên Vercel**
Project Settings → Environment Variables → thêm:
```
API_KEY  = sk-or-v1-xxxxxxxxxxxxxxxx
MODEL    = gpt-4o-mini
```
→ Save → Redeploy.

**Bước 20 · Thêm tên miền (tuỳ chọn)**
Vercel Dashboard → Domains → Add → nhập tên miền của bạn → cấu hình DNS theo hướng dẫn.

---

## 📁 Cấu trúc dự án

```
ai-chat/
├── index.html      ← Giao diện chat
├── server.js       ← Backend Express
├── package.json    ← Cấu hình npm
├── vercel.json     ← Cấu hình deploy (tạo thủ công)
├── .env            ← API key (KHÔNG đẩy lên GitHub)
├── .env.example    ← Template biến môi trường
└── .gitignore      ← Loại trừ .env và node_modules
```

## 💡 Tips

- **Model miễn phí trên OpenRouter**: `meta-llama/llama-3.3-70b-instruct:free`
- **Gemini miễn phí**: `gemini-1.5-flash` — rất nhanh và chính xác
- Tuyệt đối **không đẩy file `.env` lên GitHub** — key sẽ bị lộ
- Dùng `npm run dev` để tự động restart khi sửa code (Node 18+)
