import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'

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

const SEARCH_RADIUS = 1000

// Helper component to fly to new center
function FlyToCenter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([center.lat, center.lon], zoom, { duration: 0.6 })
  }, [center.lat, center.lon, zoom, map])
  return null
}

// Haversine distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180
  const R = 6371e3
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lon2 - lon1)
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function App() {
  const [queryText, setQueryText] = useState('Ho Chi Minh City')
  const [center, setCenter] = useState({ lat: 10.762622, lon: 106.660172 })
  const [zoom, setZoom] = useState(13)
  const [pois, setPois] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const mapRef = useRef()

  // Fix map size on mount and resize
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 200)

    const handleResize = () => {
      clearTimeout(timer)
      setTimeout(() => mapRef.current?.invalidateSize(), 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Fetch weather data for coordinates
  async function fetchWeather(lat, lon, locationName) {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
    console.log('🌤️ fetchWeather called:', { lat, lon, locationName, hasKey: !!apiKey })
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.warn('⚠️ OpenWeather API key not configured')
      return
    }

    setWeatherLoading(true)
    console.log('⏳ Setting weatherLoading to true')
    
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`
      console.log('📡 Fetching weather from API...')
      
      const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric',
          lang: 'vi'
        }
      })

      console.log('✅ Weather data received:', data)
      
      const weatherData = {
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0]?.description || '',
        icon: data.weather[0]?.icon || '01d',
        wind: data.wind.speed,
        location: locationName
      }
      
      console.log('📊 Setting weather state:', weatherData)
      setWeather(weatherData)
    } catch (err) {
      console.error('❌ Weather fetch error:', err)
      setWeather(null)
    } finally {
      setWeatherLoading(false)
      console.log('✓ weatherLoading set to false')
    }
  }

  // Load weather on mount for default location
  useEffect(() => {
    console.log('🚀 Component mounted, loading initial weather...')
    fetchWeather(center.lat, center.lon, 'Ho Chi Minh City')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(e) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    setPois([])

    try {
      // Geocode with Nominatim
      const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `${queryText} Vietnam`,
          format: 'jsonv2',
          addressdetails: 1,
          limit: 1,
          countrycodes: 'vn'
        },
        headers: { 
          'Accept-Language': 'vi', 
          'User-Agent': 'MyPOIApp/1.0' 
        }
      })

      if (!data?.length) {
        setError('Không tìm thấy địa điểm. Thử tên khác.')
        return
      }

      const { lat: latitude, lon: longitude } = data[0]
      const lat = parseFloat(latitude)
      const lon = parseFloat(longitude)
      const locationName = data[0].display_name || queryText
      
      setCenter({ lat, lon })
      setZoom(15)

      // Fetch weather for this location
      fetchWeather(lat, lon, locationName)

      // Query Overpass API for nearby POIs
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node(around:${SEARCH_RADIUS},${lat},${lon})[amenity];
          node(around:${SEARCH_RADIUS},${lat},${lon})[shop];
          node(around:${SEARCH_RADIUS},${lat},${lon})[tourism];
        );
        out center 20;`

      const { data: overpassData } = await axios.post(
        'https://overpass-api.de/api/interpreter', 
        overpassQuery,
        { headers: { 'Content-Type': 'text/plain' } }
      )

      const elements = overpassData?.elements || []

      // Calculate distances and get top 5
      const poisWithDistance = elements
        .map(el => ({
          id: el.id,
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          tags: el.tags || {},
          dist: haversineDistance(lat, lon, el.lat || el.center?.lat, el.lon || el.center?.lon)
        }))
        .filter(p => p.lat && p.lon)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5)

      setPois(poisWithDistance)

    } catch (err) {
      console.error(err)
      setError('Lỗi khi tìm kiếm. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-6">
      {console.log('🎨 Render - weather:', weather, 'weatherLoading:', weatherLoading)}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Search Panel - Left */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-sky-700">Tìm POI ở Việt Nam</h1>
            <p className="text-sm text-gray-600 mt-2">
              Nhập tên địa điểm để xem các POI gần đó
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tên địa điểm</label>
              <input
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                placeholder="Hội An, Hà Nội, Bến Thành..."
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow disabled:opacity-50"
              >
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
              <button 
                type="button" 
                onClick={() => { setQueryText('Hội An'); setTimeout(handleSearch, 0) }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Ví dụ
              </button>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          </form>

          {/* Results List */}
          <div>
            <h2 className="font-semibold mb-2">
              Kết quả <span className="text-sm text-gray-500">({pois.length})</span>
            </h2>
            <ul className="space-y-2">
              {pois.length > 0 ? (
                pois.map(p => (
                  <li key={p.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">
                          {p.tags.name || p.tags.brand || p.tags.operator || 'Không tên'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {p.tags.amenity || p.tags.shop || p.tags.tourism}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-2">
                        {(p.dist / 1000).toFixed(2)} km
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 text-center py-4">
                  Chưa có POI. Hãy tìm kiếm một địa điểm.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Map Panel - Center */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-[600px] relative">
            {loading && (
              <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
                <div className="text-sky-700 font-semibold">Đang tải...</div>
              </div>
            )}

            {/* Debug card - always show */}
            <div className="absolute top-4 left-4 z-[1000] bg-red-100 p-2 rounded text-xs">
              Weather: {weather ? '✅' : '❌'} | Loading: {weatherLoading ? '⏳' : '💤'}
            </div>

            <MapContainer
            ref={mapRef}
            center={[center.lat, center.lon]}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <FlyToCenter center={center} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Center marker */}
            <Marker position={[center.lat, center.lon]} icon={redIcon} zIndexOffset={1000}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{queryText}</div>
                  <div className="text-xs text-gray-500">
                    {center.lat.toFixed(5)}, {center.lon.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* POI markers */}
            {pois.map(p => (
              <Marker key={p.id} position={[p.lat, p.lon]}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{p.tags.name || 'Không tên'}</div>
                    <div className="text-xs text-gray-600">
                      {p.tags.amenity || p.tags.shop || p.tags.tourism}
                    </div>
                    <div className="text-xs text-gray-500">{(p.dist / 1000).toFixed(2)} km</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Search radius circle */}
            <Circle
              center={[center.lat, center.lon]}
              radius={SEARCH_RADIUS}
              pathOptions={{ color: '#0ea5a4', opacity: 0.9, weight: 2 }}
              fillColor="#0ea5a4"
              fillOpacity={0.12}
            />
          </MapContainer>

          {/* Coordinates display */}
          <div className="absolute left-4 bottom-4 bg-white/90 px-3 py-1 rounded shadow text-xs text-gray-600">
            {center.lat.toFixed(5)}, {center.lon.toFixed(5)}
          </div>
          </div>
        </div>

      {/* Weather Panel - Right */}
      <div className="lg:col-span-1 space-y-4">
        {weatherLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-gray-500">⏳ Đang tải thời tiết...</div>
          </div>
        )}

        {weather && (
          <div className="bg-gradient-to-br from-sky-100 to-blue-50 rounded-2xl shadow-lg p-6 border border-sky-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">☀️</span> Thời tiết
            </h3>
            
            <div className="flex items-center justify-center mb-6">
              <img 
                src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                alt={weather.description}
                className="w-32 h-32"
              />
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-800 mb-2">{weather.temp}°C</div>
              <div className="text-sm text-gray-600 capitalize font-medium">{weather.description}</div>
            </div>

            <div className="space-y-3 bg-white/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-lg">🌡️</span> Cảm giác
                </span>
                <span className="font-semibold text-gray-800">{weather.feels_like}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-lg">💧</span> Độ ẩm
                </span>
                <span className="font-semibold text-gray-800">{weather.humidity}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-lg">💨</span> Gió
                </span>
                <span className="font-semibold text-gray-800">{weather.wind} m/s</span>
              </div>
            </div>
          </div>
        )}

        {!weather && !weatherLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-gray-400 text-sm">
              Tìm kiếm địa điểm để xem thời tiết
            </div>
          </div>
        )}
      </div>
      </div>

      <footer className="max-w-7xl mx-auto text-xs text-gray-500 mt-6 text-center">
        Dữ liệu từ OpenStreetMap (Nominatim & Overpass API)
      </footer>
      </div>
    </div>
  )
}
