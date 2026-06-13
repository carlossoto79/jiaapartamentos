import { useState, useEffect } from 'react'
import { useUnits } from '../hooks/useUnits'
import { useRecentSimilarTickets } from '../hooks/useTickets'
import { createTicket } from '../lib/supabase'
import { formatDate, calculateTaxAmount } from '../lib/utils'
import {
  AlertCircle, Save, X,
  MapPin, Calendar, HardHat, DollarSign, StickyNote
} from 'lucide-react'
import '../styles/form.css'

const CATEGORIES = [
  'Plomería',
  'Eléctrico',
  'Electrodomésticos',
  'Aire Acondicionado/Calefacción',
  'Estructural',
  'Cerrajería',
  'Otro'
]

export default function NewTicket({ onNavigate, onSave }) {
  const { units, loading: unitsLoading } = useUnits()
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const { tickets: similarTickets } = useRecentSimilarTickets(selectedUnitId, selectedCategory)

  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    assigned_worker: '',
    work_description: '',
    completion_date: '',
    labor_cost: 0,
    materials_cost: 0,
    materials_description: '',
    tax_percentage: 19,
    is_deductible: true,
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setFormData(prev => ({ ...prev, category: selectedCategory }))
  }, [selectedCategory])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!selectedUnitId || !formData.description) {
      setError('Por favor completa los campos requeridos')
      return
    }

    setLoading(true)
    try {
      const ticketData = {
        unit_id: selectedUnitId,
        report_date: formData.report_date,
        category: formData.category,
        description: formData.description,
        status: 'Abierto',
        assigned_worker: formData.assigned_worker || null,
        work_description: formData.work_description || null,
        completion_date: formData.completion_date || null,
        labor_cost: parseFloat(formData.labor_cost) || 0,
        materials_cost: parseFloat(formData.materials_cost) || 0,
        materials_description: formData.materials_description || null,
        tax_percentage: formData.tax_percentage,
        tax_amount: calculateTaxAmount(
          parseFloat(formData.labor_cost) + parseFloat(formData.materials_cost),
          formData.tax_percentage
        ),
        is_deductible: formData.is_deductible,
        verification_status: 'No verificado',
        notes: formData.notes || null
      }

      const { data, error: err } = await createTicket(ticketData)
      if (err) throw err

      setSuccess(true)
      setTimeout(() => {
        onNavigate('dashboard')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Error al crear el ticket')
    } finally {
      setLoading(false)
    }
  }

  const selectedUnit = units.find(u => u.id === selectedUnitId)

  return (
    <div className="form-container">
      <div className="form-header">
        <div>
          <h1>Nuevo ticket de mantenimiento</h1>
          <p>Registra una reparación o incidencia</p>
        </div>
        <button className="btn-close" onClick={() => onNavigate('dashboard')} aria-label="Cerrar">
          <X size={22} />
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">¡Ticket creado exitosamente!</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="form-section-title"><MapPin size={18} /> Apartamento</h2>

          <div className="form-group">
            <label htmlFor="unit">Seleccionar apartamento <span className="required">*</span></label>
            <select
              id="unit"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              disabled={unitsLoading}
              required
            >
              <option value="">-- Selecciona un apartamento --</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_number} - {unit.building}, Piso {unit.floor}
                </option>
              ))}
            </select>
          </div>

          {selectedUnit && similarTickets.length > 0 && (
            <div className="alert alert-warning">
              <AlertCircle size={20} />
              <div>
                <strong>Historial del apartamento</strong>
                <p>
                  Se reportó un problema de {formData.category.toLowerCase()} en este apartamento hace{' '}
                  {Math.ceil(
                    (new Date() - new Date(similarTickets[0].report_date)) / (1000 * 60 * 60 * 24)
                  )}{' '}
                  días — marcado como {similarTickets[0].status.toLowerCase()}
                  {similarTickets[0].assigned_worker ? ` por ${similarTickets[0].assigned_worker}` : ''}.
                </p>
                <p className="smaller">Descripción anterior: "{similarTickets[0].description}"</p>
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 className="form-section-title"><Calendar size={18} /> Información del reporte</h2>

          <div className="form-group">
            <label htmlFor="report_date">Fecha de reporte <span className="required">*</span></label>
            <input
              id="report_date"
              type="date"
              name="report_date"
              value={formData.report_date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoría <span className="required">*</span></label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                handleInputChange(e)
              }}
              required
            >
              <option value="">-- Selecciona una categoría --</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción del problema <span className="required">*</span></label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe detalladamente qué se dañó y cómo se comporta..."
              required
              rows={4}
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title"><HardHat size={18} /> Detalles de la reparación</h2>

          <div className="form-group">
            <label htmlFor="assigned_worker">Trabajador asignado (opcional)</label>
            <input
              id="assigned_worker"
              type="text"
              name="assigned_worker"
              value={formData.assigned_worker}
              onChange={handleInputChange}
              placeholder="Nombre del trabajador"
            />
          </div>

          <div className="form-group">
            <label htmlFor="work_description">Qué se hizo exactamente (opcional)</label>
            <textarea
              id="work_description"
              name="work_description"
              value={formData.work_description}
              onChange={handleInputChange}
              placeholder="Ej: Cambié el empaque de la llave, cambié la llave completa, etc."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="completion_date">Fecha de finalización (opcional)</label>
            <input
              id="completion_date"
              type="date"
              name="completion_date"
              value={formData.completion_date}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title"><DollarSign size={18} /> Costos</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="labor_cost">Mano de obra (COP)</label>
              <input
                id="labor_cost"
                type="number"
                name="labor_cost"
                value={formData.labor_cost}
                onChange={handleInputChange}
                step="1000"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="materials_cost">Materiales (COP)</label>
              <input
                id="materials_cost"
                type="number"
                name="materials_cost"
                value={formData.materials_cost}
                onChange={handleInputChange}
                step="1000"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="materials_description">Descripción de materiales (opcional)</label>
            <input
              id="materials_description"
              type="text"
              name="materials_description"
              value={formData.materials_description}
              onChange={handleInputChange}
              placeholder="Ej: Empaque, llave de paso, etc."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tax_percentage">Impuesto (%)</label>
              <input
                id="tax_percentage"
                type="number"
                name="tax_percentage"
                value={formData.tax_percentage}
                onChange={handleInputChange}
                step="1"
                min="0"
                max="100"
              />
            </div>

            <div className="form-group checkbox-row">
              <label htmlFor="is_deductible">Deducible para impuestos</label>
              <input
                id="is_deductible"
                type="checkbox"
                name="is_deductible"
                checked={formData.is_deductible}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="cost-summary">
            <div className="cost-line">
              <span>Mano de obra:</span>
              <span>${Number(formData.labor_cost).toLocaleString('es-CO')}</span>
            </div>
            <div className="cost-line">
              <span>Materiales:</span>
              <span>${Number(formData.materials_cost).toLocaleString('es-CO')}</span>
            </div>
            <div className="cost-line">
              <span>Impuesto ({formData.tax_percentage}%):</span>
              <span>${Number(calculateTaxAmount(
                parseFloat(formData.labor_cost) + parseFloat(formData.materials_cost),
                formData.tax_percentage
              )).toLocaleString('es-CO')}</span>
            </div>
            <div className="cost-line total">
              <span>Total:</span>
              <span>${Number(
                parseFloat(formData.labor_cost) +
                parseFloat(formData.materials_cost) +
                calculateTaxAmount(
                  parseFloat(formData.labor_cost) + parseFloat(formData.materials_cost),
                  formData.tax_percentage
                )
              ).toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title"><StickyNote size={18} /> Notas internas (opcional)</h2>
          <div className="form-group">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Notas privadas sobre este ticket..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => onNavigate('dashboard')}>
            Cancelar
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            <Save size={18} /> {loading ? 'Creando...' : 'Crear ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}
