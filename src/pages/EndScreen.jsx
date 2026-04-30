import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../lib/GameContext'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './EndScreen.css'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getRankTitle(score) {
  if (score >= 800) return { title: 'Duskbreaker', color: '#e04040' }
  if (score >= 600) return { title: 'The Unshackled', color: '#e0a040' }
  if (score >= 400) return { title: 'The Seeker', color: '#c9a84c' }
  if (score >= 200) return { title: 'The Wanderer', color: '#9a7a50' }
  return { title: 'The Lost', color: '#6b5238' }
}

export default function EndScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    status, score, hintsUsed, timeRemaining,
    solvedCount, totalPuzzles, room,
  } = useGame()

  const [leaderboard, setLeaderboard] = useState([])
  const [newBadges, setNewBadges] = useState([])
  const [playerRank, setPlayerRank] = useState(null)

  const escaped = status === 'escaped'
  const timeTaken = room ? (room.duration_min * 60) - timeRemaining : 0
  const { title: rankTitle, color: rankColor } = getRankTitle(score)

  useEffect(() => {
    if (!room) return
    fetchLeaderboard()
    checkBadges()
  }, [room])

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('scores')
      .select('points, time_taken, hints_used, profiles(username)')
      .eq('room_id', room?.id)
      .eq('escaped', true)
      .order('points', { ascending: false })
      .limit(5)
    if (data) setLeaderboard(data)
  }

  async function checkBadges() {
    if (!user || user.isGuest || !escaped) return
    const earned = []
    if (hintsUsed === 0) earned.push({ type: 'no_hints', name: 'Pure Mind', icon: '🧠', desc: 'Escaped without using any hints' })
    if (score >= 700) earned.push({ type: 'high_score', name: 'Sharp Eye', icon: '👁', desc: 'Scored 700+ points in one run' })
    if (timeTaken < 600) earned.push({ type: 'speed_run', name: 'Fog Dasher', icon: '⚡', desc: 'Escaped in under 10 minutes' })
    if (solvedCount === totalPuzzles) earned.push({ type: 'all_solved', name: 'The Unshackled', icon: '🗝', desc: 'Solved every puzzle in the room' })

    for (const badge of earned) {
      await supabase.from('badges').insert({
        user_id: user.id,
        badge_type: badge.type,
        badge_name: badge.name,
        description: badge.desc,
      }).select().single()
    }
    setNewBadges(earned)
  }

  if (!room) {
    return (
      <div className="end-screen noise-overlay">
        <div className="home-bg"><div className="bg-radial-glow"/><div className="vignette"/></div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', paddingTop: '40vh' }}>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            No active session found.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/')}>
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="end-screen noise-overlay">
      <div className="home-bg">
        <div className="bg-radial-glow" />
        <div className="fog-layer fog-1" />
        <div className="vignette" />
      </div>

      <div className="end-content">
        {/* Status banner */}
        <motion.div
          className={`end-banner ${escaped ? 'banner-escaped' : 'banner-failed'}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <span className="end-banner-icon">{escaped ? '🗝' : '💀'}</span>
          <div>
            <h1 className="end-banner-title">{escaped ? 'Escaped!' : 'The Fog Wins'}</h1>
            <p className="end-banner-sub">
              {escaped
                ? `You broke free from ${room.name}`
                : `${room.name} claimed another soul`}
            </p>
          </div>
        </motion.div>

        <div className="end-grid">
          {/* Score breakdown */}
          <motion.div
            className="end-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="end-card-title">Score Breakdown</h2>

            <div className="score-big">
              <span className="score-big-value">{score.toLocaleString()}</span>
              <span className="score-big-label">points</span>
            </div>

            <div className="score-breakdown">
              <div className="score-row">
                <span>Puzzles solved</span>
                <span>{solvedCount} / {totalPuzzles}</span>
              </div>
              <div className="score-row">
                <span>Time taken</span>
                <span>{formatTime(timeTaken)}</span>
              </div>
              <div className="score-row">
                <span>Hints used</span>
                <span className={hintsUsed > 0 ? 'score-penalty' : 'score-bonus'}>
                  {hintsUsed} {hintsUsed > 0 ? `(−${hintsUsed * 50} pts)` : '(no penalty)'}
                </span>
              </div>
              <div className="score-row score-row-rank">
                <span>Performance rank</span>
                <span style={{ color: rankColor, fontWeight: 600 }}>{rankTitle}</span>
              </div>
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div
            className="end-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="end-card-title">Badges Earned</h2>
            {newBadges.length === 0 ? (
              <p className="end-empty">No badges this run. Keep trying...</p>
            ) : (
              <div className="badge-list">
                {newBadges.map((badge, i) => (
                  <motion.div
                    key={badge.type}
                    className="badge-earned"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <span className="badge-icon">{badge.icon}</span>
                    <div>
                      <p className="badge-name">{badge.name}</p>
                      <p className="badge-desc">{badge.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            className="end-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="end-card-title">Leaderboard — {room.name}</h2>
            {leaderboard.length === 0 ? (
              <p className="end-empty">No scores yet. You're first!</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((entry, i) => (
                  <div key={i} className={`lb-row ${i === 0 ? 'lb-first' : ''}`}>
                    <span className="lb-rank">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span className="lb-name">{entry.profiles?.username || 'Unknown'}</span>
                    <span className="lb-pts">{entry.points.toLocaleString()} pts</span>
                    <span className="lb-time">{formatTime(entry.time_taken)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          className="end-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button className="btn" onClick={() => navigate(`/room/${room.id}`)}>
            ↺ &nbsp; Try Again
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/game-menu')}>
            ▶ &nbsp; Choose Another Room
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/profile')}>
            ◉ &nbsp; View Profile
          </button>
        </motion.div>

        {/* Lore fragment */}
        <motion.p
          className="end-lore"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {escaped
            ? '"One lock opened. The town still holds its secrets. Keep searching."'
            : '"The fog remembers every soul it swallows. Will you be remembered?"'}
        </motion.p>
      </div>
    </div>
  )
}
