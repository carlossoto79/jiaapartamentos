import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Auth functions
export const signInWithMagicLink = async (email) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Unit functions
export const getUnits = async () => {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('building', { ascending: true })
    .order('floor', { ascending: true })
  return { data, error }
}

export const getUnitById = async (unitId) => {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()
  return { data, error }
}

export const createUnit = async (unit) => {
  const { data, error } = await supabase
    .from('units')
    .insert([unit])
    .select()
    .single()
  return { data, error }
}

// Ticket functions
export const getTickets = async (filters = {}) => {
  let query = supabase.from('tickets').select('*, units(*)')
  
  if (filters.unitId) {
    query = query.eq('unit_id', filters.unitId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  if (filters.startDate) {
    query = query.gte('report_date', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('report_date', filters.endDate)
  }
  if (filters.minCost !== undefined) {
    query = query.gte('labor_cost', filters.minCost)
  }
  if (filters.maxCost !== undefined) {
    query = query.lte('labor_cost', filters.maxCost)
  }
  
  const { data, error } = await query.order('report_date', { ascending: false })
  return { data, error }
}

export const getTicketById = async (ticketId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, units(*), ticket_attachments(*)')
    .eq('id', ticketId)
    .single()
  return { data, error }
}

export const createTicket = async (ticket) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select()
    .single()
  return { data, error }
}

export const updateTicket = async (ticketId, updates) => {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single()
  return { data, error }
}

export const deleteTicket = async (ticketId) => {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
  return { error }
}

// Get tickets for a unit with the same category in the last 6 months
export const getRecentSimilarTickets = async (unitId, category, days = 180) => {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - days)
  
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('unit_id', unitId)
    .eq('category', category)
    .gte('report_date', sixMonthsAgo.toISOString().split('T')[0])
    .order('report_date', { ascending: false })
  
  return { data, error }
}

// Get all tickets for a unit
export const getUnitTickets = async (unitId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('unit_id', unitId)
    .order('report_date', { ascending: false })
  
  return { data, error }
}

// Dashboard stats
export const getDashboardStats = async () => {
  // Open tickets
  const { data: openTickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('status', 'Abierto')
  
  // This month's spending
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  
  const { data: monthlyTickets } = await supabase
    .from('tickets')
    .select('labor_cost, materials_cost, tax_amount')
    .gte('report_date', firstDay)
  
  const monthlySpent = (monthlyTickets || []).reduce(
    (sum, t) => sum + (t.labor_cost || 0) + (t.materials_cost || 0) + (t.tax_amount || 0),
    0
  )
  
  // Pending verification
  const { data: pendingVerification } = await supabase
    .from('tickets')
    .select('id')
    .neq('verification_status', 'Verificado')
  
  return {
    openTicketsCount: openTickets?.length || 0,
    monthlySpent,
    pendingVerificationCount: pendingVerification?.length || 0
  }
}

// File upload functions
export const uploadTicketPhoto = async (ticketId, file, type = 'before') => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${ticketId}-${type}-${Date.now()}.${fileExt}`
  const filePath = `${ticketId}/${fileName}`
  
  const { data, error: uploadError } = await supabase.storage
    .from('maintenance-photos')
    .upload(filePath, file)
  
  if (uploadError) return { data: null, error: uploadError }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('maintenance-photos')
    .getPublicUrl(filePath)
  
  // Save to database
  const { data: attachmentData, error: dbError } = await supabase
    .from('ticket_attachments')
    .insert([{
      ticket_id: ticketId,
      type: 'foto',
      file_url: urlData.publicUrl,
      description: `Foto ${type === 'before' ? 'antes' : 'después'}`
    }])
    .select()
    .single()
  
  return { data: attachmentData, error: dbError }
}

export const uploadTicketReceipt = async (ticketId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${ticketId}-receipt-${Date.now()}.${fileExt}`
  const filePath = `${ticketId}/${fileName}`
  
  const { data, error: uploadError } = await supabase.storage
    .from('maintenance-receipts')
    .upload(filePath, file)
  
  if (uploadError) return { data: null, error: uploadError }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('maintenance-receipts')
    .getPublicUrl(filePath)
  
  // Save to database
  const { data: attachmentData, error: dbError } = await supabase
    .from('ticket_attachments')
    .insert([{
      ticket_id: ticketId,
      type: 'recibo',
      file_url: urlData.publicUrl,
      description: 'Recibo/Factura'
    }])
    .select()
    .single()
  
  return { data: attachmentData, error: dbError }
}

export const deleteAttachment = async (attachmentId) => {
  const { error } = await supabase
    .from('ticket_attachments')
    .delete()
    .eq('id', attachmentId)
  return { error }
}

// Utility for exporting tickets to CSV
export const exportTicketsToCSV = (tickets) => {
  const headers = ['Unidad', 'Fecha', 'Categoría', 'Descripción', 'Mano de Obra', 'Materiales', 'Impuesto', 'Total']
  
  const rows = tickets.map(t => [
    t.units?.unit_number || 'N/A',
    t.report_date,
    t.category,
    t.description,
    t.labor_cost.toFixed(2),
    t.materials_cost.toFixed(2),
    t.tax_amount.toFixed(2),
    (t.labor_cost + t.materials_cost + t.tax_amount).toFixed(2)
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `boletas-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}
