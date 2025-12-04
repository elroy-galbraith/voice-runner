#!/bin/bash
# Download complete Voice Runner data archive from Railway
# Usage: ./scripts/download_archive.sh [output_directory]

set -e

OUTPUT_DIR="${1:-./voice-runner-data}"
API_URL="https://voice-runner-production.up.railway.app/api"

echo "🐦 Voice Runner Data Downloader"
echo "================================"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Download complete archive
echo "📦 Downloading complete data archive..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_FILE="${OUTPUT_DIR}/voice-runner-data_${TIMESTAMP}.tar.gz"

curl -L "${API_URL}/download/archive" -o "$ARCHIVE_FILE"

echo ""
echo "✅ Archive downloaded to: $ARCHIVE_FILE"
echo ""
echo "To extract:"
echo "  tar -xzf $ARCHIVE_FILE -C $OUTPUT_DIR"
echo ""
echo "Or extract now? (y/n)"
read -r EXTRACT

if [ "$EXTRACT" = "y" ] || [ "$EXTRACT" = "Y" ]; then
    echo "📂 Extracting archive..."
    tar -xzf "$ARCHIVE_FILE" -C "$OUTPUT_DIR"
    echo "✅ Extracted to: ${OUTPUT_DIR}/voice-runner-data/"
    echo ""

    # Show summary
    if [ -d "${OUTPUT_DIR}/voice-runner-data" ]; then
        SESSIONS=$(find "${OUTPUT_DIR}/voice-runner-data/sessions" -name "*.json" 2>/dev/null | wc -l)
        AUDIO=$(find "${OUTPUT_DIR}/voice-runner-data/audio" -name "*.webm" 2>/dev/null | wc -l)

        echo "📊 Data Summary:"
        echo "  - ${SESSIONS} sessions"
        echo "  - ${AUDIO} audio recordings"
    fi
fi

echo ""
echo "✅ Download complete!"
