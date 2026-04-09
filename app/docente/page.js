'use client'

// app/docente/page.js — panel principal del docente
// Muestra sesión activa + historial de sesiones

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { BadgeEstado, ProgBar, Spinner, EmptyState, AlertaError } from '@/components/ui'

export default function DocenteHome() {
  const router = useRouter()
  const [sesiones,  setSesiones]  = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    cargarSesiones()
  }, [])

  async function cargarSesiones() {
    try {
      const data = await api.get('/docente/sesiones')
      setSesiones(data.sesiones)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const activa   = sesiones.find(s => s.estado === 'abierta')
  const historial = sesiones.filter(s => s.estado !== 'abierta')

  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-6 h-6"/>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Mis sesiones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sesiones.length} sesión{sesiones.length !== 1 ? 'es' : ''} en total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/docente/alumnos')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            Gestionar alumnos
          </button>
          <button
            onClick={() => router.push('/docente/sesiones/nueva')}
            className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors font-medium"
          >
            + Nueva sesión
          </button>
        </div>
      </div>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {/* Sesión activa */}
      {activa ? (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Sesión activa
          </p>
          <SesionCard
            sesion={activa}
            onClick={() => router.push(`/docente/sesiones/${activa.id}`)}
          />
        </div>
      ) : (
        <div className="card mb-6 border-dashed border-gray-200 bg-gray-50 text-center py-8">
          <p className="text-sm text-gray-400 mb-3">No hay ninguna sesión abierta</p>
          <button
            onClick={() => router.push('/docente/sesiones/nueva')}
            className="text-sm text-blue-600 hover:underline"
          >
            Crear una sesión →
          </button>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Historial
          </p>
          <div className="space-y-2">
            {historial.map(s => (
              <SesionCard
                key={s.id}
                sesion={s}
                onClick={() => router.push(`/docente/sesiones/${s.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {sesiones.length === 0 && (
        <EmptyState
          titulo="Aún no tienes sesiones"
          descripcion="Crea tu primera sesión de evaluación para comenzar."
        />
      )}
    </div>
  )
}

// ── Tarjeta de sesión ─────────────────────────────────────────

function SesionCard({ sesion, onClick }) {
  const activa = sesion.estado === 'abierta'

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer hover:border-gray-300 transition-colors
                  ${activa ? 'border-l-4 border-l-green-500 rounded-l-none' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <BadgeEstado estado={sesion.estado}/>
            {sesion.cierra_en && (
              <span className="text-xs text-gray-400">
                Cierra {new Date(sesion.cierra_en).toLocaleDateString('es-PE')}
              </span>
            )}
          </div>
          <h2 className="text-base font-medium text-gray-900 truncate">{sesion.nombre}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {sesion.aulas?.length} aula{sesion.aulas?.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;
            {sesion.criterios?.length} criterio{sesion.criterios?.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!activa && (
          <button
            onClick={e => {
              e.stopPropagation()
              const fecha = new Date().toISOString().split('T')[0]
              api.descargar(
                `/resultados/${sesion.id}/exportar`,
                `evaluacion_${fecha}.xlsx`
              )
            }}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50
                       text-gray-500 flex-shrink-0"
          >
            Exportar Excel
          </button>
        )}
      </div>

      {/* Aulas como chips */}
      <div className="flex flex-wrap gap-1">
        {(sesion.aulas || []).slice(0, 6).map(a => (
          <span key={a} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {a}
          </span>
        ))}
        {sesion.aulas?.length > 6 && (
          <span className="text-xs text-gray-400">
            +{sesion.aulas.length - 6} más
          </span>
        )}
      </div>
    </div>
  )
}
