import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../lib/GameContext'
import { supabase } from '../lib/supabase'
import { RiddlePuzzle, MathPuzzle, JigsawPuzzle, SafePuzzle, ChestPuzzle } from '../components/puzzles/Puzzles'
import GameHUD from '../components/GameHUD'
import './GameRoom.css'
import { useLoader } from '@react-three/fiber'
import monaLisaUrl from '../assets/monalisa.jpg'

function MonaLisaFrame() {
  const texture = useLoader(THREE.TextureLoader, monaLisaUrl)
  return (
    <mesh position={[1.4, 2.05, -3.88]}>
      <boxGeometry args={[0.72, 0.58, 0.02]} />
      <meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
  )
}

// ── Sequential puzzle definitions ─────────────────────────────────────────
// puzzleIndex matches the step (1-5)
const PUZZLE_STEPS = [
  {
    id: 'p1', step: 1,
    position: [2.2, 0.85, -1.1],
    label: 'Study Table — Riddle',
    type: 'riddle', puzzleIndex: 1,
    title: "The Warden's First Clue",
    typeLabel: 'Riddle',
    hint: 'Think about things that look like the real thing but are representations.',
    points: 100,
  },
  {
    id: 'p2', step: 2,
    position: [-3.6, 1.4, -2.1],
    label: 'Chalkboard — Math',
    type: 'math',
    title: 'The Chalkboard Equation',
    typeLabel: 'Math Puzzle',
    hint: 'Just solve the arithmetic shown on the chalkboard.',
    points: 100,
  },
  {
    id: 'p3', step: 3,
    position: [2.2, 0.85, -1.1],
    label: 'Study Table — Second Riddle',
    type: 'riddle', puzzleIndex: 3,
    title: "The Warden's Second Clue",
    typeLabel: 'Riddle',
    hint: 'Think about memories and images captured in time.',
    points: 100,
  },
  {
    id: 'p4', step: 4,
    position: [1.4, 2.05, -3.92],
    label: 'Photo Frame — Jigsaw',
    type: 'jigsaw',
    title: 'The Warden\'s Photograph',
    typeLabel: 'Jigsaw Puzzle',
    hint: 'Click a piece to select it, then click another to swap.',
    points: 150,
  },
  {
    id: 'p5', step: 5,
    position: [3.88, 1.55, -1.2],
    label: 'Wall Safe',
    type: 'safe',
    title: 'The Warden\'s Safe',
    typeLabel: 'Code Lock',
    hint: 'The clue from the photograph will help you find the code.',
    points: 200,
  },
]

const CHEST_POS = [-0.2, 0.26, 2.4]
const DOOR_POS  = [-3.82, 1.6, 3.72]
const KEY_POS   = [-0.2, 0.65, 2.4]

// Random safe clues & codes
const SAFE_CLUES = [
  { clue: 'The year the prison was founded, reversed. (Check the note on the desk)', code: '4281' },
  { clue: 'The year the prison was founded, reversed. (Check the note on the desk)', code: '4281' },
  { clue: 'The year the prison was founded, reversed. (Check the note on the desk)', code: '4281' },
  { clue: 'The year the prison was founded, reversed. (Check the note on the desk)', code: '4281' },
  { clue: 'The year the prison was founded, reversed. (Check the note on the desk)', code: '4281' },
]

// ── Glowing orb marker — only active step glows ───────────────────────────
function Orb({ position, label, isSolved, isActive, isNear, onClick }) {
  const mesh = useRef()
  const glow = useRef()

  useFrame(s => {
    if (!mesh.current) return
    const t = s.clock.elapsedTime
    if (isActive) {
      mesh.current.position.y = position[1] + 0.45 + Math.sin(t * 2.2) * 0.05
    }
    if (glow.current) {
      glow.current.material.opacity = isSolved ? 0 : isActive ? 0.55 + Math.sin(t * 3.5) * 0.2 : 0
    }
  })

  // Not active and not solved — invisible
  if (!isActive && !isSolved) return null

  const col = isSolved ? '#4a9e6a' : isNear ? '#f0d080' : '#c9a84c'

  return (
    <group>
      {isActive && (
        <>
          <mesh ref={mesh} position={[position[0], position[1]+0.45, position[2]]} onClick={onClick}>
            <sphereGeometry args={[0.058, 16, 16]} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={isNear ? 5 : 2.5} />
          </mesh>
          <mesh ref={glow} position={[position[0], position[1]+0.45, position[2]]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color={col} transparent opacity={0.5} depthWrite={false} />
          </mesh>
          <pointLight position={[position[0], position[1]+0.45, position[2]]} intensity={isNear?6:3} color={col} distance={2} decay={2} />
          {isNear && (
            <Text position={[position[0], position[1]+0.82, position[2]]} fontSize={0.1} color="#f0d080"
              anchorX="center" anchorY="middle" outlineWidth={0.007} outlineColor="#000">
              [E] {label}
            </Text>
          )}
        </>
      )}
      {isSolved && (
        <Text position={[position[0], position[1]+0.6, position[2]]} fontSize={0.08} color="#4a9e6a"
          anchorX="center" anchorY="middle">
          ✓
        </Text>
      )}
    </group>
  )
}

// ── Floating key ──────────────────────────────────────────────────────────
function FloatingKey({ visible, isNear, onClick }) {
  const ref = useRef()
  useFrame(s => {
    if (!ref.current || !visible) return
    ref.current.rotation.y = s.clock.elapsedTime * 2
    ref.current.position.y = KEY_POS[1] + Math.sin(s.clock.elapsedTime * 3) * 0.06
  })
  if (!visible) return null
  return (
    <group ref={ref} position={KEY_POS} onClick={onClick}>
      <mesh><torusGeometry args={[0.06, 0.014, 8, 20]} /><meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={3} metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[0.09,-0.04,0]}><boxGeometry args={[0.09,0.014,0.014]} /><meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={3} metalness={0.9} /></mesh>
      <mesh position={[0.12,-0.055,0]}><boxGeometry args={[0.014,0.024,0.014]} /><meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={3} metalness={0.9} /></mesh>
      <pointLight intensity={8} color="#c9a84c" distance={2} decay={2} />
      {isNear && <Text position={[0,0.24,0]} fontSize={0.09} color="#f0d080" anchorX="center" anchorY="middle" outlineWidth={0.007} outlineColor="#000">[E] Pick up Key</Text>}
    </group>
  )
}

