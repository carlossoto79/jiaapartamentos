import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}
