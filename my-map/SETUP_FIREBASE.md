# Hướng dẫn cấu hình Firebase Authentication

## Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** hoặc **"Create a project"**
3. Đặt tên project (ví dụ: `my-map-app`)
4. Có thể bật/tắt Google Analytics tùy ý
5. Click **"Create project"**

## Bước 2: Tạo Web App

1. Trong Firebase Console, click vào icon **"Web"** (</>) để thêm ứng dụng web
2. Đặt nickname cho app (ví dụ: `my-map-web`)
3. Không cần bật Firebase Hosting
4. Click **"Register app"**
5. Copy thông tin cấu hình được hiển thị

## Bước 3: Bật Authentication

1. Trong menu bên trái, click **"Build"** > **"Authentication"**
2. Click **"Get started"**
3. Trong tab **"Sign-in method"**, bật các phương thức đăng nhập:

### Email/Password:
- Click vào **"Email/Password"**
- Bật **"Enable"**
- Click **"Save"**

### Google Sign-in:
- Click vào **"Google"**
- Bật **"Enable"**
- Chọn email hỗ trợ dự án
- Click **"Save"**

## Bước 4: Cấu hình Environment Variables

Tạo file `.env` trong thư mục `my-map/`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenWeather API (nếu cần)
VITE_OPENWEATHER_API_KEY=your_openweather_key
```

### Lấy thông tin cấu hình:
1. Vào Firebase Console > Project Settings (icon bánh răng)
2. Scroll xuống phần **"Your apps"**
3. Click vào app web đã tạo
4. Copy các giá trị từ `firebaseConfig`

## Bước 5: Cấu hình Authorized Domains

1. Vào **Authentication** > **Settings** > **Authorized domains**
2. Thêm domain của bạn nếu deploy (ví dụ: `your-app.vercel.app`)
3. `localhost` đã được thêm mặc định cho development

## Bước 6: Chạy ứng dụng

```bash
cd my-map
npm install
npm run dev
```

Mở http://localhost:5173 và kiểm tra tính năng đăng nhập/đăng ký!

## Tính năng Authentication

- ✅ Đăng ký bằng Email/Password
- ✅ Đăng nhập bằng Email/Password
- ✅ Đăng nhập bằng Google
- ✅ Quên mật khẩu (gửi email reset)
- ✅ Đăng xuất
- ✅ Hiển thị thông tin người dùng

## Lưu ý bảo mật

- Không commit file `.env` lên Git (đã có trong `.gitignore`)
- Các API keys trong client-side có thể được nhìn thấy, nhưng Firebase sử dụng Security Rules để bảo vệ dữ liệu
- Cấu hình Firebase Security Rules phù hợp cho production
