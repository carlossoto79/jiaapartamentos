import { useState, useEffect, useCallback } from 'react'
import { getUnits, getUnitById, createUnit } from '../lib/supabase'

export const useUnits = () => {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUnits = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await getUnits()
      if (err) throw err
      setUnits(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  const addUnit = async (unitData) => {
    try {
      const { data, error: err } = await createUnit(unitData)
      if (err) throw err
      setUnits([...units, data])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    units,
    loading,
    error,
    fetchUnits,
    addUnit
  }
}

export const useUnitDetail = (unitId) => {
  const [unit, setUnit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!unitId) return

    const fetchUnit = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await getUnitById(unitId)
        if (err) throw err
        setUnit(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUnit()
  }, [unitId])

  return {
    unit,
    loading,
    error
  }
}
