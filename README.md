# 🐦 Voice Runner

A browser-based game that collects prosodic speech data from Caribbean English and Patois speakers for emergency system validation research.

## Overview

Voice Runner is a T-Rex runner-style game where players speak phrases to break obstacles. As the game progresses and pressure mounts, the system captures the natural prosodic changes in speech patterns under cognitive load—data that's directionally similar to emergency speech patterns.

### Research Purpose

This game supports TRIDENT (Triage via Dual-stream Emergency Natural language and Tone) research by collecting:
- Caribbean-accented English speech
- Jamaican Patois (Basilect/Mesolect/Acrolect)
- Speech under varying cognitive load conditions
- Natural code-switching patterns

## Features

- **Offline-First PWA**: Works without internet, syncs when connected
- **Mobile-Optimized**: Designed for WhatsApp distribution on mid-range Android devices
- **Privacy-Focused**: Anonymous data collection with local-first storage
- **Gamified Collection**: Engaging gameplay encourages multiple sessions
- **Multi-Register Corpus**: 75+ phrases across linguistic registers and domains

## Tech Stack

### Frontend
- Vanilla JavaScript (no heavy frameworks)
- Canvas-based game rendering
- Web Audio API for recording
- IndexedDB for offline storage
- Service Worker for PWA functionality

### Backend
- FastAPI (Python)
- Cloudflare R2 for audio storage
- Supabase PostgreSQL (optional)

### Hosting
- Cloudflare Pages (frontend)
- Fly.io (backend API)

## Project Structure

```
voice-runner/
├── index.html          # Main HTML entry point
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
├── css/
│   └── styles.css     # Main stylesheet
├── js/
│   ├── storage.js     # IndexedDB wrapper & sync
│   ├── phrases.js     # Phrase corpus with metadata
│   ├── audio.js       # Microphone & voice detection
│   ├── game.js        # Canvas game engine
│   └── app.js         # Main app controller
├── assets/
│   ├── icon-192.png   # PWA icon
│   └── icon-512.png   # PWA icon large
└── backend/
    ├── main.py        # FastAPI server
    └── requirements.txt
```

## Quick Start

### Frontend Development

```bash
# Serve locally (any static server works)
cd voice-runner
python -m http.server 8080

# Or use Node
npx serve .
```

Visit `http://localhost:8080`

### Backend Development

```bash
cd voice-runner/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 8000
```

### Environment Variables (Backend)

```bash
# Storage type: "local" or "r2"
STORAGE_TYPE=local

# Local storage path
LOCAL_STORAGE_PATH=./data

# Cloudflare R2 (if using)
R2_BUCKET=voice-runner-recordings
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
```

## Deployment

### Frontend (Cloudflare Pages)

1. Push to GitHub
2. Connect repo to Cloudflare Pages
3. Build command: (none needed)
4. Output directory: `/`

### Backend (Fly.io)

```bash
cd backend

# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

## Phrase Corpus Design

Phrases are categorized by:

| Dimension | Values |
|-----------|--------|
| **Register** | ACR (Acrolect), MES (Mesolect), BAS (Basilect) |
| **Category** | NEU (Neutral), EMG (Emergency), LOC (Location), MED (Medical), NUM (Numbers) |
| **Tier** | 1-5 (syllable count/complexity) |
| **Phonetic** | TH-stopping, H-dropping, consonant clusters, vowel shifts |

## Data Collection

Each recording captures:
- Audio (WebM/Opus, ~8KB per phrase)
- Phrase metadata (ID, text, category, register)
- Game context (level, speed, score)
- Timing (speech onset, duration)
- Audio quality (peak amplitude, clipping)

## Distribution Strategy

Primary distribution via WhatsApp:
1. Church coordinator receives link
2. Shares in congregation WhatsApp group
3. Members play in mobile browser
4. Optional: install as PWA to home screen

Target: 50+ unique speakers, 5000+ utterances

## Privacy & Ethics

- All data is anonymized (UUID-based player IDs)
- No PII collected (demographics optional)
- Audio stored securely, used only for research
- Participants can skip any phrase
- Clear consent flow before recording

## Contributing

This is a research project by SMG-Labs for the Caribbean Voices AI Hackathon.

## License

Research use only. Contact for commercial licensing.

---

Built with ❤️ for Caribbean communities
