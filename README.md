# 🕯 Duskbound — A Browser-Based Escape Room Game

> *"The sun stopped setting. Can you escape before it does?"*

Duskbound is a first-person perspective (FPP) browser-based escape room puzzle game set in a cursed, fog-drenched town frozen in eternal twilight. Players explore fully 3D environments, solve interconnected puzzles, and race against the clock to escape before time runs out.

![Duskbound](https://img.shields.io/badge/Status-Active%20Development-c9a84c?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge&logo=three.js)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)

---

## 📖 Table of Contents

- [About the Game](#about-the-game)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Gameplay](#gameplay)
- [Puzzle System](#puzzle-system)
- [Rooms](#rooms)
- [Player Progression](#player-progression)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎮 About the Game

The town of **Duskbound** is an ancient, fog-shrouded settlement cursed to exist in permanent twilight — the sun never fully rises, the night never fully falls. Each escape room is a different location within Duskbound, and completing each room reveals a fragment of the truth behind the curse.

Players must navigate fully rendered 3D rooms, find clues, solve puzzles in sequence, and escape before the 30-minute timer runs out. Every session is different — riddles and math equations are randomised each playthrough.

---

## ✨ Features

- **Full 3D first-person exploration** — walk freely around detailed rooms using WASD + mouse look
- **Sequential puzzle system** — only the active puzzle glows; solve them in order to progress
- **5 interconnected puzzle types** — riddles, math equations, jigsaw, code locks, and chest locks
- **Mona Lisa jigsaw puzzle** — 4×4 canvas-based jigsaw using a real painting
- **Dynamic clue system** — clues revealed progressively as puzzles are solved
- **Atmospheric 3D environment** — detailed room with desk, bookshelf, fireplace, evidence board, and more
- **Warm amber lighting** — oil lamp, fireplace flicker, candle sconces, and moonlight
- **Game HUD** — live countdown timer, score, hints, and inventory panel
- **Pause menu** — timer pauses, shows current progress and score
- **Player progression** — XP system with rank titles
- **Badge system** — achievements awarded after each session
- **Supabase authentication** — email/password login required to play
- **Session tracking** — scores, time taken, and hints used saved to database

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite |
| 3D Engine | Three.js + React Three Fiber + Drei |
| Animations | Framer Motion |
| Routing | React Router v7 |
| Auth & Database | Supabase (PostgreSQL + GoTrue Auth) |
| Hosting (planned) | Vercel / Netlify |
| Language | JavaScript (JSX) |

---

## 📁 Project Structure

```
duskbound/
├── public/
├── src/
│   ├── pages/
│   │   ├── HomePage.jsx / .css        # Main menu with fog animation
│   │   ├── AuthPage.jsx / .css        # Login and register
│   │   ├── GameMenu.jsx / .css        # Room selection (6 rooms)
│   │   ├── GameRoom.jsx / .css        # 3D FPP game environment ⭐
│   │   ├── EndScreen.jsx / .css       # Score, badges, leaderboard
│   │   ├── Profile.jsx / .css         # Player stats and logbook
│   │   └── Settings.jsx / .css        # Audio, display, controls
│   ├── components/
│   │   ├── GameHUD.jsx / .css         # Timer, score, hints, inventory
│   │   └── puzzles/
│   │       ├── Puzzles.jsx            # All puzzle types
│   │       └── Puzzles.css
│   ├── lib/
│   │   ├── supabase.js                # Supabase client
│   │   ├── AuthContext.jsx            # Auth state provider
│   │   ├── GameContext.jsx            # Game state engine (timer, score, puzzles)
│   │   └── ProtectedRoute.jsx         # Route guard
│   ├── assets/
│   │   └── monalisa.jpg               # Jigsaw puzzle image
│   └── styles/
│       └── globals.css                # Design system (CSS variables, fonts)
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/RishabhRaushan/duskbound.git
cd duskbound

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project under **Settings → API**.

---

## 🗄 Database Setup

Run the following in your Supabase SQL editor to set up the required tables:

### Tables Required

```sql
-- Profiles (auto-created on signup)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  xp INTEGER DEFAULT 0,
  rank_title TEXT DEFAULT 'The Lost',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  location TEXT,
  difficulty TEXT,
  duration_min INTEGER DEFAULT 30,
  puzzle_count INTEGER,
  is_unlocked BOOLEAN DEFAULT false,
  tag TEXT,
  order_index INTEGER
);

-- Game Sessions
CREATE TABLE game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  room_id TEXT REFERENCES rooms(id),
  status TEXT DEFAULT 'active',
  score INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  time_remaining INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Scores
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  room_id TEXT,
  session_id UUID REFERENCES game_sessions(id),
  points INTEGER,
  time_taken INTEGER,
  hints_used INTEGER,
  escaped BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Puzzle Progress
CREATE TABLE puzzle_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id),
  puzzle_id TEXT,
  is_solved BOOLEAN DEFAULT false,
  solved_at TIMESTAMPTZ
);

-- Inventory Items
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id),
  item_id TEXT,
  item_name TEXT,
  item_description TEXT,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  badge_id TEXT,
  badge_name TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Auto-create Profile on Signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Seed Room Data

```sql
INSERT INTO rooms (id, name, description, location, difficulty, duration_min, puzzle_count, is_unlocked, tag, order_index) VALUES
('wardens-study', 'The Warden''s Study', 'Yellowed confessions line the walls. The warden left in a hurry — or was dragged out.', 'Old Town Prison', 'Novice', 30, 5, true, 'STARTER', 1),
('millers-attic', 'The Miller''s Attic', 'The machinery still groans at midnight. What is it still grinding after all these years?', 'Abandoned Mill', 'Seeker', 35, 8, false, 'LOCKED', 2),
('apothecary', 'The Apothecary''s Secret', 'Every bottle is labeled. Every label is a lie. The cure and the poison look identical.', 'Cursed Medicine Shop', 'Seeker', 40, 9, false, 'LOCKED', 3),
('bell-tower', 'The Bell Tower', 'The bells rang the night the curse began. They haven''t stopped since. Neither has the clock.', 'Church at Town Centre', 'Unshackled', 45, 11, false, 'LOCKED', 4),
('hollow-crypt', 'The Hollow Crypt', 'The dead of Duskbound don''t rest. They wait. And they have questions for the living.', 'Cemetery Underground', 'Duskbreaker', 50, 14, false, 'LOCKED', 5),
('ferrymen-dock', 'The Ferryman''s Dock', 'One boat. One way out. The Ferryman will take you — if you can tell him why you deserve to leave.', 'Foggy Riverside', 'Duskbreaker', 60, 16, false, 'LOCKED', 6);
```

---

## 🎮 Gameplay

### Controls

| Key | Action |
|---|---|
| `W A S D` | Move around the room |
| `Mouse` | Look around (click to lock pointer) |
| `E` | Interact with highlighted objects |
| `ESC` | Pause / resume |

### How to Play

1. **Register** and log in to your account
2. Select **The Warden's Study** from the room menu (only room currently available)
3. Click anywhere on the enter screen to lock your mouse and begin
4. Walk towards the **glowing gold orb** — this is your active puzzle
5. Press **E** to interact and open the puzzle
6. Solve all 5 puzzles in sequence
7. Use the **chest code** revealed by the safe to open the iron chest
8. **Pick up the key** that appears above the chest
9. Walk to the **glowing exit door** and press E to escape!

### HUD Elements

- **Top centre** — countdown timer (30 minutes)
- **Top left** — room name and puzzle progress
- **Top right** — score, hint button, inventory, quit button
- **Bottom centre** — step progress dots and control hints

---

## 🧩 Puzzle System

Room 1 (The Warden's Study) features 5 sequential puzzles:

| Step | Location | Type | Description |
|---|---|---|---|
| 1 | Study Table | Riddle | Randomised riddle — answer points to next location |
| 2 | Chalkboard | Math | Random arithmetic equation (×, ÷, +, −) |
| 3 | Study Table | Riddle | Second randomised riddle — points to photo frame |
| 4 | Photo Frame | Jigsaw | Restore the Mona Lisa — 4×4 grid, 16 pieces |
| 5 | Wall Safe | Code Lock | 4-digit combination — clue revealed after jigsaw |
| 6 | Iron Chest | Chest Lock | Enter code from safe to open chest and find the key |

**Key mechanic:** Only the current active puzzle glows gold. All others are invisible until reached in sequence.

**Safe clue:** The wall safe clue reads *"The year the prison was founded, reversed."* A note on the desk reads **Est. 1824** — reversed to give **4281**.

---

## 🏛 Rooms

| # | Room | Location | Difficulty | Puzzles | Status |
|---|---|---|---|---|---|
| 1 | The Warden's Study | Old Town Prison | Novice | 5 | ✅ Playable |
| 2 | The Miller's Attic | Abandoned Mill | Seeker | 8 | 🔜 Coming Soon |
| 3 | The Apothecary's Secret | Cursed Medicine Shop | Seeker | 9 | 🔜 Coming Soon |
| 4 | The Bell Tower | Church at Town Centre | Unshackled | 11 | 🔜 Coming Soon |
| 5 | The Hollow Crypt | Cemetery Underground | Duskbreaker | 14 | 🔜 Coming Soon |
| 6 | The Ferryman's Dock | Foggy Riverside | Duskbreaker | 16 | 🔜 Coming Soon |

---

## 📈 Player Progression

### Rank System

| Rank | Title |
|---|---|
| Starter | The Lost |
| Level 2 | The Wanderer |
| Level 3 | The Seeker |
| Level 4 | The Unshackled |
| Max | The Duskbreaker |

XP is awarded after each successful escape based on score and hint usage.

### Badges

| Badge | Condition |
|---|---|
| 🧠 Pure Mind | Escaped without using any hints |
| 👁 Sharp Eye | Scored 700+ points in one run |
| ⚡ Fog Dasher | Escaped in under 10 minutes |
| 🗝 The Unshackled | Solved every puzzle in the room |

---

## 🎨 Design System

The UI follows a dark, atmospheric aesthetic inspired by Victorian gothic and candle-lit mystery.

| Token | Value |
|---|---|
| Background | `#080604` |
| Gold Accent | `#c9a84c` |
| Text Cream | `#e8d5a3` |
| Success | `#4a9e6a` |
| Danger | `#9e4a4a` |
| Title Font | Cinzel |
| Display Font | Playfair Display |
| Body Font | Cormorant Garamond |

---

## 🗺 Roadmap

- [x] Full 3D first-person room (The Warden's Study)
- [x] Sequential puzzle system (5 puzzles)
- [x] Mona Lisa jigsaw puzzle
- [x] Wall safe + chest + key + door escape flow
- [x] Timer with pause/resume
- [x] Supabase auth and session tracking
- [x] HUD, pause menu, end screen
- [x] Player progression and badges
- [ ] Profile page wired to live Supabase data
- [ ] Rooms 2–6 built and playable
- [ ] Sound effects and ambient audio
- [ ] Leaderboard page
- [ ] Multiplayer mode
- [ ] Mobile touch controls
- [ ] Deployment to Vercel

---

## 🤝 Contributing

This project is currently in active development. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👥 Team

Built as part of a college project.

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  <em>🕯 "Each room unlocks a fragment of Duskbound's truth. Escape them all to break the curse." 🕯</em>
</p>
