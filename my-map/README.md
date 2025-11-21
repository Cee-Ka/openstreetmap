# 🗺️ Vietnam POI Finder with Weather# React + Vite



Ứng dụng tìm kiếm điểm quan tâm (POI) và xem thông tin thời tiết tại các địa điểm ở Việt Nam.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## ✨ Tính năngCurrently, two official plugins are available:



- 🔍 Tìm kiếm địa điểm ở Việt Nam- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- 📍 Hiển thị 5 POI gần nhất (amenity, shop, tourism)- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- 🗺️ Bản đồ tương tác với OpenStreetMap

- ☀️ Thông tin thời tiết thời gian thực## React Compiler

- 🎯 Vùng tìm kiếm bán kính 1km

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## 🚀 Cài đặt

## Expanding the ESLint configuration

### 1. Clone và cài dependencies

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

```bash
npm install
```

### 2. Cấu hình OpenWeather API

1. Đăng ký tài khoản miễn phí tại [OpenWeatherMap](https://openweathermap.org/api)
2. Lấy API key từ trang quản lý
3. Tạo file `.env.local` từ template:

```bash
cp .env.example .env.local
```

4. Mở `.env.local` và thay `your_api_key_here` bằng API key của bạn:

```env
VITE_OPENWEATHER_API_KEY=your_actual_api_key_here
```

### 3. Chạy ứng dụng

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

## 🛠️ Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Leaflet** - Maps library
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **OpenStreetMap APIs**:
  - Nominatim - Geocoding
  - Overpass - POI data
- **OpenWeather API** - Weather data

## 📝 Lưu ý

- Nominatim và Overpass có rate limits, tránh spam requests
- OpenWeather API key miễn phí có giới hạn 1000 calls/day
- Chỉ tìm kiếm các địa điểm ở Việt Nam

## 📄 License

MIT
