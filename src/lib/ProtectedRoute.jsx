import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080604',
        fontFamily: 'serif',
        color: '#c9a84c',
        fontSize: '1.2rem',
        fontStyle: 'italic',
        letterSpacing: '0.1em'
      }}>
        The fog stirs...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}