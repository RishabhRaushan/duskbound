import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import GameMenu from './pages/GameMenu'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import './styles/globals.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/login"      element={<AuthPage />} />
          <Route path="/game-menu"  element={<GameMenu />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="/profile"    element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
