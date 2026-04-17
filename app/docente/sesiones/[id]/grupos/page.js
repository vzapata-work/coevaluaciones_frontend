'use client'

// app/docente/sesiones/[id]/grupos/page.js
// Permite al docente ver y editar los grupos de una sesión

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import api from '@/lib/api'
import { Spinner, AlertaError } from '@/components/ui'

// ── Modal para editar un grupo ─────────────────────────────
function ModalEditarGrupo({ grupo, sesionId, maxGrupo, onClose, onGuardado }) {
  const [todosAlumnos,  setTodosAlumnos]  = useState([])
  const [seleccionados, setSeleccionados] = useState(new Set(grupo.miembros.map(m => m.id)))
  const [busqueda,      setBusqueda]      = useState('')
  const [guardando,     setGuardando]     = useState(false)
  const [error,         setError]         = useState(null)
  const [cargando,      setCargando]      = useState(true)

  useEffect(() => {
    // Cargar todos los alumnos de la sesión para poder reasignar
    api.get(`/docente/alumnos`)
      .then(data => setTodosAlumnos(Object.values(data.por_aula || {}).flat()))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  function toggle(id) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size <= 1) return prev  // mínimo 1 miembro
        next.delete(id)
      } else {
        if (next.size >= maxGrupo) {
          setError(`El grupo no puede tener más de ${maxGrupo} miembros`)
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.patch(`/docente/grupos/${grupo.id}/miembros`, {
        miembro_ids: [...seleccionados],
      })
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const alumnosFiltrados = todosAlumnos.filter(a =>
    !busqueda ||
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.correo.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Agrupar por aula
  const porAula = {}
  for (const a of alumnosFiltrados) {
    if (!porAula[a.aula]) porAula[a.aula] = []
    porAula[a.aula].push(a)
  }

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
        background:'#ffffff', borderRadius:16, width:'100%', maxWidth:540,
        maxHeight:'88vh', display:'flex', flexDirection:'column',
        boxShadow:'0 8px 32px rgba(0,0,0,0.18)', border:'1px solid #e5e7eb',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'14px 18px', borderBottom:'1px solid #f3f4f6',
          background:'#f9fafb', borderRadius:'16px 16px 0 0', flexShrink:0,
        }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:15, fontWeight:600, margin:0, color:'#111827' }}>Editar grupo</p>
            <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>
              {seleccionados.size} de máx. {maxGrupo} miembros seleccionados
            </p>
          </div>
          <button onClick={onClose} style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:20, color:'#9ca3af', padding:'4px 8px',
          }}>✕</button>
        </div>

        {/* Miembros actuales */}
        <div style={{ padding:'12px 18px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          <p style={{ fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase',
                      letterSpacing:'.06em', margin:'0 0 8px' }}>
            Miembros seleccionados
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {[...seleccionados].map(id => {
              const a = todosAlumnos.find(x => x.id === id)
              const yaEvaluo = grupo.miembros.find(m => m.id === id)?.ya_evaluo
              return a ? (
                <div key={id} style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'4px 10px', borderRadius:20, fontSize:12,
                  background: yaEvaluo ? '#fef3c7' : '#eff6ff',
                  color: yaEvaluo ? '#92400e' : '#1d4ed8',
                  border: `1px solid ${yaEvaluo ? '#fde68a' : '#bfdbfe'}`,
                }}>
                  {a.nombre.split(',')[0]}
                  {yaEvaluo && <span style={{ fontSize:10 }}>🔒</span>}
                  {!yaEvaluo && (
                    <button onClick={() => toggle(id)} style={{
                      background:'none', border:'none', cursor:'pointer',
                      fontSize:14, color:'#6b7280', padding:0, lineHeight:1,
                    }}>✕</button>
                  )}
                </div>
              ) : null
            })}
          </div>
          {grupo.miembros.some(m => m.ya_evaluo) && (
            <p style={{ fontSize:11, color:'#d97706', margin:'8px 0 0' }}>
              🔒 Los miembros con candado ya enviaron su evaluación y no pueden quitarse del grupo.
            </p>
          )}
        </div>

        {/* Buscador y lista */}
        <div style={{ flex:1, overflow:'auto', padding:'12px 18px' }}>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar alumno..."
            style={{
              width:'100%', boxSizing:'border-box', marginBottom:10,
              padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8,
              fontSize:13, outline:'none',
            }}
          />

          {cargando ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'1.5rem' }}>
              <div style={{ width:18, height:18, border:'2px solid #e5e7eb',
                            borderTopColor:'#3b82f6', borderRadius:'50%',
                            animation:'spin .7s linear infinite' }}/>
            </div>
          ) : (
            Object.entries(porAula).sort(([a],[b]) => a.localeCompare(b)).map(([aula, alumnos]) => (
              <div key={aula} style={{ marginBottom:12 }}>
                <p style={{ fontSize:11, fontWeight:600, color:'#9ca3af', margin:'0 0 4px',
                            textTransform:'uppercase', letterSpacing:'.05em' }}>
                  {aula}
                </p>
                {alumnos.map(a => {
                  const sel = seleccionados.has(a.id)
                  const yaEvaluo = grupo.miembros.find(m => m.id === a.id)?.ya_evaluo
                  return (
                    <div
                      key={a.id}
                      onClick={() => !yaEvaluo && toggle(a.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'8px 10px', borderRadius:8, marginBottom:3,
                        cursor: yaEvaluo ? 'not-allowed' : 'pointer',
                        background: sel ? '#eff6ff' : 'transparent',
                        border: sel ? '1px solid #bfdbfe' : '1px solid transparent',
                        opacity: yaEvaluo ? 0.6 : 1,
                        transition:'all .1s',
                      }}
                    >
                      <div style={{
                        width:18, height:18, borderRadius:4, flexShrink:0,
                        border:`2px solid ${sel ? '#3b82f6' : '#d1d5db'}`,
                        background: sel ? '#3b82f6' : 'white',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        {sel && <span style={{ color:'white', fontSize:11, lineHeight:1 }}>✓</span>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, color:'#111827', margin:0, fontWeight: sel ? 500 : 400 }}>
                          {a.nombre}
                        </p>
                        <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>{a.correo}</p>
                      </div>
                      {yaEvaluo && <span style={{ fontSize:11, color:'#d97706' }}>🔒 ya evaluó</span>}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'12px 18px', borderTop:'1px solid #f3f4f6',
          flexShrink:0, display:'flex', gap:8,
        }}>
          {error && (
            <p style={{ fontSize:12, color:'#dc2626', flex:1, margin:0, alignSelf:'center' }}>{error}</p>
          )}
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button onClick={onClose} style={{
              padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb',
              background:'white', cursor:'pointer', fontSize:13, color:'#374151',
            }}>
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando || seleccionados.size === 0} style={{
              padding:'8px 16px', borderRadius:8, border:'none',
              background: guardando ? '#93c5fd' : '#3b82f6',
              color:'white', cursor: guardando ? 'not-allowed' : 'pointer',
              fontSize:13, fontWeight:500,
            }}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )

  return createPortal(modal, document.body)
}

// ── Página principal ───────────────────────────────────────
export default function GruposPage() {
  const router  = useRouter()
  const { id }  = useParams()

  const [grupos,      setGrupos]      = useState([])
  const [maxGrupo,    setMaxGrupo]    = useState(4)
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)
  const [grupoEditar, setGrupoEditar] = useState(null)

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    setCargando(true)
    try {
      const data = await api.get(`/docente/grupos/${id}`)
      setGrupos(data.grupos || [])
      setMaxGrupo(data.max_grupo || 4)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return <div className="flex justify-center py-20"><Spinner className="w-6 h-6"/></div>

  return (
    <div>
      {grupoEditar && (
        <ModalEditarGrupo
          grupo={grupoEditar}
          sesionId={id}
          maxGrupo={maxGrupo}
          onClose={() => setGrupoEditar(null)}
          onGuardado={() => { setGrupoEditar(null); cargar() }}
        />
      )}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push(`/docente/sesiones/${id}`)}
          className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
        <div>
          <h1 className="text-xl font-medium text-gray-900">Gestionar grupos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{grupos.length} grupos formados</p>
        </div>
      </div>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {grupos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-gray-400">Aún no se han formado grupos en esta sesión.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((g, i) => (
            <div key={g.id} className="card">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">Grupo {i + 1}</span>
                  <span className="text-xs text-gray-400">
                    {g.miembros.length} miembro{g.miembros.length !== 1 ? 's' : ''}
                  </span>
                  {g.tiene_evaluaciones && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Con evaluaciones
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setGrupoEditar(g)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50
                             transition-colors text-gray-600"
                >
                  Editar grupo
                </button>
              </div>

              <div className="space-y-1.5">
                {g.miembros.map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center
                                    text-xs font-medium text-blue-600 flex-shrink-0">
                      {m.nombre?.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{m.nombre}</p>
                      <p className="text-xs text-gray-400">{m.aula}</p>
                    </div>
                    {m.ya_evaluo && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        Ya evaluó
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
