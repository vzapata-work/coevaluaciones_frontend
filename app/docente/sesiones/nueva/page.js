'use client'

// app/docente/sesiones/nueva/page.js
// Formulario para crear una nueva sesión de evaluación

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { AlertaError, Spinner } from '@/components/ui'

const CRITERIOS_DEFAULT = [
  { nombre: 'Participación activa',          descripcion: 'Contribuyó activamente durante las sesiones de trabajo' },
  { nombre: 'Cumplimiento de tareas',        descripcion: 'Entregó sus partes a tiempo y con la calidad acordada' },
  { nombre: 'Colaboración y trabajo en equipo', descripcion: 'Apoyó a sus compañeros y facilitó el trabajo conjunto' },
  { nombre: 'Comunicación',                  descripcion: 'Se comunicó de forma clara y oportuna con el grupo' },
]

export default function NuevaSesionPage() {
  const router = useRouter()

  // Datos del formulario
  const [nombre,           setNombre]           = useState('')
  const [cierraEn,         setCierraEn]         = useState('')
  const [maxGrupo,         setMaxGrupo]         = useState(4)
  const [conAutoeval,      setConAutoeval]       = useState(true)
  const [anonima,          setAnonima]           = useState(true)
  const [criterios,        setCriterios]         = useState(CRITERIOS_DEFAULT)
  const [aulasDisponibles, setAulasDisponibles]  = useState([])
  const [aulasSeleccionadas, setAulasSeleccionadas] = useState(new Set())

  const [cargandoAulas, setCargandoAulas] = useState(true)
  const [guardando,     setGuardando]     = useState(false)
  const [error,         setError]         = useState(null)

  // Cargar aulas disponibles desde la lista de alumnos
  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/docente/alumnos')
        const aulas = Object.keys(data.por_aula || {}).sort()
        setAulasDisponibles(aulas)
        setAulasSeleccionadas(new Set(aulas))  // todas seleccionadas por defecto
      } catch (err) {
        setError('No se pudieron cargar las aulas. ¿Ya subiste la lista de alumnos?')
      } finally {
        setCargandoAulas(false)
      }
    }
    cargar()
  }, [])

  // Manejo de aulas
  function toggleAula(aula) {
    setAulasSeleccionadas(prev => {
      const next = new Set(prev)
      next.has(aula) ? next.delete(aula) : next.add(aula)
      return next
    })
  }
  function seleccionarTodas(val) {
    setAulasSeleccionadas(val ? new Set(aulasDisponibles) : new Set())
  }

  // Manejo de criterios
  function updateCriterio(i, campo, valor) {
    setCriterios(prev => prev.map((c, idx) => idx === i ? { ...c, [campo]: valor } : c))
  }
  function addCriterio() {
    setCriterios(prev => [...prev, { nombre: '', descripcion: '' }])
  }
  function removeCriterio(i) {
    if (criterios.length <= 1) return
    setCriterios(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim())              return setError('El nombre de la sesión es requerido')
    if (aulasSeleccionadas.size < 1) return setError('Selecciona al menos un aula')
    if (criterios.some(c => !c.nombre.trim())) return setError('Todos los criterios deben tener nombre')

    setGuardando(true)
    try {
      const data = await api.post('/docente/sesiones', {
        nombre:             nombre.trim(),
        aulas:              [...aulasSeleccionadas],
        criterios:          criterios.map(c => ({ nombre: c.nombre.trim(), descripcion: c.descripcion.trim() })),
        max_grupo:          maxGrupo,
        con_autoevaluacion: conAutoeval,
        anonima,
        cierra_en:          cierraEn || null,
      })
      router.push(`/docente/sesiones/${data.sesion.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
        <h1 className="text-xl font-medium text-gray-900">Nueva sesión de evaluación</h1>
      </div>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Columna izquierda */}
          <div className="space-y-4">

            {/* Info básica */}
            <div className="card">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Información</p>
              <label className="block text-xs text-gray-500 mb-1">Nombre de la sesión</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="ej. Proyecto final 2025-II"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3
                           focus:outline-none focus:border-blue-400"
              />
              <label className="block text-xs text-gray-500 mb-1">Fecha de cierre (opcional)</label>
              <input
                type="datetime-local"
                value={cierraEn}
                onChange={e => setCierraEn(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Aulas */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Aulas ({aulasSeleccionadas.size} de {aulasDisponibles.length})
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => seleccionarTodas(true)}
                    className="text-xs text-blue-600 hover:underline">Todas</button>
                  <button type="button" onClick={() => seleccionarTodas(false)}
                    className="text-xs text-gray-400 hover:underline">Ninguna</button>
                </div>
              </div>
              {cargandoAulas ? (
                <div className="flex justify-center py-4"><Spinner/></div>
              ) : aulasDisponibles.length === 0 ? (
                <p className="text-sm text-amber-600">
                  No hay alumnos cargados.{' '}
                  <button type="button" onClick={() => router.push('/docente/alumnos')}
                    className="underline">Sube el CSV primero.</button>
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {aulasDisponibles.map(aula => (
                    <label key={aula} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={aulasSeleccionadas.has(aula)}
                        onChange={() => toggleAula(aula)}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-gray-700 truncate">{aula}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Opciones */}
            <div className="card">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Opciones</p>

              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Tamaño máximo del grupo: <span className="font-medium text-gray-800">{maxGrupo} alumnos</span>
                </label>
                <input
                  type="range" min="2" max="6" value={maxGrupo}
                  onChange={e => setMaxGrupo(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                  <span>2</span><span>6</span>
                </div>
              </div>

              <Toggle label="Incluir autoevaluación" desc="El alumno se evalúa a sí mismo"
                value={conAutoeval} onChange={setConAutoeval}/>
              <Toggle label="Evaluación anónima" desc="Los alumnos no saben quién los evaluó"
                value={anonima} onChange={setAnonima}/>
            </div>

          </div>

          {/* Columna derecha — criterios */}
          <div className="card flex flex-col">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Criterios de evaluación
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Descriptores: Excelente (100%) · Bueno (75%) · Regular (50%) · Deficiente (25%)
            </p>

            <div className="space-y-2 flex-1">
              {criterios.map((c, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={c.nombre}
                      onChange={e => updateCriterio(i, 'nombre', e.target.value)}
                      placeholder="Nombre del criterio"
                      className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm
                                 focus:outline-none focus:border-blue-400 bg-white"
                    />
                    <input
                      type="text"
                      value={c.descripcion}
                      onChange={e => updateCriterio(i, 'descripcion', e.target.value)}
                      placeholder="Descripción (opcional)"
                      className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs
                                 text-gray-500 focus:outline-none focus:border-blue-400 bg-white"
                    />
                  </div>
                  {criterios.length > 1 && (
                    <button type="button" onClick={() => removeCriterio(i)}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none mt-1.5">✕</button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={addCriterio}
              className="mt-3 text-sm text-blue-600 hover:underline text-left">
              + Agregar criterio
            </button>

            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-2">
              <button type="button" onClick={() => router.back()}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || aulasDisponibles.length === 0}
                className="flex-2 flex-grow-[2] bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium
                           hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {guardando ? <><Spinner className="w-4 h-4 border-white border-t-transparent"/> Creando...</> : 'Crear sesión'}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0
                    ${value ? 'bg-blue-500' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform
                          ${value ? 'translate-x-5' : 'translate-x-1'}`}/>
      </button>
    </div>
  )
}
