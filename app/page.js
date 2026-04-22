'use client'

// app/page.js — landing page / login
//
// Si el usuario ya tiene sesión → redirige según rol:
//   docente → /docente
//   alumno  → /alumno
//
// Si no → muestra el botón de Google

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/lib/AuthContext'

export default function LoginPage() {
  const { usuario, cargando, login } = useAuth()
  const router = useRouter()
  const [error,     setError]     = useState(null)
  const [cargandoLogin, setCargandoLogin] = useState(false)

  // Redirigir si ya hay sesión
  useEffect(() => {
    if (!cargando && usuario) {
      router.replace(usuario.rol === 'docente' ? '/docente' : '/alumno')
    }
  }, [usuario, cargando, router])

  async function handleGoogleSuccess(credentialResponse) {
    setError(null)
    setCargandoLogin(true)
    try {
      const u = await login(credentialResponse.credential)
      router.replace(u.rol === 'docente' ? '/docente' : '/alumno')
    } catch (err) {
      setError(err.data?.detalle || err.message || 'No se pudo iniciar sesión')
    } finally {
      setCargandoLogin(false)
    }
  }

  function handleGoogleError() {
    setError('No se pudo conectar con Google. Intenta de nuevo.')
  }

  if (cargando) return null  // evitar flash antes de redirigir

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="2" width="9" height="9" rx="2"/>
              <rect x="13" y="2" width="9" height="9" rx="2" opacity=".5"/>
              <rect x="2" y="13" width="9" height="9" rx="2" opacity=".5"/>
              <rect x="13" y="13" width="9" height="9" rx="2"/>
            </svg>
          </div>
          <h1 className="text-xl font-medium text-gray-900 mb-1">Coevaluación - Química General</h1>
          <p className="text-sm text-gray-500">Ingresa con tu cuenta institucional</p>
        </div>

        {/* Card */}
        <div className="card">

          {/* Error */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 rounded-lg mb-4 text-sm text-red-700">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Botón Google */}
          {cargandoLogin ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"/>
              <p className="text-sm text-gray-500">Verificando tu cuenta...</p>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="400"
                  text="continue_with"
                  shape="rectangular"
                  logo_alignment="left"
                  locale="es"
                />
              </div>
              <div className="flex items-center gap-2 my-3">
                <hr className="flex-1 border-gray-100"/>
                <span className="text-xs text-gray-400">solo cuentas institucionales</span>
                <hr className="flex-1 border-gray-100"/>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Al ingresar, Google confirmará tu identidad y verificaremos
                que estés registrado en el sistema.
              </p>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          ¿Problemas para ingresar? Consulta a tu docente.
        </p>
      </div>
    </div>
  )
}
