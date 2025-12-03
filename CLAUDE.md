# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voice Runner is a browser-based endless runner game that collects prosodic speech data from Caribbean English and Patois speakers for emergency system validation research (TRIDENT project). Players speak phrases to break obstacles, with the game capturing natural speech patterns under cognitive load.

**Key Goals:**
- Collect Caribbean-accented English and Jamaican Patois speech samples
- Capture speech under varying cognitive load conditions
- Support offline-first gameplay for low-connectivity environments
- Target WhatsApp distribution on mid-range Android devices

## Architecture

### Frontend (Vanilla JavaScript PWA)

The application uses a modular architecture with no heavy frameworks:

**Core Modules** (all use IIFE pattern, expose global objects):
- [js/storage.js](js/storage.js) - IndexedDB wrapper for offline-first data persistence and server sync
- [js/phrases.js](js/phrases.js) - 75+ phrase corpus with tier/category/register metadata
- [js/audio.js](js/audio.js) - Web Audio API recording and voice activity detection
- [js/game.js](js/game.js) - Canvas-based game engine with obstacle physics
- [js/app.js](js/app.js) - Main controller coordinating screen flow and module interactions

**Module Communication:**
- Modules communicate via callback-based architecture (not events)
- Set callbacks using `Module.setCallbacks({ callbackName: handler })`
- Example: `Game.setCallbacks({ gameOver: handleGameOver })` in [js/app.js](js/app.js)
- No direct module-to-module calls; all coordination through app.js

**Data Flow:**
1. User speaks phrase → [js/audio.js](js/audio.js) detects speech
2. Audio triggers `speechEnd` callback → [js/app.js](js/app.js) evaluates match
3. If accepted → [js/app.js](js/app.js) calls `Game.phraseSuccess()`
4. Game updates score → triggers `scoreChange` callback → UI updates
5. Recording saved to IndexedDB via [js/storage.js](js/storage.js)
6. Background sync uploads to backend when online

### Backend (FastAPI + Python)

**API Server** ([backend/main.py](backend/main.py)):
- FastAPI with CORS for cross-origin requests
- Dual storage: local filesystem or Cloudflare R2 (S3-compatible)
- Endpoints: `/api/upload`, `/api/upload/audio`, `/api/stats`, `/api/export`
- Session metadata stored as JSON, audio as WebM files

### Offline-First Strategy

**Service Worker** ([sw.js](sw.js)):
- Caches all static assets on install
- Cache-first strategy for offline play
- Background sync for uploading recordings when connection restored

**IndexedDB Stores** (managed by [js/storage.js](js/storage.js)):
- `recordings` - Audio blobs with phrase metadata
- `sessions` - Game session stats
- `profile` - Optional user demographics
- `pendingUploads` - Queue for offline recordings

## Phrase Corpus Design

Located in [js/phrases.js](js/phrases.js), phrases are categorized by:

| Dimension | Values | Purpose |
|-----------|--------|---------|
| **Tier** | 1-5 | Difficulty/length (1=simple, 5=expert) |
| **Category** | NEU, EMG, LOC, MED, NUM | Domain type |
| **Register** | ACR, MES, BAS | Linguistic register (Standard→Creole) |
| **Phonetic** | TH, HD, CC, VW | Target phonetic features |

**Phrase Selection Logic:**
- Level 1-3 use Tier 1-2, Level 8-10 use Tier 4-5
- Weighted selection favors emergency (EMG) phrases and underused categories
- Recent phrases avoided (10-phrase history buffer)
- See `selectPhrase()` in [js/phrases.js](js/phrases.js:214)

## Development Commands

### Frontend Development

```bash
# Serve locally with Python
python -m http.server 8080

# Or with Node
npx serve .

# Visit http://localhost:8080
```

**Testing notes:**
- No build step required - vanilla JavaScript
- PWA requires HTTPS or localhost for service worker registration
- Use Chrome DevTools > Application > Service Workers to debug offline behavior
- IndexedDB inspection: Chrome DevTools > Application > Storage > IndexedDB

### Backend Development

```bash
cd backend

# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000

# Run with custom storage
STORAGE_TYPE=local LOCAL_STORAGE_PATH=./data uvicorn main:app --reload
```

