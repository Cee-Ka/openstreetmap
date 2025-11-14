/*
React single-file app: OpenStreetMap + Overpass + Firebase
Filename: App.jsx

Mục tiêu
- Người dùng nhập tên địa điểm ở Việt Nam
- Dùng Nominatim (OpenStreetMap) để geocode
- Dùng Overpass API để lấy 5 POI gần tọa độ (amenity/shop/tourism)
- Hiển thị bản đồ (react-leaflet) và 5 marker
- Tùy chọn: lưu tìm kiếm vào Firebase Firestore

Hướng dẫn cài đặt (README ngắn):
1) Tạo project React (ví dụ: Vite)
   npm create vite@latest my-map -- --template react
   cd my-map
2) Cài dependencies
   npm install react-leaflet leaflet axios firebase
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   -> cấu hình Tailwind theo tài liệu (thêm vào ./src/index.css)
3) Thêm file này vào src/App.jsx (thay thế nội dung)
   Thêm import 'leaflet/dist/leaflet.css' trong src/main.jsx hoặc App.jsx
4) Firebase (tùy chọn): tạo project Firebase, bật Firestore, tạo web app
   Đặt các biến môi trường trong .env.local:
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...

5) Chạy dev:
   npm run dev

6) GitHub Codespaces
   - Đưa project lên GitHub
   - Mở repo -> Code -> Open with Codespaces -> New codespace
   - Codespace sẽ mở trong container, bạn có thể chạy npm install && npm run dev

Lưu ý về API:
- Nominatim: tuân thủ chính sách (User-Agent / Referer). Ở production, cân nhắc dùng dịch vụ geocoding có SLA.
- Overpass: rate limit. Giới hạn tần suất truy vấn.


---- Bắt đầu file React ----
*/

import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
// Firebase (tùy chọn)
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore'

import 'leaflet/dist/leaflet.css'

// Tailwind styles assumed present in project

// Fix default marker icons for Leaflet when using webpack / Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

// Custom red icon for searched POI
const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Initialize Firebase if env present
let db = null
try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig)
    db = getFirestore(app)
  }
} catch (e) {
  console.warn('Firebase init skipped or failed:', e.message)
}

