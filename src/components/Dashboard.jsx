import { useState, useEffect } from 'react'
import { getDashboardStats, supabase } from '../lib/supabase'
import { formatCurrency, formatDate, isTicketOverdue } from '../lib/utils'
import {
  Plus, FileText, RefreshCw, ArrowRight,
  FolderOpen, Banknote, Clock, AlertTriangle
} from 'lucide-react'
import '../styles/dashboard.css'

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    openTicketsCount: 0,
    monthlySpent: 0,
    pendingVerificationCount: 0
  })
  const [recentTickets, setRecentTickets] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)

      const statsData = await getDashboardStats()
      setStats(statsData)

      const { data: tickets } = await supabase
        .from('tickets')
        .select('*, units(*)')
        .order('report_date', { ascending: false })
        .limit(10)

      setRecentTickets(tickets || [])

      const newAlerts = []

      const overdueTickets = (tickets || []).filter(t =>
        t.status === 'Abierto' && isTicketOverdue(t.report_date)
      )

      if (overdueTickets.length > 0) {
        newAlerts.push({
          id: 'overdue',
          type: 'warning',
          message: `${overdueTickets.length} ticket${overdueTickets.length > 1 ? 's' : ''} abierto${overdueTickets.length > 1 ? 's' : ''} por más de 7 días`,
          action: 'Ver tickets',
          actionFn: () => onNavigate('search')
        })
      }

      const pendingVerif = (tickets || []).filter(t =>
        t.verification_status === 'Pendiente inmobiliaria'
      )

      if (pendingVerif.length > 0) {
        newAlerts.push({
          id: 'pending-verification',
          type: 'info',
          message: `${pendingVerif.length} ticket${pendingVerif.length > 1 ? 's' : ''} esperando confirmación de inmobiliaria`,
          action: 'Revisar',
          actionFn: () => onNavigate('search')
        })
      }

      setAlerts(newAlerts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const statusClass = (status) =>
    status?.toLowerCase().replace(/\s/g, '-') || ''

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Resumen del sistema</h1>
        <p>Estado general de mantenimiento</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label-row accent-blue">
            <FolderOpen size={16} />
            <span className="stat-label">Tickets abiertos</span>
          </div>
          <div className="stat-value">{stats.openTicketsCount}</div>
          <div className="stat-change">Requieren atención</div>
        </div>

        <div className="stat-card">
          <div className="stat-label-row accent-green">
            <Banknote size={16} />
            <span className="stat-label">Gastado este mes</span>
          </div>
          <div className="stat-value">{formatCurrency(stats.monthlySpent)}</div>
          <div className="stat-change">En reparaciones</div>
        </div>

        <div className="stat-card">
          <div className="stat-label-row accent-amber">
            <Clock size={16} />
            <span className="stat-label">Pendientes verificación</span>
          </div>
          <div className="stat-value">{stats.pendingVerificationCount}</div>
          <div className="stat-change">Por confirmar</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Alertas</h2>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                <AlertTriangle size={18} />
                <div className="alert-content">
                  <p>{alert.message}</p>
                </div>
                <button className="alert-action" onClick={alert.actionFn}>
                  {alert.action} <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="recent-section">
        <div className="section-header">
          <h2>Tickets recientes</h2>
          <button className="btn-primary" onClick={() => onNavigate('new-ticket')}>
            <Plus size={16} /> Nuevo ticket
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <p>No hay tickets registrados aún</p>
            <button className="btn-secondary" onClick={() => onNavigate('new-ticket')}>
              Crear primer ticket
            </button>
          </div>
        ) : (
          <div className="tickets-list">
            {recentTickets.slice(0, 5).map(ticket => (
              <div
                key={ticket.id}
                className="ticket-item"
                onClick={() => onNavigate('ticket-detail', ticket.id)}
              >
                <div className="ticket-header">
                  <span className="ticket-unit">
                    {ticket.units?.unit_number || 'N/A'}
                    <span className="ticket-category">{ticket.category}</span>
                  </span>
                  <span className={`ticket-status ${statusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="ticket-description">
                  {ticket.description.length > 80
                    ? ticket.description.substring(0, 80) + '…'
                    : ticket.description}
                </p>
                <div className="ticket-footer">
                  <span className="ticket-date">{formatDate(ticket.report_date)}</span>
                  <span className="ticket-cost">
                    {formatCurrency(
                      (ticket.labor_cost || 0) +
                      (ticket.materials_cost || 0) +
                      (ticket.tax_amount || 0)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <button className="btn-secondary" onClick={loadDashboard}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>
    </div>
  )
}