**Backend endpoints:**
- `GET /` - Health check
- `POST /api/upload` - Upload complete session with recordings
- `POST /api/upload/audio` - Upload single audio file
- `GET /api/stats` - View collection statistics
- `GET /api/export` - Export all data as JSON

### Environment Variables (Backend)

```bash
# Storage configuration
STORAGE_TYPE=local              # "local" or "r2"
LOCAL_STORAGE_PATH=./data       # Local storage directory

# Cloudflare R2 (if using)
R2_BUCKET=voice-runner-recordings
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
```

## Key Implementation Patterns

### Voice Activity Detection

[js/audio.js](js/audio.js) implements a threshold-based VAD system:
- Uses Web Audio API `AnalyserNode` for RMS volume calculation
- Speech threshold: 0.05 RMS, Silence threshold: 0.02 RMS
- 300ms silence debounce prevents false stops
- Minimum 200ms speech duration to count as valid

### Phrase Evaluation

Speech evaluation in [js/audio.js:322](js/audio.js#L322) uses permissive matching:
- Duration-based validation (0.3x - 3.0x expected duration)
- No ASR/transcription - relies on timing and amplitude
- Confidence score calculated from duration match quality
- Accepts wide range to avoid frustrating players

### Game Difficulty Progression

[js/game.js](js/game.js) implements progressive difficulty:
- Base speed: 150 px/s, increases 15 px/s per level
- Spawn interval: 4000ms, decreases 200ms per level (min 1500ms)
- Level up every 500 points
- Obstacle size scales with level

### Data Recording Schema

Each recording captures ([js/storage.js:197](js/storage.js#L197)):
```javascript
{
  sessionId: string,          // Links to session
  phraseText: string,         // What was spoken
  phraseTier: number,         // Difficulty 1-5
  phraseCategory: string,     // EMG, LOC, etc.
  phraseRegister: string,     // ACR, MES, BAS
  gameLevel: number,          // Current game level
  gameSpeed: number,          // Obstacle speed
  speechOnsetMs: number,      // Time to start speaking
  speechDurationMs: number,   // Speech length
  outcome: string,            // success/calibration
  audioBlob: Blob,            // WebM audio
  audioPeakAmplitude: float,  // Max RMS volume
  audioClippingDetected: bool // Audio quality flag
}
```

## Deployment

### Frontend (Cloudflare Pages)

1. Push to GitHub
2. Connect repository to Cloudflare Pages
3. Build settings:
   - Build command: (none)
   - Output directory: `/`
   - Root directory: `/`

### Backend (Fly.io)

```bash
cd backend

# Install flyctl
curl -L https://fly.io/install.sh | sh

# Initial deployment
fly launch
fly secrets set R2_ACCESS_KEY=xxx R2_SECRET_KEY=xxx

# Subsequent deployments
fly deploy
```

## Important Constraints

**Performance:**
- Target: mid-range Android devices (~2GB RAM)
- Canvas rendering must maintain 60fps
- Audio chunks limited to 100ms to prevent memory issues
- Maximum 5MB per audio upload

**Privacy:**
- All player IDs are anonymous UUIDs
- Demographics are optional
- No PII collected or stored
- Audio never transcribed on client side

**Browser Compatibility:**
- Primary: Chrome/Edge on Android
- Service Worker requires HTTPS (or localhost)
- MediaRecorder fallbacks for Safari (webm → mp4)
- Web Audio API context must be resumed after user interaction

## Testing Audio Features

**Microphone testing:**
1. Grant permissions in browser settings
2. Check Chrome DevTools > Console for "Audio initialized successfully"
3. Inspect volume bars during calibration (should show green when speaking)
4. Verify recordings in IndexedDB > VoiceRunnerDB > recordings

**Common issues:**
- "Audio not initialized" → Microphone permission denied, check browser settings
- No volume detected → Check system audio input device
- Clipping detected → Reduce microphone gain or distance from device

## Code Style Notes

- ES5-compatible JavaScript (no arrow functions, let/const, async/await in game code)
- IIFE pattern for modules: `const Module = (function() { ... })()`
- No JSX, TypeScript, or transpilation
- Callbacks over Promises for game loop (performance)
- Comments use JSDoc-style blocks for functions