export default function App() {
  const [queryText, setQueryText] = useState('Ho Chi Minh City')
  const [center, setCenter] = useState({ lat: 10.762622, lon: 106.660172 }) // default HCMC
  const [zoom, setZoom] = useState(13)
  const [pois, setPois] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recent, setRecent] = useState([])
  const mapRef = useRef()

  // Keep map size correct on window resize (debounced)
  useEffect(() => {
    let timeout = null
    function handleResize() {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        try {
          mapRef.current && mapRef.current.invalidateSize()
        } catch (e) {}
      }, 150)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeout) clearTimeout(timeout)
    }
  }, [])

  // Search radius (meters)
  const SEARCH_RADIUS = 1000

  useEffect(() => {
    // load recent searches from Firestore (optional)
    if (!db) return
    ;(async () => {
      try {
        const q = query(collection(db, 'searches'), orderBy('createdAt', 'desc'), limit(10))
        const snap = await getDocs(q)
        const arr = []
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }))
        setRecent(arr)
      } catch (e) {
        console.warn('Failed to load recent', e.message)
      }
    })()
  }, [])

  async function handleSearch(e) {
    e && e.preventDefault && e.preventDefault()
    setLoading(true)
    setError(null)
    setPois([])

    try {
      // 1) Use Nominatim to geocode the place (limit to Vietnam)
      const nominatimUrl = 'https://nominatim.openstreetmap.org/search'
      const nomRes = await axios.get(nominatimUrl, {
        params: {
          q: queryText + ' Vietnam',
          format: 'jsonv2',
          addressdetails: 1,
          limit: 1,
          countrycodes: 'vn'
        },
        headers: { 'Accept-Language': 'vi', 'User-Agent': 'MyPOIApp/1.0 (your@email.example)' }
      })

      if (!nomRes.data || nomRes.data.length === 0) {
        setError('Không tìm thấy địa điểm. Thử tên khác.')
        setLoading(false)
        return
      }

      const place = nomRes.data[0]
      const lat = parseFloat(place.lat)
      const lon = parseFloat(place.lon)
      setCenter({ lat, lon })
      setZoom(15)

      // 2) Query Overpass API for POIs nearby (amenity/shop/tourism)
      // We'll use a radius of 1000 meters, and return up to 5 nodes
      const radius = SEARCH_RADIUS
      const overpassQuery = `[
        out:json][timeout:25];
        (
          node(around:${radius},${lat},${lon})[amenity];
          node(around:${radius},${lat},${lon})[shop];
          node(around:${radius},${lat},${lon})[tourism];
        );
        out center ${5};` // ask Overpass for up to many, we'll limit client-side

      const overpassUrl = 'https://overpass-api.de/api/interpreter'
      const overRes = await axios.post(overpassUrl, overpassQuery, {
        headers: { 'Content-Type': 'text/plain' }
      })

      const elements = overRes.data && overRes.data.elements ? overRes.data.elements : []

      // Map and sort by distance from center
      const withDist = elements.map(el => {
        const elLat = el.lat || (el.center && el.center.lat)
        const elLon = el.lon || (el.center && el.center.lon)
        const d = haversineDistance(lat, lon, elLat, elLon)
        return { id: el.id, lat: elLat, lon: elLon, tags: el.tags || {}, dist: d }
      }).filter(x => x.lat && x.lon)

      withDist.sort((a, b) => a.dist - b.dist)
      const top5 = withDist.slice(0, 5)
      setPois(top5)

      // Save to Firestore recent searches (optional)
      if (db) {
        try {
          await addDoc(collection(db, 'searches'), {
            query: queryText,
            center: { lat, lon },
            createdAt: new Date()
          })
        } catch (e) {
          console.warn('Cannot save search', e.message)
        }
      }

      // Move map view
      if (mapRef.current && mapRef.current.setView) {
        mapRef.current.setView([lat, lon], 15)
      }

    } catch (e) {
      console.error(e)
      setError('Lỗi khi tìm kiếm. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180
    const R = 6371e3 // metres
    const φ1 = toRad(lat1)
    const φ2 = toRad(lat2)
    const Δφ = toRad(lat2 - lat1)
    const Δλ = toRad(lon2 - lon1)
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c
    return d
  }

  // Small helper component to keep map centered when center state changes
  function FlyToCenter({ center, zoom }) {
    const map = useMap()
    useEffect(() => {
      map.flyTo([center.lat, center.lon], zoom, { duration: 0.6 })
    }, [center.lat, center.lon, zoom])
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-6 text-gray-800">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h1 className="text-3xl font-bold mb-3 text-sky-700">Tìm POI ở Việt Nam</h1>
          <p className="text-sm text-gray-600 mb-4">Nhập tên địa điểm để xem các POI gần đó (amenity, shop, tourism).</p>
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-sm text-gray-600">Tên địa điểm</label>
            <input
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              placeholder="ví dụ: Hội An, Hà Nội, Bến Thành"
              className="w-full bg-white placeholder-gray-400 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-sky-600 text-white shadow">{loading ? 'Đang tìm...' : 'Tìm'}</button>
              <button type="button" onClick={() => { setQueryText('Ho Chi Minh City'); handleSearch() }} className="px-4 py-2 rounded-lg border">Ví dụ</button>
            </div>
            {error && <div className="text-red-600">{error}</div>}

            <div className="mt-4">
              <h2 className="font-medium">Kết quả <span className="text-sm text-gray-500">({pois.length})</span></h2>
              <ul className="mt-3 space-y-2 text-sm">
                {pois.map(p => (
                  <li key={p.id} className="border border-gray-100 rounded-lg p-3 hover:shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">{p.tags && (p.tags.name || p.tags['brand'] || p.tags.operator) ? (p.tags.name || p.tags['brand'] || p.tags.operator) : 'Không tên'}</div>
                        <div className="text-gray-600 text-xs">{p.tags && (p.tags.amenity || p.tags.shop || p.tags.tourism)}</div>
                      </div>
                      <div className="text-xs text-gray-500">{(p.dist/1000).toFixed(2)} km</div>
                    </div>
                  </li>
                ))}
                {pois.length === 0 && <li className="text-gray-500">Chưa có POI. Tìm một địa điểm để bắt đầu.</li>}
              </ul>
            </div>

            {db && (
              <div className="mt-4">
                <h3 className="font-medium">Lịch sử tìm kiếm (Firestore)</h3>
                <ul className="text-sm mt-2 space-y-1">
                  {recent.map(r => (
                    <li key={r.id} className="text-gray-600">{r.query} — {new Date(r.createdAt.seconds * 1000).toLocaleString()}</li>
                  ))}
                  {recent.length === 0 && <li className="text-gray-500">Không có</li>}
                </ul>
              </div>
            )}

          </form>
        </div>
        <div className="md:col-span-2 h-[540px] rounded-lg overflow-hidden relative">
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
              <div className="text-sky-700 font-semibold">Đang tải kết quả…</div>
            </div>
          )}

          <MapContainer
            whenCreated={map => {
              mapRef.current = map
              // ensure Leaflet recalculates size after mount (fixes half-rendered tiles)
              setTimeout(() => {
                try { map.invalidateSize() } catch (e) { /* ignore */ }
              }, 200)
            }}
            center={[center.lat, center.lon]}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <FlyToCenter center={center} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Red pin for the searched center (POI-like) */}
            <Marker position={[center.lat, center.lon]} icon={redIcon} zIndexOffset={1000}>
              <Popup>
                <div className="text-sm text-gray-800">
                  <div className="font-semibold">{queryText}</div>
                  <div className="text-xs text-gray-500">Tọa độ: {center.lat.toFixed(5)}, {center.lon.toFixed(5)}</div>
                </div>
              </Popup>
            </Marker>

            {pois.map((p, idx) => (
              <Marker key={p.id} position={[p.lat, p.lon]}>
                <Popup>
                  <div className="text-sm text-gray-800">
                    <div className="font-semibold text-gray-800">{p.tags && (p.tags.name || 'Không tên')}</div>
                    <div className="text-xs">{p.tags && (p.tags.amenity || p.tags.shop || p.tags.tourism)}</div>
                    <div className="text-xs text-gray-500">{(p.dist/1000).toFixed(2)} km</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            <Circle center={[center.lat, center.lon]} radius={SEARCH_RADIUS} pathOptions={{ color: '#0ea5a4', opacity: 0.2 }} />
          </MapContainer>
          <div className="absolute left-4 bottom-4 bg-white/90 p-2 rounded shadow text-xs text-gray-600">Lat: {center.lat.toFixed(5)}, Lon: {center.lon.toFixed(5)}</div>
        </div>
      </div>

      <footer className="max-w-6xl mx-auto text-xs text-gray-500 mt-4">
        <div>Ghi chú: Ứng dụng dùng Nominatim và Overpass (OpenStreetMap). Xin tuân thủ policy của họ khi triển khai công khai.</div>
      </footer>
    </div>
  )
}

/* END OF FILE */
