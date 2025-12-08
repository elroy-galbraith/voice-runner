# SonarQube Setup Guide for Voice Runner

This guide helps you set up SonarQube OSS to analyze code quality with a focus on **security** and **maintainability**, while only enforcing quality standards on **new code** (PRs).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development Setup](#local-development-setup)
3. [Configuring Quality Gates (New Code Only)](#configuring-quality-gates)
4. [GitHub Actions Integration](#github-actions-integration)
5. [Understanding the Reports](#understanding-the-reports)
6. [Optional: Pre-commit Hooks](#optional-pre-commit-hooks)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git repository initialized
- GitHub repository (for CI/CD integration)

### Initial Setup (5 minutes)

```bash
# 1. Start SonarQube locally
docker-compose -f docker-compose.sonarqube.yml up -d

# 2. Wait for SonarQube to start (takes 1-2 minutes)
echo "Waiting for SonarQube to start..."
until curl -s http://localhost:9000/api/system/status | grep -q '"status":"UP"'; do
  echo "Still starting..."
  sleep 5
done

echo "✓ SonarQube is ready at http://localhost:9000"
echo "Default credentials: admin / admin (you'll be prompted to change)"
```

### First Login

1. Open http://localhost:9000
2. Login with `admin` / `admin`
3. You'll be forced to change the password - **save this password**

---

## Local Development Setup

### Step 1: Create Your Project in SonarQube

1. Navigate to **Projects** → **Create Project**
2. Choose **Manually**
3. Enter:
   - **Project key**: `voice-runner`
   - **Display name**: `Voice Runner`
4. Click **Set Up**
5. Choose **Locally**
6. Generate a token:
   - Name: `local-dev`
   - Type: **User Token**
   - Expiration: 30 days (or longer)
   - **Copy and save this token** - you'll need it

### Step 2: Run Your First Scan

```bash
# Install SonarScanner (one-time setup)
# macOS:
brew install sonar-scanner

# Linux:
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
export PATH="$PWD/sonar-scanner-5.0.1.3006-linux/bin:$PATH"

# Windows:
# Download from https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/
# Extract and add to PATH

# Run the scan
sonar-scanner \
  -Dsonar.projectKey=voice-runner \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN_HERE
```

After the scan completes, you'll see a URL to view the results.

### Step 3: Review Full Codebase Analysis

This initial scan shows you the **current state** of your entire codebase:

- **Security Hotspots**: Potential vulnerabilities
- **Code Smells**: Maintainability issues
- **Bugs**: Reliability issues
- **Duplications**: Copy-pasted code
- **Technical Debt**: Estimated time to fix all issues

**Important**: This baseline helps you understand the technical debt, but won't block your workflow.

---

## Configuring Quality Gates

This is the **key configuration** for your phased approach - enforce standards on new code only.

### Step 1: Create a Custom Quality Gate

1. Go to **Quality Gates** in the top menu
2. Click **Create**
3. Name: `New Code Standards`
4. Add the following conditions (all on **New Code**):

#### Security-Focused Conditions

| Metric | Operator | Value | Why |
|--------|----------|-------|-----|
| Security Hotspots Reviewed | is less than | 100% | Ensure all new security hotspots are reviewed |
| Security Rating | is worse than | A | No new security vulnerabilities |
| Coverage | is less than | 50% | Minimum test coverage on new code |

#### Maintainability Conditions

| Metric | Operator | Value | Why |
|--------|----------|-------|-----|
| Maintainability Rating | is worse than | A | Keep new code maintainable |
| Code Smells | is greater than | 5 | Limit technical debt accumulation |
| Duplicated Lines (%) | is greater than | 3% | Avoid copy-paste programming |

#### Optional: Stricter Standards

| Metric | Operator | Value | Why |
|--------|----------|-------|-----|
| Cognitive Complexity | is greater than | 15 | Keep functions simple |
| Lines to Cover | is less than | 80% | Higher coverage for critical code |

### Step 2: Apply Quality Gate to Your Project

1. Go to **Projects** → **Voice Runner**
2. Click **Project Settings** → **Quality Gate**
3. Select **New Code Standards**
4. Save

### Step 3: Configure New Code Period

This defines what counts as "new":

1. Go to **Project Settings** → **New Code**
2. Choose **Reference branch**: `main`

This means any code in a PR that differs from `main` is considered "new code."

**Alternative options:**
- **Previous version**: Based on the last analysis
- **Number of days**: Last 30 days, useful for ongoing refactoring
- **Specific analysis**: Pick a baseline analysis date

---

## GitHub Actions Integration

### Step 1: Get a Token for CI/CD

1. In SonarQube, go to **My Account** → **Security** → **Generate Tokens**
2. Create a new token:
   - Name: `github-actions`
   - Type: **User Token**
   - Expiration: **No expiration**
3. Copy the token

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add two repository secrets:
   - `SONAR_TOKEN`: Paste the token from above
   - `SONAR_HOST_URL`: Enter `http://YOUR_SONARQUBE_URL`
     - For testing: Use a public URL (ngrok, Cloudflare Tunnel, or deploy to a server)
     - For production: Deploy SonarQube to a cloud instance

### Step 3: How the Workflows Work

#### PR Analysis ([.github/workflows/sonarqube-pr.yml](.github/workflows/sonarqube-pr.yml))

- **Triggers**: When you open or update a PR
- **Analyzes**: Only the changed code
- **Enforces**: Quality gate on new code
- **Result**: PR check passes/fails based on quality gate

#### Main Branch Analysis ([.github/workflows/sonarqube-main.yml](.github/workflows/sonarqube-main.yml))

- **Triggers**: When code is merged to `main` or manually
- **Analyzes**: Entire codebase
- **Enforces**: Nothing (informational only)
- **Result**: Updates historical trends, doesn't block merges

### Step 4: Test the Integration

```bash
# Create a test branch
git checkout -b test-sonarqube-integration

# Make a small change (e.g., add a comment)
echo "// Test change for SonarQube" >> js/app.js

# Commit and push
git add .
git commit -m "test: verify SonarQube integration"
git push origin test-sonarqube-integration

# Open a PR on GitHub
# The SonarQube check should appear within 2-3 minutes
```

---

## Understanding the Reports

### Dashboard Overview

- **Reliability (Bugs)**: Code that might not work correctly
- **Security (Vulnerabilities)**: Exploitable weaknesses
- **Security Hotspots**: Code that needs security review
- **Maintainability (Code Smells)**: Hard-to-maintain code
- **Coverage**: Test coverage percentage
- **Duplications**: Copy-pasted code blocks

### Key Metrics to Watch

#### For Security:

1. **Security Hotspots**: Review each one
   - Examples: Hardcoded credentials, weak crypto, injection points
   - Action: Click "Review" and mark as "Safe" or "Fix"

2. **Security Vulnerabilities**: Fix immediately
   - Ranked by severity: Blocker, Critical, Major, Minor, Info

3. **Security Rating**: A (best) to E (worst)
   - Based on number and severity of vulnerabilities

#### For Maintainability:

1. **Code Smells**: Issues that make code hard to maintain
   - Examples: Long functions, complex conditionals, duplicated code
   - Prioritize: Major and Critical smells

2. **Technical Debt**: Time estimated to fix all issues
   - Target: Keep debt from growing on new code

3. **Cognitive Complexity**: How hard code is to understand
   - Target: <15 per function

### Typical Issues in Your Codebase

Based on your architecture (vanilla JS, IIFE pattern, callback-based):

**Expected findings:**
- **Cognitive Complexity**: Callback chains in `app.js` might score high
- **Duplicated Code**: IIFE boilerplate across modules
- **No Tests**: Coverage will be 0% initially
- **Security Hotspots**: `eval()` usage (if any), localStorage access, audio permissions

**Not necessarily problems:**
- IIFE pattern (necessary for your architecture)
- ES5 syntax (intentional for compatibility)
- Callback-based architecture (performance-driven choice)

---

## Optional: Pre-commit Hooks

For immediate feedback during development (before pushing):

### Option 1: Simple Pre-commit Hook

```bash
# Create .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "Running quick SonarScanner check on changed files..."

# Get list of changed JS and Python files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|py)$')

if [ -z "$CHANGED_FILES" ]; then
  echo "No JS/Python files changed, skipping scan"
  exit 0
fi

# Run sonar-scanner (quick mode)
sonar-scanner \
  -Dsonar.projectKey=voice-runner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=${SONAR_TOKEN} \
  -Dsonar.analysis.mode=preview \
  2>&1 | grep -E "(CRITICAL|BLOCKER)" && {
    echo "❌ Critical issues found! Fix before committing."
    exit 1
  }

echo "✓ No critical issues found"
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### Option 2: Using pre-commit Framework

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: local
    hooks:
      - id: sonarqube-check
        name: SonarQube Quality Check
        entry: bash -c 'sonar-scanner -Dsonar.analysis.mode=preview'
        language: system
        pass_filenames: false
        always_run: false
        files: \.(js|py)$
EOF

# Install the hook
pre-commit install
```

**Note**: Pre-commit scanning can be slow (10-30 seconds). Recommended for small teams or critical repos only.

---

## Deployment Options for CI/CD

### Option 1: Cloudflare Tunnel (Free, for testing)

```bash
# Install Cloudflare Tunnel
brew install cloudflared  # macOS
# or download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Create tunnel
cloudflared tunnel create voice-runner-sonarqube

# Run tunnel
cloudflared tunnel --url http://localhost:9000
# This gives you a public URL like: https://random-words.trycloudflare.com
```

### Option 2: Deploy to Railway/Fly.io/Render

See `deployment/sonarqube-production.md` for production deployment guides.

### Option 3: Use SonarCloud (Free for open source)

If your repo is public, use https://sonarcloud.io instead of self-hosting.

---

## Workflow Summary

### For New Features/PRs:

1. Create feature branch
2. Write code
3. Push to GitHub
4. SonarQube analyzes in PR check
5. Fix any quality gate failures
6. Merge once PR passes

### For Viewing Overall Health:

1. Go to http://localhost:9000
2. View **Voice Runner** dashboard
3. See full codebase analysis
4. Use "Issues" tab to explore:
   - Filter by: Security, Maintainability, Severity
   - Assign issues to yourself
   - Mark as "Won't Fix" or "False Positive" if needed

### For Planning Refactoring:

1. Go to **Measures** → **Security** / **Maintainability**
2. Sort by: Most complex files, Most duplicated, Highest debt
3. Create GitHub issues for top items
4. Tackle incrementally over time

---

## Troubleshooting

### SonarQube won't start

```bash
# Check logs
docker-compose -f docker-compose.sonarqube.yml logs sonarqube

# Common issue: Not enough memory
# Solution: Increase Docker memory to 4GB+ in Docker Desktop settings
```

### Scan fails with "Not authorized"

- Verify `SONAR_TOKEN` is correct
- Regenerate token in SonarQube UI
- Check token hasn't expired

### GitHub Action fails to connect

- Ensure `SONAR_HOST_URL` is publicly accessible
- Check firewall rules
- Verify secrets are set in GitHub repo settings

### Quality gate is too strict

- Adjust thresholds in **Quality Gates** → **New Code Standards**
- Start lenient, tighten over time
- Can temporarily disable specific conditions

### No issues found (seems wrong)

- Check `sonar-project.properties` has correct source paths
- Verify file extensions are included
- Check exclusion patterns aren't too broad

---

## Next Steps

1. ✅ Run initial scan to see full codebase health
2. ✅ Configure quality gate for new code only
3. ✅ Test GitHub Actions on a dummy PR
4. 📋 Review top 10 security hotspots
5. 📋 Create refactoring plan for high-debt modules
6. 📋 Consider adding tests to improve coverage over time

---

## Additional Resources

- [SonarQube Documentation](https://docs.sonarqube.org/latest/)
- [JavaScript Analysis Parameters](https://docs.sonarqube.org/latest/analyzing-source-code/languages/javascript/)
- [Python Analysis Parameters](https://docs.sonarqube.org/latest/analyzing-source-code/languages/python/)
- [Security Rules](https://rules.sonarsource.com/javascript/type/Security%20Hotspot)
