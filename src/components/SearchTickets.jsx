import { useState, useEffect } from 'react'
import { supabase, exportTicketsToCSV } from '../lib/supabase'
import { formatDate, formatCurrency, searchTickets } from '../lib/utils'
import { Search, Download, X } from 'lucide-react'
import '../styles/search.css'

const CATEGORIES = [
  'Plomería',
  'Eléctrico',
  'Electrodomésticos',
  'Aire Acondicionado/Calefacción',
  'Estructural',
  'Cerrajería',
  'Otro'
]

const STATUSES = ['Abierto', 'Asignado', 'Reparado', 'Verificado']

export default function SearchTickets({ onNavigate }) {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState({
    searchTerm: '',
    unit: '',
    dateFrom: '',
    dateTo: '',
    categories: [],
    statuses: [],
    minCost: '',
    maxCost: ''
  })

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('tickets')
        .select('*, units(*)')
        .order('report_date', { ascending: false })

      if (err) throw err
      setTickets(data || [])
      setFilteredTickets(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = tickets

    // Search term
    if (filters.searchTerm) {
      result = searchTickets(result, filters.searchTerm)
    }

    // Unit filter
    if (filters.unit) {
      result = result.filter(t => t.units?.unit_number.toLowerCase() === filters.unit.toLowerCase())
    }

    // Date range
    if (filters.dateFrom) {
      result = result.filter(t => new Date(t.report_date) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      result = result.filter(t => new Date(t.report_date) <= new Date(filters.dateTo))
    }

    // Categories
    if (filters.categories.length > 0) {
      result = result.filter(t => filters.categories.includes(t.category))
    }

    // Statuses
    if (filters.statuses.length > 0) {
      result = result.filter(t => filters.statuses.includes(t.status))
    }

    // Cost range
    const minCost = parseFloat(filters.minCost) || 0
    const maxCost = parseFloat(filters.maxCost) || Infinity
    result = result.filter(t => {
      const totalCost = (t.labor_cost || 0) + (t.materials_cost || 0) + (t.tax_amount || 0)
      return totalCost >= minCost && totalCost <= maxCost
    })

    setFilteredTickets(result)
  }

  useEffect(() => {
    applyFilters()
  }, [filters, tickets])

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const handleCategoryToggle = (category) => {
    setFilters(prev => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
      return { ...prev, categories }
    })
  }

  const handleStatusToggle = (status) => {
    setFilters(prev => {
      const statuses = prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
      return { ...prev, statuses }
    })
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      unit: '',
      dateFrom: '',
      dateTo: '',
      categories: [],
      statuses: [],
      minCost: '',
      maxCost: ''
    })
  }

  const handleExport = () => {
    if (filteredTickets.length === 0) {
      alert('No hay boletas para exportar')
      return
    }
    exportTicketsToCSV(filteredTickets)
  }

  const totalSpent = filteredTickets.reduce((sum, t) => 
    sum + (t.labor_cost || 0) + (t.materials_cost || 0) + (t.tax_amount || 0),
    0
  )

  if (loading) {
    return <div className="loading">Cargando boletas...</div>
  }

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>🔍 Buscar y Filtrar Boletas</h1>
        <button 
          className="btn-close"
          onClick={() => onNavigate('dashboard')}
        >
          <X size={24} />
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-filters">
        <div className="quick-search">
          <input
            type="text"
            placeholder="Unidad, descripción, trabajador..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="search-input"
          />
        </div>

        <details className="advanced-filters">
          <summary>📋 Filtros Avanzados</summary>

          <div className="filters-grid">
            <div className="filter-group">
              <label>Unidad</label>
              <input
                type="text"
                placeholder="Ej: 4B"
                value={filters.unit}
                onChange={(e) => handleFilterChange('unit', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Costo Mínimo (COP)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minCost}
                onChange={(e) => handleFilterChange('minCost', e.target.value)}
                step="10000"
              />
            </div>

            <div className="filter-group">
              <label>Costo Máximo (COP)</label>
              <input
                type="number"
                placeholder="∞"
                value={filters.maxCost}
                onChange={(e) => handleFilterChange('maxCost', e.target.value)}
                step="10000"
              />
            </div>
          </div>

          <div className="filter-section">
            <label>Categorías</label>
            <div className="checkbox-group">
              {CATEGORIES.map(cat => (
                <label key={cat} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>Estados</label>
            <div className="checkbox-group">
              {STATUSES.map(status => (
                <label key={status} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn-secondary">
              Limpiar filtros
            </button>
          </div>
        </details>
      </div>

      <div className="results-header">
        <div className="results-info">
          <p>
            <strong>Resultados:</strong> {filteredTickets.length} boleta{filteredTickets.length !== 1 ? 's' : ''}
          </p>
          <p>
            <strong>Gasto total:</strong> {formatCurrency(totalSpent)}
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-primary"
          disabled={filteredTickets.length === 0}
        >
          <Download size={18} /> Exportar a CSV
        </button>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <p>No se encontraron boletas con estos filtros</p>
          <button onClick={clearFilters} className="btn-secondary">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="tickets-table-container">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Mano de Obra</th>
                <th>Materiales</th>
                <th>Impuesto</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => {
                const totalCost = (ticket.labor_cost || 0) + (ticket.materials_cost || 0) + (ticket.tax_amount || 0)
                return (
                  <tr key={ticket.id}>
                    <td className="cell-unit">
                      <strong>{ticket.units?.unit_number}</strong>
                    </td>
                    <td className="cell-date">{formatDate(ticket.report_date)}</td>
                    <td className="cell-category">{ticket.category}</td>
                    <td className="cell-description">
                      {ticket.description.substring(0, 35)}...
                    </td>
                    <td className="cell-currency">{formatCurrency(ticket.labor_cost || 0)}</td>
                    <td className="cell-currency">{formatCurrency(ticket.materials_cost || 0)}</td>
                    <td className="cell-currency">{formatCurrency(ticket.tax_amount || 0)}</td>
                    <td className="cell-currency total">
                      <strong>{formatCurrency(totalCost)}</strong>
                    </td>
                    <td>
                      <span className={`status-badge status-${ticket.status.toLowerCase().replace(/\s/g, '-')}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onNavigate('ticket-detail', ticket.id)}
                        className="btn-view"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
