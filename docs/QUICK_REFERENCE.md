# SonarQube Quick Reference Card

One-page cheat sheet for common SonarQube tasks.

## Starting SonarQube

```bash
# Start
docker-compose -f docker-compose.sonarqube.yml up -d

# Check status
curl -s http://localhost:9000/api/system/status

# Stop
docker-compose -f docker-compose.sonarqube.yml down

# View logs
docker-compose -f docker-compose.sonarqube.yml logs -f
```

**Access**: http://localhost:9000 (admin/admin on first login)

---

## Running Scans

### This Project (Voice Runner)

```bash
# Quick scan
./scripts/run-sonar-scan.sh YOUR_TOKEN

# Manual
sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN
```

### New Project

```bash
# 1. Copy template
cp docs/sonar-project.properties.template sonar-project.properties

# 2. Edit (change projectKey, projectName, sources)
vim sonar-project.properties

# 3. Create project in UI
open http://localhost:9000

# 4. Run scan
sonar-scanner -Dsonar.token=YOUR_TOKEN
```

---

## Token Management

```bash
# Store globally for pre-commit
git config --global sonar.token YOUR_TOKEN

# View stored token
git config --get sonar.token

# Remove stored token
git config --global --unset sonar.token
```

**Get new token**: http://localhost:9000 → Account → Security → Generate Token

---

## Pre-commit Hooks

```bash
# Install (one-time setup)
python3 -m pre_commit install

# Run manually on all files
python3 -m pre_commit run --all-files

# Run on specific files
python3 -m pre_commit run --files js/app.js backend/main.py

# Update hooks to latest versions
python3 -m pre_commit autoupdate

# Skip hooks for one commit
git commit --no-verify -m "message"

# Skip specific hook
SKIP=sonarqube-incremental git commit -m "message"
```

---

## Common sonar-project.properties Patterns

### Minimal Setup
```properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.sources=.
sonar.exclusions=**/node_modules/**,**/venv/**
```

### JavaScript/React
```properties
sonar.sources=src,components
sonar.tests=__tests__
sonar.javascript.file.suffixes=.js,.jsx
sonar.typescript.file.suffixes=.ts,.tsx
sonar.exclusions=**/node_modules/**,**/build/**
```

### Python/FastAPI
```properties
sonar.sources=app,src
sonar.tests=tests
sonar.python.version=3.11
sonar.exclusions=**/venv/**,**/__pycache__/**
```

### Full-Stack
```properties
sonar.sources=frontend/src,backend/app
sonar.javascript.file.suffixes=.js,.jsx,.ts,.tsx
sonar.python.version=3.11
sonar.exclusions=**/node_modules/**,**/venv/**
```

---

## Quality Gates

### View Quality Gate
- UI: Quality Gates → Your Gate Name
- Default: "Sonar way" (built-in)

### Create Custom Gate
1. Quality Gates → Create
2. Add conditions (focus on "New Code")
3. Projects → Your Project → Settings → Quality Gate

### Key Metrics
| Metric | Description | Typical Threshold |
|--------|-------------|-------------------|
| Security Rating | A-E scale | A (no vulnerabilities) |
| Maintainability Rating | A-E scale | A (low tech debt) |
| Coverage | % code tested | 50-80% |
| Duplications | % duplicated code | < 3% |
| Code Smells | Maintainability issues | < 5 on new code |

---

## Viewing Results

### Dashboard
```bash
# Open project dashboard
open http://localhost:9000/dashboard?id=PROJECT_KEY
```

### Key Pages
- **Overview**: Main metrics and quality gate status
- **Issues**: All code smells, bugs, vulnerabilities
- **Measures**: Detailed metrics and history
- **Code**: Browse code with inline annotations
- **Activity**: Scan history and trends

### Filter Issues
- **Severity**: Blocker, Critical, Major, Minor, Info
- **Type**: Bug, Vulnerability, Code Smell, Security Hotspot
- **Status**: Open, Confirmed, Resolved, Closed
- **Assignee**: Assign issues to yourself or team members

