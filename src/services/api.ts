import axios from 'axios'

// Same-origin by default — the monolith serves the API and the frontend
// bundle from the same Node process/port (Vite proxies /api in dev; both
// are literally the same server in production). Only set VITE_API_BASE_URL
// if you're deliberately pointing this build at a different host.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({ baseURL })

const TOKEN_KEY = 'littlebee_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
    }
    return Promise.reject(normalizeError(error))
  },
)

export function normalizeError(error: unknown): { message: string; status?: number } {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message || error.message || 'Something went wrong',
      status: error.response?.status,
    }
  }
  return { message: error instanceof Error ? error.message : 'Something went wrong' }
}

export default api
