'use client'

// app/docente/layout.js
// Todas las páginas bajo /docente requieren rol 'docente'

import ProtegerRuta from '@/components/ProtegerRuta'
import NavBar from '@/components/NavBar'

export default function DocenteLayout({ children }) {
  return (
    <ProtegerRuta rol="docente">
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </ProtegerRuta>
  )
}
