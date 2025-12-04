# 📊 Data Access Guide - Voice Runner

After users play your game, here's how to access, download, and analyze the collected voice data.

---

## Quick Access Methods

### Method 1: API Endpoints (Recommended)

Your backend provides 3 endpoints for data access:

#### 1. **View Statistics**
```bash
curl https://your-railway-app.up.railway.app/api/stats
```

Returns:
```json
{
  "totalSessions": 42,
  "totalRecordings": 247,
  "totalPlayersUnique": 38,
  "phraseBreakdown": {
    "EMG": 85,    // Emergency phrases
    "LOC": 62,    // Location phrases
    "MED": 48,    // Medical phrases
    "NEU": 32,    // Neutral phrases
    "NUM": 20     // Numbers
  },
  "registerBreakdown": {
    "ACR": 120,   // Acrolect (Standard English)
    "MES": 85,    // Mesolect (Mid-range)
    "BAS": 42     // Basilect (Deep Patois)
  }
}
```

#### 2. **Export All Data**
```bash
# Download all metadata as JSON
curl https://your-railway-app.up.railway.app/api/export > data_export.json
```

Returns:
```json
{
  "exportedAt": "2025-12-04T10:30:00Z",
  "sessions": [...],      // All game sessions
  "recordings": [...]     // All recording metadata
}
```

#### 3. **Health Check**
```bash
curl https://your-railway-app.up.railway.app/api/health
```

---

## Method 2: Direct Storage Access

### Railway Deployment

#### Option A: Railway CLI (Easiest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# SSH into your container
railway shell

# Navigate to data directory
cd /app/data

# List all sessions
ls -lah sessions/

# List audio files for a specific session
ls -lah audio/SESSION_ID/

# View a session's metadata
cat sessions/SESSION_ID.json

# Copy data to your local machine (from another terminal)
railway run scp -r /app/data ./local_data_backup
```

#### Option B: Download Volume Backup

```bash
# Create a backup script
railway run tar -czf /tmp/data_backup.tar.gz /app/data

# Download the backup
railway run cat /tmp/data_backup.tar.gz > data_backup.tar.gz

# Extract locally
tar -xzf data_backup.tar.gz
```

### Local Development Access

If running backend locally:

```bash
cd backend/data

# View structure
tree .
# Output:
# ├── audio/
# │   └── SESSION_ID/
# │       └── PHRASE_ID.webm
# ├── sessions/
# │   └── SESSION_ID.json
# └── metadata/
#     └── SESSION_ID/
#         └── PHRASE_ID_timestamp.json
```

---

## Method 3: Download via Python Script

Create this script to batch download all data:

```python
# download_data.py
import requests
import json
from pathlib import Path

API_BASE = "https://your-railway-app.up.railway.app"

