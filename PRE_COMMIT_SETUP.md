# Pre-commit Hooks Setup for Voice Runner

Catch code quality issues **before** you commit, not during PR review!

## What This Does

Pre-commit hooks run automatically before each `git commit` and check for:

1. **Code Formatting** - Trailing whitespace, end-of-file fixes
2. **Security Issues** - Private keys, hardcoded secrets (Bandit for Python)
3. **Code Quality** - Python linting (Ruff), JavaScript linting (ESLint)
4. **SonarQube Analysis** - Quick scan of changed files only
5. **File Safety** - Large files, merge conflicts

**Key benefit**: Issues are caught in ~5-10 seconds locally, not 5 minutes later in CI/CD.

---

## Quick Setup (2 minutes)

### Step 1: Install Pre-commit

```bash
# Already done if you followed SonarQube setup
pip3 install pre-commit
```

### Step 2: Install the Hooks

```bash
# From the project root
python3 -m pre_commit install

# You should see:
# ✓ pre-commit installed at .git/hooks/pre-commit
```

### Step 3: Configure SonarQube Token (Optional)

```bash
# Store your SonarQube token for automatic scans
git config --global sonar.token YOUR_TOKEN_HERE

# Get token from: http://localhost:9000 → Account → Security
```

### Step 4: Test It

```bash
# Make a small change
echo "// test" >> js/app.js

# Stage it
git add js/app.js

# Try to commit (hooks will run)
git commit -m "test: verify pre-commit hooks"

# You'll see all hooks run!
```

---

## How It Works

### Automatic (On Every Commit)

When you run `git commit`, pre-commit automatically:

1. ✅ Checks only **staged files** (fast!)
2. ✅ Runs relevant hooks (JS hooks skip Python files)
3. ✅ Auto-fixes issues when possible (formatting, trailing spaces)
4. ❌ **Blocks commit** if critical issues found
5. ✅ Lets you commit if all checks pass

### Manual (Anytime)

```bash
# Run on all files (good for first-time setup)
python3 -m pre_commit run --all-files

# Run on specific files
python3 -m pre_commit run --files js/app.js backend/main.py

# Skip hooks for emergency commits (use sparingly!)
git commit --no-verify -m "hotfix: emergency fix"
```

---

## What Each Hook Does

### 1. Basic Code Quality (Always Runs)

| Hook | What It Does | Auto-Fix? |
|------|-------------|-----------|
| `trailing-whitespace` | Removes trailing spaces | ✅ Yes |
| `end-of-file-fixer` | Ensures files end with newline | ✅ Yes |
| `check-yaml` | Validates YAML syntax | ❌ No |
| `check-json` | Validates JSON syntax | ❌ No |
| `check-added-large-files` | Blocks files > 5MB | ❌ No |
| `check-merge-conflicts` | Detects `<<<<<<<` markers | ❌ No |
| `detect-private-key` | Finds SSH/API keys | ❌ No |

**Result**: Clean, safe commits

### 2. Python Backend (backend/*.py files)

| Hook | What It Does | Blocks Commit? |
|------|-------------|----------------|
| `ruff` | Fast linter (replaces flake8, pylint) | ✅ Yes (if errors) |
| `ruff-format` | Code formatter (replaces black) | ✅ Yes |
| `bandit` | Security vulnerability scanner | ✅ Yes (high severity) |

**Example issues caught:**
- SQL injection risks
- Hardcoded passwords
- Insecure random usage
- Eval() usage
- Weak cryptography

### 3. JavaScript Frontend (js/*.js files)

| Hook | What It Does | Blocks Commit? |
|------|-------------|----------------|
| `eslint` | JavaScript linter | ✅ Yes (if errors) |

**Example issues caught:**
- Unused variables
- Missing semicolons
- Console.log statements (warnings only)
- Undefined variables

### 4. SonarQube Quick Scan (Optional)

**Runs when**:
- SonarQube is running (`localhost:9000`)
- Token is configured
- JS or Python files changed

**What it does**:
- Scans **only changed files** (fast!)
- Checks for critical/blocker issues
- **Blocks commit** if critical issues found
- Skips gracefully if SonarQube unavailable

**Speed**: ~3-5 seconds for typical commit

**To disable**: Remove your token:
```bash
git config --global --unset sonar.token
```

### 5. Dockerfile Linting (Optional)

Uses `hadolint` to check Dockerfile best practices.

**Install**:
```bash
brew install hadolint  # macOS
```

Skips silently if not installed.

---

## Configuration Files

### `.pre-commit-config.yaml`

Main configuration. Edit to:
- Add/remove hooks
- Change hook behavior
- Update versions

```bash
# Update all hooks to latest versions
python3 -m pre_commit autoupdate
```

### `bandit.yaml`

Security scanner config for Python. Customize to:
- Skip specific security tests
- Add exclusions
- Change severity thresholds

### `.eslintrc.json`

JavaScript linting rules. Customize to:
- Change code style rules
- Add ESLint plugins
- Adjust severity levels

---

## Common Workflows

### Daily Development

```bash
# Normal workflow - hooks run automatically
git add .
git commit -m "feat: add new feature"
# → Hooks run, auto-fix issues, commit succeeds
```

### First-Time Run (Slower)

