import api from './api'

/** Uploads a file (KYC document, payment receipt) and returns its public URL. */
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url as string
}

/**
 * Resolves an uploaded file's URL. In the monolith, the frontend and the
 * /uploads/* files are served from the same origin, so a relative path
 * (e.g. "/uploads/x.png") already works as-is anywhere a browser needs a
 * URL (<img src>, <a href>) — no origin-stitching required. Kept as a
 * named helper (rather than using the raw field directly) so call sites
 * don't need to change if that ever stops being true.
 */
export function resolveUploadUrl(url: string): string {
  return url
}
