'use client'

// app/alumno/sesion/[id]/page.js
// Muestra las respuestas que el alumno envió en una sesión completada

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { Spinner, AlertaError } from '@/components/ui'

const COLOR_DESC = {
  Excelente:  'bg-green-50 text-green-700',
  Bueno:      'bg-blue-50 text-blue-700',
  Regular:    'bg-amber-50 text-amber-700',
  Deficiente: 'bg-red-50 text-red-700',
}

export default function MisRespuestasPage() {
  const router = useRouter()
  const { id } = useParams()

  const [sesion,       setSesion]       = useState(null)
  const [evaluaciones, setEvaluaciones] = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get(`/alumno/mis-respuestas/${id}`)
        setSesion(data.sesion)
        setEvaluaciones(data.evaluaciones || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner className="w-6 h-6"/>
      <p className="text-sm text-gray-400">Cargando tus respuestas...</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/alumno')}
          className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
        <div>
          <h1 className="text-xl font-medium text-gray-900">Mis respuestas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{sesion?.nombre}</p>
        </div>
      </div>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {evaluaciones.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-gray-400">No se encontraron evaluaciones enviadas para esta sesión.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluaciones.map((ev, idx) => (
            <div key={ev.evaluado_id} className="card p-0 overflow-hidden">
              {/* Cabecera del evaluado */}
              <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100
                ${ev.es_autoevaluacion ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center
                  text-xs font-medium flex-shrink-0
                  ${ev.es_autoevaluacion ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                  {ev.es_autoevaluacion
                    ? 'YO'
                    : ev.evaluado_nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {ev.es_autoevaluacion ? 'Autoevaluación' : ev.evaluado_nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {ev.es_autoevaluacion
                      ? 'Tu propia evaluación'
                      : ev.evaluado_aula}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-400">
                    {ev.enviado_en
                      ? new Date(ev.enviado_en).toLocaleDateString('es-PE', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })
                      : ''}
                  </p>
                </div>
              </div>

              {/* Respuestas por criterio */}
              <div className="divide-y divide-gray-50">
                {ev.respuestas.map(r => (
                  <div key={r.criterio_index}
                    className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 truncate">{r.criterio_nombre}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium
                        ${COLOR_DESC[r.descriptor] || 'bg-gray-100 text-gray-500'}`}>
                        {r.descriptor}
                      </span>
                      <span className="text-xs text-gray-400 w-10 text-right">
                        {r.valor_pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promedio del evaluado */}
              {ev.respuestas.length > 0 && (() => {
                const prom = ev.respuestas.reduce((s, r) => s + (r.valor_pct || 0), 0) / ev.respuestas.length
                const desc = prom >= 100 ? 'Excelente' : prom >= 75 ? 'Bueno' : prom >= 50 ? 'Regular' : 'Deficiente'
                return (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500">Promedio que le asignaste</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLOR_DESC[desc] || ''}`}>
                        {desc}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{prom.toFixed(2)}%</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Nota de anonimato */}
      <div className="flex gap-2 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <p className="text-xs text-gray-500">
          Estas son las respuestas que tú enviaste. Los resultados que recibiste de tus compañeros
          son anónimos y solo los puede ver el docente.
        </p>
      </div>
    </div>
  )
}
