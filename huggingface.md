# 🤗 HuggingFace Spaces - Backend API

## Links

| Resource | URL |
|----------|-----|
| **HuggingFace Space** | https://huggingface.co/spaces/cong-khanh/openstreetmap |
| **Backend API** | https://cong-khanh-openstreetmap.hf.space |
| **API Documentation (Swagger)** | https://cong-khanh-openstreetmap.hf.space/docs |
| **API Documentation (ReDoc)** | https://cong-khanh-openstreetmap.hf.space/redoc |

## API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/` | GET | API info |
| `/api/health` | GET | Health check |
| `/api/translate` | POST | Dịch văn bản Anh-Việt |
| `/api/weather` | POST | Lấy thông tin thời tiết |
| `/api/geocoding` | POST | Tìm kiếm địa điểm |
| `/api/pois` | POST | Lấy POIs gần vị trí |

## Ví dụ sử dụng

### Health Check
```bash
curl https://cong-khanh-openstreetmap.hf.space/api/health
```

### Dịch văn bản
```bash
curl -X POST https://cong-khanh-openstreetmap.hf.space/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "source_lang": "en", "target_lang": "vi"}'
```

### Lấy thời tiết
```bash
curl -X POST https://cong-khanh-openstreetmap.hf.space/api/weather \
  -H "Content-Type: application/json" \
  -d '{"lat": 10.762622, "lon": 106.660172, "location_name": "Ho Chi Minh City"}'
```

### Tìm địa điểm
```bash
curl -X POST https://cong-khanh-openstreetmap.hf.space/api/geocoding \
  -H "Content-Type: application/json" \
  -d '{"query": "Hội An", "country_code": "vn"}'
```

### Lấy POIs
```bash
curl -X POST https://cong-khanh-openstreetmap.hf.space/api/pois \
  -H "Content-Type: application/json" \
  -d '{"lat": 10.762622, "lon": 106.660172, "radius": 1000}'
```

## Cấu hình Frontend

Thêm vào file `my-map/.env`:
```env
VITE_API_BASE_URL=https://cong-khanh-openstreetmap.hf.space
```

## Tech Stack

- **Framework:** FastAPI
- **Runtime:** Python 3.11
- **Hosting:** HuggingFace Spaces (Docker)
- **APIs:** Google Translate, OpenWeather, Nominatim, Overpass
