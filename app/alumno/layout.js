'use client'

// app/alumno/layout.js
// Todas las páginas bajo /alumno requieren rol 'alumno'

import ProtegerRuta from '@/components/ProtegerRuta'
import NavBar from '@/components/NavBar'

export default function AlumnoLayout({ children }) {
  return (
    <ProtegerRuta rol="alumno">
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </ProtegerRuta>
  )
}