def download_all_data():
    """Download all data from Voice Runner backend"""

    # Create output directory
    output_dir = Path("voice_runner_data")
    output_dir.mkdir(exist_ok=True)

    # Download stats
    print("📊 Downloading statistics...")
    stats = requests.get(f"{API_BASE}/api/stats").json()
    with open(output_dir / "stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    print(f"   Total sessions: {stats['totalSessions']}")
    print(f"   Total recordings: {stats['totalRecordings']}")

    # Download full export
    print("\n📦 Downloading full data export...")
    export_data = requests.get(f"{API_BASE}/api/export").json()
    with open(output_dir / "full_export.json", "w") as f:
        json.dump(export_data, f, indent=2)

    print(f"\n✅ Downloaded {len(export_data['sessions'])} sessions")
    print(f"✅ Downloaded {len(export_data['recordings'])} recording metadata entries")
    print(f"\n📁 Data saved to: {output_dir.absolute()}")

    return export_data

if __name__ == "__main__":
    data = download_all_data()
```

Run it:
```bash
python download_data.py
```

---

## Method 4: Cloudflare R2 Access (If Using R2 Storage)

If you configured R2 storage, audio files are stored in Cloudflare R2:

### Using AWS CLI (R2 is S3-compatible)

```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
# Enter your R2 credentials:
# - Access Key ID: your_r2_access_key
# - Secret Access Key: your_r2_secret_key
# - Region: auto
# - Output: json

# List all audio files
aws s3 ls s3://voice-runner-recordings/audio/ \
  --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com \
  --recursive

# Download all audio files
aws s3 sync s3://voice-runner-recordings/audio/ ./local_audio/ \
  --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com

# Download a specific session's audio
aws s3 sync s3://voice-runner-recordings/audio/SESSION_ID/ ./session_audio/ \
  --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

### Using Python boto3

```python
import boto3
from pathlib import Path

# Initialize R2 client
s3 = boto3.client(
    's3',
    endpoint_url='https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com',
    aws_access_key_id='your_access_key',
    aws_secret_access_key='your_secret_key'
)

# List all audio files
def list_all_recordings():
    response = s3.list_objects_v2(
        Bucket='voice-runner-recordings',
        Prefix='audio/'
    )
    return [obj['Key'] for obj in response.get('Contents', [])]

# Download all audio files
def download_all_audio(output_dir='./audio_files'):
    Path(output_dir).mkdir(exist_ok=True)

    files = list_all_recordings()
    print(f"Downloading {len(files)} audio files...")

    for key in files:
        local_path = Path(output_dir) / key
        local_path.parent.mkdir(parents=True, exist_ok=True)

        s3.download_file(
            'voice-runner-recordings',
            key,
            str(local_path)
        )
        print(f"  ✓ {key}")

    print(f"\n✅ Downloaded to {output_dir}")

if __name__ == "__main__":
    download_all_audio()
```

---

## Data Structure Reference

### Session Data (`sessions/SESSION_ID.json`)

```json
{
  "id": "abc-123-def",
  "playerId": "player-uuid",
  "deviceType": "mobile",
  "browser": "Chrome Mobile",
  "demographicAgeRange": "18-25",
  "demographicParish": "Kingston",
  "demographicPatoisFirst": "yes",
  "calibrationPhrases": ["phrase1", "phrase2"],
  "totalPhrasesAttempted": 15,
  "totalPhrasesSucceeded": 12,
  "finalScore": 3200,
  "maxLevelReached": 5,
  "bestCombo": 8,
  "sessionDurationSeconds": 180,
  "timestampStart": "2025-12-04T10:00:00Z",
  "timestampEnd": "2025-12-04T10:03:00Z"
}
```

### Recording Metadata (`metadata/SESSION_ID/PHRASE_ID_timestamp.json`)

```json
{
  "sessionId": "abc-123-def",
  "phraseId": "phrase_123",
  "phraseText": "Fire at my location",
  "phraseTier": 2,
  "phraseCategory": "EMG",
  "phraseRegister": "ACR",
  "gameLevel": 3,
  "gameSpeed": 195.0,
  "obstacleDistanceAtSpeechStart": 450.0,
  "timeToSpeechOnsetMs": 1200,
  "speechDurationMs": 850,
  "outcome": "success",
  "scoreAwarded": 100,
  "comboMultiplier": 1.5,
  "audioPeakAmplitude": 0.68,
  "audioClippingDetected": false,
  "timestampUtc": "2025-12-04T10:01:23Z",
  "audioPath": "r2://bucket/audio/abc-123-def/phrase_123.webm"
}
```

### Audio Files (`audio/SESSION_ID/PHRASE_ID.webm`)

- Format: WebM (Opus codec)
- Sample rate: 48kHz
- Channels: 1 (mono)
- Average size: 20-80 KB per phrase
- Duration: 0.5-3 seconds typical

---

## Analysis Scripts

### Example: Basic Statistics

```python
import json
import pandas as pd
from pathlib import Path

# Load exported data
with open("voice_runner_data/full_export.json") as f:
    data = json.load(f)

# Convert to DataFrames
sessions_df = pd.DataFrame(data['sessions'])
recordings_df = pd.DataFrame(data['recordings'])

# Basic stats
print("=== COLLECTION SUMMARY ===")
print(f"Total sessions: {len(sessions_df)}")
print(f"Total recordings: {len(recordings_df)}")
print(f"Unique players: {sessions_df['playerId'].nunique()}")
print(f"Date range: {recordings_df['timestampUtc'].min()} to {recordings_df['timestampUtc'].max()}")

# Phrase category distribution
print("\n=== PHRASE CATEGORIES ===")
print(recordings_df['phraseCategory'].value_counts())

# Register distribution (language variety)
print("\n=== LANGUAGE REGISTER ===")
print(recordings_df['phraseRegister'].value_counts())

# Demographics (if collected)
print("\n=== DEMOGRAPHICS ===")
print("Age ranges:", sessions_df['demographicAgeRange'].value_counts())
print("Parishes:", sessions_df['demographicParish'].value_counts())
print("Patois first language:", sessions_df['demographicPatoisFirst'].value_counts())

# Speech timing statistics
print("\n=== SPEECH TIMING ===")
print(f"Average time to speech onset: {recordings_df['timeToSpeechOnsetMs'].mean():.0f}ms")
print(f"Average speech duration: {recordings_df['speechDurationMs'].mean():.0f}ms")
print(f"Average peak amplitude: {recordings_df['audioPeakAmplitude'].mean():.2f}")

# Game performance
print("\n=== GAME PERFORMANCE ===")
print(f"Average final score: {sessions_df['finalScore'].mean():.0f}")
print(f"Average max level: {sessions_df['maxLevelReached'].mean():.1f}")
print(f"Average session duration: {sessions_df['sessionDurationSeconds'].mean():.0f}s")
```

### Example: Export for Research

```python
def export_for_praat_analysis():
    """Export in format suitable for Praat phonetic analysis"""

    with open("voice_runner_data/full_export.json") as f:
        data = json.load(f)

    # Create CSV with recording metadata
    recordings = []
    for rec in data['recordings']:
        recordings.append({
            'file_path': rec['audioPath'].replace('r2://', 'audio/'),
            'text': rec['phraseText'],
            'speaker_id': rec['sessionId'].split('-')[0],  # Anonymize
            'register': rec['phraseRegister'],
            'category': rec['phraseCategory'],
            'duration_ms': rec['speechDurationMs'],
            'peak_amplitude': rec['audioPeakAmplitude']
        })

    df = pd.DataFrame(recordings)
    df.to_csv('praat_analysis_manifest.csv', index=False)
    print(f"✅ Exported {len(df)} recordings for Praat analysis")

def export_for_whisper_transcription():
    """Prepare audio files for Whisper ASR"""

    import subprocess
    from pathlib import Path

    audio_dir = Path("audio_files/audio")
    output_dir = Path("whisper_ready")
    output_dir.mkdir(exist_ok=True)

    # Convert WebM to WAV for Whisper compatibility
    for webm_file in audio_dir.rglob("*.webm"):
        wav_file = output_dir / f"{webm_file.stem}.wav"
        subprocess.run([
            'ffmpeg', '-i', str(webm_file),
            '-ar', '16000',  # 16kHz for Whisper
            '-ac', '1',      # Mono
            '-c:a', 'pcm_s16le',
            str(wav_file)
        ], check=True, capture_output=True)

    print(f"✅ Converted {len(list(audio_dir.rglob('*.webm')))} files to WAV")
    print(f"   Ready for: whisper whisper_ready/*.wav --model medium")
```

---

## Monitoring Real-Time Collection

### Railway Logs (Live)

```bash
# Watch logs in real-time
railway logs --follow

# Filter for uploads
railway logs --follow | grep "Uploaded session"

# Export logs to file
railway logs > logs_$(date +%Y%m%d).txt
```

### Web Dashboard (Optional)

Create a simple monitoring page:

```html
<!-- monitor.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Voice Runner Monitor</title>
    <script>
        async function updateStats() {
            const response = await fetch('https://your-app.up.railway.app/api/stats');
            const stats = await response.json();

            document.getElementById('sessions').textContent = stats.totalSessions;
            document.getElementById('recordings').textContent = stats.totalRecordings;
            document.getElementById('players').textContent = stats.totalPlayersUnique;
        }

        setInterval(updateStats, 5000);  // Update every 5 seconds
        updateStats();
    </script>
</head>
<body>
    <h1>🎮 Voice Runner Collection Monitor</h1>
    <p>Sessions: <strong id="sessions">-</strong></p>
    <p>Recordings: <strong id="recordings">-</strong></p>
    <p>Unique Players: <strong id="players">-</strong></p>
</body>
</html>
```

---

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh - Run daily via cron

DATE=$(date +%Y%m%d)
BACKUP_DIR="backups/$DATE"

# Download data
mkdir -p "$BACKUP_DIR"
curl https://your-app.up.railway.app/api/export > "$BACKUP_DIR/data.json"

# If using R2, sync audio
aws s3 sync s3://voice-runner-recordings/audio/ "$BACKUP_DIR/audio/" \
  --endpoint-url https://xxx.r2.cloudflarestorage.com

# Compress
tar -czf "voice_runner_backup_$DATE.tar.gz" "$BACKUP_DIR"

# Upload to safe location (e.g., Google Drive, Dropbox, S3)
# rclone copy "voice_runner_backup_$DATE.tar.gz" gdrive:backups/

echo "✅ Backup complete: voice_runner_backup_$DATE.tar.gz"
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## Privacy & Compliance

**Before accessing data:**
- ✅ Ensure you have consent from participants
- ✅ Review your IRB/ethics approval (TRIDENT project)
- ✅ Store data securely (encrypted at rest)
- ✅ Anonymize player IDs before sharing
- ✅ Follow GDPR/data protection regulations

**Data retention:**
- Raw audio: Store securely for analysis period
- Metadata: Can be retained longer
- Player IDs: Hash or anonymize before publication

---

## Next Steps

1. **Access data**: Choose method above based on your deployment
2. **Analyze**: Use Python scripts or export to research tools
3. **Share findings**: Publish results (with anonymized data)
4. **Iterate**: Use insights to improve collection strategy

For questions, see [DEPLOYMENT.md](./DEPLOYMENT.md) or backend API documentation.
