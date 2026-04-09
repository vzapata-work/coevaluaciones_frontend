'use client'

// app/alumno/page.js — inicio del alumno
// Muestra sesión activa + historial de evaluaciones anteriores

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { BadgeEstado, ProgBar, Spinner, AlertaError } from '@/components/ui'

export default function AlumnoHome() {
  const router = useRouter()
  const [activa,   setActiva]   = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/alumno/sesion-activa')
        setActiva(data.activa)
        setHistorial(data.historial || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  async function irAEvaluar() {
    if (!activa) return
    // Verificar si ya tiene grupo
    try {
      const data = await api.get(`/alumno/grupo?sesion_id=${activa.id}`)
      if (data.grupo) {
        router.push(`/alumno/evaluar?sesion_id=${activa.id}`)
      } else {
        router.push(`/alumno/grupo?sesion_id=${activa.id}`)
      }
    } catch {
      router.push(`/alumno/grupo?sesion_id=${activa.id}`)
    }
  }

  if (cargando) return <div className="flex justify-center py-20"><Spinner className="w-6 h-6"/></div>

  return (
    <div>
      <h1 className="text-xl font-medium text-gray-900 mb-6">Mis evaluaciones</h1>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {/* Sesión activa */}
      {activa ? (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Sesión activa</p>
          <div className="card border-2 border-blue-100">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BadgeEstado estado="abierta"/>
                  {activa.cierra_en && (
                    <span className="text-xs text-gray-400">
                      Cierra {new Date(activa.cierra_en).toLocaleDateString('es-PE')}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-medium text-gray-900">{activa.nombre}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activa.criterios?.length} criterio{activa.criterios?.length !== 1 ? 's' : ''}
                  {activa.con_autoevaluacion ? ' · Incluye autoevaluación' : ''}
                </p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                Pendiente
              </span>
            </div>
            <button
              onClick={irAEvaluar}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium
                         hover:bg-blue-700 transition-colors"
            >
              Comenzar evaluación →
            </button>
          </div>
        </div>
      ) : (
        <div className="card mb-6 bg-gray-50 border-dashed text-center py-10">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v4M12 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-gray-400">No hay ninguna sesión abierta para tu aula.</p>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Historial</p>
          <div className="space-y-2">
            {historial.map(s => (
              <div key={s.id} className="card">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 truncate">{s.nombre}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.abierta_en ? new Date(s.abierta_en).toLocaleDateString('es-PE') : '—'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                    ${s.alumno_completo
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-500'}`}>
                    {s.alumno_completo ? 'Completado' : 'No enviado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