// ── Exit door ─────────────────────────────────────────────────────────────
function ExitDoor({ unlocked, isNear, onClick }) {
  const glow = useRef()
  useFrame(s => {
    if (!glow.current || !unlocked) return
    glow.current.material.emissiveIntensity = 0.5 + Math.sin(s.clock.elapsedTime * 2) * 0.3
  })
  return (
    <group position={DOOR_POS}>
      <mesh><boxGeometry args={[0.1, 2.8, 1.1]} /><meshStandardMaterial color="#1a0f04" roughness={0.9} /></mesh>
      <mesh ref={glow} position={[0.04,0,0]}>
        <boxGeometry args={[0.04,2.5,0.88]} />
        <meshStandardMaterial color={unlocked?'#2a1a08':'#0f0a04'} emissive={unlocked?'#c9a84c':'#000'} emissiveIntensity={0.5} roughness={0.8} />
      </mesh>
      <mesh position={[0.08,0.05,-0.3]}>
        <sphereGeometry args={[0.038,10,10]} />
        <meshStandardMaterial color={unlocked?'#c9a84c':'#2a1a08'} metalness={0.9} roughness={0.2} emissive={unlocked?'#c9a84c':'#000'} emissiveIntensity={unlocked?1.5:0} />
      </mesh>
      {unlocked && <pointLight intensity={10} color="#c9a84c" distance={4} decay={2} />}
      {unlocked && isNear && <Text position={[0,1.65,0.6]} fontSize={0.1} color="#f0d080" anchorX="center" anchorY="middle" outlineWidth={0.007} outlineColor="#000">[E] Escape!</Text>}
      {!unlocked && <Text position={[0,1.65,0.6]} fontSize={0.08} color="#3a2a10" anchorX="center" anchorY="middle">🔒 Locked</Text>}
    </group>
  )
}

// ── Chest ─────────────────────────────────────────────────────────────────
function Chest({ isOpen, isNear, onClick }) {
  const lid = useRef()
  useFrame(() => {
    if (!lid.current) return
    const target = isOpen ? -Math.PI/2.1 : 0
    lid.current.rotation.x += (target - lid.current.rotation.x) * 0.09
  })
  return (
    <group position={CHEST_POS}>
      <mesh position={[0,0,0]}><boxGeometry args={[0.65,0.38,0.44]} /><meshStandardMaterial color="#2a1a06" roughness={0.85} metalness={0.1} /></mesh>
      {[-0.18,0.18].map((x,i)=>(
        <mesh key={i} position={[x,0,0]}><boxGeometry args={[0.025,0.4,0.46]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.2} /></mesh>
      ))}
      <group ref={lid} position={[0,0.19,-0.22]}>
        <mesh position={[0,0.11,0.22]}><boxGeometry args={[0.67,0.22,0.46]} /><meshStandardMaterial color="#3a2508" roughness={0.85} /></mesh>
        {[-0.18,0.18].map((x,i)=>(
          <mesh key={i} position={[x,0.11,0.22]}><boxGeometry args={[0.025,0.24,0.48]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.2} /></mesh>
        ))}
      </group>
      <mesh position={[0,0.14,0.23]}>
        <boxGeometry args={[0.09,0.09,0.025]} />
        <meshStandardMaterial color={isOpen?'#4a9e6a':'#8B6914'} metalness={0.8} roughness={0.2} emissive={isOpen?'#4a9e6a':'#000'} emissiveIntensity={isOpen?0.6:0} />
      </mesh>
      <pointLight intensity={isOpen?6:1.5} color={isOpen?'#c9a84c':'#8B6914'} distance={2.5} decay={2} />
      {isNear && !isOpen && <Text position={[0,0.7,0]} fontSize={0.09} color="#f0d080" anchorX="center" anchorY="middle" outlineWidth={0.007} outlineColor="#000">[E] Open Chest</Text>}
    </group>
  )
}

// ── Wall Safe 3D object ───────────────────────────────────────────────────
function WallSafe({ isOpen }) {
  return (
    <group position={[3.9, 1.55, -1.2]}>
      <mesh><boxGeometry args={[0.05,0.55,0.55]} /><meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.5} /></mesh>
      <mesh position={[0.04,0,0]}>
        <boxGeometry args={[0.02,0.48,0.48]} />
        <meshStandardMaterial color={isOpen?'#2a4a1a':'#1a1a1a'} metalness={0.6} roughness={0.4} emissive={isOpen?'#4a9e6a':'#000'} emissiveIntensity={isOpen?0.4:0} />
      </mesh>
      <mesh position={[0.06,0.05,-0.18]}>
        <cylinderGeometry args={[0.025,0.025,0.035,10]} rotation={[0,0,Math.PI/2]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} />
      </mesh>
      {isOpen && <pointLight intensity={4} color="#4a9e6a" distance={1.5} decay={2} />}
    </group>
  )
}

