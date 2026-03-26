import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Settings.css'

const tabs = ['Audio', 'Display', 'Controls', 'Gameplay', 'Accessibility']

const defaults = {
  volume: 80, music: 60, sfx: 70,
  narration: true, hints: true, timer: true, autosave: false,
  difficulty: 'Normal',
  fullscreen: false, reducedMotion: false, highContrast: false,
  fontSize: 'Medium',
  colorblind: 'None',
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Audio')
  const [settings, setSettings] = useState(defaults)

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  return (
    <div className="settings-page noise-overlay">
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
        <h1 className="settings-title-header">Settings</h1>
        <div style={{ minWidth: 120 }} />
      </motion.header>

      <motion.div
        className="settings-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Sidebar */}
        <aside className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`settings-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </aside>

        {/* Panel */}
        <main className="settings-panel">
          {activeTab === 'Audio' && (
            <div className="settings-section">
              <p className="section-label">AUDIO SETTINGS</p>

              <SettingSlider label="Volume" value={settings.volume} onChange={v => set('volume', v)} />
              <SettingSlider label="Music" sub="Ambient room music" value={settings.music} onChange={v => set('music', v)} />
              <SettingSlider label="Sound Effects" value={settings.sfx} onChange={v => set('sfx', v)} />
              <SettingToggle label="Narration" sub="Voiced story clues" value={settings.narration} onChange={v => set('narration', v)} />

              <p className="section-label" style={{ marginTop: 32 }}>GAMEPLAY</p>
              <SettingToggle label="Hint System" value={settings.hints} onChange={v => set('hints', v)} />
              <SettingSelect
                label="Difficulty"
                value={settings.difficulty}
                options={['Easy', 'Normal', 'Hard', 'Nightmare']}
                onChange={v => set('difficulty', v)}
              />
              <SettingToggle label="Show Timer" value={settings.timer} onChange={v => set('timer', v)} />
              <SettingToggle label="Autosave" value={settings.autosave} onChange={v => set('autosave', v)} />
            </div>
          )}

          {activeTab === 'Display' && (
            <div className="settings-section">
              <p className="section-label">DISPLAY SETTINGS</p>
              <SettingToggle label="Fullscreen" value={settings.fullscreen} onChange={v => set('fullscreen', v)} />
              <SettingToggle label="Reduced Motion" sub="Disables heavy animations" value={settings.reducedMotion} onChange={v => set('reducedMotion', v)} />
              <SettingSelect label="Font Size" value={settings.fontSize} options={['Small', 'Medium', 'Large']} onChange={v => set('fontSize', v)} />
            </div>
          )}

          {activeTab === 'Controls' && (
            <div className="settings-section">
              <p className="section-label">CONTROLS</p>
              <div className="keybind-row"><span>Hint</span><kbd>H</kbd></div>
              <div className="keybind-row"><span>Inventory</span><kbd>I</kbd></div>
              <div className="keybind-row"><span>Examine</span><kbd>E</kbd></div>
              <div className="keybind-row"><span>Pause</span><kbd>Esc</kbd></div>
              <div className="keybind-row"><span>Map</span><kbd>M</kbd></div>
            </div>
          )}

          {activeTab === 'Gameplay' && (
            <div className="settings-section">
              <p className="section-label">GAMEPLAY</p>
              <SettingToggle label="Hint System" value={settings.hints} onChange={v => set('hints', v)} />
              <SettingSelect label="Difficulty" value={settings.difficulty} options={['Easy', 'Normal', 'Hard', 'Nightmare']} onChange={v => set('difficulty', v)} />
              <SettingToggle label="Show Timer" value={settings.timer} onChange={v => set('timer', v)} />
              <SettingToggle label="Autosave" value={settings.autosave} onChange={v => set('autosave', v)} />
            </div>
          )}

          {activeTab === 'Accessibility' && (
            <div className="settings-section">
              <p className="section-label">ACCESSIBILITY</p>
              <SettingToggle label="High Contrast" value={settings.highContrast} onChange={v => set('highContrast', v)} />
              <SettingToggle label="Reduced Motion" value={settings.reducedMotion} onChange={v => set('reducedMotion', v)} />
              <SettingSelect label="Colorblind Mode" value={settings.colorblind} options={['None', 'Deuteranopia', 'Protanopia', 'Tritanopia']} onChange={v => set('colorblind', v)} />
              <SettingSelect label="Font Size" value={settings.fontSize} options={['Small', 'Medium', 'Large']} onChange={v => set('fontSize', v)} />
            </div>
          )}
        </main>
      </motion.div>
    </div>
  )
}

function SettingSlider({ label, sub, value, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {sub && <span className="setting-sub">{sub}</span>}
      </div>
      <div className="slider-wrap">
        <input
          type="range" min="0" max="100" value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="setting-slider"
        />
        <span className="slider-val">{value}</span>
      </div>
    </div>
  )
}

function SettingToggle({ label, sub, value, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {sub && <span className="setting-sub">{sub}</span>}
      </div>
      <button
        className={`toggle ${value ? 'toggle-on' : ''}`}
        onClick={() => onChange(!value)}
        aria-checked={value}
        role="switch"
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  )
}

function SettingSelect({ label, value, options, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
      </div>
      <select
        className="setting-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
