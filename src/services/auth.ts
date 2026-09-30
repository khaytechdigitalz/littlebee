import api, { setToken, clearToken } from './api'

export interface AuthUser {
  id: number
  fullName: string
  email: string
  country: string | null
  role: 'user' | 'admin'
  accountType: 'demo' | 'live'
  isVerified: boolean
  hasTransactionPin: boolean
  is2faEnabled: boolean
}

export async function register(payload: { fullName: string; email: string; password: string; country?: string }) {
  const { data } = await api.post('/auth/register', payload)
  setToken(data.token)
  return data.user as AuthUser
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post('/auth/login', payload)
  setToken(data.token)
  return data.user as AuthUser
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    clearToken()
  }
}

export async function me() {
  const { data } = await api.get('/auth/me')
  return data.user as AuthUser
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
  return data
}

export async function setTransactionPin(pin: string) {
  const { data } = await api.post('/auth/pin', { pin })
  return data
}

export async function verifyTransactionPin(pin: string) {
  const { data } = await api.post('/auth/verify-pin', { pin })
  return data as { valid: boolean }
}

export async function setup2fa() {
  const { data } = await api.post('/auth/2fa/setup')
  return data as { secret: string; qrCodeDataUrl: string }
}

export async function verify2fa(code: string) {
  const { data } = await api.post('/auth/2fa/verify', { code })
  return data as { valid: boolean; enabled: boolean }
}
