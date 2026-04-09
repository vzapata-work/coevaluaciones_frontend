'use client'

// components/NavBar.js — barra de navegación superior
//
// Uso:
//   <NavBar />   ← muestra nombre, correo, aula (si es alumno), y botón logout

import { useAuth } from '@/lib/AuthContext'

export default function NavBar() {
  const { usuario, logout } = useAuth()
  if (!usuario) return null

  // Iniciales para el avatar
  const iniciales = usuario.nombre
    .split(' ')
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase()

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 16 16">
              <rect x="1" y="1" width="6" height="6" rx="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" opacity=".5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" opacity=".5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">Evaluación grupal</span>
        </div>

        {/* Usuario */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{usuario.nombre}</p>
            <div className="flex items-center gap-1 justify-end">
              <p className="text-xs text-gray-400">{usuario.correo}</p>
              {usuario.aula && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    {usuario.aula}
                  </span>
                </>
              )}
              {usuario.rol === 'docente' && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                    Docente
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center
                          text-sm font-medium text-blue-700 flex-shrink-0">
            {iniciales}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1
                       border border-gray-200 rounded-md hover:border-gray-300"
          >
            Salir
          </button>
        </div>

      </div>
    </header>
  )
}
