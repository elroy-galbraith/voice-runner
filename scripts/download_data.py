#!/usr/bin/env python3
"""
Download all Voice Runner data from deployed backend
"""

import requests
import json
from pathlib import Path
from datetime import datetime
import sys

def download_data(api_base_url, output_dir="voice_runner_data"):
    """
    Download all data from Voice Runner backend

    Args:
        api_base_url: Base URL of your Railway deployment (e.g., https://xxx.up.railway.app)
        output_dir: Local directory to save data
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    print("🎮 Voice Runner Data Download")
    print("=" * 50)
    print(f"API: {api_base_url}")
    print(f"Output: {output_path.absolute()}")
    print()

    # Test connection
    try:
        print("🔍 Testing connection...")
        response = requests.get(f"{api_base_url}/api/health", timeout=10)
        response.raise_for_status()
        print("✅ Backend is online\n")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("\nMake sure:")
        print("  1. Your backend is deployed and running")
        print("  2. URL is correct (should be https://xxx.up.railway.app)")
        print("  3. No trailing slash in URL")
        sys.exit(1)

    # Download statistics
    print("📊 Downloading statistics...")
    try:
        stats = requests.get(f"{api_base_url}/api/stats", timeout=30).json()

        stats_file = output_path / "stats.json"
        with open(stats_file, "w") as f:
            json.dump(stats, f, indent=2)

        print(f"   ✓ Total sessions: {stats['totalSessions']}")
        print(f"   ✓ Total recordings: {stats['totalRecordings']}")
        print(f"   ✓ Unique players: {stats['totalPlayersUnique']}")
        print(f"   ✓ Saved to: {stats_file}")

    except Exception as e:
        print(f"   ⚠️  Failed to download stats: {e}")

    # Download full export
    print("\n📦 Downloading full data export...")
    try:
        export_data = requests.get(f"{api_base_url}/api/export", timeout=60).json()

        # Save full export
        export_file = output_path / f"full_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(export_file, "w") as f:
            json.dump(export_data, f, indent=2)

        print(f"   ✓ {len(export_data.get('sessions', []))} sessions")
        print(f"   ✓ {len(export_data.get('recordings', []))} recordings")
        print(f"   ✓ Saved to: {export_file}")

        # Save sessions separately
        if export_data.get('sessions'):
            sessions_file = output_path / "sessions.json"
            with open(sessions_file, "w") as f:
                json.dump(export_data['sessions'], f, indent=2)
            print(f"   ✓ Sessions saved to: {sessions_file}")

        # Save recordings separately
        if export_data.get('recordings'):
            recordings_file = output_path / "recordings.json"
            with open(recordings_file, "w") as f:
                json.dump(export_data['recordings'], f, indent=2)
            print(f"   ✓ Recordings saved to: {recordings_file}")

    except Exception as e:
        print(f"   ❌ Failed to download export: {e}")
        sys.exit(1)

    print("\n" + "=" * 50)
    print(f"✅ Download complete!")
    print(f"📁 Data saved to: {output_path.absolute()}")
    print("\nNext steps:")
    print("  - Run analyze_data.py to generate reports")
    print("  - Use the JSON files for your research")
    print("  - Audio files remain on the server (see DATA-ACCESS-GUIDE.md)")

    return export_data


if __name__ == "__main__":
    # Get API URL from command line or prompt
    if len(sys.argv) > 1:
        api_url = sys.argv[1].rstrip('/')
    else:
        print("Enter your Railway backend URL (e.g., https://xxx.up.railway.app):")
        api_url = input("> ").strip().rstrip('/')

        if not api_url:
            print("❌ URL is required")
            sys.exit(1)

    # Optional: custom output directory
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "voice_runner_data"

    try:
        download_data(api_url, output_dir)
    except KeyboardInterrupt:
        print("\n\n⚠️  Download cancelled by user")
        sys.exit(1)
