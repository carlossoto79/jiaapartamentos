import { useState, useEffect } from 'react'
import { useTicketDetail } from '../hooks/useTickets'
import { updateTicket, uploadTicketPhoto, uploadTicketReceipt, deleteAttachment } from '../lib/supabase'
import { formatDate, calculateTaxAmount, formatCurrency } from '../lib/utils'
import { Upload, X, Save, Download } from 'lucide-react'
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

const STATUSES = ['Abierto', 'Asignado', 'Reparado', 'Verificado']
const VERIFICATION_STATUSES = ['No verificado', 'Pendiente inmobiliaria', 'Verificado']

export default function TicketDetail({ ticketId, onNavigate }) {
  const { ticket, loading, error: loadError, updateTicket: updateTicketData } = useTicketDetail(ticketId)
  const [formData, setFormData] = useState({})
  const [loading2, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    if (ticket) {
      setFormData(ticket)
      setAttachments(ticket.ticket_attachments || [])
    }
  }, [ticket])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    // Recalculate tax if labor or materials cost changed
    let newFormData = {
      ...formData,
      [name]: newValue
    }

    if (name === 'labor_cost' || name === 'materials_cost' || name === 'tax_percentage') {
      const baseAmount = (parseFloat(newFormData.labor_cost) || 0) + 
                        (parseFloat(newFormData.materials_cost) || 0)
      newFormData.tax_amount = calculateTaxAmount(baseAmount, newFormData.tax_percentage || 19)
    }

    setFormData(newFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const updates = {
        status: formData.status,
        assigned_worker: formData.assigned_worker,
        work_description: formData.work_description,
        completion_date: formData.completion_date,
        labor_cost: parseFloat(formData.labor_cost) || 0,
        materials_cost: parseFloat(formData.materials_cost) || 0,
        materials_description: formData.materials_description,
        tax_percentage: formData.tax_percentage,
        tax_amount: formData.tax_amount,
        is_deductible: formData.is_deductible,
        verification_status: formData.verification_status,
        verification_date: formData.verification_date,
        notes: formData.notes,
        description: formData.description,
        category: formData.category
      }

      await updateTicketData(updates)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Error al actualizar la boleta')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e, photoType) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const { data, error: err } = await uploadTicketPhoto(ticketId, file, photoType)
      if (err) throw err
      setAttachments([...attachments, data])
    } catch (err) {
      setError(err.message || 'Error al subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingReceipt(true)
    try {
      const { data, error: err } = await uploadTicketReceipt(ticketId, file)
      if (err) throw err
      setAttachments([...attachments, data])
    } catch (err) {
      setError(err.message || 'Error al subir el recibo')
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const { error: err } = await deleteAttachment(attachmentId)
      if (err) throw err
      setAttachments(attachments.filter(a => a.id !== attachmentId))
    } catch (err) {
      setError(err.message || 'Error al eliminar el archivo')
    }
  }

  if (loading) {
    return <div className="loading">Cargando boleta...</div>
  }

  if (loadError || !ticket) {
    return (
      <div className="form-container">
        <div className="alert alert-error">
          {loadError || 'Boleta no encontrada'}
        </div>
        <button onClick={() => onNavigate('dashboard')}>Volver al Dashboard</button>
      </div>
    )
  }

  const totalCost = (formData.labor_cost || 0) + (formData.materials_cost || 0) + (formData.tax_amount || 0)

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>📋 Boleta #{ticket.id.slice(0, 8)}</h1>
        <button 
          className="btn-close"
          onClick={() => onNavigate('dashboard')}
        >
          <X size={24} />
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">¡Cambios guardados exitosamente!</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>📍 Información de la Unidad</h2>
          <div className="info-display">
            <p><strong>Unidad:</strong> {ticket.units?.unit_number} - {ticket.units?.building}, Piso {ticket.units?.floor}</p>
            <p><strong>Reportada:</strong> {formatDate(ticket.report_date)}</p>
          </div>
        </div>

        <div className="form-section">
          <h2>📝 Problema Reportado</h2>

          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleInputChange}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>👷 Detalles de la Reparación</h2>

          <div className="form-group">
            <label htmlFor="status">Estado *</label>
            <select
              id="status"
              name="status"
              value={formData.status || ''}
              onChange={handleInputChange}
            >
              {STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="assigned_worker">Trabajador Asignado</label>
            <input
              id="assigned_worker"
              type="text"
              name="assigned_worker"
              value={formData.assigned_worker || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="work_description">Qué se hizo exactamente</label>
            <textarea
              id="work_description"
              name="work_description"
              value={formData.work_description || ''}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="completion_date">Fecha de Finalización</label>
            <input
              id="completion_date"
              type="date"
              name="completion_date"
              value={formData.completion_date || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>💰 Costos</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="labor_cost">Mano de Obra (COP)</label>
              <input
                id="labor_cost"
                type="number"
                name="labor_cost"
                value={formData.labor_cost || 0}
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
                value={formData.materials_cost || 0}
                onChange={handleInputChange}
                step="1000"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="materials_description">Descripción de Materiales</label>
            <input
              id="materials_description"
              type="text"
              name="materials_description"
              value={formData.materials_description || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tax_percentage">Impuesto (%)</label>
              <input
                id="tax_percentage"
                type="number"
                name="tax_percentage"
                value={formData.tax_percentage || 19}
                onChange={handleInputChange}
                step="1"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="is_deductible">Deducible</label>
              <input
                id="is_deductible"
                type="checkbox"
                name="is_deductible"
                checked={formData.is_deductible || false}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="cost-summary">
            <div className="cost-line">
              <span>Mano de obra:</span>
              <span>{formatCurrency(formData.labor_cost || 0)}</span>
            </div>
            <div className="cost-line">
              <span>Materiales:</span>
              <span>{formatCurrency(formData.materials_cost || 0)}</span>
            </div>
            <div className="cost-line">
              <span>Impuesto:</span>
              <span>{formatCurrency(formData.tax_amount || 0)}</span>
            </div>
            <div className="cost-line total">
              <span><strong>Total:</strong></span>
              <span><strong>{formatCurrency(totalCost)}</strong></span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>✅ Verificación</h2>

          <div className="form-group">
            <label htmlFor="verification_status">Estado de Verificación</label>
            <select
              id="verification_status"
              name="verification_status"
              value={formData.verification_status || ''}
              onChange={handleInputChange}
            >
              {VERIFICATION_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="verification_date">Fecha de Verificación</label>
            <input
              id="verification_date"
              type="date"
              name="verification_date"
              value={formData.verification_date || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>📸 Fotos</h2>
          <div className="attachments-section">
            <div className="attachment-upload">
              <label htmlFor="photo_before">
                <input
                  id="photo_before"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'before')}
                  disabled={uploadingPhoto}
                  style={{ display: 'none' }}
                />
                <span className="upload-btn">+ Agregar foto "Antes"</span>
              </label>
            </div>

            <div className="attachment-upload">
              <label htmlFor="photo_after">
                <input
                  id="photo_after"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'after')}
                  disabled={uploadingPhoto}
                  style={{ display: 'none' }}
                />
                <span className="upload-btn">+ Agregar foto "Después"</span>
              </label>
            </div>
          </div>

          {attachments.filter(a => a.type === 'foto').length > 0 && (
            <div className="attachments-list">
              {attachments.filter(a => a.type === 'foto').map(att => (
                <div key={att.id} className="attachment-item">
                  <span>{att.description}</span>
                  <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="attachment-link">
                    <Download size={16} /> Ver
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="btn-delete"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>🧾 Recibos / Facturas</h2>
          <div className="attachments-section">
            <div className="attachment-upload">
              <label htmlFor="receipt">
                <input
                  id="receipt"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleReceiptUpload}
                  disabled={uploadingReceipt}
                  style={{ display: 'none' }}
                />
                <span className="upload-btn">+ Agregar recibo/factura</span>
              </label>
            </div>
          </div>

          {attachments.filter(a => a.type === 'recibo').length > 0 && (
            <div className="attachments-list">
              {attachments.filter(a => a.type === 'recibo').map(att => (
                <div key={att.id} className="attachment-item">
                  <span>{att.description}</span>
                  <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="attachment-link">
                    <Download size={16} /> Ver
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="btn-delete"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>📝 Notas Internas</h2>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigate('dashboard')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading2}
          >
            <Save size={20} /> {loading2 ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
