#!/usr/bin/env python3
"""
Download all Voice Runner data from Railway backend
Usage: python scripts/download_data.py [output_directory]
"""

import sys
import json
import requests
from pathlib import Path
from datetime import datetime

API_URL = "https://voice-runner-production.up.railway.app/api"

def main():
    output_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "./voice-runner-data")
    output_dir.mkdir(parents=True, exist_ok=True)

    print("🐦 Voice Runner Data Downloader")
    print("=" * 40)
    print()

    # Download complete archive (easiest method)
    print("📦 Downloading complete archive...")
    try:
        response = requests.get(f"{API_URL}/download/archive", stream=True)
        response.raise_for_status()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_path = output_dir / f"voice-runner-data_{timestamp}.tar.gz"

        with open(archive_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print(f"✅ Complete archive downloaded to: {archive_path}")
        print()
        print("To extract:")
        print(f"  tar -xzf {archive_path}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
