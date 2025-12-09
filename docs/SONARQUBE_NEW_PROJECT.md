# Adding SonarQube to a New Project

Quick guide to set up SonarQube analysis for any new codebase.

## Quick Setup (3 steps)

### Step 1: Create `sonar-project.properties`

Add this file to the root of your new project:

```properties
# Project identification
sonar.projectKey=my-project-name
sonar.projectName=My Project Name
sonar.projectVersion=1.0.0

# Source code location
sonar.sources=.

# Exclusions - adjust based on your project structure
sonar.exclusions=**/node_modules/**,**/venv/**,**/__pycache__/**,**/dist/**,**/build/**,**/vendor/**,**/*.min.js

# Language-specific settings (uncomment what you need)

# JavaScript/TypeScript
# sonar.javascript.file.suffixes=.js,.jsx,.ts,.tsx
# sonar.typescript.file.suffixes=.ts,.tsx

# Python
# sonar.python.version=3.11

# Java
# sonar.java.binaries=target/classes

# Go
# sonar.go.coverage.reportPaths=coverage.out

# Security and quality
sonar.scm.provider=git
sonar.newCode.referenceBranch=main
```

### Step 2: Create Project in SonarQube

```bash
# Make sure SonarQube is running
docker-compose -f docker-compose.sonarqube.yml up -d

# Open SonarQube
open http://localhost:9000

# In UI:
# 1. Projects → Create Project → Manually
# 2. Project key: my-project-name (must match sonar.projectKey)
# 3. Display name: My Project Name
# 4. Click "Set Up" → Choose "Locally"
# 5. Generate token → Save it
```

### Step 3: Run First Scan

```bash
# Navigate to your project directory
cd /path/to/my-project

# Run scan
sonar-scanner \
  -Dsonar.projectKey=my-project-name \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN_HERE

# View results
open http://localhost:9000/dashboard?id=my-project-name
```

---

## Project-Specific Configurations

### JavaScript/Node.js Project

```properties
# sonar-project.properties
sonar.projectKey=my-js-app
sonar.projectName=My JavaScript App
sonar.projectVersion=1.0.0

# Source locations
sonar.sources=src
sonar.tests=test,tests,__tests__

# Exclusions
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/*.spec.js,**/*.test.js

# JavaScript settings
sonar.javascript.file.suffixes=.js,.jsx
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# If using TypeScript
sonar.typescript.file.suffixes=.ts,.tsx
sonar.typescript.tsconfigPath=tsconfig.json
```

### Python Project

```properties
# sonar-project.properties
sonar.projectKey=my-python-app
sonar.projectName=My Python App
sonar.projectVersion=1.0.0

# Source locations
sonar.sources=src,app
sonar.tests=tests

# Exclusions
sonar.exclusions=**/venv/**,**/__pycache__/**,**/*.pyc,**/migrations/**

# Python settings
sonar.python.version=3.11
sonar.python.coverage.reportPaths=coverage.xml

# Test settings
sonar.test.inclusions=**/test_*.py,**/*_test.py
```

### React/Next.js Project

```properties
# sonar-project.properties
sonar.projectKey=my-react-app
sonar.projectName=My React App
sonar.projectVersion=1.0.0

# Source locations
sonar.sources=src,components,pages,app
sonar.tests=__tests__,src/**/*.test.tsx,src/**/*.spec.tsx

# Exclusions
sonar.exclusions=**/node_modules/**,**/.next/**,**/out/**,**/public/**,**/*.config.js

# JavaScript/TypeScript settings
sonar.javascript.file.suffixes=.js,.jsx
sonar.typescript.file.suffixes=.ts,.tsx
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# Next.js specific
sonar.coverage.exclusions=**/*.config.js,**/*.config.ts,**/pages/_app.tsx,**/pages/_document.tsx
```

### FastAPI/Django Project

```properties
# sonar-project.properties
sonar.projectKey=my-api
sonar.projectName=My API
sonar.projectVersion=1.0.0

# Source locations
sonar.sources=app,src
sonar.tests=tests

# Exclusions
sonar.exclusions=**/venv/**,**/__pycache__/**,**/migrations/**,**/static/**,**/media/**

# Python settings
sonar.python.version=3.11
sonar.python.coverage.reportPaths=coverage.xml

# Django specific (if applicable)
# sonar.exclusions=**/settings.py,**/wsgi.py,**/asgi.py,**/manage.py
```

### Full-Stack Monorepo

```properties
# sonar-project.properties
sonar.projectKey=my-fullstack-app
sonar.projectName=My Full-Stack App
sonar.projectVersion=1.0.0

# Source locations - specify both frontend and backend
sonar.sources=frontend/src,backend/app

# Exclusions
sonar.exclusions=**/node_modules/**,**/venv/**,**/dist/**,**/build/**,**/__pycache__/**

# Multiple languages
sonar.javascript.file.suffixes=.js,.jsx,.ts,.tsx
sonar.python.version=3.11

# Test coverage (if you have it)
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info
sonar.python.coverage.reportPaths=backend/coverage.xml

# New code definition
sonar.newCode.referenceBranch=main
```

---

## Template for Any Project

Copy this minimal template and customize:

