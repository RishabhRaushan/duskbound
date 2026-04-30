import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { GameProvider } from './lib/GameContext'
import ProtectedRoute from './lib/ProtectedRoute'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import GameMenu from './pages/GameMenu'
import GameRoom from './pages/GameRoom'
import EndScreen from './pages/EndScreen'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import './styles/globals.css'

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"      element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/game-menu" element={
              <ProtectedRoute><GameMenu /></ProtectedRoute>
            } />
            <Route path="/room/:roomId" element={
              <ProtectedRoute><GameRoom /></ProtectedRoute>
            } />
            <Route path="/end" element={
              <ProtectedRoute><EndScreen /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  )
}