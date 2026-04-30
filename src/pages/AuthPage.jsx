import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import './AuthPage.css'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', username: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, continueAsGuest } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(form.email, form.password)
        if (error) throw error
        navigate('/')
      } else {
        if (form.password !== form.confirm) throw new Error('Passwords do not match.')
        if (form.username.length < 3) throw new Error('Username must be at least 3 characters.')
        const { error } = await signUp(form.email, form.password, form.username)
        if (error) throw error
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page noise-overlay">
      <div className="home-bg">
        <div className="bg-radial-glow" />
        <div className="fog-layer fog-1" />
        <div className="fog-layer fog-2" />
        <div className="vignette" />
      </div>

      {/* Back button */}
      <motion.div
        className="auth-back"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link to="/" className="back-link">← Return to Duskbound</Link>
      </motion.div>

      <div className="auth-container">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header */}
          <div className="auth-header">
            <p className="auth-eyebrow">🕯 DUSKBOUND</p>
            <h2 className="auth-title">
              {mode === 'login' ? 'Welcome Back' : 'Join the Hunt'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'The town remembers you.'
                : 'The fog awaits a new soul.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError('') }}
            >Sign In</button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError('') }}
            >Register</button>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              className="auth-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: mode === 'login' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Hunter's Name</label>
                  <input
                    className="input"
                    type="text"
                    name="username"
                    placeholder="e.g. RavenSeeker"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="input"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="input"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    className="input"
                    type="password"
                    name="confirm"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {error && (
                <motion.div
                  className="auth-error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  ⚠ {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? 'Entering the fog...' : mode === 'login' ? '▶ Enter Duskbound' : '▶ Begin Your Escape'}
              </button>
            </motion.form>
          </AnimatePresence>

        </motion.div>
      </div>

      <div className="auth-footer">
        <span>v1.0.0 · DUSKBOUND</span>
      </div>
    </div>
  )
}
