# 🚀 Hướng dẫn lấy OpenWeather API Key

## Bước 1: Đăng ký tài khoản

1. Truy cập https://openweathermap.org/api
2. Click nút **Sign Up** (góc trên bên phải)
3. Điền thông tin:
   - Username
   - Email
   - Password
4. Xác nhận email

## Bước 2: Lấy API Key

1. Đăng nhập vào tài khoản
2. Click vào tên user (góc trên bên phải) → **My API keys**
3. Copy **API key** (dạng: `abcd1234efgh5678...`)
4. **Lưu ý**: API key mới có thể mất 10-15 phút để active

## Bước 3: Cấu hình project

1. Copy file `.env.example` thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Mở file `.env.local` và thay thế:
   ```env
   VITE_OPENWEATHER_API_KEY=paste_api_key_của_bạn_vào_đây
   ```

3. Restart dev server:
   ```bash
   npm run dev
   ```

## ✅ Kiểm tra

Sau khi cấu hình xong:
1. Tìm kiếm một địa điểm (ví dụ: "Hà Nội")
2. Bạn sẽ thấy thông tin thời tiết hiển thị ngay bên dưới form tìm kiếm

## 📝 Giới hạn miễn phí

- **60 calls/minute**
- **1,000,000 calls/month**
- Hoàn toàn đủ cho development!

## ⚠️ Lưu ý bảo mật

- **KHÔNG** commit file `.env.local` lên Git
- **KHÔNG** share API key công khai
- File `.gitignore` đã được cấu hình tự động loại trừ `*.local`
