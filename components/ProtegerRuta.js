'use client'

// components/ProtegerRuta.js
//
// Envuelve páginas que requieren autenticación.
// Si no hay sesión → redirige al login.
// Si el rol no coincide → redirige a la página del rol correcto.
//
// Uso:
//   <ProtegerRuta rol="docente"> ... </ProtegerRuta>
//   <ProtegerRuta rol="alumno">  ... </ProtegerRuta>

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function ProtegerRuta({ rol, children }) {
  const { usuario, cargando } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (cargando) return
    if (!usuario) {
      router.replace('/')
      return
    }
    if (rol && usuario.rol !== rol) {
      router.replace(usuario.rol === 'docente' ? '/docente' : '/alumno')
    }
  }, [usuario, cargando, rol, router])

  if (cargando || !usuario || (rol && usuario.rol !== rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"/>
      </div>
    )
  }

  return children
}
