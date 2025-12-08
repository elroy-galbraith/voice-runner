#!/bin/bash
# Quick SonarQube Scan Script for Voice Runner
# Usage: ./scripts/run-sonar-scan.sh [TOKEN]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_KEY="voice-runner"
SONAR_URL="${SONAR_HOST_URL:-http://localhost:9000}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Voice Runner - SonarQube Scan${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if sonar-scanner is installed
if ! command -v sonar-scanner &> /dev/null; then
    echo -e "${RED}✗ sonar-scanner not found${NC}"
    echo -e "${YELLOW}Install it using:${NC}"
    echo -e "  macOS:   ${GREEN}brew install sonar-scanner${NC}"
    echo -e "  Linux:   Download from https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/"
    exit 1
fi

# Get token from argument or environment variable
if [ -n "$1" ]; then
    SONAR_TOKEN="$1"
elif [ -n "$SONAR_TOKEN" ]; then
    # Use existing environment variable
    true
else
    echo -e "${YELLOW}No token provided. Checking if SonarQube is accessible...${NC}"
    if ! curl -s "$SONAR_URL/api/system/status" &> /dev/null; then
        echo -e "${RED}✗ Cannot reach SonarQube at $SONAR_URL${NC}"
        echo -e "${YELLOW}Make sure SonarQube is running:${NC}"
        echo -e "  ${GREEN}docker-compose -f docker-compose.sonarqube.yml up -d${NC}\n"
        exit 1
    fi

    echo -e "${YELLOW}Please provide your SonarQube token:${NC}"
    echo -e "  Get it from: ${BLUE}$SONAR_URL/account/security${NC}"
    echo -e "  Or pass as argument: ${GREEN}./scripts/run-sonar-scan.sh YOUR_TOKEN${NC}\n"
    read -sp "Token: " SONAR_TOKEN
    echo ""
fi

# Check if SonarQube is reachable
echo -e "${YELLOW}Checking SonarQube connection...${NC}"
if ! curl -s -u "$SONAR_TOKEN:" "$SONAR_URL/api/system/status" &> /dev/null; then
    echo -e "${RED}✗ Cannot authenticate with SonarQube${NC}"
    echo -e "${YELLOW}Verify:${NC}"
    echo -e "  1. SonarQube is running"
    echo -e "  2. Token is correct"
    echo -e "  3. URL is correct: $SONAR_URL"
    exit 1
fi
echo -e "${GREEN}✓ Connected to SonarQube${NC}"

# Optional: Run additional linters for better analysis
echo -e "\n${YELLOW}Running additional code analysis tools...${NC}"

# Python linting (backend)
if [ -d "backend" ] && command -v pylint &> /dev/null; then
    echo -e "${BLUE}Running pylint on backend...${NC}"
    cd backend
    pylint main.py --output-format=json > ../pylint-report.json 2>/dev/null || true
    cd ..
    echo -e "${GREEN}✓ Pylint complete${NC}"
fi

# Python security scan
if [ -d "backend" ] && command -v bandit &> /dev/null; then
    echo -e "${BLUE}Running bandit security scan on backend...${NC}"
    cd backend
    bandit -r . -f json -o ../bandit-report.json 2>/dev/null || true
    cd ..
    echo -e "${GREEN}✓ Bandit complete${NC}"
fi

# Run the scan
echo -e "\n${YELLOW}Running SonarQube scan...${NC}"
echo -e "${BLUE}This may take 1-2 minutes for the full codebase${NC}\n"

sonar-scanner \
  -Dsonar.projectKey="$PROJECT_KEY" \
  -Dsonar.host.url="$SONAR_URL" \
  -Dsonar.token="$SONAR_TOKEN" \
  -Dsonar.scm.provider=git

echo -e "\n${GREEN}✓ Scan complete!${NC}"
echo -e "\n${BLUE}View results at:${NC}"
echo -e "  ${GREEN}$SONAR_URL/dashboard?id=$PROJECT_KEY${NC}\n"

# Summary stats
echo -e "${YELLOW}Quick Summary:${NC}"
echo -e "  Run ${GREEN}./scripts/sonar-summary.sh${NC} to see key metrics\n"
