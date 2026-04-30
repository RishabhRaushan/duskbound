import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../lib/GameContext'
import './GameHUD.css'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function GameHUD({ onQuit }) {
  const {
    timeRemaining, score, hintsUsed, progress,
    solvedCount, totalPuzzles, inventory,
    useHint, useItem, activePuzzleId, room, HINT_COST,
  } = useGame()

  const [showInventory, setShowInventory] = useState(false)
  const [showHintConfirm, setShowHintConfirm] = useState(false)

  const isLow = timeRemaining < 300
  const isCritical = timeRemaining < 60

  const handleHint = () => {
    setShowHintConfirm(true)
  }

  const confirmHint = () => {
    useHint()
    setShowHintConfirm(false)
  }

  return (
    <>
      <div className={`hud ${isCritical ? 'hud-critical' : isLow ? 'hud-low' : ''}`}>

        {/* Left — Room name + progress */}
        <div className="hud-left">
          <p className="hud-room-name">{room?.name || 'The Warden\'s Study'}</p>
          <div className="hud-progress-wrap">
            <div className="hud-progress-bar">
              <motion.div
                className="hud-progress-fill"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="hud-progress-label">{solvedCount}/{totalPuzzles} puzzles</span>
          </div>
        </div>

        {/* Center — Timer */}
        <div className="hud-center">
          <motion.div
            className={`hud-timer ${isCritical ? 'timer-critical' : isLow ? 'timer-low' : ''}`}
            animate={isCritical ? { scale: [1, 1.03, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <span className="timer-icon">⏳</span>
            <span className="timer-value">{formatTime(timeRemaining)}</span>
          </motion.div>
          {isCritical && (
            <p className="hud-warning">Time is running out!</p>
          )}
        </div>

        {/* Right — Score, hints, inventory, quit */}
        <div className="hud-right">
          <div className="hud-score">
            <span className="hud-score-label">Score</span>
            <span className="hud-score-value">{score.toLocaleString()}</span>
          </div>

          <div className="hud-actions">
            <button
              className="hud-btn hud-hint-btn"
              onClick={handleHint}
              title={`Use hint (−${HINT_COST} pts)`}
            >
              💡 Hint
            </button>

            <button
              className={`hud-btn hud-inv-btn ${inventory.length > 0 ? 'has-items' : ''}`}
              onClick={() => setShowInventory(v => !v)}
              title="Inventory"
            >
              🎒 <span className="inv-count">{inventory.length}</span>
            </button>

            <button className="hud-btn hud-quit-btn" onClick={onQuit} title="Quit room">
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Inventory panel */}
      <AnimatePresence>
        {showInventory && (
          <motion.div
            className="inventory-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="inv-header">
              <span className="inv-title">🎒 Inventory</span>
              <button className="inv-close" onClick={() => setShowInventory(false)}>✕</button>
            </div>
            {inventory.length === 0 ? (
              <p className="inv-empty">Nothing collected yet. Explore the room.</p>
            ) : (
              <div className="inv-grid">
                {inventory.map(item => (
                  <div key={item.id} className="inv-item">
                    <span className="inv-item-icon">{item.icon}</span>
                    <span className="inv-item-name">{item.name}</span>
                    <span className="inv-item-desc">{item.description}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint confirm dialog */}
      <AnimatePresence>
        {showHintConfirm && (
          <motion.div
            className="hint-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHintConfirm(false)}
          >
            <motion.div
              className="hint-dialog"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <p className="hint-dialog-title">💡 Use a Hint?</p>
              <p className="hint-dialog-body">
                This will cost you <strong>{HINT_COST} points</strong> from your score.
              </p>
              <p className="hint-dialog-used">Hints used so far: {hintsUsed}</p>
              <div className="hint-dialog-actions">
                <button className="btn btn-ghost" onClick={() => setShowHintConfirm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmHint}>Use Hint</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
