import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import './HomePage.css'

const menuItems = [
  { label: 'New Game',  icon: '▶',  path: '/game-menu', primary: true  },
  { label: 'Continue',  icon: '◈',  path: '/game-menu', primary: false },
  { label: 'Settings',  icon: '⚙',  path: '/settings',  primary: false },
  { label: 'Profile',   icon: '◉',  path: '/profile',   primary: false },
]

const loreFragments = [
  '"The sun stopped setting the night Elara Voss lit the Hollow Lantern."',
  '"No one remembers when the fog first rolled in. It was always there."',
  '"Three keys. Three truths. One escape. Or so they say."',
  '"The Ferryman hasn\'t moved his boat in forty years. He\'s still waiting."',
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [loreIndex, setLoreIndex] = useState(0)
  const [showLore, setShowLore] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLore(false)
      setTimeout(() => {
        setLoreIndex(i => (i + 1) % loreFragments.length)
        setShowLore(true)
      }, 600)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const handleNav = (path) => {
    if (!user && path !== '/settings') {
      navigate('/login')
    } else {
      navigate(path)
    }
  }

  return (
    <div className="home-page noise-overlay">
      {/* Animated dusk background */}
      <div className="home-bg">
        <div className="bg-radial-glow" />
        <div className="fog-layer fog-1" />
        <div className="fog-layer fog-2" />
        <div className="fog-layer fog-3" />
        <div className="town-silhouette" />
        <div className="vignette" />
      </div>

      {/* Top bar */}
      <motion.div
        className="home-topbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <span className="topbar-lore">
          <span className="topbar-dot" />
          DUSKBOUND
        </span>
        {user && !user.isGuest && (
          <div className="topbar-user">
            <span className="topbar-username">{user.user_metadata?.username || user.email}</span>
            <button className="topbar-signout" onClick={signOut}>Sign Out</button>
          </div>
        )}
      </motion.div>

      {/* Main content */}
      <div className="home-content">

        {/* Logo block */}
        <motion.div
          className="home-logo-block"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.p
            className="home-eyebrow"
            initial={{ opacity: 0, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, letterSpacing: '0.5em' }}
            transition={{ delay: 0.6, duration: 1.2 }}
          >
            🕯 &nbsp; A &nbsp; P U Z Z L E &nbsp; A D V E N T U R E
          </motion.p>

          <motion.h1
            className="home-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            Dusk<span className="title-bound">bound</span>
          </motion.h1>

          <motion.p
            className="home-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            The sun stopped setting. Can you escape before it does?
          </motion.p>
        </motion.div>

        {/* Ornament */}
        <motion.div
          className="home-ornament"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <span className="ornament-line" />
          <span className="ornament-glyph">⬡</span>
          <span className="ornament-line" />
        </motion.div>

        {/* Menu */}
        <motion.nav
          className="home-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              className={`menu-btn ${item.primary ? 'menu-btn-primary' : ''} ${hoveredIndex === i ? 'menu-btn-hovered' : ''}`}
              onClick={() => handleNav(item.path)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7 + i * 0.08, duration: 0.5 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="menu-btn-icon">{item.icon}</span>
              <span className="menu-btn-label">{item.label}</span>
              {hoveredIndex === i && (
                <motion.span
                  className="menu-btn-arrow"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                >›</motion.span>
              )}
            </motion.button>
          ))}

          {!user && (
            <motion.button
              className="menu-btn menu-btn-ghost"
              onClick={() => navigate('/login')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.1, duration: 0.5 }}
            >
              <span className="menu-btn-icon">◎</span>
              <span className="menu-btn-label">Sign In / Register</span>
            </motion.button>
          )}
        </motion.nav>
      </div>

      {/* Lore fragment ticker */}
      <motion.div
        className="home-lore-ticker"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
      >
        <AnimatePresence mode="wait">
          {showLore && (
            <motion.p
              key={loreIndex}
              className="lore-text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
            >
              {loreFragments[loreIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom version bar */}
      <motion.div
        className="home-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6, duration: 0.8 }}
      >
        <span>v1.0.0 · DUSKBOUND · A PUZZLE ADVENTURE</span>
      </motion.div>
    </div>
  )
}
