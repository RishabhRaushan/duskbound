import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

const GameContext = createContext({})

const HINT_COST = 50

function gameReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload, status: 'active' }
    case 'TICK':
      return { ...state, timeRemaining: Math.max(0, state.timeRemaining - 1) }
    case 'SOLVE_PUZZLE': {
      const solved = new Set(state.solvedPuzzles)
      solved.add(action.puzzleId)
      return {
        ...state,
        solvedPuzzles: solved,
        score: state.score + action.points,
        currentPuzzleIndex: state.currentPuzzleIndex + 1,
      }
    }
    case 'USE_HINT':
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
      }
    case 'PICK_UP_ITEM':
      return {
        ...state,
        inventory: [...state.inventory, action.item],
      }
    case 'USE_ITEM':
      return {
        ...state,
        inventory: state.inventory.filter(i => i.id !== action.itemId),
      }
    case 'SET_STATUS':
      return { ...state, status: action.status }
    case 'OPEN_PUZZLE':
      return { ...state, activePuzzleId: action.puzzleId }
    case 'CLOSE_PUZZLE':
      return { ...state, activePuzzleId: null }
    default:
      return state
  }
}

const initialState = {
  sessionId: null,
  roomId: null,
  room: null,
  puzzles: [],
  solvedPuzzles: new Set(),
  currentPuzzleIndex: 0,
  score: 0,
  hintsUsed: 0,
  timeRemaining: 1800,
  inventory: [],
  status: 'idle', // idle | active | escaped | failed
  activePuzzleId: null,
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const { user } = useAuth()
  const timerRef = useRef(null)

  // Countdown timer
  useEffect(() => {
    if (state.status !== 'active') return
    timerRef.current = setInterval(() => {
      dispatch({ type: 'TICK' })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [state.status])

  // Auto-fail when timer hits 0
  useEffect(() => {
    if (state.timeRemaining === 0 && state.status === 'active') {
      endSession('failed')
    }
  }, [state.timeRemaining, state.status])

  // Auto-escape when all puzzles solved
  useEffect(() => {
    if (
      state.status === 'active' &&
      state.puzzles.length > 0 &&
      state.solvedPuzzles.size === state.puzzles.length
    ) {
      endSession('escaped')
    }
  }, [state.solvedPuzzles, state.puzzles, state.status])

  async function startSession(room, puzzles) {
    clearInterval(timerRef.current)
    let sessionId = null

    if (user && !user.isGuest) {
      const { data } = await supabase
        .from('game_sessions')
        .insert({
          user_id: user.id,
          room_id: room.id,
          status: 'active',
          time_remaining: 1800,
          score: 0,
          hints_used: 0,
        })
        .select()
        .single()
      sessionId = data?.id
    }

    dispatch({
      type: 'INIT',
      payload: {
        sessionId,
        roomId: room.id,
        room,
        puzzles,
        solvedPuzzles: new Set(),
        currentPuzzleIndex: 0,
        score: 0,
        hintsUsed: 0,
        timeRemaining: (room.duration_min || 30) * 60,
        inventory: [],
        activePuzzleId: null,
      },
    })
  }

  async function solvePuzzle(puzzleId, points) {
    dispatch({ type: 'SOLVE_PUZZLE', puzzleId, points })

    if (state.sessionId) {
      await supabase.from('puzzle_progress').upsert({
        session_id: state.sessionId,
        puzzle_id: puzzleId,
        is_solved: true,
        solved_at: new Date().toISOString(),
      })
    }
  }

  async function useHint() {
    dispatch({ type: 'USE_HINT' })
    if (state.sessionId) {
      await supabase
        .from('game_sessions')
        .update({ hints_used: state.hintsUsed + 1 })
        .eq('id', state.sessionId)
    }
  }

  async function pickUpItem(item) {
    dispatch({ type: 'PICK_UP_ITEM', item })
    if (state.sessionId) {
      await supabase.from('inventory_items').insert({
        session_id: state.sessionId,
        item_id: item.id,
        item_name: item.name,
        item_description: item.description,
      })
    }
  }

  function useItem(itemId) {
    dispatch({ type: 'USE_ITEM', itemId })
  }

  async function endSession(status) {
    clearInterval(timerRef.current)
    dispatch({ type: 'SET_STATUS', status })

    if (!user || user.isGuest || !state.sessionId) return

    const timeTaken = (state.room?.duration_min * 60) - state.timeRemaining

    await supabase
      .from('game_sessions')
      .update({
        status,
        ended_at: new Date().toISOString(),
        score: state.score,
        hints_used: state.hintsUsed,
        time_remaining: state.timeRemaining,
      })
      .eq('id', state.sessionId)

    if (status === 'escaped') {
      await supabase.from('scores').insert({
        user_id: user.id,
        room_id: state.roomId,
        session_id: state.sessionId,
        points: state.score,
        time_taken: timeTaken,
        hints_used: state.hintsUsed,
        escaped: true,
      })

      // Update XP
      const xpGained = Math.floor(state.score / 10) + (state.hintsUsed === 0 ? 200 : 100)
      await supabase.rpc('increment_xp', { user_id: user.id, amount: xpGained }).catch(() => {})
    }
  }

  function pauseTimer() {
    clearInterval(timerRef.current)
  }

  function resumeTimer() {
    timerRef.current = setInterval(() => {
      dispatch({ type: 'TICK' })
    }, 1000)
  }

  function openPuzzle(puzzleId) { dispatch({ type: 'OPEN_PUZZLE', puzzleId }) }
  function closePuzzle() { dispatch({ type: 'CLOSE_PUZZLE' }) }

  const totalPuzzles = state.puzzles.length
  const solvedCount = state.solvedPuzzles.size
  const progress = totalPuzzles > 0 ? (solvedCount / totalPuzzles) * 100 : 0

  return (
    <GameContext.Provider value={{
      ...state,
      startSession,
      solvePuzzle,
      useHint,
      pickUpItem,
      useItem,
      endSession,
      openPuzzle,
      closePuzzle,
      pauseTimer,
      resumeTimer,
      progress,
      solvedCount,
      totalPuzzles,
      HINT_COST,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => useContext(GameContext)