// ── Full detailed room ────────────────────────────────────────────────────
function WardensStudy({ solvedSteps, activeStep, onInteract, nearId, chestOpen, chestNear, onChest, keyVisible, keyNear, onKey, doorUnlocked, doorNear, onDoor, safeOpen }) {
  const w    = { color: '#1c1108', roughness: 0.96 }
  const wood = { color: '#3a1e06', roughness: 0.82, metalness: 0.04 }

  return (
    <group>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.04} color="#2a1505" />
      <pointLight position={[1.8,1.95,-1.0]} intensity={24} color="#d08020" distance={9} decay={2} castShadow />
      <pointLight position={[1.8,1.95,-1.0]} intensity={8} color="#ff9a30" distance={3} decay={2} />
      <pointLight position={[-3.5,0.6,2.8]} intensity={16} color="#ff5500" distance={6} decay={2} />
      <pointLight position={[-3.5,0.9,2.8]} intensity={6} color="#ff8800" distance={4} decay={2} />
      <spotLight position={[4.0,3.2,1.5]} intensity={7} color="#3a5070" angle={0.35} penumbra={0.9} distance={16} castShadow />
      {[[-3.9,2.1,-0.8],[3.9,2.1,-0.8],[0.2,2.1,-3.9],[-1.8,2.1,3.8]].map((p,i)=>(
        <pointLight key={i} position={[p[0],p[1]+0.15,p[2]]} intensity={3.5} color="#ff9030" distance={3.5} decay={2} />
      ))}

      {/* ── Floor ── */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
        <planeGeometry args={[8,8]} /><meshStandardMaterial color="#0d0803" roughness={0.92} />
      </mesh>
      {[-3,-2,-1,0,1,2,3].map((x,i)=>(
        <mesh key={i} rotation={[-Math.PI/2,0,0]} position={[x+0.5,0.001,0]}>
          <planeGeometry args={[0.02,8]} /><meshStandardMaterial color="#080503" roughness={1} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0.5,0.005,0.2]}>
        <planeGeometry args={[4.5,3.5]} /><meshStandardMaterial color="#3a0808" roughness={0.98} />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh rotation={[Math.PI/2,0,0]} position={[0,3.4,0]}>
        <planeGeometry args={[8,8]} /><meshStandardMaterial color="#0c0805" roughness={1} />
      </mesh>
      {[-2.5,-0.8,0.8,2.5].map((x,i)=>(
        <mesh key={i} position={[x,3.28,0]} castShadow>
          <boxGeometry args={[0.22,0.22,8.1]} /><meshStandardMaterial color="#1a0f04" roughness={0.95} />
        </mesh>
      ))}
      {[-2.5,0,2.5].map((z,i)=>(
        <mesh key={i} position={[0,3.22,z]} castShadow>
          <boxGeometry args={[8.1,0.14,0.14]} /><meshStandardMaterial color="#1a0f04" roughness={0.95} />
        </mesh>
      ))}

      {/* ── Walls ── */}
      <mesh position={[0,1.7,-4]} receiveShadow><planeGeometry args={[8,3.4]} /><meshStandardMaterial {...w} /></mesh>
      <mesh rotation={[0,Math.PI,0]} position={[0,1.7,4]}><planeGeometry args={[8,3.4]} /><meshStandardMaterial color="#150e06" roughness={0.95} /></mesh>
      <mesh rotation={[0,Math.PI/2,0]} position={[-4,1.7,0]} receiveShadow><planeGeometry args={[8,3.4]} /><meshStandardMaterial {...w} /></mesh>
      <mesh rotation={[0,-Math.PI/2,0]} position={[4,1.7,0]}><planeGeometry args={[8,3.4]} /><meshStandardMaterial {...w} /></mesh>
      {/* Wainscoting */}
      {[[0,'-3.98'],[0,'3.98'],['-3.98',0,true],['3.98',0,true]].map(([a,b,vert],i)=>(
        <mesh key={i} position={vert?[parseFloat(a),0.45,0]:[0,0.45,parseFloat(b)]} rotation={[0,vert?Math.PI/2:0,0]}>
          <planeGeometry args={[8,0.9]} /><meshStandardMaterial color={i<2?'#1e1409':'#1a1107'} roughness={0.9} />
        </mesh>
      ))}

      {/* ── Desk ── */}
      <mesh position={[2.0,0.78,-1.5]} castShadow receiveShadow>
        <boxGeometry args={[2.0,0.07,1.1]} /><meshStandardMaterial {...wood} />
      </mesh>
      <mesh position={[2.0,0.74,-1.5]}><boxGeometry args={[2.04,0.04,1.14]} /><meshStandardMaterial color="#2a1504" roughness={0.8} /></mesh>
      {[[1.06,0.37,-1.02],[2.94,0.37,-1.02],[1.06,0.37,-1.98],[2.94,0.37,-1.98]].map((p,i)=>(
        <mesh key={i} position={p} castShadow><boxGeometry args={[0.08,0.74,0.08]} /><meshStandardMaterial {...wood} /></mesh>
      ))}
      <mesh position={[2.0,0.37,-1.04]}><boxGeometry args={[1.82,0.72,0.04]} /><meshStandardMaterial {...wood} /></mesh>
      <mesh position={[2.0,0.37,-1.98]}><boxGeometry args={[1.82,0.72,0.04]} /><meshStandardMaterial {...wood} /></mesh>
      {[1.4,2.0,2.6].map((x,i)=>(
        <group key={i}>
          <mesh position={[x,0.58,-1.04]}><boxGeometry args={[0.48,0.2,0.03]} /><meshStandardMaterial color="#2e1806" roughness={0.75} /></mesh>
          <mesh position={[x,0.58,-1.01]}><sphereGeometry args={[0.018,8,8]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.15} /></mesh>
        </group>
      ))}
      {/* Papers & items on desk */}
      <mesh position={[1.5,0.82,-1.7]} rotation={[0,0.25,0]}><boxGeometry args={[0.32,0.008,0.42]} /><meshStandardMaterial color="#c8b48a" roughness={1} /></mesh>
      <mesh position={[1.2,0.85,-1.5]} rotation={[0,-0.1,0]}><boxGeometry args={[0.18,0.008,0.26]} /><meshStandardMaterial color="#d4c09a" roughness={1} /></mesh>
      <mesh position={[2.85,0.89,-1.3]}><cylinderGeometry args={[0.038,0.048,0.13,10]} /><meshStandardMaterial color="#1a1a2e" roughness={0.15} metalness={0.1} transparent opacity={0.85} /></mesh>
      <mesh position={[2.6,0.82,-1.65]} rotation={[0,0,0.3]}><cylinderGeometry args={[0.006,0.012,0.35,6]} /><meshStandardMaterial color="#e8d8a0" roughness={0.9} /></mesh>
      {/* Book stack */}
      {[[0.04,0,'#8B2020'],[0.02,0.04,'#1a3a5c'],[0,0.08,'#2a4a1a']].map(([rx,by,c],i)=>(
        <mesh key={i} position={[2.9,0.82+by,-1.8]} rotation={[rx,0,0]}><boxGeometry args={[0.14,0.04,0.2]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>
      ))}

      {/* ── Oil lamp ── */}
      <mesh position={[1.8,0.79,-1.1]}><cylinderGeometry args={[0.025,0.025,0.14,8]} /><meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[1.8,0.87,-1.1]}><cylinderGeometry args={[0.055,0.07,0.22,12]} /><meshStandardMaterial color="#8B6914" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[1.8,1.0,-1.1]}><sphereGeometry args={[0.075,14,14]} /><meshStandardMaterial color="#ffe090" emissive="#ffaa20" emissiveIntensity={5} transparent opacity={0.92} /></mesh>

      {/* ── Chair ── */}
      <mesh position={[2.0,0.42,-0.55]} castShadow><boxGeometry args={[0.58,0.06,0.58]} /><meshStandardMaterial color="#2e1606" roughness={0.85} /></mesh>
      <mesh position={[2.0,0.84,-0.86]} castShadow><boxGeometry args={[0.56,0.78,0.05]} /><meshStandardMaterial color="#2e1606" roughness={0.85} /></mesh>
      <mesh position={[2.0,0.46,-0.55]}><boxGeometry args={[0.52,0.05,0.52]} /><meshStandardMaterial color="#3d0a0a" roughness={0.95} /></mesh>
      {[[1.74,0.2,-0.28],[2.26,0.2,-0.28],[1.74,0.2,-0.82],[2.26,0.2,-0.82]].map((p,i)=>(
        <mesh key={i} position={p} castShadow><cylinderGeometry args={[0.03,0.03,0.4,8]} /><meshStandardMaterial color="#2e1606" roughness={0.85} /></mesh>
      ))}
      {[[1.74,0.65,-0.55],[2.26,0.65,-0.55]].map((p,i)=>(
        <mesh key={i} position={p}><boxGeometry args={[0.04,0.04,0.55]} /><meshStandardMaterial color="#2e1606" roughness={0.85} /></mesh>
      ))}

      {/* ── Bookshelf ── */}
      <mesh position={[-3.78,1.5,-1.5]} castShadow><boxGeometry args={[0.16,2.6,1.6]} /><meshStandardMaterial {...wood} /></mesh>
      <mesh position={[-3.72,1.5,-1.5]}><boxGeometry args={[0.04,2.4,1.5]} /><meshStandardMaterial color="#1e1006" roughness={0.9} /></mesh>
      {[0.25,0.82,1.38,1.94,2.5].map((y,i)=>(
        <mesh key={i} position={[-3.71,y,-1.5]}><boxGeometry args={[0.06,0.038,1.5]} /><meshStandardMaterial color="#2a1504" roughness={0.8} /></mesh>
      ))}
      {[
        [-3.7,0.55,-1.82,0.055,0.24,0.13,'#8B2020'],[-3.7,0.55,-1.64,0.055,0.20,0.13,'#1a3a5c'],
        [-3.7,0.55,-1.46,0.055,0.22,0.13,'#2a4a1a'],[-3.7,0.55,-1.28,0.055,0.18,0.13,'#4a3a0a'],
        [-3.7,0.55,-1.10,0.055,0.21,0.13,'#3a1a4a'],[-3.7,0.55,-0.92,0.055,0.19,0.13,'#1a2a3a'],
        [-3.7,1.12,-1.82,0.055,0.22,0.13,'#3a1a0a'],[-3.7,1.12,-1.64,0.055,0.20,0.13,'#1a2a3a'],
        [-3.7,1.12,-1.46,0.055,0.18,0.13,'#2a1a0a'],[-3.7,1.12,-1.28,0.055,0.23,0.13,'#4a1a1a'],
        [-3.7,1.12,-1.10,0.055,0.20,0.13,'#0a2a1a'],[-3.7,1.12,-0.92,0.055,0.17,0.13,'#1a3a2a'],
        [-3.7,1.68,-1.82,0.055,0.21,0.13,'#4a2a0a'],[-3.7,1.68,-1.60,0.055,0.19,0.13,'#1a1a3a'],
        [-3.7,1.68,-1.38,0.055,0.22,0.13,'#3a0a0a'],[-3.7,1.68,-1.16,0.055,0.18,0.13,'#0a3a1a'],
        [-3.7,2.24,-1.78,0.055,0.20,0.13,'#2a2a0a'],[-3.7,2.24,-1.58,0.055,0.22,0.13,'#0a1a3a'],
        [-3.7,2.24,-1.36,0.055,0.18,0.13,'#3a1a1a'],
      ].map(([x,y,z,w2,h,d,c],i)=>(
        <mesh key={i} position={[x,y,z]} castShadow><boxGeometry args={[w2,h,d]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>
      ))}
      {/* Skull */}
      <mesh position={[-3.7,2.62,-0.95]}><sphereGeometry args={[0.07,10,10]} /><meshStandardMaterial color="#c8b89a" roughness={0.9} /></mesh>

      {/* ── Evidence board ── */}
      <mesh position={[-1.2,1.95,-3.92]} castShadow><boxGeometry args={[1.5,1.15,0.055]} /><meshStandardMaterial color="#1e1208" roughness={0.9} /></mesh>
      <mesh position={[-1.2,1.95,-3.89]}><boxGeometry args={[1.3,1.0,0.02]} /><meshStandardMaterial color="#8B6440" roughness={1} /></mesh>
      {[[-1.55,2.06],[-1.08,2.06],[-0.72,2.06],[-1.55,1.78],[-1.08,1.78],[-0.72,1.78]].map(([x,y],i)=>(
        <mesh key={i} position={[x,y,-3.87]} rotation={[0,0,(i%3-1)*0.08]}>
          <boxGeometry args={[0.24,0.18,0.008]} /><meshStandardMaterial color={i===2?'#e8dfc0':'#d0c09a'} roughness={1} />
        </mesh>
      ))}
      {[[-1.55,2.06,-1.08,1.78],[-1.08,2.06,-0.72,2.06]].map(([x1,y1,x2,y2],i)=>{
        const mx=(x1+x2)/2,my=(y1+y2)/2,len=Math.sqrt((x2-x1)**2+(y2-y1)**2),angle=Math.atan2(y2-y1,x2-x1)
        return(<mesh key={i} position={[mx,my,-3.87]} rotation={[0,0,angle]}><boxGeometry args={[len,0.008,0.003]} /><meshStandardMaterial color="#cc2222" /></mesh>)
      })}

      {/* ── Photo frame (puzzle 4 location) ── */}
      <mesh position={[1.4,2.05,-3.92]} castShadow>
        <boxGeometry args={[0.9,0.75,0.06]} /><meshStandardMaterial color="#2a1a08" roughness={0.85} />
      </mesh>
      {solvedSteps.has('p4')
        ? <MonaLisaFrame />
        : (
          <mesh position={[1.4,2.05,-3.88]}>
            <boxGeometry args={[0.72,0.58,0.02]} />
            <meshStandardMaterial color="#1a1208" roughness={0.9} />
          </mesh>
        )
      }

      {/* ── Chalkboard ── */}
      <mesh position={[-3.92,1.55,-2.2]}><boxGeometry args={[0.04,0.9,1.3]} /><meshStandardMaterial color="#1a1a1a" roughness={0.95} /></mesh>
      <mesh position={[-3.90,1.55,-2.2]}><boxGeometry args={[0.025,0.96,1.36]} /><meshStandardMaterial color="#2a1a08" roughness={0.9} /></mesh>

      {/* ── Wall inscription (back wall) ── */}
      <mesh position={[0.2,1.62,-3.92]}><boxGeometry args={[1.0,0.6,0.02]} /><meshStandardMaterial color="#120c06" roughness={0.95} /></mesh>
      <mesh position={[0.2,1.62,-3.91]}><boxGeometry args={[0.9,0.5,0.01]} /><meshStandardMaterial color="#0e0906" roughness={0.95} /></mesh>

      {/* ── Wall Safe (right wall) ── */}
      <WallSafe isOpen={safeOpen} />

      {/* ── Window ── */}
      <mesh position={[3.91,2.0,1.6]}><boxGeometry args={[0.07,1.4,1.05]} /><meshStandardMaterial color="#1e1208" roughness={0.85} /></mesh>
      <mesh position={[3.9,2.0,1.6]}><boxGeometry args={[0.02,1.15,0.85]} /><meshStandardMaterial color="#1a2535" transparent opacity={0.25} metalness={0.3} /></mesh>
      <mesh position={[3.89,2.0,1.6]}><boxGeometry args={[0.035,1.15,0.025]} /><meshStandardMaterial color="#1e1208" /></mesh>
      <mesh position={[3.89,2.0,1.6]}><boxGeometry args={[0.035,0.025,0.85]} /><meshStandardMaterial color="#1e1208" /></mesh>
      <mesh position={[3.78,1.32,1.6]}><boxGeometry args={[0.22,0.04,1.1]} /><meshStandardMaterial color="#1e1208" roughness={0.8} /></mesh>

      {/* ── Filing cabinet ── */}
      <mesh position={[3.42,0.7,-2.6]} castShadow><boxGeometry args={[0.65,1.4,0.55]} /><meshStandardMaterial color="#1e1208" roughness={0.85} /></mesh>
      {[0.12,0.48,0.84,1.18].map((y,i)=>(
        <group key={i}>
          <mesh position={[3.1,y,-2.6]}><boxGeometry args={[0.02,0.28,0.5]} /><meshStandardMaterial color="#140e06" roughness={0.9} /></mesh>
          <mesh position={[3.1,y+0.04,-2.6]}><sphereGeometry args={[0.016,8,8]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.2} /></mesh>
        </group>
      ))}

      {/* ── Fireplace ── */}
      <mesh position={[-3.9,1.1,2.85]} castShadow><boxGeometry args={[0.22,2.2,1.6]} /><meshStandardMaterial color="#141008" roughness={0.95} /></mesh>
      <mesh position={[-3.72,2.28,2.85]}><boxGeometry args={[0.52,0.1,1.8]} /><meshStandardMaterial color="#1e1208" roughness={0.85} /></mesh>
      <mesh position={[-3.82,0.55,2.85]}><boxGeometry args={[0.12,1.0,1.1]} /><meshStandardMaterial color="#0a0604" roughness={1} /></mesh>
      <mesh position={[-3.85,0.28,2.85]}><boxGeometry args={[0.02,0.35,0.85]} /><meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={5} transparent opacity={0.75} /></mesh>
      <mesh position={[-3.85,0.32,2.85]}><boxGeometry args={[0.02,0.28,0.65]} /><meshStandardMaterial color="#ff8800" emissive="#ff8800" emissiveIntensity={6} transparent opacity={0.7} /></mesh>
      {[-0.2,0,0.2].map((z,i)=>(
        <mesh key={i} position={[-3.84,0.12,2.85+z]} rotation={[0,i*0.3,Math.PI/2]}>
          <cylinderGeometry args={[0.05,0.055,0.7,8]} /><meshStandardMaterial color="#1a0a02" roughness={0.95} />
        </mesh>
      ))}
      {/* Mantle items */}
      <mesh position={[-3.65,2.35,2.6]}><boxGeometry args={[0.06,0.18,0.06]} /><meshStandardMaterial color="#c8b89a" roughness={0.9} /></mesh>
      <mesh position={[-3.65,2.4,2.85]}><boxGeometry args={[0.06,0.2,0.16]} /><meshStandardMaterial color="#1e1208" roughness={0.85} /></mesh>

      {/* ── Candle sconces ── */}
      {[[-3.9,2.1,-0.8],[3.9,2.1,-0.8],[0.2,2.1,-3.9],[-1.8,2.1,3.8]].map((pos,i)=>(
        <group key={i}>
          <mesh position={pos}><boxGeometry args={[0.06,0.06,0.12]} /><meshStandardMaterial color="#8B6914" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[pos[0],pos[1]+0.06,pos[2]+0.04]}><cylinderGeometry args={[0.016,0.02,0.12,8]} /><meshStandardMaterial color="#e8e0d0" roughness={0.9} /></mesh>
          <mesh position={[pos[0],pos[1]+0.13,pos[2]+0.04]}><sphereGeometry args={[0.014,6,6]} /><meshStandardMaterial color="#ffdd88" emissive="#ffaa22" emissiveIntensity={4} /></mesh>
        </group>
      ))}

      {/* ── Map on back wall ── */}
      <mesh position={[2.6,2.1,-3.92]}><boxGeometry args={[0.85,0.62,0.012]} /><meshStandardMaterial color="#c8b07a" roughness={0.9} /></mesh>

      {/* ── Founding year note on desk ── */}
      <mesh position={[1.5, 0.83, -1.55]} rotation={[-0.05, 0.15, 0]}>
        <boxGeometry args={[0.24, 0.008, 0.16]} />
        <meshStandardMaterial color="#d4c09a" roughness={1} />
      </mesh>
      <Text
        position={[1.5, 0.845, -1.55]}
        fontSize={0.028}
        color="#2a1a08"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI/2, 0, 0.15]}
      >
        {"Est. 1824\nPrison Records\nDuskbound Penitentiary"}
      </Text>

      {/* ── Small side table ── */}
      <mesh position={[-2.0,0.62,2.0]} castShadow><boxGeometry args={[0.7,0.05,0.5]} /><meshStandardMaterial {...wood} /></mesh>
      {[[-2.28,0.28,1.82],[-1.72,0.28,1.82],[-2.28,0.28,2.18],[-1.72,0.28,2.18]].map((p,i)=>(
        <mesh key={i} position={p} castShadow><cylinderGeometry args={[0.025,0.025,0.56,8]} /><meshStandardMaterial {...wood} /></mesh>
      ))}
      {/* Candle on side table */}
      <mesh position={[-2.0,0.68,2.0]}><cylinderGeometry args={[0.04,0.06,0.04,10]} /><meshStandardMaterial color="#8B6914" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[-2.0,0.71,2.0]}><cylinderGeometry args={[0.018,0.022,0.12,8]} /><meshStandardMaterial color="#e8e0d0" roughness={0.9} /></mesh>
      <mesh position={[-2.0,0.78,2.0]}><sphereGeometry args={[0.015,6,6]} /><meshStandardMaterial color="#ffdd88" emissive="#ffaa22" emissiveIntensity={3} /></mesh>
      <pointLight position={[-2.0,0.85,2.0]} intensity={3} color="#ff9030" distance={2.5} decay={2} />

      {/* ── Chest ── */}
      <Chest isOpen={chestOpen} isNear={chestNear} onClick={onChest} />

      {/* ── Floating key ── */}
      <FloatingKey visible={keyVisible} isNear={keyNear} onClick={onKey} />

      {/* ── Exit door ── */}
      <ExitDoor unlocked={doorUnlocked} isNear={doorNear} onClick={onDoor} />

      {/* ── Sequential puzzle orbs ── */}
      {PUZZLE_STEPS.map(ps => (
        <Orb
          key={ps.id}
          position={ps.position}
          label={ps.label}
          isSolved={solvedSteps.has(ps.id)}
          isActive={activeStep === ps.step}
          isNear={nearId === ps.id}
          onClick={() => onInteract(ps.id)}
        />
      ))}
    </group>
  )
}

