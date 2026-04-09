'use client'

// lib/AuthContext.js — contexto global de autenticación
//
// Provee: { usuario, cargando, login, logout }
//
// usuario tiene la forma:
//   { id, nombre, correo, rol: 'docente' | 'alumno', aula?, docente_id? }
//
// Uso en cualquier componente:
//   import { useAuth } from '@/lib/AuthContext'
//   const { usuario, logout } = useAuth()

import { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario,  setUsuario]  = useState(null)
  const [cargando, setCargando] = useState(true)

  // Al montar, restaurar sesión desde localStorage
  useEffect(() => {
    const token       = localStorage.getItem('google_token')
    const usuarioStr  = localStorage.getItem('usuario')

    if (token && usuarioStr) {
      try {
        setUsuario(JSON.parse(usuarioStr))
      } catch {
        localStorage.removeItem('usuario')
      }
    }
    setCargando(false)
  }, [])

  // Llamado por el componente GoogleLogin tras obtener el token
  async function login(googleToken) {
    localStorage.setItem('google_token', googleToken)
    try {
      const data = await api.post('/auth/login', {})
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      setUsuario(data.usuario)
      return data.usuario
    } catch (err) {
      localStorage.removeItem('google_token')
      throw err
    }
  }

  function logout() {
    localStorage.removeItem('google_token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
