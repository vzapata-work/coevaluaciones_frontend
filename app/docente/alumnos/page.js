'use client'

// app/docente/alumnos/page.js
// Subir CSV de alumnos y visualizar la lista actual

import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { Spinner, AlertaError, EmptyState } from '@/components/ui'

export default function AlumnosPage() {
  const [porAula,   setPorAula]   = useState({})
  const [total,     setTotal]     = useState(0)
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)
  const [subiendo,  setSubiendo]  = useState(false)
  const [resultado, setResultado] = useState(null)  // resultado de la última importación
  const [aulaFiltro, setAulaFiltro] = useState('')
  const [busqueda,   setBusqueda]   = useState('')
  const fileRef = useRef()

  useEffect(() => { cargarAlumnos() }, [])

  async function cargarAlumnos() {
    setCargando(true)
    try {
      const data = await api.get('/docente/alumnos')
      setPorAula(data.por_aula || {})
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  async function handleArchivo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    setResultado(null)
    setError(null)
    try {
      const form = new FormData()
      form.append('archivo', archivo)
      const data = await api.upload('/docente/alumnos/importar', form)
      setResultado(data)
      await cargarAlumnos()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
      fileRef.current.value = ''
    }
  }

  const aulas = Object.keys(porAula).sort()

  // Filtrar por aula y búsqueda
  const aulasMostradas = aulas.filter(a => !aulaFiltro || a === aulaFiltro)
  const alumnosFiltrados = aulasMostradas.flatMap(aula =>
    (porAula[aula] || []).filter(al =>
      !busqueda ||
      al.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      al.correo.toLowerCase().includes(busqueda.toLowerCase())
    ).map(al => ({ ...al, aula }))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Lista de alumnos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} alumno{total !== 1 ? 's' : ''} · {aulas.length} aula{aulas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleArchivo}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current.click()}
            disabled={subiendo}
            className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700
                       transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {subiendo ? <><Spinner className="w-4 h-4 border-white border-t-transparent"/> Importando...</> : 'Subir CSV / Excel'}
          </button>
        </div>
      </div>

      <AlertaError mensaje={error} onClose={() => setError(null)}/>

      {/* Resultado de importación */}
      {resultado && (
        <div className={`card mb-4 ${resultado.con_errores > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium text-green-800">
              {resultado.importados} alumnos importados correctamente
            </span>
          </div>
          {resultado.con_errores > 0 && (
            <div className="text-sm text-amber-700">
              <p className="mb-1">{resultado.con_errores} registros con errores:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {resultado.errores.slice(0, 5).map((e, i) => (
                  <li key={i} className="text-xs">
                    {e.fila?.apellidos_nombres || e.fila?.correo || 'Fila desconocida'} — {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Formato esperado */}
      {total === 0 && !cargando && (
        <div className="card mb-4 bg-blue-50 border-blue-100">
          <p className="text-sm font-medium text-blue-800 mb-2">Formato esperado del archivo</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-3 py-1.5 text-left">aula</th>
                  <th className="px-3 py-1.5 text-left">apellidos_nombres</th>
                  <th className="px-3 py-1.5 text-left">correo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-1.5 text-gray-600">Laboratorio 110</td>
                  <td className="px-3 py-1.5 text-gray-600">García Rodríguez Ana</td>
                  <td className="px-3 py-1.5 text-gray-600">a.garcia@universidad.edu.pe</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            La primera fila debe ser el encabezado exactamente como se muestra.
          </p>
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-16"><Spinner className="w-6 h-6"/></div>
      ) : total === 0 ? (
        <EmptyState titulo="No hay alumnos cargados" descripcion="Sube un archivo CSV o Excel para comenzar."/>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <input
              type="text"
              placeholder="Buscar nombre o correo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-40 focus:outline-none focus:border-blue-400"
            />
            <select
              value={aulaFiltro}
              onChange={e => setAulaFiltro(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">Todas las aulas ({aulas.length})</option>
              {aulas.map(a => (
                <option key={a} value={a}>{a} ({porAula[a]?.length})</option>
              ))}
            </select>
          </div>

          {/* Tabla */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Correo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Aula</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosFiltrados.map((al, i) => (
                    <tr key={al.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-2.5 text-gray-800">{al.nombre}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{al.correo}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {al.aula}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
              Mostrando {alumnosFiltrados.length} de {total} alumnos
            </div>
          </div>
        </>
      )}
    </div>
  )
}