```properties
# ====================================
# SonarQube Project Configuration
# ====================================

# Project Info
sonar.projectKey=CHANGE_ME
sonar.projectName=CHANGE_ME
sonar.projectVersion=1.0.0

# What to scan
sonar.sources=.

# What to exclude (add more as needed)
sonar.exclusions=\
  **/node_modules/**,\
  **/venv/**,\
  **/__pycache__/**,\
  **/dist/**,\
  **/build/**,\
  **/target/**,\
  **/vendor/**,\
  **/*.min.js,\
  **/*.min.css

# Git integration
sonar.scm.provider=git

# New code definition (enforce quality on new code only)
sonar.newCode.referenceBranch=main
```

---

## Common Patterns

### Exclude Test Files from Coverage

```properties
sonar.coverage.exclusions=\
  **/tests/**,\
  **/*test*.js,\
  **/*spec*.js,\
  **/test_*.py,\
  **/*_test.py
```

### Exclude Generated Code

```properties
sonar.exclusions=\
  **/generated/**,\
  **/.generated/**,\
  **/proto/**,\
  **/*_pb.js,\
  **/*.pb.go
```

### Multiple Source Directories

```properties
# Comma-separated list
sonar.sources=src,lib,components,utils
```

### Custom Test Directories

```properties
sonar.tests=test,tests,spec,__tests__
```

---

## Copying Configuration from Voice Runner

You can reuse the Voice Runner setup for similar projects:

```bash
# Copy the base configuration
cp /path/to/voice-runner/sonar-project.properties ./

# Edit the project-specific fields
vim sonar-project.properties
# Change: sonar.projectKey, sonar.projectName, sonar.sources

# Copy pre-commit setup (optional)
cp /path/to/voice-runner/.pre-commit-config.yaml ./
cp /path/to/voice-runner/bandit.yaml ./
cp /path/to/voice-runner/.eslintrc.json ./

# Install pre-commit
python3 -m pre_commit install
```

---

## Using the Same SonarQube Instance

Your local SonarQube instance can manage **multiple projects**:

1. **Each project needs**:
   - Unique `sonar.projectKey`
   - Its own `sonar-project.properties` file

2. **One SonarQube instance tracks all projects**:
   ```bash
   # Start SonarQube once
   docker-compose -f ~/voice-runner/docker-compose.sonarqube.yml up -d

   # Scan project 1
   cd ~/project-1
   sonar-scanner -Dsonar.token=TOKEN

   # Scan project 2
   cd ~/project-2
   sonar-scanner -Dsonar.token=TOKEN

   # View all projects at http://localhost:9000
   ```

3. **Each project appears separately** in the SonarQube UI

---

## Checklist for New Projects

- [ ] Create `sonar-project.properties` in project root
- [ ] Set unique `sonar.projectKey` (no spaces or special chars)
- [ ] Configure `sonar.sources` to match your project structure
- [ ] Add exclusions for dependencies/generated code
- [ ] Create project in SonarQube UI
- [ ] Generate and save token
- [ ] Run first scan
- [ ] Review results and adjust configuration
- [ ] (Optional) Set up pre-commit hooks
- [ ] (Optional) Configure quality gate

---

## Troubleshooting

### "Project not found"

Make sure `sonar.projectKey` in the file matches the project key in SonarQube UI.

### "No files to analyze"

Check `sonar.sources` points to actual source code directories:
```bash
# Test with absolute paths first
sonar-scanner -Dsonar.sources=/absolute/path/to/src
```

### "Exclusions not working"

Use absolute patterns:
```properties
# Good - matches anywhere
sonar.exclusions=**/node_modules/**

# Bad - only matches root level
sonar.exclusions=node_modules/**
```

### "Scan takes too long"

Add more exclusions:
```properties
# Exclude large directories
sonar.exclusions=\
  **/node_modules/**,\
  **/vendor/**,\
  **/build/**,\
  **/*.min.js,\
  **/assets/**
```

---

## Example: Quick Setup for New Project

```bash
# 1. Navigate to your new project
cd ~/my-new-project

# 2. Create minimal config
cat > sonar-project.properties << 'EOF'
sonar.projectKey=my-new-project
sonar.projectName=My New Project
sonar.sources=.
sonar.exclusions=**/node_modules/**,**/venv/**
sonar.scm.provider=git
sonar.newCode.referenceBranch=main
EOF

# 3. Create project in SonarQube UI and get token
open http://localhost:9000

# 4. Run first scan
sonar-scanner \
  -Dsonar.projectKey=my-new-project \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN

# 5. Review results
open http://localhost:9000/dashboard?id=my-new-project

# 6. Refine configuration based on results
vim sonar-project.properties

# 7. Re-scan
sonar-scanner -Dsonar.token=YOUR_TOKEN
```

---

## Summary

**Minimum required**:
1. `sonar-project.properties` file
2. Project created in SonarQube UI
3. Token generated

**Recommended**:
- Configure exclusions for dependencies
- Set `sonar.sources` explicitly
- Define `sonar.newCode.referenceBranch`
- Add language-specific settings

**Result**: Clean analysis of your new codebase using the same SonarQube instance! 🎉
