# Voice Runner Data Analysis Scripts

Python scripts for downloading and analyzing Voice Runner data.

## Prerequisites

```bash
# Basic requirements (for downloading)
pip install requests

# Advanced analysis (optional)
pip install pandas matplotlib
```

## Quick Start

### 1. Download Data

```bash
python download_data.py https://your-app.up.railway.app
```

This creates a `voice_runner_data/` directory with:
- `stats.json` - Overall statistics
- `full_export_TIMESTAMP.json` - Complete data dump
- `sessions.json` - All game sessions
- `recordings.json` - All recording metadata

### 2. Analyze Data

```bash
python analyze_data.py
```

This generates:
- Console output with statistics
- `analysis_output/` directory with:
  - `summary.json` - Key metrics
  - `sessions.csv` - Session data
  - `recordings.csv` - Recording data
  - `category_stats.csv` - Stats by phrase category
  - `register_stats.csv` - Stats by language register
  - `analysis_plots.png` - Visualizations (if matplotlib installed)

## Scripts

### `download_data.py`

Downloads all metadata from your deployed backend.

**Usage:**
```bash
# Interactive (prompts for URL)
python download_data.py

# With URL argument
python download_data.py https://your-app.up.railway.app

# Custom output directory
python download_data.py https://your-app.up.railway.app my_data
```

**What it downloads:**
- Session metadata (player info, scores, demographics)
- Recording metadata (phrase text, timing, outcomes)
- Statistics summary

**What it does NOT download:**
- Audio files (see DATA-ACCESS-GUIDE.md for audio access)

### `analyze_data.py`

Generates reports and statistics from downloaded data.

**Usage:**
```bash
# Analyze default directory (voice_runner_data/)
python analyze_data.py

# Analyze custom directory
python analyze_data.py my_data
```

**What it produces:**
- Collection summary (totals, date range)
- Phrase category breakdown
- Language register distribution
- Speech timing statistics
- Game performance metrics
- Demographics summary
- CSV exports for spreadsheet analysis
- Visualization plots (if pandas/matplotlib available)

## Example Workflow

```bash
# 1. Download data from production
python download_data.py https://voice-runner.up.railway.app

# 2. Analyze it
python analyze_data.py

# 3. View results
cat analysis_output/summary.json
open analysis_output/analysis_plots.png  # macOS
xdg-open analysis_output/analysis_plots.png  # Linux
```

## Output Examples

### Console Output

```
🎮 Voice Runner Data Analysis
============================================================
📂 Loading data from: full_export_20251204_103045.json

============================================================
📊 COLLECTION SUMMARY
============================================================

Total sessions: 42
Total recordings: 247
Unique players: 38
Date range: 2025-12-01 to 2025-12-04

============================================================
📝 PHRASE CATEGORIES
============================================================
  EMG: 85 recordings
  LOC: 62 recordings
  MED: 48 recordings
  NEU: 32 recordings
  NUM: 20 recordings

...
```

### CSV Files

`recordings.csv` - Ready for Excel/Google Sheets analysis:
```csv
sessionId,phraseText,phraseCategory,phraseRegister,speechDurationMs,audioPeakAmplitude
abc123,Fire at my location,EMG,ACR,850,0.68
def456,Mi need help now,EMG,BAS,920,0.72
...
```

## Advanced Usage

### Export for Research Tools

```python
# Custom analysis script
import json
import pandas as pd

# Load data
with open("voice_runner_data/full_export.json") as f:
    data = json.load(f)

recordings_df = pd.DataFrame(data['recordings'])

# Filter for specific criteria
emergency_phrases = recordings_df[recordings_df['phraseCategory'] == 'EMG']
basilect_samples = recordings_df[recordings_df['phraseRegister'] == 'BAS']

# Export for Praat analysis
basilect_samples[['phraseText', 'speechDurationMs', 'audioPath']].to_csv(
    'praat_manifest.csv',
    index=False
)
```

### Combine Multiple Exports

```python
import json
from pathlib import Path

# Combine multiple download sessions
all_recordings = []
for export_file in Path("voice_runner_data").glob("full_export_*.json"):
    with open(export_file) as f:
        data = json.load(f)
        all_recordings.extend(data['recordings'])

# Remove duplicates by phraseId
unique_recordings = {r['phraseId']: r for r in all_recordings}.values()
print(f"Total unique recordings: {len(unique_recordings)}")
```

## Troubleshooting

### "Cannot connect to backend"
- Check your Railway deployment is running: `railway status`
- Verify URL is correct (no trailing slash)
- Check CORS settings allow API requests

### "No export file found"
- Run `download_data.py` first
- Check you're in the correct directory

### "Module not found: pandas"
- Scripts work without pandas, but with reduced features
- Install with: `pip install pandas matplotlib`

## Data Privacy

**Important:** These scripts download metadata only, not raw audio files.

For audio file access, see [DATA-ACCESS-GUIDE.md](../DATA-ACCESS-GUIDE.md).

Before sharing data:
- Anonymize player IDs
- Review IRB/ethics protocols
- Follow GDPR/data protection requirements
