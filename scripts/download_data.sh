#!/bin/bash
# Download all Voice Runner data from Railway
# Usage: ./scripts/download_data.sh [output_directory]

set -e

OUTPUT_DIR="${1:-./voice-runner-data}"
RAILWAY_SERVICE="voice-runner-production"
API_URL="https://voice-runner-production.up.railway.app/api"

echo "🐦 Voice Runner Data Downloader"
echo "================================"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Download metadata export
echo "📊 Downloading session metadata..."
curl -s "${API_URL}/export" > export.json
echo "✓ Saved to: export.json"

SESSIONS=$(cat export.json | jq -r '.sessions | length')
RECORDINGS=$(cat export.json | jq -r '.recordings | length')

echo ""
echo "Found:"
echo "  - ${SESSIONS} sessions"
echo "  - ${RECORDINGS} recordings"
echo ""

# Create directory structure
mkdir -p sessions
mkdir -p recordings/audio
mkdir -p recordings/metadata

# Extract session data
echo "📝 Extracting session data..."
cat export.json | jq -r '.sessions[] | @json' | while read -r session; do
    SESSION_ID=$(echo "$session" | jq -r '.id')
    echo "$session" | jq '.' > "sessions/${SESSION_ID}.json"
done
echo "✓ Sessions saved to: sessions/"

# Extract recording metadata
echo "📝 Extracting recording metadata..."
cat export.json | jq -r '.recordings[] | @json' | while read -r recording; do
    SESSION_ID=$(echo "$recording" | jq -r '.sessionId')
    PHRASE_ID=$(echo "$recording" | jq -r '.phraseId')
    TIMESTAMP=$(echo "$recording" | jq -r '.timestampUtc')

    # Create session subdirectory
    mkdir -p "recordings/metadata/${SESSION_ID}"

    # Save metadata
    FILENAME="${PHRASE_ID}_${TIMESTAMP//:/-}.json"
    echo "$recording" | jq '.' > "recordings/metadata/${SESSION_ID}/${FILENAME}"
done
echo "✓ Recording metadata saved to: recordings/metadata/"

echo ""
echo "⚠️  NOTE: Audio files are stored on Railway's volume."
echo "   To download audio files, you need to:"
echo ""
echo "   Option 1: Use Railway CLI to access the volume"
echo "   $ railway run bash"
echo "   $ tar -czf data.tar.gz /app/data"
echo "   $ exit"
echo "   $ railway files download"
echo ""
echo "   Option 2: Add an API endpoint to download audio files"
echo "   (Would you like me to create this endpoint?)"
echo ""
echo "✅ Metadata download complete!"
echo "   Output directory: $(pwd)"