// ── Camera capture ─────────────────────────────────────────────────────────
function CameraCapture({ cameraRef }) {
  const { camera } = useThree()
  useEffect(() => { cameraRef.current = camera }, [camera])
  return null
}

// ── FPP Controls ──────────────────────────────────────────────────────────
function FPPControls({ controlsRef, onNearId, activeStep, solvedSteps, chestOpen, keyCollected, doorUnlocked }) {
  const { camera } = useThree()
  const keys = useRef({})
  const front = useRef(new THREE.Vector3())
  const side  = useRef(new THREE.Vector3())
  const dir   = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.position.set(0, 1.65, 2.8)
    const dn = e => { keys.current[e.code] = true }
    const up = e => { keys.current[e.code] = false }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked) return

    front.current.set(0, 0,
      (keys.current['KeyS'] || keys.current['ArrowDown']  ? 1 : 0) -
      (keys.current['KeyW'] || keys.current['ArrowUp']    ? 1 : 0)
    )
    side.current.set(
      (keys.current['KeyA'] || keys.current['ArrowLeft']  ? 1 : 0) -
      (keys.current['KeyD'] || keys.current['ArrowRight'] ? 1 : 0),
      0, 0
    )
    dir.current.subVectors(front.current, side.current).normalize().multiplyScalar(3.2 * delta).applyEuler(camera.rotation)
    camera.position.x = THREE.MathUtils.clamp(camera.position.x + dir.current.x, -3.55, 3.55)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + dir.current.z, -3.55, 3.55)
    camera.position.y = 1.65

    const pos = camera.position
    let nearest = null, minDist = 2.6

    // Active puzzle only
    const activePuzzle = PUZZLE_STEPS.find(p => p.step === activeStep && !solvedSteps.has(p.id))
    if (activePuzzle) {
      const d = pos.distanceTo(new THREE.Vector3(...activePuzzle.position))
      if (d < minDist) { nearest = activePuzzle.id; minDist = d }
    }

    // Chest (after all 5 puzzles)
    if (solvedSteps.size >= 5 && !chestOpen) {
      const d = pos.distanceTo(new THREE.Vector3(...CHEST_POS))
      if (d < 2.0) { nearest = 'chest'; minDist = d }
    }

    // Key
    if (chestOpen && !keyCollected) {
      const d = pos.distanceTo(new THREE.Vector3(...KEY_POS))
      if (d < 2.0) { nearest = 'key'; minDist = d }
    }

    // Door
    if (doorUnlocked) {
      const d = pos.distanceTo(new THREE.Vector3(...DOOR_POS))
      if (d < 2.4) { nearest = 'door'; minDist = d }
    }

    onNearId(nearest)
  })
  return null
}

