'use client'

// app/docente/sesiones/[id]/page.js
// Dashboard de resultados de una sesión: progreso por aula + tabla de alumnos

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { BadgeDescriptor, BadgePct, BadgeEstado, ProgBar, Spinner, AlertaError } from '@/components/ui'

export default function SesionDetallePage() {
  const router  = useRouter()
  const { id }  = useParams()

  const [sesion,     setSesion]     = useState(null)
  const [progreso,   setProgreso]   = useState([])
  const [resultados, setResultados] = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)
  const [aulaFiltro, setAulaFiltro] = useState('')
  const [filtroBadge, setFiltroBadge] = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  useEffect(() => { cargarDatos() }, [id])

  async function cargarDatos() {
    setCargando(true)
    try {
      const data = await api.get(`/resultados/${id}`)
      setSesion(data.sesion)
      setProgreso(data.progreso || [])
      setResultados(data.resultados || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  async function toggleEstado() {
    if (!sesion) return
    const nuevoEstado = sesion.estado === 'abierta' ? 'cerrada' : 'abierta'
    if (!confirm(`¿Confirmas ${nuevoEstado === 'cerrada' ? 'cerrar' : 'reabrir'} esta sesión?`)) return
    setCambiandoEstado(true)
    try {
      await api.patch(`/docente/sesiones/${id}/estado`, { estado: nuevoEstado })
      setSesion(s => ({ ...s, estado: nuevoEstado }))
    } catch (err) {
      setError(err.message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function exportar() {
    const fecha = new Date().toISOString().split('T')[0]
    await api.descargar(`/resultados/${id}/exportar`, `evaluacion_${fecha}.xlsx`)
  }

  if (cargando) return <div className="flex justify-center py-20"><Spinner className="w-6 h-6"/></div>

  // Filtrar resultados
  const aulas = [...new Set(resultados.map(r => r.aula))].sort()
  const filtrados = resultados.filter(r => {
    if (aulaFiltro && r.aula !== aulaFiltro) return false
    if (filtroBadge === 'completo'  && !r.pct_final) return false
    if (filtroBadge === 'pendiente' && r.pct_final)  return false
    return true
  })

  // Métricas globales
  const completaron = resultados.filter(r => r.pct_final !== null).length
  const total       = resultados.length
  const promedio    = completaron > 0
    ? (resultados.filter(r => r.pct_final).reduce((s, r) => s + r.pct_final, 0) / completaron).toFixed(2)
    : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.push('/docente')} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
          </div>
          <h1 className="text-xl font-medium text-gray-900">{sesion?.nombre}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <BadgeEstado estado={sesion?.estado}/>
            <span className="text-xs text-gray-400">{aulas.length} aulas</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportar}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
            Exportar Excel
          </button>
          <button
            onClick={toggleEstado}
            disabled={cambiandoEstado}
            className={`text-sm rounded-lg px-3 py-2 font-medium transition-colors disabled:opacity-50
              ${sesion?.estado === 'abierta'
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}
          >
            {cambiandoEstado ? '...' : sesion?.estado === 'abierta' ? 'Cerrar sesión' : 'Reabrir sesión'}
          </button>
        </div>
      </div>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Alumnos',      valor: total },
          { label: 'Completaron',  valor: completaron, color: 'text-green-600' },
          { label: 'Pendientes',   valor: total - completaron, color: 'text-red-500' },
          { label: 'Promedio aula',valor: promedio ? `${promedio}%` : '—' },
        ].map(m => (
          <div key={m.label} className="card py-3">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-2xl font-medium ${m.color || 'text-gray-800'}`}>{m.valor}</p>
          </div>
        ))}
      </div>

      {/* Progreso por aula */}
      <div className="card mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Progreso por aula</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {progreso.sort((a, b) => b.pct_respuesta - a.pct_respuesta).map(p => {
            const pct = parseFloat(p.pct_respuesta) || 0
            return (
              <div key={p.aula}
                className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => setAulaFiltro(p.aula === aulaFiltro ? '' : p.aula)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm ${aulaFiltro === p.aula ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                    {p.aula}
                  </span>
                  <span className={`text-xs font-medium
                    ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <ProgBar pct={pct}/>
                <p className="text-xs text-gray-400 mt-0.5">{p.completaron} de {p.total_alumnos}</p>
              </div>
            )
          })}
        </div>
        {aulaFiltro && (
          <button onClick={() => setAulaFiltro('')}
            className="mt-3 text-xs text-blue-600 hover:underline">
            Mostrar todas las aulas ✕
          </button>
        )}
      </div>

      {/* Tabla de resultados */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-2">
          <p className="text-sm font-medium text-gray-800">Resultados por alumno</p>
          <select
            value={filtroBadge}
            onChange={e => setFiltroBadge(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="">Todos ({total})</option>
            <option value="completo">Completaron ({completaron})</option>
            <option value="pendiente">Pendientes ({total - completaron})</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Alumno</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Aula</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">% Final</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">Descriptor</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r, i) => (
                <tr key={r.alumno_id} className={`border-t border-gray-50 ${r.pct_final === null ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2.5">
                    <p className="text-gray-800 font-medium text-sm">{r.nombre}</p>
                    <p className="text-xs text-gray-400">{r.correo}</p>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.aula}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <BadgePct pct={r.pct_final}/>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <BadgeDescriptor descriptor={r.descriptor}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
          Mostrando {filtrados.length} de {total} alumnos
        </div>
      </div>
    </div>
  )
}