---

## Troubleshooting

### SonarQube won't start
```bash
# Check if port 9000 is in use
lsof -i :9000

# Increase Docker memory (needs 4GB+)
# Docker Desktop → Settings → Resources → Memory

# Check logs
docker-compose -f docker-compose.sonarqube.yml logs sonarqube
```

### Scan fails: "Not authorized"
```bash
# Regenerate token
# http://localhost:9000 → Account → Security → Revoke old → Generate new

# Update stored token
git config --global sonar.token NEW_TOKEN
```

### Scan fails: "Project not found"
- Verify `sonar.projectKey` matches project created in UI
- Create project: http://localhost:9000 → Projects → Create

### No files analyzed
```bash
# Check sonar.sources points to real directories
ls -la src/  # Should show source files

# Use absolute path for testing
sonar-scanner -Dsonar.sources=/full/path/to/src
```

### Pre-commit too slow
```bash
# Disable SonarQube hook
git config --global --unset sonar.token

# Or skip it temporarily
SKIP=sonarqube-incremental git commit -m "message"
```

---

## File Locations

```
voice-runner/
├── sonar-project.properties      # SonarQube config (this project)
├── .pre-commit-config.yaml       # Pre-commit hooks config
├── .eslintrc.json                # JavaScript linting rules
├── bandit.yaml                   # Python security rules
├── docker-compose.sonarqube.yml  # SonarQube server setup
├── scripts/
│   ├── setup-sonarqube.sh        # Initial setup script
│   ├── run-sonar-scan.sh         # Quick scan script
│   └── pre-commit-sonar.sh       # Pre-commit integration
└── docs/
    ├── SONARQUBE_SETUP.md        # Full setup guide
    ├── SONARQUBE_QUICKSTART.md   # 5-minute guide
    ├── PRE_COMMIT_SETUP.md       # Pre-commit guide
    ├── SONARQUBE_NEW_PROJECT.md  # Add to new projects
    └── sonar-project.properties.template  # Template for new projects
```

---

## Command Quick Reference

| Task | Command |
|------|---------|
| Start SonarQube | `docker-compose -f docker-compose.sonarqube.yml up -d` |
| Stop SonarQube | `docker-compose -f docker-compose.sonarqube.yml down` |
| Scan current project | `./scripts/run-sonar-scan.sh TOKEN` |
| Scan any project | `sonar-scanner -Dsonar.token=TOKEN` |
| Open SonarQube | `open http://localhost:9000` |
| Install pre-commit | `python3 -m pre_commit install` |
| Run all pre-commit | `python3 -m pre_commit run --all-files` |
| Store token | `git config --global sonar.token TOKEN` |
| Skip pre-commit | `git commit --no-verify` |

---

## URL Quick Reference

| Page | URL |
|------|-----|
| Dashboard | http://localhost:9000 |
| Voice Runner Project | http://localhost:9000/dashboard?id=voice-runner |
| Create Project | http://localhost:9000/projects/create |
| Generate Token | http://localhost:9000/account/security |
| Quality Gates | http://localhost:9000/quality_gates |
| Rules Explorer | http://localhost:9000/coding_rules |
| System Status | http://localhost:9000/api/system/status |

---

## Getting Help

- **Full Setup**: [SONARQUBE_SETUP.md](SONARQUBE_SETUP.md)
- **Quick Start**: [SONARQUBE_QUICKSTART.md](SONARQUBE_QUICKSTART.md)
- **Pre-commit**: [PRE_COMMIT_SETUP.md](PRE_COMMIT_SETUP.md)
- **New Projects**: [SONARQUBE_NEW_PROJECT.md](SONARQUBE_NEW_PROJECT.md)
- **SonarQube Docs**: https://docs.sonarqube.org/latest/
- **Pre-commit Docs**: https://pre-commit.com/
