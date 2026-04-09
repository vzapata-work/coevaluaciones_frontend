// lib/api.js — cliente HTTP centralizado
//
// Todas las llamadas al backend pasan por aquí.
// Lee el token de Google del localStorage y lo adjunta
// automáticamente en el header Authorization.
//
// Uso:
//   import api from '@/lib/api'
//   const data = await api.get('/auth/me')
//   const data = await api.post('/alumno/grupo', { sesion_id, miembro_ids })

const BASE = process.env.NEXT_PUBLIC_API_URL

// Obtiene el token almacenado por GoogleLogin
function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('google_token')
}

async function request(method, path, body) {
  const token = getToken()

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(`${BASE}/api${path}`, config)

  // Token expirado → limpiar sesión y redirigir al login
  if (res.status === 401) {
    localStorage.removeItem('google_token')
    localStorage.removeItem('usuario')
    window.location.href = '/'
    return
  }

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.error || 'Error del servidor')
    err.status = res.status
    err.data   = data
    throw err
  }

  return data
}

// Para subir archivos (importar CSV) — no usa JSON
async function upload(path, formData) {
  const token = getToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error || 'Error del servidor')
    err.status = res.status
    throw err
  }
  return data
}

const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
  upload,

  // Descarga un archivo (para el Excel)
  async descargar(path, nombreArchivo) {
    const token = getToken()
    const res = await fetch(`${BASE}/api${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Error al descargar el archivo')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = nombreArchivo
    a.click()
    URL.revokeObjectURL(url)
  },
}

export default api
