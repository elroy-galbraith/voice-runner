# 🚀 Quick Data Access Guide

## TL;DR - Get Your Data in 2 Minutes

### Option 1: Python Scripts (Easiest)

```bash
# 1. Download metadata
cd scripts
python download_data.py https://your-app.up.railway.app

# 2. Analyze it
python analyze_data.py

# 3. Done! Check the output/
ls -la voice_runner_data/
ls -la analysis_output/
```

---

### Option 2: Direct API Call

```bash
# View stats
curl https://your-app.up.railway.app/api/stats | jq

# Download everything
curl https://your-app.up.railway.app/api/export > data.json
```

---

### Option 3: Railway CLI (For Audio Files)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Connect and access files
railway login
railway link
railway shell

# Inside the container:
cd /app/data
ls -la audio/
ls -la sessions/

# Download audio files
tar -czf /tmp/audio.tar.gz audio/
# (then copy from another terminal)
```

---

## What Data You Get

### Metadata (via API or Python scripts)
- ✅ Session info (scores, levels, duration)
- ✅ Recording metadata (phrase text, timing, outcomes)
- ✅ Demographics (age, location, language)
- ✅ Statistics (categories, registers, performance)

### Audio Files (via Railway CLI or R2)
- 🎵 WebM format (Opus codec)
- 🎵 ~20-80 KB per phrase
- 🎵 Organized by session ID

---

## Data Structure

```
data/
├── sessions/
│   └── SESSION_ID.json          # Game session metadata
├── metadata/
│   └── SESSION_ID/
│       └── PHRASE_ID.json       # Recording metadata
└── audio/
    └── SESSION_ID/
        └── PHRASE_ID.webm       # Audio file
```

---

## Common Tasks

### Get Latest Stats
```bash
curl https://your-app.up.railway.app/api/stats
```

### Export for Excel
```bash
python scripts/download_data.py
python scripts/analyze_data.py
# Open analysis_output/recordings.csv in Excel
```

### Get Audio Files
```bash
railway shell
cd /app/data/audio
# Find session: ls -la
# Download: tar -czf session_XYZ.tar.gz SESSION_ID/
```

### Monitor Real-Time
```bash
railway logs --follow
# Watch for: "Uploaded session abc-123 with N recordings"
```

---

## Installation

### Python Scripts
```bash
# Basic (metadata only)
pip install requests

# Advanced (with analysis/plots)
pip install requests pandas matplotlib
```

### Railway CLI
```bash
npm install -g @railway/cli
railway login
```

---

## Quick Analysis Examples

### Python
```python
import json
import pandas as pd

# Load data
with open("voice_runner_data/recordings.json") as f:
    recordings = json.load(f)

df = pd.DataFrame(recordings)

# Basic stats
print(df['phraseCategory'].value_counts())
print(f"Average speech onset: {df['timeToSpeechOnsetMs'].mean():.0f}ms")
print(f"Success rate: {(df['outcome'] == 'success').mean() * 100:.1f}%")
```

### Shell
```bash
# Count total recordings
jq '.recordings | length' data.json

# Get all emergency phrases
jq '.recordings[] | select(.phraseCategory == "EMG")' data.json

# Find longest speech
jq '.recordings | max_by(.speechDurationMs)' data.json
```

---

## Full Documentation

- **[DATA-ACCESS-GUIDE.md](DATA-ACCESS-GUIDE.md)** - Complete reference
- **[scripts/README.md](scripts/README.md)** - Python script details
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment setup

---

## Troubleshooting

**"Cannot connect to backend"**
→ Check Railway deployment is running: `railway status`

**"No data found"**
→ Verify users have played the game and uploads succeeded

**"Audio files too large"**
→ Download by session, not all at once

**Need real-time monitoring?**
→ Use `railway logs --follow` or create webhook alerts

---

## Data Privacy Checklist

Before sharing data:
- ☐ Anonymize player IDs
- ☐ Review IRB/ethics approval
- ☐ Remove PII if collected
- ☐ Encrypt storage
- ☐ Follow GDPR requirements

---

## Next Steps

1. ✅ Download your data (use Python scripts)
2. ✅ Analyze it (check analysis_output/)
3. ✅ Export for research tools (Praat, Whisper, etc.)
4. ✅ Share findings (with anonymized data)

Need help? See full guides in the docs/ directory.
