import { useState } from 'react'
import { signInWithMagicLink } from '../lib/supabase'
import { validateEmail } from '../lib/utils'
import { Mail } from 'lucide-react'
import '../styles/auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validateEmail(email)) {
      setError('Por favor ingresa un correo electrónico válido')
      return
    }

    setLoading(true)
    try {
      const { error: err } = await signInWithMagicLink(email)
      if (err) throw err
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Error al enviar el enlace de inicio de sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>MANTENIMIENTO INMUEBLES</h1>
          <p>Sistema de Seguimiento JIA Apartamentos</p>
        </div>

        {submitted ? (
          <div className="auth-success">
            <Mail size={48} className="icon-large" />
            <h2>¡Enlace enviado!</h2>
            <p>Hemos enviado un enlace de inicio de sesión a:</p>
            <p className="email">{email}</p>
            <p className="info">Abre tu correo y haz clic en el enlace para acceder al sistema.</p>
            <button
              onClick={() => {
                setSubmitted(false)
                setEmail('')
              }}
              className="btn-secondary"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@ejemplo.com"
                disabled={loading}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Enviando...' : 'Enviar enlace mágico'}
            </button>

            <p className="info-text">
              Te enviaremos un enlace seguro para iniciar sesión. No necesitas contraseña.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
