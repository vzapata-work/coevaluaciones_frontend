'use client'

// app/alumno/grupo/page.js
// Formar grupo (si es el primero) o ver grupo ya asignado

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import api from '@/lib/api'
import { Spinner, AlertaError } from '@/components/ui'

export default function GrupoPage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const sesionId     = params.get('sesion_id')
  const { usuario }  = useAuth()

  const [grupo,       setGrupo]       = useState(null)   // null = no tiene grupo aún
  const [companeros,  setCompaneros]  = useState([])
  const [aulas,       setAulas]       = useState([])
  const [aulaExtra,   setAulaExtra]   = useState('')
  const [exteriores,  setExteriores]  = useState([])
  const [tab,         setTab]         = useState('miaula')
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [cargando,    setCargando]    = useState(true)
  const [guardando,   setGuardando]   = useState(false)
  const [error,       setError]       = useState(null)
  const [sesion,      setSesion]      = useState(null)

  useEffect(() => {
    if (!sesionId) { router.replace('/alumno'); return }
    cargarInicial()
  }, [sesionId])

  async function cargarInicial() {
    setCargando(true)
    try {
      // Ver si ya tiene grupo
      const grupoData = await api.get(`/alumno/grupo?sesion_id=${sesionId}`)
      if (grupoData.grupo) {
        setGrupo(grupoData.grupo)
        setCargando(false)
        return
      }
      // No tiene grupo → cargar compañeros y sesión activa
      const [companeroData, sesionData] = await Promise.all([
        api.get(`/alumno/companeros?sesion_id=${sesionId}`),
        api.get(`/alumno/sesion-activa`),
      ])
      setCompaneros(companeroData.companeros || [])
      const sesionActiva = sesionData.activa?.id === sesionId
        ? sesionData.activa
        : sesionData.historial?.find(s => s.id === sesionId)
      setSesion(sesionActiva)
      const aulasDisp = (sesionActiva?.aulas || []).filter(a => a !== usuario.aula).sort()
      setAulas(aulasDisp)
    } catch (err) {
      console.error("Error en cargarInicial:", err)
      setError(err.message || "Error al cargar")
    } finally {
      setCargando(false)
    }
  }

  async function cargarAulaExtra(aula) {
    if (!aula) return
    try {
      const data = await api.get(`/alumno/companeros/aula/${encodeURIComponent(aula)}?sesion_id=${sesionId}`)
      setExteriores(data.companeros || [])
    } catch (err) {
      setError(err.message)
    }
  }

  function toggleAlumno(id) {
    const maxSel = (sesion?.max_grupo || 4) - 1  // -1 porque el alumno mismo no se selecciona
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= maxSel) {
          setError(`El grupo no puede tener más de ${sesion?.max_grupo || 4} integrantes (incluyéndote a ti)`)
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  async function confirmarGrupo(soloYo = false) {
    setGuardando(true)
    setError(null)
    try {
      await api.post('/alumno/grupo', {
        sesion_id:   sesionId,
        miembro_ids: soloYo ? [] : [...seleccionados],
      })
      router.push(`/alumno/evaluar?sesion_id=${sesionId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="flex justify-center py-20"><Spinner className="w-6 h-6"/></div>

  // Vista B: ya tiene grupo
  if (grupo) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/alumno')} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
          <h1 className="text-xl font-medium text-gray-900">Tu grupo</h1>
        </div>
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4 text-green-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium">
              Registrado por {grupo.creado_por?.nombre}
            </span>
          </div>
          <div className="space-y-2">
            {grupo.miembros?.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                <Avatar nombre={m.nombre}/>
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.nombre}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">{m.aula}</span>
                    {m.aula !== usuario.aula && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">Otra aula</span>
                    )}
                    {m.id === usuario.id && (
                      <span className="text-xs text-blue-500">Tú</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
          ¿Algún integrante no corresponde a tu grupo? Comunícate con tu docente antes de continuar.
        </div>

        <button
          onClick={() => router.push(`/alumno/evaluar?sesion_id=${sesionId}`)}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Comenzar evaluación →
        </button>
      </div>
    )
  }

  // Vista A: formar grupo
  const maxSel = (sesion?.max_grupo || 4) - 1
  const listaActual = tab === 'miaula' ? companeros.filter(c => !c.soy_yo) : exteriores

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/alumno')} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
        <h1 className="text-xl font-medium text-gray-900">Forma tu grupo</h1>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Selecciona entre 1 y {maxSel} compañeros. Tú ya estás incluido. Máximo {sesion?.max_grupo || 4} integrantes en total.
      </p>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {/* Slots visuales */}
      <div className="card mb-4">
        <p className="text-xs text-gray-400 mb-3">
          Tu grupo — {seleccionados.size + 1} de máx. {sesion?.max_grupo || 4} integrantes
        </p>
        <div className="flex gap-3 flex-wrap">
          {/* Slot propio fijo */}
          <SlotFijo label="YO" sub="Tú"/>
          {/* Slots dinámicos */}
          {[...Array(maxSel)].map((_, i) => {
            const id = [...seleccionados][i]
            const al = id ? [...companeros, ...exteriores].find(c => c.id === id) : null
            return <SlotDinamico key={i} alumno={al} index={i + 1}/>
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('miaula')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors
              ${tab === 'miaula' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Mi aula ({usuario.aula})
          </button>
          <button
            onClick={() => setTab('otraaula')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors
              ${tab === 'otraaula' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Otra aula
            <span className="ml-1.5 text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">Recuperación</span>
          </button>
        </div>

        <div className="p-4">
          {tab === 'otraaula' && (
            <div className="mb-3">
              <div className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5 mb-3">
                Usa esta opción solo si un compañero cursó o recuperó en un aula diferente.
              </div>
              <select
                value={aulaExtra}
                onChange={e => { setAulaExtra(e.target.value); cargarAulaExtra(e.target.value) }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="">Selecciona un aula...</option>
                {aulas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {listaActual.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                {tab === 'otraaula' ? 'Selecciona un aula para ver sus alumnos' : 'No hay compañeros disponibles'}
              </p>
            ) : (
              listaActual.map(al => (
                <button
                  key={al.id}
                  onClick={() => !al.tiene_grupo && toggleAlumno(al.id)}
                  disabled={al.tiene_grupo}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors
                    ${al.tiene_grupo ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
                    ${seleccionados.has(al.id) ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'}`}
                >
                  <Avatar nombre={al.nombre}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{al.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {al.tiene_grupo ? 'Ya en otro grupo' : 'Sin grupo'}
                    </p>
                  </div>
                  {!al.tiene_grupo && (
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                      ${seleccionados.has(al.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {seleccionados.has(al.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <p className="text-sm text-gray-400 flex-1">
          {seleccionados.size >= 1
            ? `Grupo de ${seleccionados.size + 1} integrantes listo para confirmar.`
            : 'Selecciona compañeros o trabaja solo.'}
        </p>
        <button
          onClick={() => {
            if (confirm('¿Confirmas que trabajarás solo? Solo podrás autoevaluarte.')) {
              confirmarGrupo(true)
            }
          }}
          disabled={guardando}
          className="border border-gray-200 text-gray-600 rounded-lg px-4 py-2.5 text-sm
                     hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          Trabajar solo
        </button>
        <button
          onClick={() => confirmarGrupo(false)}
          disabled={seleccionados.size === 0 || guardando}
          className="bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium
                     hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center gap-2"
        >
          {guardando ? <><Spinner className="w-4 h-4 border-white border-t-transparent"/> Guardando...</> : 'Confirmar grupo →'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right">
        Una vez confirmado, el grupo queda fijo para todos los integrantes.
      </p>
    </div>
  )
}

function Avatar({ nombre }) {
  const ini = nombre?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                    text-xs font-medium text-blue-700 flex-shrink-0">
      {ini}
    </div>
  )
}

function SlotFijo({ label, sub }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-11 h-11 rounded-full bg-blue-100 border-2 border-blue-300
                      flex items-center justify-center text-xs font-medium text-blue-700">
        {label}
      </div>
      <span className="text-xs text-blue-500">{sub}</span>
    </div>
  )
}

function SlotDinamico({ alumno, index }) {
  if (alumno) {
    const ini = alumno.nombre?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-11 h-11 rounded-full bg-green-100 border-2 border-green-300
                        flex items-center justify-center text-xs font-medium text-green-700">
          {ini}
        </div>
        <span className="text-xs text-green-600 max-w-12 truncate text-center">
          {alumno.nombre.split(',')[0]}
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300
                      flex items-center justify-center text-gray-300 text-lg">
        +
      </div>
      <span className="text-xs text-gray-300">+{index}</span>
    </div>
  )
}
