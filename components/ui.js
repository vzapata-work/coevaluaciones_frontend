'use client'

// components/ui.js — componentes UI pequeños reutilizables

// ── Spinner de carga ────────────────────────────────────────

export function Spinner({ className = '' }) {
  return (
    <div className={`w-5 h-5 border-2 border-gray-200 border-t-blue-500
                     rounded-full animate-spin ${className}`}/>
  )
}

// ── Pantalla de carga centrada ──────────────────────────────

export function LoadingScreen({ texto = 'Cargando...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Spinner className="w-6 h-6"/>
      <p className="text-sm text-gray-400">{texto}</p>
    </div>
  )
}

// ── Badge de descriptor ─────────────────────────────────────

const BADGE_CLASES = {
  Excelente:  'badge-excelente',
  Bueno:      'badge-bueno',
  Regular:    'badge-regular',
  Deficiente: 'badge-deficiente',
}

export function BadgeDescriptor({ descriptor }) {
  if (!descriptor) return <span className="text-xs text-gray-300">—</span>
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_CLASES[descriptor] || 'bg-gray-100 text-gray-500'}`}>
      {descriptor}
    </span>
  )
}

// ── Badge de porcentaje con color ───────────────────────────

export function BadgePct({ pct }) {
  if (pct === null || pct === undefined) return <span className="text-xs text-gray-300">—</span>
  const color = pct >= 100 ? 'text-green-700'
              : pct >= 75  ? 'text-blue-700'
              : pct >= 50  ? 'text-amber-700'
              : 'text-red-700'
  return <span className={`text-sm font-medium ${color}`}>{pct.toFixed(2)}%</span>
}

// ── Badge de estado de sesión ───────────────────────────────

export function BadgeEstado({ estado }) {
  const cls = estado === 'abierta'
    ? 'bg-green-50 text-green-700'
    : 'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {estado === 'abierta' ? 'Abierta' : 'Cerrada'}
    </span>
  )
}

// ── Barra de progreso ───────────────────────────────────────

export function ProgBar({ pct, color }) {
  const bg = pct >= 80 ? 'bg-green-500'
           : pct >= 50 ? 'bg-yellow-400'
           : 'bg-red-400'
  return (
    <div className="prog-bar">
      <div className={`prog-fill ${color || bg}`} style={{ width: `${Math.min(pct, 100)}%` }}/>
    </div>
  )
}

// ── Alerta de error ─────────────────────────────────────────

export function AlertaError({ mensaje, onClose }) {
  if (!mensaje) return null
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 mb-4">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      <span className="flex-1">{mensaje}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-600">✕</button>
      )}
    </div>
  )
}

// ── Estado vacío ────────────────────────────────────────────

export function EmptyState({ titulo, descripcion }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p className="font-medium text-gray-500 mb-1">{titulo}</p>
      {descripcion && <p className="text-sm">{descripcion}</p>}
    </div>
  )
}
