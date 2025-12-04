#!/usr/bin/env python3
"""
Analyze Voice Runner collected data and generate reports
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from collections import Counter

try:
    import pandas as pd
    import matplotlib.pyplot as plt
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("⚠️  pandas/matplotlib not installed - using basic analysis only")
    print("   Install with: pip install pandas matplotlib")
    print()


def load_data(data_dir="voice_runner_data"):
    """Load exported data"""
    data_path = Path(data_dir)

    if not data_path.exists():
        print(f"❌ Data directory not found: {data_path}")
        print("   Run download_data.py first")
        sys.exit(1)

    # Try to load the most recent export
    export_files = list(data_path.glob("full_export_*.json"))
    if export_files:
        export_file = sorted(export_files)[-1]  # Most recent
    elif (data_path / "full_export.json").exists():
        export_file = data_path / "full_export.json"
    else:
        print(f"❌ No export file found in {data_path}")
        sys.exit(1)

    print(f"📂 Loading data from: {export_file.name}")
    with open(export_file) as f:
        data = json.load(f)

    return data


def basic_analysis(data):
    """Generate basic statistics without pandas"""
    sessions = data.get('sessions', [])
    recordings = data.get('recordings', [])

    print("\n" + "=" * 60)
    print("📊 COLLECTION SUMMARY")
    print("=" * 60)

    print(f"\nTotal sessions: {len(sessions)}")
    print(f"Total recordings: {len(recordings)}")

    if sessions:
        unique_players = len(set(s.get('playerId') for s in sessions))
        print(f"Unique players: {unique_players}")

        # Time range
        timestamps = [r.get('timestampUtc') for r in recordings if r.get('timestampUtc')]
        if timestamps:
            timestamps.sort()
            print(f"Date range: {timestamps[0][:10]} to {timestamps[-1][:10]}")

    # Phrase categories
    if recordings:
        print("\n" + "=" * 60)
        print("📝 PHRASE CATEGORIES")
        print("=" * 60)

        categories = Counter(r.get('phraseCategory') for r in recordings)
        for cat, count in categories.most_common():
            print(f"  {cat}: {count} recordings")

        # Language register
        print("\n" + "=" * 60)
        print("🗣️  LANGUAGE REGISTER")
        print("=" * 60)

        registers = Counter(r.get('phraseRegister') for r in recordings)
        register_names = {
            'ACR': 'Acrolect (Standard English)',
            'MES': 'Mesolect (Mid-range)',
            'BAS': 'Basilect (Deep Patois)'
        }
        for reg, count in registers.most_common():
            name = register_names.get(reg, reg)
            print(f"  {name}: {count} recordings")

        # Speech timing
        print("\n" + "=" * 60)
        print("⏱️  SPEECH TIMING")
        print("=" * 60)

        onset_times = [r.get('timeToSpeechOnsetMs') for r in recordings if r.get('timeToSpeechOnsetMs')]
        durations = [r.get('speechDurationMs') for r in recordings if r.get('speechDurationMs')]
        amplitudes = [r.get('audioPeakAmplitude') for r in recordings if r.get('audioPeakAmplitude')]

        if onset_times:
            print(f"  Average time to speech onset: {sum(onset_times) / len(onset_times):.0f}ms")
            print(f"  Min onset: {min(onset_times)}ms, Max onset: {max(onset_times)}ms")

        if durations:
            print(f"  Average speech duration: {sum(durations) / len(durations):.0f}ms")
            print(f"  Min duration: {min(durations)}ms, Max duration: {max(durations)}ms")

        if amplitudes:
            print(f"  Average peak amplitude: {sum(amplitudes) / len(amplitudes):.2f}")

        # Success rate
        outcomes = Counter(r.get('outcome') for r in recordings)
        total_attempts = sum(outcomes.values())
        if total_attempts > 0:
            success_rate = (outcomes.get('success', 0) / total_attempts) * 100
            print(f"  Success rate: {success_rate:.1f}% ({outcomes.get('success', 0)}/{total_attempts})")

    # Game performance
    if sessions:
        print("\n" + "=" * 60)
        print("🎮 GAME PERFORMANCE")
        print("=" * 60)

        scores = [s.get('finalScore', 0) for s in sessions]
        levels = [s.get('maxLevelReached', 1) for s in sessions]
        durations = [s.get('sessionDurationSeconds', 0) for s in sessions]

        if scores:
            print(f"  Average final score: {sum(scores) / len(scores):.0f}")
            print(f"  Highest score: {max(scores)}")

        if levels:
            print(f"  Average max level: {sum(levels) / len(levels):.1f}")
            print(f"  Highest level reached: {max(levels)}")

        if durations:
            print(f"  Average session duration: {sum(durations) / len(durations):.0f}s")
            print(f"  Longest session: {max(durations)}s")

    # Demographics
    if sessions:
        print("\n" + "=" * 60)
        print("👥 DEMOGRAPHICS")
        print("=" * 60)

        ages = Counter(s.get('demographicAgeRange') for s in sessions if s.get('demographicAgeRange'))
        if ages:
            print("\n  Age ranges:")
            for age, count in ages.most_common():
                print(f"    {age}: {count} players")

        parishes = Counter(s.get('demographicParish') for s in sessions if s.get('demographicParish'))
        if parishes:
            print("\n  Parishes:")
            for parish, count in parishes.most_common():
                print(f"    {parish}: {count} players")

        patois_first = Counter(s.get('demographicPatoisFirst') for s in sessions if s.get('demographicPatoisFirst'))
        if patois_first:
            print("\n  Patois as first language:")
            for answer, count in patois_first.most_common():
                print(f"    {answer}: {count} players")


def pandas_analysis(data):
    """Generate detailed analysis with pandas"""
    sessions = pd.DataFrame(data.get('sessions', []))
    recordings = pd.DataFrame(data.get('recordings', []))

    output_dir = Path("analysis_output")
    output_dir.mkdir(exist_ok=True)

    print("\n" + "=" * 60)
    print("📊 GENERATING DETAILED REPORTS")
    print("=" * 60)

    # Summary statistics
    print("\n📈 Generating summary statistics...")
    summary = {
        'Total Sessions': len(sessions),
        'Total Recordings': len(recordings),
        'Unique Players': sessions['playerId'].nunique() if not sessions.empty else 0,
        'Date Range': f"{recordings['timestampUtc'].min()} to {recordings['timestampUtc'].max()}" if not recordings.empty else "N/A",
    }

    summary_file = output_dir / "summary.json"
    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"   ✓ Saved to {summary_file}")

    # Detailed CSV exports
    if not sessions.empty:
        print("\n📄 Exporting CSVs...")
        sessions.to_csv(output_dir / "sessions.csv", index=False)
        print(f"   ✓ sessions.csv")

    if not recordings.empty:
        recordings.to_csv(output_dir / "recordings.csv", index=False)
        print(f"   ✓ recordings.csv")

        # Recording statistics by category
        category_stats = recordings.groupby('phraseCategory').agg({
            'phraseId': 'count',
            'timeToSpeechOnsetMs': 'mean',
            'speechDurationMs': 'mean',
            'audioPeakAmplitude': 'mean'
        }).round(2)
        category_stats.to_csv(output_dir / "category_stats.csv")
        print(f"   ✓ category_stats.csv")

        # Register statistics
        register_stats = recordings.groupby('phraseRegister').agg({
            'phraseId': 'count',
            'timeToSpeechOnsetMs': 'mean',
            'speechDurationMs': 'mean'
        }).round(2)
        register_stats.to_csv(output_dir / "register_stats.csv")
        print(f"   ✓ register_stats.csv")

    # Generate plots
    print("\n📊 Generating visualizations...")

    if not recordings.empty:
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('Voice Runner Data Analysis', fontsize=16)

        # Plot 1: Phrase categories
        recordings['phraseCategory'].value_counts().plot(kind='bar', ax=axes[0, 0])
        axes[0, 0].set_title('Recordings by Phrase Category')
        axes[0, 0].set_xlabel('Category')
        axes[0, 0].set_ylabel('Count')

        # Plot 2: Language register
        recordings['phraseRegister'].value_counts().plot(kind='bar', ax=axes[0, 1])
        axes[0, 1].set_title('Recordings by Language Register')
        axes[0, 1].set_xlabel('Register')
        axes[0, 1].set_ylabel('Count')

        # Plot 3: Speech onset time distribution
        recordings['timeToSpeechOnsetMs'].hist(bins=30, ax=axes[1, 0])
        axes[1, 0].set_title('Time to Speech Onset Distribution')
        axes[1, 0].set_xlabel('Time (ms)')
        axes[1, 0].set_ylabel('Frequency')

        # Plot 4: Speech duration distribution
        recordings['speechDurationMs'].hist(bins=30, ax=axes[1, 1])
        axes[1, 1].set_title('Speech Duration Distribution')
        axes[1, 1].set_xlabel('Duration (ms)')
        axes[1, 1].set_ylabel('Frequency')

        plt.tight_layout()
        plot_file = output_dir / "analysis_plots.png"
        plt.savefig(plot_file, dpi=150)
        print(f"   ✓ {plot_file}")

    print(f"\n✅ Analysis complete! Reports saved to: {output_dir.absolute()}")


def main():
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "voice_runner_data"

    print("🎮 Voice Runner Data Analysis")
    print("=" * 60)

    data = load_data(data_dir)

    # Always run basic analysis
    basic_analysis(data)

    # Run pandas analysis if available
    if PANDAS_AVAILABLE:
        try:
            pandas_analysis(data)
        except Exception as e:
            print(f"\n⚠️  Error in detailed analysis: {e}")
    else:
        print("\n" + "=" * 60)
        print("💡 TIP: Install pandas and matplotlib for detailed reports")
        print("   pip install pandas matplotlib")
        print("=" * 60)

    print("\n✅ Analysis complete!")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Analysis cancelled by user")
        sys.exit(1)
