#!/bin/bash
# Pre-commit SonarQube Quick Scan
# Runs a fast, incremental scan on changed files only

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if sonar-scanner is installed
if ! command -v sonar-scanner &> /dev/null; then
    echo -e "${YELLOW}⚠ sonar-scanner not found, skipping SonarQube check${NC}"
    echo -e "${BLUE}Install with: brew install sonar-scanner${NC}"
    exit 0  # Don't block commit
fi

# Check if SonarQube is running
if ! curl -s http://localhost:9000/api/system/status &> /dev/null; then
    echo -e "${YELLOW}⚠ SonarQube not running at localhost:9000, skipping${NC}"
    echo -e "${BLUE}Start with: docker-compose -f docker-compose.sonarqube.yml up -d${NC}"
    exit 0  # Don't block commit
fi

# Get changed files (staged)
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|py)$' || true)

if [ -z "$CHANGED_FILES" ]; then
    echo -e "${GREEN}✓ No JS/Python files changed, skipping SonarQube scan${NC}"
    exit 0
fi

echo -e "${BLUE}Running SonarQube quick scan on changed files...${NC}"

# Create a temporary properties file for incremental scan
TEMP_PROPS=$(mktemp)
cat > "$TEMP_PROPS" << EOF
# Incremental scan configuration
sonar.projectKey=voice-runner
sonar.sources=.
sonar.inclusions=$(echo "$CHANGED_FILES" | tr '\n' ',')
sonar.scm.exclusions.disabled=true

# Speed optimizations for pre-commit
sonar.qualitygate.wait=false
sonar.issuesReport.console.enable=true
EOF

# Run quick scan
echo -e "${YELLOW}Analyzing: $(echo "$CHANGED_FILES" | wc -l | xargs) file(s)${NC}"

# Get token from environment or ask user
if [ -z "$SONAR_TOKEN" ]; then
    SONAR_TOKEN="${SONAR_TOKEN:-$(git config --get sonar.token 2>/dev/null || echo '')}"
fi

if [ -z "$SONAR_TOKEN" ]; then
    echo -e "${YELLOW}No SONAR_TOKEN found. Skipping detailed analysis.${NC}"
    echo -e "${BLUE}Set token with: git config --global sonar.token YOUR_TOKEN${NC}"
    rm "$TEMP_PROPS"
    exit 0
fi

# Run the scan
if sonar-scanner \
    -Dproject.settings="$TEMP_PROPS" \
    -Dsonar.host.url=http://localhost:9000 \
    -Dsonar.token="$SONAR_TOKEN" \
    -Dsonar.verbose=false \
    &> /tmp/sonar-precommit.log; then

    # Check for critical issues in the log
    CRITICAL_ISSUES=$(grep -c "CRITICAL\|BLOCKER" /tmp/sonar-precommit.log 2>/dev/null || echo "0")

    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        echo -e "${RED}✗ Found $CRITICAL_ISSUES critical issue(s)${NC}"
        echo -e "${YELLOW}Review at: http://localhost:9000/dashboard?id=voice-runner${NC}"
        rm "$TEMP_PROPS"
        exit 1  # Block commit
    else
        echo -e "${GREEN}✓ No critical issues found${NC}"
    fi
else
    echo -e "${YELLOW}⚠ SonarQube scan had warnings (not blocking)${NC}"
fi

rm "$TEMP_PROPS"
exit 0
