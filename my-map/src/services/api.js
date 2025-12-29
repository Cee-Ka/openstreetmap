import axios from 'axios'

// Backend API URL - có thể đổi thành URL từ HuggingFace/ngrok/pinggy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============ Translation API ============

export async function translateText(text, sourceLang = 'en', targetLang = 'vi') {
  try {
    const response = await api.post('/api/translate', {
      text,
      source_lang: sourceLang,
      target_lang: targetLang
    })
    return response.data
  } catch (error) {
    console.error('Translation API error:', error)
    throw error
  }
}

// ============ Weather API ============

export async function getWeather(lat, lon, locationName = null) {
  try {
    const response = await api.post('/api/weather', {
      lat,
      lon,
      location_name: locationName
    })
    return response.data
  } catch (error) {
    console.error('Weather API error:', error)
    throw error
  }
}

// ============ Geocoding API ============

export async function geocodeLocation(query, countryCode = 'vn') {
  try {
    const response = await api.post('/api/geocoding', {
      query,
      country_code: countryCode
    })
    return response.data
  } catch (error) {
    console.error('Geocoding API error:', error)
    throw error
  }
}

// ============ POI API ============

export async function getPOIs(lat, lon, radius = 1000) {
  try {
    const response = await api.post('/api/pois', {
      lat,
      lon,
      radius
    })
    return response.data
  } catch (error) {
    console.error('POI API error:', error)
    throw error
  }
}

// ============ Health Check ============

export async function healthCheck() {
  try {
    const response = await api.get('/api/health')
    return response.data
  } catch (error) {
    console.error('Health check failed:', error)
    return { status: 'error', message: error.message }
  }
}

// ============ Check if backend is available ============

export async function isBackendAvailable() {
  try {
    const result = await healthCheck()
    return result.status === 'healthy'
  } catch {
    return false
  }
}

export default api
