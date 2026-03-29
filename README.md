# Momentum ⚡

**A voice-first ADHD companion for kids** — built to protect self-worth, build competence through tiny wins, and change the environment around the child.

---

## What it does

Momentum helps children with ADHD plan, start, and stay focused on tasks through:

- 🎙️ **Voice-first task capture** — talk to Zap, the AI companion, to add tasks
- 🗺️ **Micro-step guidance** — every task broken into bite-sized, doable steps
- ⏱️ **Gentle nudge system** — child estimates time, Zap checks in at 10% and 40% elapsed
- 💛 **Feelings check-in** — 12-emotion grid, voice response from Zap to calm the child
- ⭐ **Wins & Brave Timeline** — celebrates effort, not just outcomes
- 🤝 **Social rehearsal** — practice real-life scenarios with Zap
- 📅 **Smart calendar** — add events (e.g. soccer match) and get auto-generated prep tasks
- 👨‍👩‍👧 **Parent Dashboard** — PIN-protected view with insights, alerts, and teacher notes

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 App Router · React · TypeScript · Tailwind CSS v4 · Framer Motion |
| Backend | FastAPI · Python · SQLite |
| AI | Anthropic Claude (claude-haiku-4-5) |
| Voice | ElevenLabs STT (Scribe v1) + TTS (Turbo v2) |

---

## Getting Started

### Backend

```bash
cd /path/to/Momentumv2
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Add your keys
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and ELEVENLABS_API_KEY

python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend1
npm install
npm run dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001)

---

## Demo

Load demo data from **Settings → 🎬 Load Demo Data** to populate:
- Alex (age 10) profile with struggles
- 2 demo tasks: Math Homework + Soccer Match Prep
- 6 emotional check-ins, 7 wins, calendar events

Default parent PIN: **1234**

---

## Design Principles

> "AI should not try to fix the child. It should protect self-worth, build competence through tiny wins, and change the environment around the child."

Built with ❤️ for the ADHD Hackathon 2026.
