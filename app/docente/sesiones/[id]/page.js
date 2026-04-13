'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { BadgeDescriptor, BadgePct, BadgeEstado, ProgBar, Spinner, AlertaError } from '@/components/ui'

const COLOR_DESC = {
  Excelente:  { background:'#e8f5e9', color:'#1d6f42' },
  Bueno:      { background:'#e3f2fd', color:'#185fa5' },
  Regular:    { background:'#fff8e1', color:'#854f0b' },
  Deficiente: { background:'#ffebee', color:'#a32d2d' },
}

// ── Modal de detalle por alumno ────────────────────────────
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

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:50,
               display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'var(--color-background-primary)', borderRadius:16,
                    width:'100%', maxWidth:560, maxHeight:'85vh', overflow:'auto',
                    border:'0.5px solid var(--color-border-tertiary)' }}>

        {/* Header modal */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px',
                      borderBottom:'0.5px solid var(--color-border-tertiary)',
                      background:'var(--color-background-secondary)' }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--color-background-info)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:500, color:'var(--color-text-info)', flexShrink:0 }}>
            {alumno.nombre?.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:14, fontWeight:500, margin:0, color:'var(--color-text-primary)' }}>
              {alumno.nombre}
            </p>
            <p style={{ fontSize:11, color:'var(--color-text-secondary)', margin:0 }}>
              {alumno.aula} · {alumno.correo}
            </p>
          </div>
          <button onClick={onClose}
            style={{ fontSize:18, color:'var(--color-text-tertiary)', background:'none',
                     border:'none', cursor:'pointer', padding:'4px 8px', lineHeight:1 }}>
            ✕
          </button>
        </div>

        <div style={{ padding:'16px 18px' }}>
          {cargando && (
            <div style={{ display:'flex', justifyContent:'center', padding:'2rem 0' }}>
              <div style={{ width:20, height:20, border:'2px solid var(--color-border-secondary)',
                            borderTopColor:'var(--color-text-info)', borderRadius:'50%',
                            animation:'spin .7s linear infinite' }}/>
            </div>
          )}

          {error && (
            <p style={{ fontSize:13, color:'var(--color-text-danger)', textAlign:'center', padding:'1rem 0' }}>
              {error}
            </p>
          )}

          {datos && !cargando && (
            <>
              {/* Resultado final */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px' }}>
                  <p style={{ fontSize:11, color:'var(--color-text-secondary)', margin:'0 0 3px' }}>
                    Evaluaciones recibidas
                  </p>
                  <p style={{ fontSize:22, fontWeight:500, margin:0 }}>{datos.total_evaluaciones}</p>
                </div>
                <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 14px' }}>
                  <p style={{ fontSize:11, color:'var(--color-text-secondary)', margin:'0 0 3px' }}>
                    Resultado final
                  </p>
                  <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                    <p style={{ fontSize:22, fontWeight:500, margin:0 }}>
                      {datos.pct_final !== null ? `${datos.pct_final}%` : '—'}
                    </p>
                    {datos.descriptor_final && (
                      <span style={{ fontSize:11, padding:'1px 8px', borderRadius:20, fontWeight:500,
                                     ...(COLOR_DESC[datos.descriptor_final] || {}) }}>
                        {datos.descriptor_final}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Promedio por criterio */}
              <p style={{ fontSize:11, fontWeight:500, color:'var(--color-text-tertiary)',
                          textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 8px' }}>
                Promedio por criterio
              </p>
              <div style={{ background:'var(--color-background-primary)',
                            border:'0.5px solid var(--color-border-tertiary)',
                            borderRadius:10, overflow:'hidden', marginBottom:16 }}>
                {datos.por_criterio.map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                                        padding:'9px 14px', gap:8,
                                        borderBottom: i < datos.por_criterio.length-1
                                          ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                    <p style={{ fontSize:13, color:'var(--color-text-primary)', margin:0 }}>
                      {c.criterio_nombre}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {c.descriptor && (
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:500,
                                       ...(COLOR_DESC[c.descriptor] || {}) }}>
                          {c.descriptor}
                        </span>
                      )}
                      <span style={{ fontSize:12, fontWeight:500, color:'var(--color-text-primary)',
                                     minWidth:44, textAlign:'right' }}>
                        {c.promedio_pct !== null ? `${c.promedio_pct}%` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Evaluaciones individuales */}
              <p style={{ fontSize:11, fontWeight:500, color:'var(--color-text-tertiary)',
                          textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 8px' }}>
                Evaluaciones individuales
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {datos.evaluaciones.map((ev, i) => (
                  <div key={i} style={{ border:'0.5px solid var(--color-border-tertiary)',
                                        borderRadius:10, overflow:'hidden' }}>
                    <div style={{ padding:'8px 14px',
                                  background: ev.es_autoevaluacion
                                    ? 'var(--color-background-info)'
                                    : 'var(--color-background-secondary)',
                                  borderBottom:'0.5px solid var(--color-border-tertiary)',
                                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <p style={{ fontSize:12, fontWeight:500, margin:0,
                                  color: ev.es_autoevaluacion
                                    ? 'var(--color-text-info)'
                                    : 'var(--color-text-primary)' }}>
                        {ev.etiqueta}
                      </p>
                      {ev.enviado_en && (
                        <p style={{ fontSize:11, color:'var(--color-text-tertiary)', margin:0 }}>
                          {new Date(ev.enviado_en).toLocaleDateString('es-PE')}
                        </p>
                      )}
                    </div>
                    <div style={{ display:'grid',
                                  gridTemplateColumns: ev.respuestas.length > 2 ? '1fr 1fr' : '1fr' }}>
                      {ev.respuestas.map((r, j) => (
                        <div key={j} style={{ padding:'7px 14px', display:'flex',
                                              justifyContent:'space-between', alignItems:'center', gap:8,
                                              borderBottom: j < ev.respuestas.length - 1
                                                ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                          <p style={{ fontSize:12, color:'var(--color-text-secondary)',
                                      margin:0, minWidth:0, overflow:'hidden',
                                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.criterio_nombre}
                          </p>
                          <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20,
                                         fontWeight:500, flexShrink:0,
                                         ...(COLOR_DESC[r.descriptor] || { background:'#f3f4f6', color:'#6b7280' }) }}>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
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

  async function eliminarSesion() {
    if (!confirm(`¿Eliminar "${sesion?.nombre}" y todos sus datos? Esta acción no se puede deshacer.`)) return
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
  const promedio     = conResultado.length > 0
    ? (conResultado.reduce((s, r) => s + parseFloat(r.pct_final), 0) / conResultado.length).toFixed(2)
    : null

  return (
    <div>
      {/* Modal */}
      {alumnoModal && (
        <ModalAlumno
          sesionId={id}
          alumno={alumnoModal}
          onClose={() => setAlumnoModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.push('/docente')}
              className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
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
          { label: 'Total alumnos', valor: total },
          { label: 'En grupo',      valor: enGrupo,    color: 'text-blue-600' },
          { label: 'Sin grupo',     valor: sinGrupo,   color: sinGrupo > 0 ? 'text-amber-500' : 'text-gray-800' },
          { label: 'Completaron',   valor: completaron, color: 'text-green-600' },
          { label: 'Pendientes',    valor: pendientes,  color: pendientes > 0 ? 'text-red-500' : 'text-gray-800' },
        ].map(m => (
          <div key={m.label} className="card py-3">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-2xl font-medium ${m.color || 'text-gray-800'}`}>{m.valor}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-6">
        {promedio
          ? <>Promedio del aula: <span className="font-medium text-gray-700">{promedio}%</span> · {conResultado.length} alumno{conResultado.length !== 1 ? 's' : ''} con evaluación completa.</>
          : 'Aún no hay evaluaciones completas para calcular el promedio.'}
      </p>

      {/* Progreso por aula */}
      {progreso.length > 0 && (
        <div className="card mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Progreso por aula</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {progreso.sort((a, b) => b.pct_respuesta - a.pct_respuesta).map(p => {
              const pct = parseFloat(p.pct_respuesta) || 0
              return (
                <div key={p.aula}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => setAulaFiltro(p.aula === aulaFiltro ? '' : p.aula)}>
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
            <button onClick={() => setAulaFiltro('')} className="mt-3 text-xs text-blue-600 hover:underline">
              Mostrar todas las aulas ✕
            </button>
          )}
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-2">
          <div>
            <p className="text-sm font-medium text-gray-800">Resultados por alumno</p>
            <p className="text-xs text-gray-400 mt-0.5">Haz clic en un alumno para ver el detalle de sus evaluaciones</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={aulaFiltro} onChange={e => setAulaFiltro(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
              <option value="">Todas las aulas</option>
              {aulas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
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
                <tr
                  key={r.alumno_id}
                  onClick={() => r.tiene_grupo && setAlumnoModal(r)}
                  className={`border-t border-gray-50 transition-colors
                    ${r.tiene_grupo ? 'cursor-pointer hover:bg-blue-50' : ''}
                    ${!r.tiene_grupo ? 'opacity-40' : !r.completado ? 'opacity-70' : ''}`}
                >
                  <td className="px-4 py-2.5">
                    <p className="text-gray-800 font-medium text-sm">{r.nombre}</p>
                    <p className="text-xs text-gray-400">{r.correo}</p>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.aula}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {!r.tiene_grupo ? (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">Sin grupo</span>
                    ) : r.completado ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Completado</span>
                    ) : (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center"><BadgePct pct={r.pct_final}/></td>
                  <td className="px-4 py-2.5 text-center"><BadgeDescriptor descriptor={r.descriptor}/></td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    No hay alumnos con este filtro.
                  </td>
                </tr>
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
