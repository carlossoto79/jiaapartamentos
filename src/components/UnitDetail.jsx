import { useMemo } from 'react'
import { useUnitTickets } from '../hooks/useTickets'
import { formatCurrency } from '../lib/utils'
import { ArrowLeft, AlertTriangle, Plus } from 'lucide-react'
import '../styles/unit-detail.css'

const STATUS_CLASS = {
  'Abierto': 'abierto',
  'Asignado': 'asignado',
  'Reparado': 'reparado',
  'Verificado': 'verificado'
}

const REPETITION_WINDOW_MONTHS = 6

function formatDate(dateStr) {
  if (!dateStr) return ''
  // report_date is a DATE (YYYY-MM-DD); parse as local to avoid TZ drift
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function ticketTotal(t) {
  return (t.labor_cost || 0) + (t.materials_cost || 0) + (t.tax_amount || 0)
}

export default function UnitDetail({ unit, onNavigate }) {
  const { tickets, loading, error } = useUnitTickets(unit?.id)

  // Sort newest-first for the timeline feed
  const sorted = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const da = a.report_date || ''
      const db = b.report_date || ''
      return db.localeCompare(da)
    })
  }, [tickets])

  // Unit-level rollups
  const summary = useMemo(() => {
    const totalSpent = tickets.reduce((sum, t) => sum + ticketTotal(t), 0)
    const openCount = tickets.filter(t => t.status === 'Abierto').length
    const lastVisit = sorted.length > 0 ? sorted[0].report_date : null
    return {
      totalSpent,
      ticketCount: tickets.length,
      openCount,
      lastVisit
    }
  }, [tickets, sorted])

  // Recurring-problem detection: any category appearing 2+ times
  // within the last REPETITION_WINDOW_MONTHS
  const recurring = useMemo(() => {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - REPETITION_WINDOW_MONTHS)

    const counts = {}
    for (const t of tickets) {
      if (!t.report_date) continue
      const [y, m, d] = t.report_date.split('-').map(Number)
      const date = new Date(y, (m || 1) - 1, d || 1)
      if (date >= cutoff) {
        counts[t.category] = (counts[t.category] || 0) + 1
      }
    }

    return Object.entries(counts)
      .filter(([, count]) => count >= 2)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }, [tickets])

  if (!unit) {
    return (
      <div className="unit-detail-container">
        <div className="empty-state">
          <p>No se seleccionó ningún apartamento.</p>
          <button className="btn-secondary" onClick={() => onNavigate('registry')}>
            Volver a Apartamentos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="unit-detail-container">
      <div className="unit-detail-header">
        <button
          className="btn-back"
          onClick={() => onNavigate('registry')}
          title="Volver a Apartamentos"
        >
          <ArrowLeft size={18} /> Apartamentos
        </button>
      </div>

      <div className="unit-detail-title">
        <div className="unit-detail-icon">{unit.unit_number}</div>
        <div>
          <h1>Apartamento {unit.unit_number}</h1>
          <p className="unit-detail-location">
            {unit.building} · Piso {unit.floor}
          </p>
        </div>
        <button
          className="btn-primary unit-detail-new"
          onClick={() => onNavigate('new-ticket', unit.id)}
        >
          <Plus size={18} /> Nuevo Ticket
        </button>
      </div>

      {unit.notes && (
        <div className="unit-detail-notes">
          <strong>Notas:</strong> {unit.notes}
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando historial del apartamento...</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          <div className="unit-detail-stats">
            <div className="udetail-stat">
              <span className="udetail-stat-label">Costo Acumulado</span>
              <span className="udetail-stat-value">{formatCurrency(summary.totalSpent)}</span>
            </div>
            <div className="udetail-stat">
              <span className="udetail-stat-label">Tickets</span>
              <span className="udetail-stat-value">{summary.ticketCount}</span>
            </div>
            <div className="udetail-stat">
              <span className="udetail-stat-label">Abiertos</span>
              <span className="udetail-stat-value">{summary.openCount}</span>
            </div>
            <div className="udetail-stat">
              <span className="udetail-stat-label">Última Visita</span>
              <span className="udetail-stat-value">
                {summary.lastVisit ? formatDate(summary.lastVisit) : '—'}
              </span>
            </div>
          </div>

          {recurring.length > 0 && (
            <div className="recurring-banner">
              <AlertTriangle size={18} />
              <div>
                {recurring.map((r, i) => (
                  <span key={r.category}>
                    {i > 0 && ' · '}
                    Problema recurrente: <strong>{r.category}</strong> ({r.count} veces en {REPETITION_WINDOW_MONTHS} meses)
                  </span>
                ))}
              </div>
            </div>
          )}

          <h2 className="timeline-heading">Historial</h2>

          {sorted.length === 0 ? (
            <div className="empty-state">
              <p>Este apartamento aún no tiene tickets registrados.</p>
              <button
                className="btn-primary"
                onClick={() => onNavigate('new-ticket', unit.id)}
              >
                <Plus size={18} /> Crear el primer ticket
              </button>
            </div>
          ) : (
            <div className="timeline">
              {sorted.map(ticket => {
                const statusClass = STATUS_CLASS[ticket.status] || 'abierto'
                return (
                  <div className="timeline-item" key={ticket.id}>
                    <div className={`timeline-dot ${statusClass}`} />
                    <div
                      className="timeline-card"
                      onClick={() => onNavigate('ticket-detail', ticket.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onNavigate('ticket-detail', ticket.id)
                        }
                      }}
                    >
                      <div className="timeline-card-header">
                        <span className="timeline-title">{ticket.description}</span>
                        <span className="timeline-date">{formatDate(ticket.report_date)}</span>
                      </div>
                      <p className="timeline-meta">
                        {ticket.category}
                        {ticket.assigned_worker ? ` · ${ticket.assigned_worker}` : ''}
                      </p>
                      <div className="timeline-card-footer">
                        <span className={`result-status ${statusClass}`}>{ticket.status}</span>
                        <span className="timeline-category-tag">{ticket.category}</span>
                        <span className="timeline-cost">{formatCurrency(ticketTotal(ticket))}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
