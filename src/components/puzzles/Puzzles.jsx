import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../../lib/GameContext'
import monaLisa from '../../assets/monalisa.jpg'
import './Puzzles.css'

// ── Shared Modal Wrapper ───────────────────────────────────────────────────
function PuzzleModal({ puzzle, onClose, children }) {
  const { useHint, HINT_COST } = useGame()
  const [showHint, setShowHint] = useState(false)
  const handleHint = () => { useHint(); setShowHint(true) }

  return (
    <motion.div className="puzzle-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="puzzle-modal"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="puzzle-modal-header">
          <div>
            <p className="puzzle-type-label">{puzzle.typeLabel || puzzle.type}</p>
            <h2 className="puzzle-title">{puzzle.title}</h2>
          </div>
          <button className="puzzle-close" onClick={onClose}>✕</button>
        </div>
        <div className="puzzle-content">{children}</div>
        <div className="puzzle-footer">
          {puzzle.hint && (
            <button className="puzzle-hint-btn" onClick={handleHint}>
              💡 Hint
            </button>
          )}
          <span className="puzzle-points">🏆 {puzzle.points} pts</span>
        </div>
        <AnimatePresence>
          {showHint && (
            <motion.div className="hint-reveal" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <span className="hint-label">💡 Hint</span>
              <p className="hint-text">{puzzle.hint}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// Solved message shown inside modals
function SolvedMsg({ icon = '✓', title, next, extra }) {
  return (
    <motion.div className="puzzle-solved-msg" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <span className="solved-icon">{icon}</span>
      <p className="solved-title">{title}</p>
      <p className="solved-next">{next}</p>
      {extra}
    </motion.div>
  )
}

// ── PUZZLE 1 & 3: Randomised Riddle ───────────────────────────────────────
const RIDDLES_1 = [
  { q: 'I have cities but no houses. Mountains but no trees. Water but no fish. Roads but no cars. What am I?', a: 'map', next: 'The chalkboard on the left wall awaits your attention.' },
  { q: 'The more you take, the more you leave behind. What am I?', a: 'footsteps', next: 'Seek the chalkboard across the room on the left wall.' },
  { q: 'I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?', a: 'echo', next: 'Look to the chalkboard on the left wall.' },
  { q: 'I have hands but cannot clap. What am I?', a: 'clock', next: 'The numbers on the chalkboard are your next challenge.' },
  { q: 'The more you have of it, the less you see. What am I?', a: 'darkness', next: 'Find the chalkboard on the left wall for your next clue.' },
]

const RIDDLES_3 = [
  { q: 'I have a face but never smile. Hands but cannot touch. I measure something endless. What am I?', a: 'clock', next: 'Study the photograph in the frame on the far wall.' },
  { q: 'I can be cracked, made, told and played. What am I?', a: 'joke', next: 'A photo frame on the back wall holds your next clue.' },
  { q: 'I am always before you but cannot be seen. What am I?', a: 'future', next: 'Examine the photograph hanging on the wall carefully.' },
  { q: 'What gets wetter the more it dries?', a: 'towel', next: 'Look to the framed photograph on the far wall.' },
  { q: 'I run but never walk, have a mouth but never talk, have a bed but never sleep. What am I?', a: 'river', next: 'The picture frame on the wall is your next step.' },
]

export function RiddlePuzzle({ puzzle, onClose, onSolve }) {
  const bank = puzzle.puzzleIndex === 3 ? RIDDLES_3 : RIDDLES_1
  const [riddle] = useState(() => bank[Math.floor(Math.random() * bank.length)])
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)

  const submit = () => {
    if (answer.trim().toLowerCase() === riddle.a.toLowerCase()) {
      setSolved(true)
      setTimeout(onSolve, 2000)
    } else {
      setError('That is not right. Think carefully...')
      setAnswer('')
    }
  }

  return (
    <PuzzleModal puzzle={puzzle} onClose={onClose}>
      {solved
        ? <SolvedMsg title="Correct!" next={riddle.next} />
        : (
          <div className="riddle-wrap">
            <div className="riddle-scroll">
              <p className="riddle-eyebrow">The Warden's Riddle</p>
              <p className="riddle-text">"{riddle.q}"</p>
            </div>
            <input className="input riddle-input" type="text" placeholder="Your answer..."
              value={answer} onChange={e => { setAnswer(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
            {error && <p className="puzzle-error">{error}</p>}
            <button className="btn btn-primary puzzle-submit" onClick={submit}>Submit Answer ›</button>
          </div>
        )
      }
    </PuzzleModal>
  )
}

// ── PUZZLE 2: Randomised Math ─────────────────────────────────────────────
function genMath() {
  const ops = ['+', '-', '×', '÷']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a, b, answer, q
  switch(op) {
    case '+': a = 10+Math.floor(Math.random()*50); b = 10+Math.floor(Math.random()*50); answer = a+b; q = `${a} + ${b}`; break
    case '-': a = 30+Math.floor(Math.random()*50); b = 5+Math.floor(Math.random()*25); answer = a-b; q = `${a} − ${b}`; break
    case '×': a = 2+Math.floor(Math.random()*11); b = 2+Math.floor(Math.random()*11); answer = a*b; q = `${a} × ${b}`; break
    case '÷': b = 2+Math.floor(Math.random()*9); answer = 2+Math.floor(Math.random()*10); a = b*answer; q = `${a} ÷ ${b}`; break
  }
  return { q: `${q} = ?`, answer: String(answer) }
}

export function MathPuzzle({ puzzle, onClose, onSolve }) {
  const [math] = useState(genMath)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)
  const [shake, setShake] = useState(false)

  const submit = () => {
    if (input.trim() === math.answer) {
      setSolved(true)
      setTimeout(onSolve, 1800)
    } else {
      setError('Incorrect. Try again.'); setShake(true)
      setTimeout(() => setShake(false), 500)
      setInput('')
    }
  }

  return (
    <PuzzleModal puzzle={puzzle} onClose={onClose}>
      {solved
        ? <SolvedMsg title="Correct!" next="Return to the study table — another clue waits." />
        : (
          <div className="math-wrap">
            <div className="math-display">
              <p className="math-label">Solve the equation on the chalkboard</p>
              <motion.p className="math-equation" animate={shake ? { x: [-8,8,-8,8,0] } : {}} transition={{ duration: 0.4 }}>
                {math.q}
              </motion.p>
            </div>
            <input className="input math-input" type="number" placeholder="Enter answer..."
              value={input} onChange={e => { setInput(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
            {error && <p className="puzzle-error">{error}</p>}
            <button className="btn btn-primary puzzle-submit" onClick={submit}>Submit ›</button>
          </div>
        )
      }
    </PuzzleModal>
  )
}

// ── PUZZLE 4: Jigsaw 4×4 ─────────────────────────────────────────────────
const PIECE_COLORS = [
  '#6B2020','#1a3a5c','#2a4a1a','#4a3a0a',
  '#3a1a4a','#1a2a3a','#3a1a0a','#0a2a1a',
  '#4a1a1a','#1a3a2a','#4a2a0a','#1a1a3a',
  '#3a0a0a','#0a3a1a','#2a2a0a','#0a1a3a',
]
const PIECE_ICONS = ['⚓','🗝','🕯','📜','💀','⚗','🔔','📌','🗡','🧲','⚙','🔒','🪙','📋','✒️','🏛']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]]
  }
  return a
}

export function JigsawPuzzle({ puzzle, onClose, onSolve, onRevealSafeClue }) {
  const SIZE = 4, TOTAL = 16
  const canvasRef = useRef()
  const [pieces, setPieces] = useState(() => shuffle(Array.from({ length: TOTAL }, (_, i) => i)))
  const [selected, setSelected] = useState(null)
  const [solved, setSolved] = useState(false)
  const [moves, setMoves] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef()

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imgRef.current = img; setImgLoaded(true) }
    img.src = monaLisa
  }, [])

  const correctCount = pieces.filter((p, i) => p === i).length

  useEffect(() => {
    if (correctCount === TOTAL && moves > 0 && !solved) {
      setSolved(true)
      onRevealSafeClue?.()
      setTimeout(onSolve, 2200)
    }
  }, [pieces])

  const PIECE_W = 80
  const PIECE_H = 90

  const drawPiece = (ctx, pieceIdx, x, y, isSelected, isCorrect) => {
    if (!imgRef.current) return
    const img = imgRef.current
    const col = pieceIdx % SIZE
    const row = Math.floor(pieceIdx / SIZE)
    const sx = (col / SIZE) * img.width
    const sy = (row / SIZE) * img.height
    const sw = img.width / SIZE
    const sh = img.height / SIZE

    // Border glow
    ctx.save()
    if (isSelected) {
      ctx.shadowColor = '#f0d080'
      ctx.shadowBlur = 14
    } else if (isCorrect) {
      ctx.shadowColor = '#4a9e6a'
      ctx.shadowBlur = 8
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, PIECE_W, PIECE_H)

    // Border
    ctx.strokeStyle = isSelected ? '#f0d080' : isCorrect ? '#4a9e6a' : 'rgba(0,0,0,0.6)'
    ctx.lineWidth = isSelected ? 2.5 : 1.5
    ctx.strokeRect(x + 0.75, y + 0.75, PIECE_W - 1.5, PIECE_H - 1.5)

    // Correct checkmark
    if (isCorrect) {
      ctx.fillStyle = 'rgba(74,158,106,0.7)'
      ctx.fillRect(x, y, 18, 18)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px Arial'
      ctx.fillText('✓', x + 3, y + 13)
    }
    ctx.restore()
  }

  useEffect(() => {
    if (!imgLoaded || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dark background
    ctx.fillStyle = '#0d0a06'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    pieces.forEach((pieceIdx, gridIdx) => {
      const col = gridIdx % SIZE
      const row = Math.floor(gridIdx / SIZE)
      const x = col * (PIECE_W + 3) + 3
      const y = row * (PIECE_H + 3) + 3
      drawPiece(ctx, pieceIdx, x, y, selected === gridIdx, pieces[gridIdx] === gridIdx)
    })
  }, [pieces, selected, imgLoaded])

  const handleCanvasClick = (e) => {
    if (solved || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const col = Math.floor(mx / (PIECE_W + 3))
    const row = Math.floor(my / (PIECE_H + 3))
    const idx = row * SIZE + col
    if (idx < 0 || idx >= TOTAL) return

    if (selected === null) {
      setSelected(idx)
    } else {
      if (selected !== idx) {
        const next = [...pieces];
        [next[selected], next[idx]] = [next[idx], next[selected]]
        setPieces(next)
        setMoves(m => m + 1)
      }
      setSelected(null)
    }
  }

  const totalW = SIZE * (PIECE_W + 3) + 3
  const totalH = SIZE * (PIECE_H + 3) + 3

  return (
    <PuzzleModal puzzle={puzzle} onClose={onClose}>
      {solved ? (
        <SolvedMsg icon="🖼" title="Mona Lisa Restored!"
          next="A clue has appeared on the photograph. Find the wall safe on the right side of the room." />
      ) : (
        <div className="jigsaw-wrap">
          <div className="jigsaw-header">
            <p className="jigsaw-instruction">
              {!imgLoaded ? 'Loading painting...' : 'Click two pieces to swap them. Restore the Mona Lisa.'}
            </p>
            <span className="jigsaw-moves">Moves: {moves}</span>
          </div>
          {!imgLoaded ? (
            <div className="jigsaw-loading">
              <div className="loading-candle">🖼</div>
              <p>Loading painting...</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={totalW}
              height={totalH}
              onClick={handleCanvasClick}
              className="jigsaw-canvas"
              style={{ cursor: 'pointer' }}
            />
          )}
          <div className="jigsaw-progress">
            <div className="jigsaw-bar">
              <div className="jigsaw-fill" style={{ width: `${(correctCount / TOTAL) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
            <span className="jigsaw-count">{correctCount} / {TOTAL} in place</span>
          </div>
        </div>
      )}
    </PuzzleModal>
  )
}

// ── PUZZLE 5: Wall Safe ───────────────────────────────────────────────────
export function SafePuzzle({ puzzle, onClose, onSolve }) {
  const [digits, setDigits] = useState(['','','',''])
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)
  const [shake, setShake] = useState(false)
  const refs = [useRef(),useRef(),useRef(),useRef()]

  const setDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]; next[i] = val; setDigits(next); setError('')
    if (val && i < 3) refs[i+1].current?.focus()
  }
  const onKey = (i, e) => { if (e.key==='Backspace' && !digits[i] && i>0) refs[i-1].current?.focus() }

  const submit = () => {
    const code = digits.join('')
    if (code.length < 4) { setError('Enter all 4 digits.'); return }
    if (code === puzzle.solution) {
      setSolved(true)
      setTimeout(onSolve, 2500)
    } else {
      setError('Wrong combination. The safe stays shut.')
      setShake(true); setTimeout(()=>setShake(false),600)
      setDigits(['','','','']); refs[0].current?.focus()
    }
  }

  return (
    <PuzzleModal puzzle={puzzle} onClose={onClose}>
      {solved
        ? (
          <SolvedMsg icon="🔓" title="Safe Opened!" next="Inside is a folded note with the chest combination:"
            extra={
              <div className="chest-code-preview">
                {puzzle.chestCode?.split('').map((d,i) => (
                  <motion.span key={i} className="code-digit" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3+i*0.15}}>{d}</motion.span>
                ))}
              </div>
            }
          />
        ) : (
          <div className="safe-wrap">
            <div className="safe-visual">
              <div className="safe-door-circle">🔒</div>
              <p className="safe-door-label">WARDEN'S SAFE</p>
            </div>
            <div className="safe-clue-box">
              <p className="safe-clue-label">📸 Clue from the photograph:</p>
              <p className="safe-clue-text">"{puzzle.safeClue}"</p>
            </div>
            <motion.div className="code-dials-wrap" animate={shake ? {x:[-8,8,-8,8,0]}:{}} transition={{duration:0.4}}>
              <div className="code-dials">
                {digits.map((d,i) => (
                  <input key={i} ref={refs[i]} className="code-dial" type="text" inputMode="numeric"
                    maxLength={1} value={d} onChange={e=>setDigit(i,e.target.value)}
                    onKeyDown={e=>onKey(i,e)} autoFocus={i===0} />
                ))}
              </div>
            </motion.div>
            {error && <p className="puzzle-error">{error}</p>}
            <button className="btn btn-primary puzzle-submit" onClick={submit}>Open Safe ›</button>
          </div>
        )
      }
    </PuzzleModal>
  )
}

// ── Chest Unlock ──────────────────────────────────────────────────────────
export function ChestPuzzle({ puzzle, onClose, onSolve }) {
  const [digits, setDigits] = useState(['','','',''])
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)
  const refs = [useRef(),useRef(),useRef(),useRef()]

  const setDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]; next[i] = val; setDigits(next); setError('')
    if (val && i < 3) refs[i+1].current?.focus()
  }
  const onKey = (i, e) => { if (e.key==='Backspace' && !digits[i] && i>0) refs[i-1].current?.focus() }

  const submit = () => {
    const code = digits.join('')
    if (code === puzzle.solution) {
      setSolved(true); setTimeout(onSolve, 2000)
    } else {
      setError('Wrong code. Check the safe note.')
      setDigits(['','','','']); refs[0].current?.focus()
    }
  }

  return (
    <PuzzleModal puzzle={puzzle} onClose={onClose}>
      {solved
        ? <SolvedMsg icon="🗝" title="Chest Opened!" next="The Warden's Key glints inside. Pick it up and find the exit door!" />
        : (
          <div className="riddle-wrap">
            <p className="puzzle-description-text">{puzzle.description}</p>
            <div className="code-dials" style={{justifyContent:'center',display:'flex',gap:12,marginBottom:12}}>
              {digits.map((d,i) => (
                <input key={i} ref={refs[i]} className="code-dial" type="text" inputMode="numeric"
                  maxLength={1} value={d} onChange={e=>setDigit(i,e.target.value)}
                  onKeyDown={e=>onKey(i,e)} autoFocus={i===0} />
              ))}
            </div>
            {error && <p className="puzzle-error">{error}</p>}
            <button className="btn btn-primary puzzle-submit" onClick={submit}>Unlock Chest ›</button>
          </div>
        )
      }
    </PuzzleModal>
  )
}
