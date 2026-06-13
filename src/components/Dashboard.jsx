import { useState, useEffect } from 'react'
import { getDashboardStats, supabase } from '../lib/supabase'
import { formatCurrency, formatDate, isTicketOverdue } from '../lib/utils'
import { AlertCircle, Plus, FileText } from 'lucide-react'
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
      
      // Get stats
      const statsData = await getDashboardStats()
      setStats(statsData)

      // Get recent tickets with alerts
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*, units(*)')
        .order('report_date', { ascending: false })
        .limit(10)

      setRecentTickets(tickets || [])

      // Generate alerts
      const newAlerts = []
      
      // Alert for overdue tickets
      const overdueTickets = (tickets || []).filter(t => 
        t.status === 'Abierto' && isTicketOverdue(t.report_date)
      )
      
      if (overdueTickets.length > 0) {
        newAlerts.push({
          id: 'overdue',
          type: 'warning',
          icon: '⏰',
          message: `${overdueTickets.length} boleta${overdueTickets.length > 1 ? 's' : ''} abiertas por más de 7 días`,
          action: 'Ver boletas',
          actionFn: () => onNavigate('search')
        })
      }

      // Alert for pending verification
      const pendingVerif = (tickets || []).filter(t => 
        t.verification_status === 'Pendiente inmobiliaria'
      )
      
      if (pendingVerif.length > 0) {
        newAlerts.push({
          id: 'pending-verification',
          type: 'info',
          icon: '📋',
          message: `${pendingVerif.length} boleta${pendingVerif.length > 1 ? 's' : ''} esperando confirmación de inmobiliaria`,
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
        <h1>📊 Resumen del Sistema</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Boletas Abiertas</div>
          <div className="stat-value">{stats.openTicketsCount}</div>
          <div className="stat-sublabel">Requieren atención</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Gastado Este Mes</div>
          <div className="stat-value">{formatCurrency(stats.monthlySpent)}</div>
          <div className="stat-sublabel">En reparaciones</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pendientes Verificación</div>
          <div className="stat-value">{stats.pendingVerificationCount}</div>
          <div className="stat-sublabel">Por confirmar</div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h2>⚠️ Alertas Recientes</h2>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                <span className="alert-icon">{alert.icon}</span>
                <div className="alert-content">
                  <p>{alert.message}</p>
                </div>
                <button 
                  className="alert-action"
                  onClick={alert.actionFn}
                >
                  {alert.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="btn-primary btn-large"
          onClick={() => onNavigate('new-ticket')}
        >
          <Plus size={20} /> Nueva Boleta
        </button>
      </div>

      {/* Recent Tickets */}
      <div className="recent-section">
        <h2>📋 Boletas Recientes</h2>
        {recentTickets.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No hay boletas registradas aún</p>
            <button 
              className="btn-secondary"
              onClick={() => onNavigate('new-ticket')}
            >
              Crear primera boleta
            </button>
          </div>
        ) : (
          <div className="tickets-list">
            {recentTickets.slice(0, 5).map(ticket => (
              <div 
                key={ticket.id} 
                className="ticket-summary"
                onClick={() => onNavigate('ticket-detail', ticket.id)}
              >
                <div className="ticket-unit">
                  <strong>{ticket.units?.unit_number || 'N/A'}</strong>
                  <span className="ticket-category">{ticket.category}</span>
                </div>
                <div className="ticket-info">
                  <p className="ticket-description">
                    {ticket.description.substring(0, 50)}...
                  </p>
                  <p className="ticket-date">{formatDate(ticket.report_date)}</p>
                </div>
                <div className={`ticket-status status-${ticket.status.toLowerCase().replace(/\s/g, '-')}`}>
                  {ticket.status}
                </div>
                <div className="ticket-cost">
                  {formatCurrency(
                    (ticket.labor_cost || 0) + 
                    (ticket.materials_cost || 0) + 
                    (ticket.tax_amount || 0)
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="dashboard-footer">
        <button 
          className="btn-secondary"
          onClick={loadDashboard}
        >
          🔄 Actualizar
        </button>
      </div>
    </div>
  )
}
