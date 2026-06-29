import { useState, useEffect } from 'react'
import { useUnits } from '../hooks/useUnits'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { X, Plus, AlertTriangle, ArrowRight, Upload } from 'lucide-react'
import BulkImportUnits from './BulkImportUnits'
import '../styles/registry.css'

export default function UnitRegistry({ onNavigate }) {
  const { units, loading: unitsLoading, addUnit } = useUnits()
  const [unitStats, setUnitStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [formData, setFormData] = useState({
    unit_number: '',
    building: '',
    floor: '',
    notes: ''
  })
  const [formError, setFormError] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadUnitStats()
  }, [units])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'floor' ? parseInt(value) || '' : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.unit_number || !formData.building || formData.floor === '') {
      setFormError('Por favor completa los campos requeridos')
      return
    }

    setFormLoading(true)
    try {
      await addUnit({
        unit_number: formData.unit_number,
        building: formData.building,
        floor: parseInt(formData.floor),
        notes: formData.notes || null
      })
      setFormData({ unit_number: '', building: '', floor: '', notes: '' })
      setShowAddForm(false)
    } catch (err) {
      setFormError(err.message || 'Error al crear la unidad')
    } finally {
      setFormLoading(false)
    }
  }

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
    return <div className="loading">Cargando apartamentos...</div>
  }

  return (
    <div className="registry-container">
      <div className="registry-header">
        <h1>Apartamentos</h1>
        <button
          className="btn-secondary"
          onClick={() => setShowImport(true)}
          style={{ marginRight: '0.75rem' }}
        >
          <Upload size={18} /> Importar
        </button>
        <button
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ marginRight: '0.75rem' }}
        >
          <Plus size={18} /> Agregar Apartamento
        </button>
        <button
          className="btn-close"
          onClick={() => onNavigate('dashboard')}
        >
          <X size={22} />
        </button>
      </div>

      {showImport && (
        <BulkImportUnits
          onClose={() => setShowImport(false)}
          onImported={() => window.location.reload()}
        />
      )}

      {showAddForm && (
        <div className="add-unit-form-container">
          <h2>Agregar Nuevo Apartamento</h2>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleSubmit} className="add-unit-form">
            <div className="form-group">
              <label htmlFor="unit_number">Número de Apartamento *</label>
              <input
                id="unit_number"
                type="text"
                name="unit_number"
                value={formData.unit_number}
                onChange={handleInputChange}
                placeholder="Ej: 4B, 12A, 3-C"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="building">Edificio *</label>
              <input
                id="building"
                type="text"
                name="building"
                value={formData.building}
                onChange={handleInputChange}
                placeholder="Ej: Edificio Norte"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="floor">Piso *</label>
              <input
                id="floor"
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                placeholder="Ej: 4"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notas (opcional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Notas sobre el apartamento..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ unit_number: '', building: '', floor: '', notes: '' })
                  setFormError(null)
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={formLoading}
              >
                {formLoading ? 'Creando...' : 'Crear Apartamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="registry-search">
        <input
          type="text"
          placeholder="Buscar por apartamento o edificio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="registry-stats">
        <div className="stat-badge">
          <span className="stat-label">Total de Apartamentos:</span>
          <span className="stat-value">{filteredUnits.length}</span>
        </div>
        <div className="stat-badge">
          <span className="stat-label">Gasto Promedio:</span>
          <span className="stat-value">{formatCurrency(averageSpent)}</span>
        </div>
      </div>

      {filteredUnits.length === 0 ? (
        <div className="empty-state">
          <p>No se encontraron apartamentos</p>
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
                    <span className="label">Tickets:</span>
                    <span className="value">{stats.ticketCount}</span>
                  </div>
                  <div className="unit-stat">
                    <span className="label">Gasto Acumulado:</span>
                    <span className="value">{formatCurrency(stats.totalSpent)}</span>
                  </div>
                  {isHighCost && (
                    <div className="unit-stat warning">
                      <span className="label">
                        <AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                        Costo Alto:
                      </span>
                      <span className="value">Revisar problemas sistémicos</span>
                    </div>
                  )}
                </div>

                <button
                  className="btn-view-tickets"
                  onClick={() => onNavigate('unit-detail', unit)}
                >
                  Ver historial de este apartamento
                  <ArrowRight size={16} style={{ verticalAlign: '-3px', marginLeft: '4px' }} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
