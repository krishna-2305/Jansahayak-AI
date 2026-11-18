import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper to extract clean error message from Axios / FastAPI errors
export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail)) {
      return detail.map((err) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ')
    }
    return JSON.stringify(detail)
  }
  if (error.message) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your network or try again.'
    }
    if (error.message === 'Network Error') {
      return 'Unable to reach the server. Please verify backend service is running.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

export default api
