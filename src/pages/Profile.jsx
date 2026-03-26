import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import './Profile.css'

const ranks = ['The Lost', 'The Wanderer', 'The Seeker', 'The Unshackled', 'The Duskbreaker']
const badges = ['🗝', '⚡', '🧠', '🔮', '💀', '🏛']

const mockStats = {
  runsTotal: 12, escapes: 7, winRate: 58,
  puzzlesSolved: 34, bestScore: 8200, bestTime: '04:12',
  xp: 3720, xpNext: 6000, rank: 2,
  roomsEscaped: 7, hintsUsed: 4,
  recentRuns: [
    { room: "The Warden's Study", status: 'escaped', pts: 8740, time: '06:32' },
    { room: "The Miller's Attic",  status: 'failed',  pts: 3120, time: '15:00' },
    { room: "The Warden's Study", status: 'escaped', pts: 6200, time: '09:14' },
  ]
}

export default function Profile() {
  const { user } = useAuth()
  const stats = mockStats
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Wanderer'
  const rankTitle = ranks[stats.rank]
  const xpPct = Math.round((stats.xp / stats.xpNext) * 100)

  return (
    <div className="profile-page noise-overlay">
      <div className="home-bg">
        <div className="bg-radial-glow" />
        <div className="vignette" />
      </div>

      {/* Header */}
      <motion.header
        className="settings-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="gm-back">← Duskbound</Link>
        <h1 className="settings-title-header">Adventurer's Logbook</h1>
        <div style={{ minWidth: 120 }} />
      </motion.header>

      <motion.div
        className="profile-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Left sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-ring">
              <span className="avatar-icon">🕵</span>
            </div>
          </div>
          <h2 className="profile-username">{username}</h2>
          <p className="profile-rank">{rankTitle}</p>

          {/* XP bar */}
          <div className="xp-bar-wrap">
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="xp-label">{stats.xp.toLocaleString()} / {stats.xpNext.toLocaleString()} XP · Next Rank</p>
          </div>

          <div className="profile-quick-stats">
            <div className="quick-stat"><span>Rooms escaped:</span><strong>{stats.roomsEscaped}</strong></div>
            <div className="quick-stat"><span>Best time:</span><strong>{stats.bestTime}</strong></div>
            <div className="quick-stat"><span>Hints used:</span><strong>{stats.hintsUsed}</strong></div>
            <div className="quick-stat"><span>Win rate:</span><strong>{stats.winRate}%</strong></div>
          </div>
        </aside>

        {/* Right panel */}
        <main className="profile-main">
          {/* Stats overview */}
          <p className="section-label">STATS OVERVIEW</p>
          <div className="stats-grid">
            <StatCard value={stats.runsTotal}  label="Runs total" />
            <StatCard value={stats.escapes}    label="Escapes" />
            <StatCard value={`${stats.winRate}%`} label="Win rate" />
            <StatCard value={stats.puzzlesSolved} label="Puzzles solved" />
            <StatCard value={`${(stats.bestScore/1000).toFixed(1)}k`} label="Best score" />
            <StatCard value={stats.bestTime}   label="Best time" />
          </div>

          {/* Badges */}
          <p className="section-label" style={{ marginTop: 28 }}>BADGES EARNED</p>
          <div className="badges-grid">
            {badges.map((b, i) => (
              <motion.div
                key={i}
                className="badge-item"
                whileHover={{ scale: 1.1, y: -2 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                {b}
              </motion.div>
            ))}
          </div>

          {/* Recent runs */}
          <p className="section-label" style={{ marginTop: 28 }}>RECENT RUNS</p>
          <div className="runs-list">
            {stats.recentRuns.map((run, i) => (
              <motion.div
                key={i}
                className="run-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
              >
                <span className="run-name">{run.room}</span>
                <span className={`badge ${run.status === 'escaped' ? 'badge-escaped' : 'badge-failed'}`}>
                  {run.status === 'escaped' ? 'ESCAPED' : 'FAILED'}
                </span>
                <span className="run-pts">{run.pts.toLocaleString()} pts — {run.time}</span>
              </motion.div>
            ))}
          </div>
        </main>
      </motion.div>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <motion.div
      className="stat-card"
      whileHover={{ borderColor: 'var(--border-gold)', y: -2 }}
    >
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </motion.div>
  )
}
