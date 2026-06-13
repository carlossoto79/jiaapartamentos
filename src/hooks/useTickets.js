import { useState, useEffect, useCallback } from 'react'
import { 
  getTickets, 
  getTicketById, 
  createTicket, 
  updateTicket,
  getRecentSimilarTickets,
  getUnitTickets 
} from '../lib/supabase'

export const useTickets = (initialFilters = {}) => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTickets = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await getTickets(filters || initialFilters)
      if (err) throw err
      setTickets(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [initialFilters])

  useEffect(() => {
    fetchTickets(initialFilters)
  }, [initialFilters, fetchTickets])

  const addTicket = async (ticketData) => {
    try {
      const { data, error: err } = await createTicket(ticketData)
      if (err) throw err
      setTickets([data, ...tickets])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateTicketData = async (ticketId, updates) => {
    try {
      const { data, error: err } = await updateTicket(ticketId, updates)
      if (err) throw err
      setTickets(tickets.map(t => t.id === ticketId ? data : t))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    addTicket,
    updateTicketData
  }
}

export const useTicketDetail = (ticketId) => {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ticketId) return

    const fetchTicket = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await getTicketById(ticketId)
        if (err) throw err
        setTicket(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [ticketId])

  const updateTicket = async (updates) => {
    try {
      const { data, error: err } = await updateTicket(ticketId, updates)
      if (err) throw err
      setTicket(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    ticket,
    loading,
    error,
    updateTicket
  }
}

export const useRecentSimilarTickets = (unitId, category) => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!unitId || !category) return

    const fetchSimilarTickets = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await getRecentSimilarTickets(unitId, category)
        if (err) throw err
        setTickets(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarTickets()
  }, [unitId, category])

  return { tickets, loading, error }
}

export const useUnitTickets = (unitId) => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!unitId) return

    const fetchTickets = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await getUnitTickets(unitId)
        if (err) throw err
        setTickets(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [unitId])

  return { tickets, loading, error }
}
