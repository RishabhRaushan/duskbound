import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import './GameMenu.css'

const rooms = [
  {
    id: 'wardens-study',
    name: "The Warden's Study",
    location: 'Old Town Prison',
    description: 'Yellowed confessions line the walls. The warden left in a hurry — or was dragged out.',
    difficulty: 'Novice',
    difficultyLevel: 1,
    duration: '15–25 min',
    puzzles: 6,
    unlocked: true,
    icon: '🗝',
    tag: 'STARTER',
  },
  {
    id: 'millers-attic',
    name: "The Miller's Attic",
    location: 'Abandoned Mill',
    description: 'The machinery still groans at midnight. What is it still grinding after all these years?',
    difficulty: 'Seeker',
    difficultyLevel: 2,
    duration: '20–35 min',
    puzzles: 8,
    unlocked: true,
    icon: '⚙',
    tag: null,
  },
  {
    id: 'apothecary',
    name: "The Apothecary's Secret",
    location: 'Cursed Medicine Shop',
    description: 'Every bottle is labeled. Every label is a lie. The cure and the poison look identical.',
    difficulty: 'Seeker',
    difficultyLevel: 2,
    duration: '25–40 min',
    puzzles: 9,
    unlocked: true,
    icon: '⚗',
    tag: null,
  },
  {
    id: 'bell-tower',
    name: 'The Bell Tower',
    location: 'Church at Town Centre',
    description: 'The bells rang the night the curse began. They haven\'t stopped since. Neither has the clock.',
    difficulty: 'Unshackled',
    difficultyLevel: 3,
    duration: '30–45 min',
    puzzles: 11,
    unlocked: false,
    icon: '🔔',
    tag: 'LOCKED',
  },
  {
    id: 'hollow-crypt',
    name: 'The Hollow Crypt',
    location: 'Cemetery Underground',
    description: 'The dead of Duskbound don\'t rest. They wait. And they have questions for the living.',
    difficulty: 'Duskbreaker',
    difficultyLevel: 4,
    duration: '40–60 min',
    puzzles: 14,
    unlocked: false,
    icon: '💀',
    tag: 'LOCKED',
  },
  {
    id: 'ferrymen-dock',
    name: "The Ferryman's Dock",
    location: 'Foggy Riverside',
    description: 'One boat. One way out. The Ferryman will take you — if you can tell him why you deserve to leave.',
    difficulty: 'Duskbreaker',
    difficultyLevel: 4,
    duration: '45–70 min',
    puzzles: 16,
    unlocked: false,
    icon: '⚓',
    tag: 'LOCKED',
  },
]

const difficultyColors = {
  'Novice':      '#4a9e6a',
  'Seeker':      '#c9a84c',
  'Unshackled':  '#b06030',
  'Duskbreaker': '#9e4a4a',
}

export default function GameMenu() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)

  const handlePlay = (room) => {
    if (!room.unlocked) return
    navigate(`/room/${room.id}`)
  }

  return (
    <div className="game-menu-page noise-overlay">
      <div className="home-bg">
        <div className="bg-radial-glow" />
        <div className="fog-layer fog-1" />
        <div className="vignette" />
      </div>

      {/* Header */}
      <motion.header
        className="gm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/" className="gm-back">← Duskbound</Link>
        <div className="gm-header-center">
          <h1 className="gm-title">Choose Your Room</h1>
          <p className="gm-subtitle">Six locations. One cursed town. No guarantees.</p>
        </div>
        <div className="gm-header-right">
          <Link to="/profile" className="gm-profile-link">
            <span className="gm-avatar">◉</span>
            <span>{user?.user_metadata?.username || user?.email?.split('@')[0] || 'Wanderer'}</span>
          </Link>
        </div>
      </motion.header>

      {/* Rooms grid */}
      <div className="gm-content">
        <div className="gm-rooms-grid">
          {rooms.map((room, i) => (
            <motion.div
              key={room.id}
              className={`room-card ${!room.unlocked ? 'room-locked' : ''} ${selected?.id === room.id ? 'room-selected' : ''}`}
              onClick={() => room.unlocked && setSelected(room === selected ? null : room)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={room.unlocked ? { y: -3 } : {}}
            >
              {/* Card top */}
              <div className="room-card-top">
                <div className="room-icon">{room.icon}</div>
                <div className="room-meta">
                  {room.tag && (
                    <span className={`room-tag ${room.tag === 'LOCKED' ? 'tag-locked' : 'tag-starter'}`}>
                      {room.tag === 'LOCKED' ? '🔒 ' : '⭐ '}{room.tag}
                    </span>
                  )}
                  <span
                    className="room-difficulty"
                    style={{ color: difficultyColors[room.difficulty] }}
                  >
                    {room.difficulty}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="room-card-body">
                <h3 className="room-name">{room.name}</h3>
                <p className="room-location">📍 {room.location}</p>
                <p className="room-description">{room.description}</p>
              </div>

              {/* Card footer */}
              <div className="room-card-footer">
                <span className="room-stat">⏱ {room.duration}</span>
                <span className="room-stat">🧩 {room.puzzles} puzzles</span>
                {room.unlocked ? (
                  <button
                    className="room-play-btn"
                    onClick={(e) => { e.stopPropagation(); handlePlay(room) }}
                  >
                    Enter ›
                  </button>
                ) : (
                  <span className="room-locked-label">Complete previous rooms to unlock</span>
                )}
              </div>

              {/* Lock overlay */}
              {!room.unlocked && <div className="room-lock-overlay" />}
            </motion.div>
          ))}
        </div>

        {/* Lore note */}
        <motion.p
          className="gm-lore-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          "Each room unlocks a fragment of Duskbound's truth. Escape them all to break the curse."
        </motion.p>
      </div>

      <div className="home-footer">
        <span>v1.0.0 · DUSKBOUND</span>
      </div>
    </div>
  )
}
