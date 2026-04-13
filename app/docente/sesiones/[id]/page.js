'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import api from '@/lib/api'
import { BadgeDescriptor, BadgePct, BadgeEstado, ProgBar, Spinner, AlertaError } from '@/components/ui'

const DESC_STYLE = {
  Excelente:  { background:'#e8f5e9', color:'#1d6f42' },
  Bueno:      { background:'#e3f2fd', color:'#185fa5' },
  Regular:    { background:'#fff8e1', color:'#854f0b' },
  Deficiente: { background:'#ffebee', color:'#a32d2d' },
}
const DEFAULT_STYLE = { background:'#f3f4f6', color:'#6b7280' }

// ── Modal ──────────────────────────────────────────────────
function ModalAlumno({ sesionId, alumno, onClose }) {
  const [datos,    setDatos]    = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    api.get(`/resultados/${sesionId}/alumno/${alumno.alumno_id}`)
      .then(d => setDatos(d))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [sesionId, alumno.alumno_id])

  if (typeof document === 'undefined') return null

  const modal = (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,0.55)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1rem',
      }}
    >
      <div style={{
        background:'#ffffff', borderRadius:16, width:'100%', maxWidth:580,
        maxHeight:'88vh', overflow:'auto',
        boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
        border:'1px solid #e5e7eb',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'14px 18px', borderBottom:'1px solid #f3f4f6',
          background:'#f9fafb', borderRadius:'16px 16px 0 0',
        }}>
          <div style={{
            width:40, height:40, borderRadius:'50%',
            background:'#e3f2fd', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:13, fontWeight:600,
            color:'#185fa5', flexShrink:0,
          }}>
            {(alumno.nombre || '?').split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:15, fontWeight:600, margin:0, color:'#111827' }}>{alumno.nombre}</p>
            <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{alumno.aula} · {alumno.correo}</p>
          </div>
          <button onClick={onClose} style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:20, color:'#9ca3af', padding:'4px 8px', lineHeight:1,
          }}>✕</button>
        </div>

        <div style={{ padding:'18px' }}>
          {/* Cargando */}
          {cargando && (
            <div style={{ display:'flex', justifyContent:'center', padding:'2.5rem 0' }}>
              <div style={{
                width:22, height:22,
                border:'2.5px solid #e5e7eb', borderTopColor:'#3b82f6',
                borderRadius:'50%', animation:'spin .7s linear infinite',
              }}/>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ fontSize:13, color:'#dc2626', textAlign:'center', padding:'1.5rem 0' }}>{error}</p>
          )}

          {datos && !cargando && (
            <>
              {/* Resultado final */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #f3f4f6' }}>
                  <p style={{ fontSize:11, color:'#6b7280', margin:'0 0 4px' }}>Evaluaciones recibidas</p>
                  <p style={{ fontSize:24, fontWeight:600, margin:0, color:'#111827' }}>{datos.total_evaluaciones}</p>
                </div>
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #f3f4f6' }}>
                  <p style={{ fontSize:11, color:'#6b7280', margin:'0 0 4px' }}>Resultado final</p>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <p style={{ fontSize:24, fontWeight:600, margin:0, color:'#111827' }}>
                      {datos.pct_final !== null ? `${datos.pct_final}%` : '—'}
                    </p>
                    {datos.descriptor_final && (
                      <span style={{
                        fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600,
                        ...(DESC_STYLE[datos.descriptor_final] || DEFAULT_STYLE),
                      }}>
                        {datos.descriptor_final}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Promedio por criterio */}
              <p style={{ fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase',
                          letterSpacing:'.06em', margin:'0 0 8px' }}>
                Promedio por criterio
              </p>
              <div style={{ border:'1px solid #f3f4f6', borderRadius:10, overflow:'hidden', marginBottom:20 }}>
                {datos.por_criterio.map((c, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px', gap:8,
                    borderBottom: i < datos.por_criterio.length-1 ? '1px solid #f9fafb' : 'none',
                    background: i % 2 === 0 ? '#ffffff' : '#fafafa',
                  }}>
                    <p style={{ fontSize:13, color:'#374151', margin:0 }}>{c.criterio_nombre}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {c.descriptor && (
                        <span style={{
                          fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600,
                          ...(DESC_STYLE[c.descriptor] || DEFAULT_STYLE),
                        }}>
                          {c.descriptor}
                        </span>
                      )}
                      <span style={{ fontSize:13, fontWeight:600, color:'#111827', minWidth:50, textAlign:'right' }}>
                        {c.promedio_pct !== null ? `${c.promedio_pct}%` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Evaluaciones individuales */}
              <p style={{ fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase',
                          letterSpacing:'.06em', margin:'0 0 8px' }}>
                Detalle por evaluador
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {datos.evaluaciones.map((ev, i) => (
                  <div key={i} style={{ border:'1px solid #f3f4f6', borderRadius:10, overflow:'hidden' }}>
                    {/* Cabecera evaluador */}
                    <div style={{
                      padding:'9px 14px',
                      background: ev.es_autoevaluacion ? '#eff6ff' : '#f9fafb',
                      borderBottom:'1px solid #f3f4f6',
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{
                          width:28, height:28, borderRadius:'50%',
                          background: ev.es_autoevaluacion ? '#dbeafe' : '#e5e7eb',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:10, fontWeight:600,
                          color: ev.es_autoevaluacion ? '#1d4ed8' : '#6b7280',
                        }}>
                          {ev.es_autoevaluacion ? 'YO' : i}
                        </div>
                        <div>
                          <p style={{ fontSize:12, fontWeight:600, margin:0,
                                      color: ev.es_autoevaluacion ? '#1d4ed8' : '#374151' }}>
                            {ev.etiqueta}
                          </p>
                          {ev.evaluador_nombre && (
                            <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>{ev.evaluador_nombre}</p>
                          )}
                        </div>
                      </div>
                      {/* Promedio de esta evaluación */}
                      {ev.respuestas.length > 0 && (() => {
                        const prom = ev.respuestas.reduce((s,r) => s + (r.valor_pct||0), 0) / ev.respuestas.length
                        const desc = prom >= 100 ? 'Excelente' : prom >= 75 ? 'Bueno' : prom >= 50 ? 'Regular' : 'Deficiente'
                        return (
                          <span style={{
                            fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600,
                            ...(DESC_STYLE[desc] || DEFAULT_STYLE),
                          }}>
                            {prom.toFixed(0)}% · {desc}
                          </span>
                        )
                      })()}
                    </div>
                    {/* Respuestas */}
                    <div style={{ display:'grid', gridTemplateColumns: ev.respuestas.length > 2 ? '1fr 1fr' : '1fr' }}>
                      {ev.respuestas.map((r, j) => (
                        <div key={j} style={{
                          padding:'8px 14px', display:'flex',
                          justifyContent:'space-between', alignItems:'center', gap:8,
                          borderBottom: j < ev.respuestas.length-1 ? '1px solid #f9fafb' : 'none',
                          background:'#ffffff',
                        }}>
                          <p style={{ fontSize:12, color:'#6b7280', margin:0,
                                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.criterio_nombre}
                          </p>
                          <span style={{
                            fontSize:11, padding:'2px 7px', borderRadius:20, fontWeight:600, flexShrink:0,
                            ...(DESC_STYLE[r.descriptor] || DEFAULT_STYLE),
                          }}>
                            {r.descriptor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )

  return createPortal(modal, document.body)
}

// ── Página principal ───────────────────────────────────────
export default function SesionDetallePage() {
  const router  = useRouter()
  const { id }  = useParams()

  const [sesion,       setSesion]       = useState(null)
  const [progreso,     setProgreso]     = useState([])
  const [resultados,   setResultados]   = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState(null)
  const [aulaFiltro,   setAulaFiltro]   = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [eliminando,   setEliminando]   = useState(false)
  const [alumnoModal,  setAlumnoModal]  = useState(null)

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
    const nuevo = sesion.estado === 'abierta' ? 'cerrada' : 'abierta'
    if (!confirm(`¿Confirmas ${nuevo === 'cerrada' ? 'cerrar' : 'reabrir'} esta sesión?`)) return
    setCambiandoEstado(true)
    try {
      await api.patch(`/docente/sesiones/${id}/estado`, { estado: nuevo })
      setSesion(s => ({ ...s, estado: nuevo }))
    } catch (err) {
      setError(err.message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function eliminarSesion() {
    if (!confirm(`¿Eliminar "${sesion?.nombre}" y todos sus datos? No se puede deshacer.`)) return
    setEliminando(true)
    try {
      await api.delete(`/docente/sesiones/${id}`)
      router.replace('/docente')
    } catch (err) {
      setError(err.message)
      setEliminando(false)
    }
  }

  async function exportar() {
    const fecha = new Date().toISOString().split('T')[0]
    await api.descargar(`/resultados/${id}/exportar`, `evaluacion_${fecha}.xlsx`)
  }

  if (cargando) return <div className="flex justify-center py-20"><Spinner className="w-6 h-6"/></div>

  const aulas = [...new Set(resultados.map(r => r.aula))].sort()
  const filtrados = resultados.filter(r => {
    if (aulaFiltro && r.aula !== aulaFiltro) return false
    if (filtroEstado === 'completo')  return r.completado
    if (filtroEstado === 'pendiente') return r.tiene_grupo && !r.completado
    if (filtroEstado === 'sin_grupo') return !r.tiene_grupo
    return true
  })

  const total       = resultados.length
  const enGrupo     = resultados.filter(r => r.tiene_grupo).length
  const sinGrupo    = total - enGrupo
  const completaron = resultados.filter(r => r.completado).length
  const pendientes  = enGrupo - completaron
  const conResultado = resultados.filter(r => r.completado && r.pct_final !== null)
  const promedio    = conResultado.length > 0
    ? (conResultado.reduce((s,r) => s + parseFloat(r.pct_final), 0) / conResultado.length).toFixed(2)
    : null

  return (
    <div>
      {alumnoModal && <ModalAlumno sesionId={id} alumno={alumnoModal} onClose={() => setAlumnoModal(null)}/>}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.push('/docente')} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
          </div>
          <h1 className="text-xl font-medium text-gray-900">{sesion?.nombre}</h1>
          <div className="flex items-center gap-2 mt-1">
            <BadgeEstado estado={sesion?.estado}/>
            <span className="text-xs text-gray-400">{aulas.length} aulas</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportar} className="text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">Exportar Excel</button>
          <button onClick={toggleEstado} disabled={cambiandoEstado}
            className={`text-sm rounded-lg px-3 py-2 font-medium transition-colors disabled:opacity-50
              ${sesion?.estado === 'abierta'
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}>
            {cambiandoEstado ? '...' : sesion?.estado === 'abierta' ? 'Cerrar sesión' : 'Reabrir sesión'}
          </button>
          <button onClick={eliminarSesion} disabled={eliminando}
            className="text-sm rounded-lg px-3 py-2 font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
            {eliminando ? 'Eliminando...' : 'Eliminar sesión'}
          </button>
        </div>
      </div>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
        {[
          { label:'Total alumnos', valor:total },
          { label:'En grupo',      valor:enGrupo,    color:'text-blue-600' },
          { label:'Sin grupo',     valor:sinGrupo,   color:sinGrupo>0?'text-amber-500':'text-gray-800' },
          { label:'Completaron',   valor:completaron, color:'text-green-600' },
          { label:'Pendientes',    valor:pendientes,  color:pendientes>0?'text-red-500':'text-gray-800' },
        ].map(m => (
          <div key={m.label} className="card py-3">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-2xl font-medium ${m.color||'text-gray-800'}`}>{m.valor}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-6">
        {promedio
          ? <>{`Promedio del aula: `}<span className="font-medium text-gray-700">{promedio}%</span>{` · ${conResultado.length} alumno${conResultado.length!==1?'s':''} con evaluación completa.`}</>
          : 'Aún no hay evaluaciones completas para calcular el promedio.'}
      </p>

      {/* Progreso por aula */}
      {progreso.length > 0 && (
        <div className="card mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Progreso por aula</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {progreso.sort((a,b) => b.pct_respuesta - a.pct_respuesta).map(p => {
              const pct = parseFloat(p.pct_respuesta)||0
              return (
                <div key={p.aula}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => setAulaFiltro(p.aula===aulaFiltro?'':p.aula)}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm ${aulaFiltro===p.aula?'font-medium text-blue-600':'text-gray-700'}`}>{p.aula}</span>
                    <span className={`text-xs font-medium ${pct>=80?'text-green-600':pct>=50?'text-amber-600':'text-red-500'}`}>{pct.toFixed(0)}%</span>
                  </div>
                  <ProgBar pct={pct}/>
                  <p className="text-xs text-gray-400 mt-0.5">{p.completaron} de {p.total_alumnos}</p>
                </div>
              )
            })}
          </div>
          {aulaFiltro && <button onClick={() => setAulaFiltro('')} className="mt-3 text-xs text-blue-600 hover:underline">Mostrar todas las aulas ✕</button>}
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-2">
          <div>
            <p className="text-sm font-medium text-gray-800">Resultados por alumno</p>
            <p className="text-xs text-gray-400 mt-0.5">Haz clic en un alumno con grupo para ver el detalle</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={aulaFiltro} onChange={e=>setAulaFiltro(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
              <option value="">Todas las aulas</option>
              {aulas.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
              <option value="">Todos ({total})</option>
              <option value="completo">Completaron ({completaron})</option>
              <option value="pendiente">Pendientes ({pendientes})</option>
              <option value="sin_grupo">Sin grupo ({sinGrupo})</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Alumno</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Aula</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">% Final</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">Descriptor</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(r => (
                <tr key={r.alumno_id}
                  onClick={() => r.tiene_grupo && setAlumnoModal(r)}
                  className={`border-t border-gray-50 transition-colors
                    ${r.tiene_grupo ? 'cursor-pointer hover:bg-blue-50' : ''}
                    ${!r.tiene_grupo ? 'opacity-40' : !r.completado ? 'opacity-70' : ''}`}>
                  <td className="px-4 py-2.5">
                    <p className="text-gray-800 font-medium text-sm">{r.nombre}</p>
                    <p className="text-xs text-gray-400">{r.correo}</p>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.aula}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {!r.tiene_grupo
                      ? <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">Sin grupo</span>
                      : r.completado
                        ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Completado</span>
                        : <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pendiente</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <BadgePct pct={r.pct_final}/>
                      {r.autoeval_penalizada && (
                        <span className="text-xs text-amber-500" title="Incluye autoeval. penalizada (Deficiente)">⚠ penalizado</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center"><BadgeDescriptor descriptor={r.descriptor}/></td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No hay alumnos con este filtro.</td></tr>
              )}
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
