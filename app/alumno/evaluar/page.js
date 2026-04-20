'use client'

// app/alumno/evaluar/page.js
// Formulario de evaluación: autoevaluación + evaluación de compañeros
// El alumno avanza persona por persona y envía todo al final

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import api from '@/lib/api'
import { Spinner, AlertaError } from '@/components/ui'

const DESCRIPTORES = ['Excelente', 'Bueno', 'Regular', 'Deficiente']
const COLOR_DESC = {
  Excelente:  'bg-green-50 border-green-400 text-green-700',
  Bueno:      'bg-blue-50  border-blue-400  text-blue-700',
  Regular:    'bg-amber-50 border-amber-400 text-amber-700',
  Deficiente: 'bg-red-50   border-red-400   text-red-700',
}

export default function EvaluarPage() {
  const router      = useRouter()
  const params      = useSearchParams()
  const sesionId    = params.get('sesion_id')
  const { usuario } = useAuth()

  const [sesion,     setSesion]    = useState(null)
  const [grupo,      setGrupo]     = useState(null)
  const [personas,   setPersonas]  = useState([])   // orden: yo primero, luego compañeros
  const [paso,       setPaso]      = useState(0)    // índice de persona actual
  const [respuestas, setRespuestas] = useState({})  // { [persona_id]: { [criterio_idx]: descriptor } }
  const [cargando,   setCargando]  = useState(true)
  const [enviando,   setEnviando]  = useState(false)
  const [enviado,    setEnviado]   = useState(false)
  const [error,      setError]     = useState(null)

  useEffect(() => {
    if (!sesionId) { router.replace('/alumno'); return }
    cargarDatos()
  }, [sesionId])

  async function cargarDatos() {
    try {
      const [grupoData, sesionesData] = await Promise.all([
        api.get(`/alumno/grupo?sesion_id=${sesionId}`),
        api.get('/alumno/sesion-activa'),
      ])
      // Si ya completó la evaluación, redirigir al inicio
      if (sesionesData.activa?.id === sesionId && sesionesData.activa?.alumno_completo) {
        router.replace('/alumno')
        return
      }
      if (!grupoData.grupo) { router.replace(`/alumno/grupo?sesion_id=${sesionId}`); return }

      const g = grupoData.grupo
      const s = sesionesData.activa
      setGrupo(g)
      setSesion(s)

      // Orden: yo primero (autoevaluación), luego el resto
      const yo       = g.miembros.find(m => m.id === usuario.id)
      const otros    = g.miembros.filter(m => m.id !== usuario.id)
      // Grupo de 1: si no hay compañeros, solo se autoevalúa (siempre incluir autoevaluación)
      const soloYo   = otros.length === 0
      const ordenados = (s?.con_autoevaluacion || soloYo) ? [yo, ...otros] : otros
      setPersonas(ordenados.filter(Boolean))
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  function setDescriptor(personaId, criterioIdx, descriptor) {
    setRespuestas(prev => ({
      ...prev,
      [personaId]: { ...(prev[personaId] || {}), [criterioIdx]: descriptor },
    }))
  }

  function criteriosCompletos(personaId) {
    const r = respuestas[personaId] || {}
    return sesion?.criterios?.every((_, i) => r[i])
  }

  function todasCompletas() {
    return personas.every(p => criteriosCompletos(p.id))
  }

  async function enviarTodo() {
    setEnviando(true)
    setError(null)
    try {
      const evaluaciones = personas.map(p => ({
        evaluado_id: p.id,
        respuestas:  sesion.criterios.map((_, i) => ({
          criterio_index: i,
          descriptor:     respuestas[p.id]?.[i],
        })),
      }))

      await api.post('/alumno/evaluaciones', {
        sesion_id: sesionId,
        grupo_id:  grupo.id,
        evaluaciones,
      })
      setEnviado(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <div className="flex justify-center py-20"><Spinner className="w-6 h-6"/></div>

  // ── Pantalla de éxito ──────────────────────────────────────
  if (enviado) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
            <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Evaluación enviada</h2>
        <p className="text-sm text-gray-500 mb-6">Tus respuestas fueron registradas correctamente.</p>
        <div className="inline-flex gap-6 bg-gray-50 rounded-xl px-6 py-4 mb-6 border border-gray-100">
          <div className="text-center"><p className="text-2xl font-medium">{personas.length}</p><p className="text-xs text-gray-400">Evaluaciones</p></div>
          <div className="w-px bg-gray-200"/>
          <div className="text-center"><p className="text-2xl font-medium">{sesion?.criterios?.length * personas.length}</p><p className="text-xs text-gray-400">Respuestas</p></div>
          <div className="w-px bg-gray-200"/>
          <div className="text-center"><p className="text-2xl font-medium text-green-600">100%</p><p className="text-xs text-gray-400">Completado</p></div>
        </div>
        <br/>
        <button onClick={() => router.push('/alumno')}
          className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
          Volver al inicio
        </button>
      </div>
    )
  }

  const personaActual = personas[paso]
  const esAutoeval    = personaActual?.id === usuario.id
  const totalPasos    = personas.length
  const enResumen     = paso === totalPasos

  // ── Pantalla de resumen / confirmación ────────────────────
  if (enResumen) {
    return (
      <div>
        <h1 className="text-xl font-medium text-gray-900 mb-2">Revisa tu evaluación</h1>
        <p className="text-sm text-gray-500 mb-5">Una vez enviada no podrás modificarla.</p>

        <AlertaError mensaje={error} onClose={() => setError(null)}/>

        <div className="space-y-3 mb-5">
          {personas.map(p => (
            <div key={p.id} className="card p-0 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <Avatar nombre={p.nombre}/>
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                  <p className="text-xs text-gray-400">{p.id === usuario.id ? 'Autoevaluación' : 'Compañero'}</p>
                </div>
                <svg className="w-4 h-4 text-green-500 ml-auto" fill="none" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
                {sesion?.criterios?.map((c, i) => (
                  <div key={i} className="px-4 py-2.5 flex justify-between items-center gap-2">
                    <span className="text-xs text-gray-500 truncate">{c.nombre}</span>
                    <DescBadge val={respuestas[p.id]?.[i]}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 items-center bg-gray-50 rounded-lg p-3 mb-5 text-xs text-gray-500">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 7v3.5M8 5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Tus respuestas son anónimas. Solo el docente verá los resultados agregados.
        </div>

        <div className="flex gap-2">
          <button onClick={() => setPaso(totalPasos - 1)}
            className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
            Revisar respuestas
          </button>
          <button
            onClick={enviarTodo}
            disabled={enviando}
            className="flex-[2] bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium
                       hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {enviando ? <><Spinner className="w-4 h-4 border-white border-t-transparent"/> Enviando...</> : 'Enviar evaluación'}
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario de evaluación ───────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-medium text-gray-900">
          {esAutoeval ? 'Autoevaluación' : 'Evaluar compañero'}
        </h1>
        <span className="text-sm text-gray-400">Paso {paso + 1} de {totalPasos}</span>
      </div>

      {/* Barra de personas */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {personas.map((p, i) => {
          const done = i < paso || criteriosCompletos(p.id)
          const active = i === paso
          return (
            <div key={p.id} className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
              onClick={() => setPaso(i)}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors
                ${active  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : done  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                {p.id === usuario.id ? 'YO' : p.nombre?.split(' ').slice(0, 2).map(x => x[0]).join('')}
              </div>
              <span className={`text-xs max-w-12 truncate text-center
                ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {p.id === usuario.id ? 'Tú' : p.nombre?.split(',')[0]}
              </span>
            </div>
          )
        })}
      </div>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {/* Cabecera persona */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <Avatar nombre={personaActual?.nombre}/>
          <div>
            <p className="text-sm font-medium text-gray-800">{personaActual?.nombre}</p>
            <p className="text-xs text-gray-400">
              {esAutoeval ? 'Autoevaluación — ¿cómo evaluarías tu propio desempeño?' : `Compañero · ${personaActual?.aula}`}
            </p>
          </div>
        </div>
      </div>

      {/* Criterios */}
      <div className="space-y-3 mb-5">
        {sesion?.criterios?.map((c, i) => {
          const seleccionado = respuestas[personaActual?.id]?.[i]
          return (
            <div key={i} className="card">
              <p className="text-sm font-medium text-gray-800 mb-0.5">
                {c.nombre}
                <span className="text-red-400 ml-1">*</span>
              </p>
              {c.descripcion && <p className="text-xs text-gray-400 mb-3">{c.descripcion}</p>}
              <div className="grid grid-cols-2 gap-2">
                {DESCRIPTORES.map(d => (
                  <button
                    key={d}
                    onClick={() => setDescriptor(personaActual.id, i, d)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all
                      ${seleccionado === d
                        ? COLOR_DESC[d]
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Navegación */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPaso(p => Math.max(0, p - 1))}
          disabled={paso === 0}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50
                     transition-colors disabled:opacity-40"
        >
          Anterior
        </button>
        <div className="flex-1 text-xs text-gray-400 text-center">
          {criteriosCompletos(personaActual?.id)
            ? <span className="text-green-600 font-medium">✓ Completo</span>
            : `${Object.keys(respuestas[personaActual?.id] || {}).length} de ${sesion?.criterios?.length} criterios`
          }
        </div>
        {paso < totalPasos - 1 ? (
          <button
            onClick={() => setPaso(p => p + 1)}
            disabled={!criteriosCompletos(personaActual?.id)}
            className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium
                       hover:bg-blue-700 transition-colors disabled:opacity-40"
          >
            Siguiente →
          </button>
        ) : (
          <button
            onClick={() => setPaso(totalPasos)}
            disabled={!todasCompletas()}
            className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium
                       hover:bg-blue-700 transition-colors disabled:opacity-40"
          >
            Revisar y enviar →
          </button>
        )}
      </div>
    </div>
  )
}

function Avatar({ nombre }) {
  const ini = nombre?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center
                    text-xs font-medium text-blue-700 flex-shrink-0">{ini}</div>
  )
}

function DescBadge({ val }) {
  if (!val) return <span className="text-xs text-gray-300">—</span>
  const cls = {
    Excelente: 'bg-green-50 text-green-700', Bueno: 'bg-blue-50 text-blue-700',
    Regular: 'bg-amber-50 text-amber-700', Deficiente: 'bg-red-50 text-red-700',
  }[val] || 'bg-gray-100 text-gray-500'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cls}`}>{val}</span>
}