// ── Main GameRoom ─────────────────────────────────────────────────────────
export default function GameRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const {
    startSession, solvePuzzle: ctxSolvePuzzle, pickUpItem,
    openPuzzle, closePuzzle, activePuzzleId,
    status, puzzles, room, timeRemaining, score, solvedCount, totalPuzzles,
    pauseTimer, resumeTimer
  } = useGame()

  const controlsRef = useRef()
  const cameraRef   = useRef()

  const [loading, setLoading]     = useState(true)
  const [entered, setEntered]     = useState(false)
  const [nearId, setNearId]       = useState(null)
  const [paused, setPaused]       = useState(false)
  const [showQuit, setShowQuit]   = useState(false)
  const [solvedFlash, setSolvedFlash] = useState('')

  // Game flow
  const [solvedSteps, setSolvedSteps] = useState(new Set())
  const [activeStep, setActiveStep]   = useState(1)
  const [safeData]  = useState(() => SAFE_CLUES[Math.floor(Math.random() * SAFE_CLUES.length)])
  const [chestCode] = useState(() => String(Math.floor(1000 + Math.random() * 9000)))
  const [chestOpen, setChestOpen]     = useState(false)
  const [keyVisible, setKeyVisible]   = useState(false)
  const [keyCollected, setKeyCollected] = useState(false)
  const [doorUnlocked, setDoorUnlocked] = useState(false)
  const [showChestModal, setShowChestModal] = useState(false)
  const [activePuzzleData, setActivePuzzleData] = useState(null)

  // Stale closure refs
  const enteredRef     = useRef(false)
  const pausedRef      = useRef(false)
  const activePRef     = useRef(null)
  const nearIdRef      = useRef(null)
  const solvedRef      = useRef(new Set())
  const activeStepRef  = useRef(1)

  useEffect(() => { enteredRef.current = entered }, [entered])
  useEffect(() => { pausedRef.current  = paused  }, [paused])
  useEffect(() => { activePRef.current = activePuzzleId }, [activePuzzleId])
  useEffect(() => { nearIdRef.current  = nearId  }, [nearId])
  useEffect(() => { solvedRef.current  = solvedSteps }, [solvedSteps])
  useEffect(() => { activeStepRef.current = activeStep }, [activeStep])

  useEffect(() => { loadRoom() }, [roomId])
  useEffect(() => {
    if (status === 'escaped' || status === 'failed') navigate('/end', { replace: true })
  }, [status])
  useEffect(() => {
    if (activePuzzleId) controlsRef.current?.unlock()
    else if (entered && !paused) setTimeout(() => controlsRef.current?.lock(), 300)
  }, [activePuzzleId])

  useEffect(() => {
    const fn = e => {
      if (e.code === 'Escape' && enteredRef.current && !activePRef.current) {
        setPaused(v => {
          const next = !v
          if (next) {
            controlsRef.current?.unlock()
            pauseTimer()
          } else {
            setTimeout(() => controlsRef.current?.lock(), 100)
            resumeTimer()
          }
          return next
        })
      }
      if (e.code === 'KeyE' && enteredRef.current && !activePRef.current && !pausedRef.current) {
        e.preventDefault()
        const near = nearIdRef.current
        if (!near) return

        if (near === 'chest') {
          controlsRef.current?.unlock()
          setShowChestModal(true)
          return
        }
        if (near === 'key') {
          setKeyVisible(false); setKeyCollected(true); setDoorUnlocked(true)
          pickUpItem({ id: 'escape_key', name: "The Warden's Key", icon: '🗝', description: 'The key to escape' })
          return
        }
        if (near === 'door') {
          navigate('/end', { state: { escaped: true } })
          return
        }

        // Puzzle step
        const step = PUZZLE_STEPS.find(p => p.id === near && !solvedRef.current.has(p.id))
        if (!step) return
        controlsRef.current?.unlock()
        setActivePuzzleData(buildPuzzleData(step))
        openPuzzle(step.id)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [openPuzzle, pickUpItem, navigate])

  function buildPuzzleData(step) {
    const base = { ...step }
    if (step.type === 'safe') {
      base.solution = safeData.code
      base.safeClue = safeData.clue
      base.chestCode = chestCode
    }
    return base
  }

  async function loadRoom() {
    setLoading(true)
    try {
      const { data: r } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      const dummyPuzzles = PUZZLE_STEPS.map(p => ({ id: p.id, points: p.points, type: p.type }))
      // Ensure duration_min is always set
      const room = { ...r, duration_min: r?.duration_min || 30 }
      await startSession(room, dummyPuzzles)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const handleSolve = async (stepId) => {
    const step = PUZZLE_STEPS.find(p => p.id === stepId)
    if (!step) return
    await ctxSolvePuzzle(stepId, step.points)
    const next = new Set(solvedSteps); next.add(stepId)
    setSolvedSteps(next)
    setActiveStep(step.step + 1)
    closePuzzle()
    setActivePuzzleData(null)
    setSolvedFlash(`Puzzle ${step.step} solved!`)
    setTimeout(() => setSolvedFlash(''), 2500)
    setTimeout(() => { if (!paused) controlsRef.current?.lock() }, 400)
  }

  const handleChestSubmit = (code) => {
    if (code === chestCode) {
      setChestOpen(true); setKeyVisible(true); setShowChestModal(false)
      setTimeout(() => { if (!paused) controlsRef.current?.lock() }, 300)
    }
  }

  const nearLabel =
    PUZZLE_STEPS.find(p => p.id === nearId)?.label ||
    (nearId === 'chest' ? 'Open Chest' : nearId === 'key' ? 'Pick up Key' : nearId === 'door' ? 'Escape!' : '')

  const renderActivePuzzle = () => {
    if (!activePuzzleData || !activePuzzleId) return null
    const onClose = () => { closePuzzle(); setActivePuzzleData(null); setTimeout(() => { if (!paused) controlsRef.current?.lock() }, 300) }
    const onSolve = () => handleSolve(activePuzzleId)
    switch (activePuzzleData.type) {
      case 'riddle': return <RiddlePuzzle puzzle={activePuzzleData} onClose={onClose} onSolve={onSolve} />
      case 'math':   return <MathPuzzle   puzzle={activePuzzleData} onClose={onClose} onSolve={onSolve} />
      case 'jigsaw': return <JigsawPuzzle puzzle={activePuzzleData} onClose={onClose} onSolve={onSolve} onRevealSafeClue={() => {}} />
      case 'safe':   return <SafePuzzle   puzzle={activePuzzleData} onClose={onClose} onSolve={onSolve} />
      default: return null
    }
  }

  // Chest modal with its own code input
  const ChestModal = () => {
    const [digits, setDigits] = useState(['','','',''])
    const [error, setError]   = useState('')
    const refs = [useRef(),useRef(),useRef(),useRef()]

    const setD = (i, val) => {
      if (!/^\d?$/.test(val)) return
      const n = [...digits]; n[i] = val; setDigits(n); setError('')
      if (val && i < 3) refs[i+1].current?.focus()
    }
    const onK = (i, e) => { if (e.key==='Backspace' && !digits[i] && i>0) refs[i-1].current?.focus() }
    const submit = () => {
      const code = digits.join('')
      if (code.length < 4) { setError('Enter all 4 digits.'); return }
      if (code === chestCode) { handleChestSubmit(code) }
      else { setError('Wrong code. Check the safe note.'); setDigits(['','','','']); refs[0].current?.focus() }
    }

    return (
      <motion.div className="puzzle-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="puzzle-modal" style={{ maxWidth: 420 }}
          initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}>
          <div className="puzzle-modal-header">
            <div><p className="puzzle-type-label">chest lock</p><h2 className="puzzle-title">The Iron Chest</h2></div>
            <button className="puzzle-close" onClick={() => { setShowChestModal(false); setTimeout(()=>controlsRef.current?.lock(),200) }}>✕</button>
          </div>
          <div className="puzzle-content">
            <p style={{ fontFamily:'var(--font-body)', fontStyle:'italic', fontSize:'1rem', color:'var(--text-secondary)', marginBottom:16, lineHeight:1.6 }}>
              A heavy iron chest sealed with a 4-digit combination. The code was hidden in the safe...
            </p>
            <div className="code-dials" style={{ justifyContent:'center', display:'flex', gap:12, marginBottom:12 }}>
              {digits.map((d,i) => (
                <input key={i} ref={refs[i]} className="code-dial" type="text" inputMode="numeric"
                  maxLength={1} value={d} onChange={e=>setD(i,e.target.value)}
                  onKeyDown={e=>onK(i,e)} autoFocus={i===0} />
              ))}
            </div>
            {error && <p className="puzzle-error">{error}</p>}
            <button className="btn btn-primary puzzle-submit" onClick={submit}>Unlock Chest ›</button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="room-loading">
        <div className="home-bg"><div className="bg-radial-glow" /><div className="vignette" /></div>
        <motion.div className="room-loading-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="loading-candle">🕯</div>
          <p className="loading-text">The fog rolls in...</p>
          <div className="loading-dots">
            {[0,1,2].map(i => (
              <motion.span key={i} className="loading-dot" animate={{ opacity:[0.2,1,0.2] }} transition={{ duration:1.2, repeat:Infinity, delay:i*0.2 }} />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="game-room-3d">
      <Canvas shadows camera={{ fov: 72, near: 0.08, far: 60 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.52 }}
        style={{ position: 'absolute', inset: 0 }}>
        <fog attach="fog" args={['#070503', 7, 22]} />
        <CameraCapture cameraRef={cameraRef} />
        <WardensStudy
          solvedSteps={solvedSteps}
          activeStep={activeStep}
          onInteract={id => {
            const step = PUZZLE_STEPS.find(p => p.id === id)
            if (!step) return
            controlsRef.current?.unlock()
            setActivePuzzleData(buildPuzzleData(step))
            openPuzzle(id)
          }}
          nearId={nearId}
          chestOpen={chestOpen}
          chestNear={nearId === 'chest'}
          onChest={() => { controlsRef.current?.unlock(); setShowChestModal(true) }}
          keyVisible={keyVisible}
          keyNear={nearId === 'key'}
          onKey={() => { setKeyVisible(false); setKeyCollected(true); setDoorUnlocked(true); pickUpItem({ id:'escape_key', name:"The Warden's Key", icon:'🗝', description:'The key to escape' }) }}
          doorUnlocked={doorUnlocked}
          doorNear={nearId === 'door'}
          onDoor={() => navigate('/end', { state: { escaped: true } })}
          safeOpen={solvedSteps.has('p5')}
        />
        <FPPControls
          controlsRef={controlsRef}
          onNearId={setNearId}
          activeStep={activeStep}
          solvedSteps={solvedSteps}
          chestOpen={chestOpen}
          keyCollected={keyCollected}
          doorUnlocked={doorUnlocked}
        />
        <PointerLockControls ref={controlsRef} />
      </Canvas>

      {entered && !paused && <GameHUD onQuit={() => { controlsRef.current?.unlock(); setPaused(true); pauseTimer() }} />}

      {/* Crosshair */}
      {entered && !activePuzzleId && !showChestModal && (
        <div className={`crosshair ${nearId ? 'crosshair-active' : ''}`}>
          <div className="ch-h" /><div className="ch-v" />
        </div>
      )}

      {/* Interact prompt */}
      <AnimatePresence>
        {entered && nearId && !activePuzzleId && !showChestModal && (
          <motion.div className="interact-prompt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <span className="interact-key">E</span>
            <span>{nearLabel}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {entered && !paused && !activePuzzleId && (
        <div className="step-indicator">
          {PUZZLE_STEPS.map(p => (
            <div key={p.id} className={`step-dot ${solvedSteps.has(p.id) ? 'done' : activeStep === p.step ? 'active' : 'locked'}`} title={p.label} />
          ))}
          <div className={`step-dot ${chestOpen ? 'done' : solvedSteps.size >= 5 ? 'active' : 'locked'}`} title="Chest" />
        </div>
      )}

      {/* Enter screen */}
      <AnimatePresence>
        {!entered && (
          <motion.div className="enter-screen" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
            onClick={() => { setEntered(true); controlsRef.current?.lock() }}>
            <div className="enter-candle">🕯</div>
            <h2 className="enter-title">ENTER THE HOLLOW</h2>
            <p className="enter-room">{room?.name || "The Warden's Study"}</p>
            <p className="enter-sub">Click to begin · WASD to move · Mouse to look · E to interact · ESC to pause</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls hint */}
      {entered && !activePuzzleId && !showChestModal && (
        <div className="controls-hint">
          <span>WASD</span><span>·</span><span>Mouse Look</span><span>·</span><span>E Interact</span><span>·</span><span>ESC Pause</span>
        </div>
      )}

      {/* Active puzzle */}
      <AnimatePresence>{renderActivePuzzle()}</AnimatePresence>

      {/* Chest modal */}
      <AnimatePresence>{showChestModal && <ChestModal />}</AnimatePresence>

      {/* Solved flash */}
      <AnimatePresence>
        {solvedFlash && (
          <motion.div className="solve-notification" initial={{ opacity:0, y:30, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-20 }}>
            ✓ {solvedFlash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key collected */}
      <AnimatePresence>
        {keyCollected && doorUnlocked && !nearId && (
          <motion.div className="key-collected-banner" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ delay:0.3 }}>
            🗝 Key collected! Find the exit door and escape!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause menu */}
      <AnimatePresence>
        {paused && (
          <motion.div className="pause-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="pause-menu" initial={{ scale:0.92, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.92, opacity:0, y:20 }} transition={{ type:'spring', stiffness:300, damping:30 }}>
              <div className="pause-header">
                <span className="pause-candle">🕯</span>
                <h2 className="pause-title">Paused</h2>
                <p className="pause-room">{room?.name}</p>
              </div>
              <div className="pause-stats">
                <div className="pause-stat"><span className="pause-stat-label">Time Left</span><span className="pause-stat-value" style={{ color:'var(--gold-main)' }}>{String(Math.floor(timeRemaining/60)).padStart(2,'0')}:{String(timeRemaining%60).padStart(2,'0')}</span></div>
                <div className="pause-stat"><span className="pause-stat-label">Score</span><span className="pause-stat-value">{score.toLocaleString()}</span></div>
                <div className="pause-stat"><span className="pause-stat-label">Step</span><span className="pause-stat-value">{Math.min(activeStep-1,5)} / 5</span></div>
              </div>
              <div className="pause-actions">
                <button className="btn btn-primary pause-btn" onClick={() => { setPaused(false); controlsRef.current?.lock(); resumeTimer() }}>▶ &nbsp; Resume</button>
                <button className="btn pause-btn" style={{ borderColor:'var(--failed-text)', color:'var(--failed-text)' }} onClick={() => setShowQuit(true)}>✕ &nbsp; Quit Room</button>
              </div>
              <p className="pause-hint">Press ESC to resume</p>
            </motion.div>
            <AnimatePresence>
              {showQuit && (
                <motion.div className="quit-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <motion.div className="quit-dialog" initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}>
                    <h3 className="quit-title">Abandon the room?</h3>
                    <p className="quit-body">The fog will swallow your progress.</p>
                    <div className="quit-actions">
                      <button className="btn btn-ghost" onClick={() => setShowQuit(false)}>Stay</button>
                      <button className="btn" style={{ borderColor:'var(--failed-text)', color:'var(--failed-text)' }} onClick={() => navigate('/game-menu')}>Leave</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
