import { useState, useEffect } from 'react'
import { useUnits } from '../hooks/useUnits'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { X } from 'lucide-react'
import '../styles/registry.css'

export default function UnitRegistry({ onNavigate }) {
  const { units, loading: unitsLoading } = useUnits()
  const [unitStats, setUnitStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUnitStats()
  }, [units])

  const loadUnitStats = async () => {
    setLoading(true)
    try {
      const stats = {}
      
      for (const unit of units) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('labor_cost, materials_cost, tax_amount')
          .eq('unit_id', unit.id)
        
        const totalSpent = (tickets || []).reduce((sum, t) => 
          sum + (t.labor_cost || 0) + (t.materials_cost || 0) + (t.tax_amount || 0),
          0
        )

        const { count: ticketCount } = await supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('unit_id', unit.id)

        stats[unit.id] = {
          totalSpent,
          ticketCount: ticketCount || 0
        }
      }
      
      setUnitStats(stats)
    } catch (err) {
      console.error('Error loading unit stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUnits = units.filter(unit =>
    unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.building.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const averageSpent = filteredUnits.length > 0 
    ? filteredUnits.reduce((sum, unit) => sum + (unitStats[unit.id]?.totalSpent || 0), 0) / filteredUnits.length
    : 0

  if (loading || unitsLoading) {
    return <div className="loading">Cargando registro de unidades...</div>
  }

  return (
    <div className="registry-container">
      <div className="registry-header">
        <h1>📋 Registro de Unidades</h1>
        <button 
          className="btn-close"
          onClick={() => onNavigate('dashboard')}
        >
          <X size={24} />
        </button>
      </div>

      <div className="registry-search">
        <input
          type="text"
          placeholder="Buscar por unidad o edificio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="registry-stats">
        <div className="stat-badge">
          <span className="stat-label">Total de Unidades:</span>
          <span className="stat-value">{filteredUnits.length}</span>
        </div>
        <div className="stat-badge">
          <span className="stat-label">Gasto Promedio:</span>
          <span className="stat-value">{formatCurrency(averageSpent)}</span>
        </div>
      </div>

      {filteredUnits.length === 0 ? (
        <div className="empty-state">
          <p>No se encontraron unidades</p>
        </div>
      ) : (
        <div className="units-list">
          {filteredUnits.map(unit => {
            const stats = unitStats[unit.id] || { totalSpent: 0, ticketCount: 0 }
            const isHighCost = stats.totalSpent > averageSpent * 2 && averageSpent > 0

            return (
              <div 
                key={unit.id}
                className={`unit-card ${isHighCost ? 'high-cost' : ''}`}
              >
                <div className="unit-header">
                  <div className="unit-info">
                    <h3>{unit.unit_number}</h3>
                    <p className="unit-location">
                      {unit.building}, Piso {unit.floor}
                    </p>
                  </div>
                  <div className={`unit-cost-badge ${isHighCost ? 'warning' : 'normal'}`}>
                    {formatCurrency(stats.totalSpent)}
                  </div>
                </div>

                {unit.notes && (
                  <div className="unit-notes">
                    <strong>Notas:</strong> {unit.notes}
                  </div>
                )}

                <div className="unit-stats-row">
                  <div className="unit-stat">
                    <span className="label">Boletas:</span>
                    <span className="value">{stats.ticketCount}</span>
                  </div>
                  <div className="unit-stat">
                    <span className="label">Gasto Acumulado:</span>
                    <span className="value">{formatCurrency(stats.totalSpent)}</span>
                  </div>
                  {isHighCost && (
                    <div className="unit-stat warning">
                      <span className="label">⚠️ Costo Alto:</span>
                      <span className="value">Revisar problemas sistémicos</span>
                    </div>
                  )}
                </div>

                <button
                  className="btn-view-tickets"
                  onClick={() => onNavigate('dashboard')}
                >
                  Ver boletas de esta unidad →
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