```bash
# Run on entire codebase once
python3 -m pre_commit run --all-files

# This will:
# - Auto-fix formatting issues across all files
# - Report any unfixable issues
# - May take 30-60 seconds

# Then commit the fixes
git add .
git commit -m "chore: apply pre-commit fixes"
```

### When Hooks Block Your Commit

```bash
# Scenario: You try to commit
git commit -m "fix: update logic"

# Output:
# ❌ ruff.......................Failed
# - backend/main.py:42:1: F401 'os' imported but unused

# Fix the issue
# Remove unused import from backend/main.py

# Stage the fix
git add backend/main.py

# Commit again (will pass now)
git commit -m "fix: update logic"
```

### Emergency Bypass (Use Rarely!)

```bash
# Skip all hooks (only for emergencies!)
git commit --no-verify -m "hotfix: critical production fix"

# You'll still need to fix issues later
```

---

## Integration with SonarQube

Pre-commit and SonarQube work together:

| Tool | When | What | Speed |
|------|------|------|-------|
| **Pre-commit** | Before commit | Changed files only | 5-10s |
| **SonarQube Local** | After commit (manual) | Full codebase | 30-60s |
| **SonarQube CI/CD** | On PR | Full diff vs main | 1-2min |

**Recommended workflow:**

1. **Write code** → Pre-commit catches issues immediately
2. **Push to branch** → SonarQube local scan for full context
3. **Create PR** → CI/CD enforces quality gate

---

## Troubleshooting

### "pre-commit: command not found"

```bash
# Use Python module directly
python3 -m pre_commit install
python3 -m pre_commit run
```

### "SonarQube scan failed"

```bash
# Check if SonarQube is running
curl http://localhost:9000/api/system/status

# If not running:
docker-compose -f docker-compose.sonarqube.yml up -d

# Or skip SonarQube check:
git config --global --unset sonar.token
```

### "Hook took too long"

```bash
# Skip slow hooks for this commit
SKIP=sonarqube-incremental git commit -m "message"

# Or disable specific hooks permanently
# Edit .pre-commit-config.yaml and comment out the hook
```

### "eslint not found"

```bash
# Re-install pre-commit environments
python3 -m pre_commit clean
python3 -m pre_commit install --install-hooks
```

### "Hooks keep failing on old code"

```bash
# Run auto-fixes on all files once
python3 -m pre_commit run --all-files

# Commit the auto-fixes
git add .
git commit -m "chore: apply pre-commit auto-fixes"

# Future commits will be cleaner
```

---

## Customization

### Disable Specific Hooks

Edit `.pre-commit-config.yaml`:

```yaml
# Comment out hooks you don't want
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    hooks:
      - id: trailing-whitespace
      # - id: check-yaml  # Disabled
```

### Change Hook Behavior

```yaml
# Example: Only warn on unused variables
- repo: https://github.com/pre-commit/mirrors-eslint
  hooks:
    - id: eslint
      args: ['--fix', '--rule', 'no-unused-vars: warn']
```

### Add New Hooks

Browse available hooks: https://pre-commit.com/hooks.html

```yaml
# Example: Add Prettier for JS formatting
- repo: https://github.com/pre-commit/mirrors-prettier
  rev: v3.1.0
  hooks:
    - id: prettier
      types_or: [javascript, json, yaml]
```

---

## Performance Tips

### Keep It Fast

Pre-commit should be **fast** to avoid frustration:

- ✅ **Good**: 5-15 seconds per commit
- ⚠️ **Slow**: 30+ seconds
- ❌ **Too slow**: 1+ minute

**If slow:**

1. **Disable SonarQube hook** for everyday commits:
   ```bash
   git config --global --unset sonar.token
   ```

2. **Run SonarQube manually** when needed:
   ```bash
   ./scripts/run-sonar-scan.sh
   ```

3. **Skip heavy hooks** occasionally:
   ```bash
   SKIP=bandit,sonarqube-incremental git commit -m "wip: work in progress"
   ```

---

## Team Setup

### For Team Members

Share this setup with your team:

```bash
# After cloning the repo
python3 -m pip install pre-commit
python3 -m pre_commit install

# Optional: Add SonarQube token
git config --global sonar.token YOUR_TOKEN
```

### Enforce Hooks (Optional)

Add to README:

> **Pre-commit hooks are required**. Run `python3 -m pre_commit install` after cloning.

Or check in CI/CD:

```yaml
# GitHub Actions
- name: Check pre-commit
  run: python3 -m pre_commit run --all-files
```

---

## Summary

**What you get:**
- ✅ Catch issues in seconds, not minutes
- ✅ Auto-fix formatting issues
- ✅ Prevent committing secrets or broken code
- ✅ Maintain consistent code quality
- ✅ Reduce PR review iterations

**Cost:**
- ⏱️ 5-10 seconds per commit
- 📦 ~50MB disk space for hook environments
- 🔧 One-time setup (2 minutes)

**Worth it?** Absolutely! Clean commits = faster reviews = happier team.

---

## Next Steps

1. ✅ **Try it**: Make a small change and commit
2. 📋 **Run on all files**: `python3 -m pre_commit run --all-files`
3. 🎯 **Customize**: Edit `.pre-commit-config.yaml` for your needs
4. 👥 **Share**: Help teammates set up pre-commit
5. 📊 **Monitor**: Track how many issues are caught early

**Questions?** See the [full documentation](https://pre-commit.com/)
