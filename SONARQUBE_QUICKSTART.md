# SonarQube Quick Start (TL;DR)

**Goal**: Analyze code quality (security + maintainability) without blocking existing code, only enforce on new PRs.

## 1. Start SonarQube Locally (5 minutes)

```bash
# Run the automated setup
./scripts/setup-sonarqube.sh

# Or manually:
docker-compose -f docker-compose.sonarqube.yml up -d

# Wait 2 minutes, then visit:
open http://localhost:9000
# Login: admin / admin (change password when prompted)
```

## 2. Create Project & Get Token (2 minutes)

1. **In SonarQube UI**: Projects → Create Project → Manually
   - Project key: `voice-runner`
   - Display name: `Voice Runner`
2. Choose **Locally**, generate a token
3. **Save the token** - you'll need it

## 3. Run First Scan (1 minute)

```bash
# Option 1: Use helper script
./scripts/run-sonar-scan.sh YOUR_TOKEN_HERE

# Option 2: Manual
sonar-scanner \
  -Dsonar.projectKey=voice-runner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN_HERE
```

**Result**: Full codebase analysis visible at http://localhost:9000

## 4. Configure "New Code Only" Quality Gate (5 minutes)

In SonarQube UI:

1. **Quality Gates** → **Create** → Name: `New Code Standards`
2. Add these conditions **(all on "New Code")**:
   - Security Hotspots Reviewed: `< 100%` → ❌
   - Security Rating: `worse than A` → ❌
   - Maintainability Rating: `worse than A` → ❌
   - Code Smells: `> 5` → ❌
   - Coverage: `< 50%` → ❌ (adjust if no tests yet)
3. **Projects** → **Voice Runner** → **Settings** → **Quality Gate** → Select `New Code Standards`
4. **Project Settings** → **New Code** → Set to: **Reference branch: main**

✅ **Done!** Existing code issues won't block anything. Only new code in PRs must meet standards.

## 5. GitHub Actions Integration (Optional, 10 minutes)

### For PR Checks:

1. **Deploy SonarQube** to be publicly accessible (or use ngrok/Cloudflare Tunnel for testing)
2. **Add GitHub Secrets**:
   - `SONAR_TOKEN`: Your token from step 2
   - `SONAR_HOST_URL`: Your SonarQube URL
3. Push a branch and **create a PR** - SonarQube will analyze automatically

Workflows are already configured:
- [.github/workflows/sonarqube-pr.yml](.github/workflows/sonarqube-pr.yml) - Enforces quality gate on PRs
- [.github/workflows/sonarqube-main.yml](.github/workflows/sonarqube-main.yml) - Tracks full codebase trends

---

## What You Get

### Immediate Benefits:
- **Security analysis**: See all potential vulnerabilities and security hotspots
- **Maintainability metrics**: Find complex, duplicated, or hard-to-maintain code
- **Technical debt**: Estimated time to fix all issues
- **Trends**: Track if code quality improves or degrades over time

### On Every PR:
- Automatic analysis of changed code
- Quality gate check (pass/fail)
- Inline comments on issues (if configured)
- Prevents merging bad code

### For Planning:
- Identify top files needing refactoring
- Prioritize security fixes
- See which modules have highest debt
- Track improvement over time

---

## Daily Workflow

### When Making Changes:

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Write code
# ... make changes ...

# 3. Optional: Run local scan before pushing
./scripts/run-sonar-scan.sh

# 4. Push and create PR
git push origin feature/my-feature
# GitHub Actions will analyze automatically
```

### When Reviewing Overall Health:

```bash
# Run a fresh scan
./scripts/run-sonar-scan.sh

# View in browser
open http://localhost:9000/dashboard?id=voice-runner

# Focus on:
# - Security Hotspots (review all)
# - High/Critical issues (prioritize)
# - Most complex files (refactoring candidates)
```

---

## Common Scenarios

### "I want to see the baseline without changing my workflow"

✅ Perfect - that's the default setup. Run scans locally, view results, no enforcement.

### "I want to enforce quality on new PRs only"

✅ Covered - configure the quality gate (step 4) and GitHub Actions (step 5).

### "I want pre-commit checks"

⚠️ Possible but slows down commits (10-30s). See [SONARQUBE_SETUP.md](SONARQUBE_SETUP.md#optional-pre-commit-hooks).

### "I want to plan refactoring"

✅ Run a scan, go to **Measures** → sort by Technical Debt or Complexity. Create GitHub issues for top items.

### "Quality gate is too strict for my legacy code"

✅ Adjust thresholds in **Quality Gates** → **New Code Standards**. Start lenient, tighten over time.

### "I don't have tests yet, coverage check fails"

✅ Temporarily disable coverage condition in quality gate or set to 0%. Re-enable when you add tests.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "SonarQube won't start" | Increase Docker memory to 4GB+ |
| "Scan fails with auth error" | Regenerate token, verify it's correct |
| "No issues found" | Check `sonar-project.properties` source paths |
| "GitHub Action can't connect" | Ensure SONAR_HOST_URL is publicly accessible |

---

## Files Created

- [docker-compose.sonarqube.yml](docker-compose.sonarqube.yml) - Local SonarQube server
- [sonar-project.properties](sonar-project.properties) - Project configuration
- [.github/workflows/sonarqube-pr.yml](.github/workflows/sonarqube-pr.yml) - PR analysis
- [.github/workflows/sonarqube-main.yml](.github/workflows/sonarqube-main.yml) - Main branch analysis
- [quality-gate-config.json](quality-gate-config.json) - Quality gate reference
- [scripts/setup-sonarqube.sh](scripts/setup-sonarqube.sh) - Automated setup
- [scripts/run-sonar-scan.sh](scripts/run-sonar-scan.sh) - Quick scan helper
- [SONARQUBE_SETUP.md](SONARQUBE_SETUP.md) - Full documentation

---

## Next Steps

1. ✅ **Run first scan** - See current state
2. 📋 **Review security hotspots** - Check for vulnerabilities
3. 📋 **Configure quality gate** - Enforce on new code
4. 📋 **Test with a PR** - Verify automation works
5. 📋 **Plan refactoring** - Tackle high-debt areas incrementally

**Full docs**: [SONARQUBE_SETUP.md](SONARQUBE_SETUP.md)
