import api from './api'

export async function getProfile() {
  const { data } = await api.get('/profile')
  return data.user
}

export async function updateProfile(payload: { fullName?: string; country?: string; accountType?: 'demo' | 'live' }) {
  const { data } = await api.patch('/profile', payload)
  return data.user
}

export async function listSessions() {
  const { data } = await api.get('/profile/sessions')
  return data.sessions
}

export async function revokeSession(id: number) {
  await api.delete(`/profile/sessions/${id}`)
}

export async function revokeAllSessions() {
  await api.post('/profile/sessions/revoke-all')
}

export async function listKyc() {
  const { data } = await api.get('/kyc')
  return data.documents
}

export async function submitKyc(payload: { tierLevel: number; documentType: string; documentUrl: string }) {
  const { data } = await api.post('/kyc', payload)
  return data.document
}
