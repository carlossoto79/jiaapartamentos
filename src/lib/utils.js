// Format currency in Colombian pesos
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

// Format date to DD/MM/AAAA
export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Parse date from DD/MM/AAAA to YYYY-MM-DD
export const parseDate = (dateString) => {
  if (!dateString) return ''
  const [day, month, year] = dateString.split('/')
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Get days ago from date
export const getDaysAgo = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = Math.abs(today - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Get month name in Spanish
export const getMonthName = (monthIndex) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[monthIndex] || ''
}

// Calculate total cost
export const calculateTotalCost = (laborCost, materialsCost, taxAmount) => {
  return (laborCost || 0) + (materialsCost || 0) + (taxAmount || 0)
}

// Calculate tax amount
export const calculateTaxAmount = (baseAmount, taxPercentage = 19) => {
  return Math.round(baseAmount * (taxPercentage / 100))
}

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Check if ticket is overdue (open for more than 7 days)
export const isTicketOverdue = (reportDate) => {
  const daysAgo = getDaysAgo(reportDate)
  return daysAgo > 7
}

// Get status color/badge
export const getStatusColor = (status) => {
  const colors = {
    'Abierto': '#ef4444',
    'Asignado': '#f97316',
    'Reparado': '#eab308',
    'Verificado': '#22c55e'
  }
  return colors[status] || '#6b7280'
}

// Get verification status color
export const getVerificationColor = (status) => {
  const colors = {
    'No verificado': '#ef4444',
    'Pendiente inmobiliaria': '#f97316',
    'Verificado': '#22c55e'
  }
  return colors[status] || '#6b7280'
}

// Truncate text
export const truncateText = (text, length = 50) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Search/filter helper
export const searchTickets = (tickets, searchTerm) => {
  if (!searchTerm.trim()) return tickets
  
  const term = searchTerm.toLowerCase()
  return tickets.filter(t => 
    (t.units?.unit_number || '').toLowerCase().includes(term) ||
    (t.description || '').toLowerCase().includes(term) ||
    (t.assigned_worker || '').toLowerCase().includes(term) ||
    (t.category || '').toLowerCase().includes(term)
  )
}

// Export ticket data as JSON (for backup)
export const exportTicketsAsJSON = (tickets) => {
  const dataStr = JSON.stringify(tickets, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `boletas-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  window.URL.revokeObjectURL(url)
}
