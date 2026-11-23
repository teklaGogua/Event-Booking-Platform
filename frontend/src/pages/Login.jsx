
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <section className="auth-visual">
        <div className="auth-brand">
          <Link to="/" className="auth-brand-name">
            EventHub
          </Link>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrapper">
          <div className="auth-tabs">
            <Link to="/login" className="auth-tab active">
              Log in
            </Link>
            <Link to="/register" className="auth-tab">
              Register
            </Link>
          </div>

          <div className="auth-heading">
            <h1>Welcome back</h1>
            <p>Enter your details to access your account.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <small>Use the email you registered with.</small>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">
            No account yet? <Link to="/register">Register</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
