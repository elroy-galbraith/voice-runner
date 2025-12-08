#!/bin/bash
# SonarQube Setup Helper Script
# This script automates the initial SonarQube setup for Voice Runner

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_KEY="voice-runner"
PROJECT_NAME="Voice Runner"
SONAR_URL="http://localhost:9000"
COMPOSE_FILE="docker-compose.sonarqube.yml"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Voice Runner - SonarQube Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Start SonarQube
echo -e "\n${YELLOW}Starting SonarQube containers...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

echo -e "${YELLOW}Waiting for SonarQube to be ready (this may take 2-3 minutes)...${NC}"

# Wait for SonarQube to be ready
RETRIES=60
COUNT=0
until curl -s "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $RETRIES ]; then
        echo -e "${RED}✗ SonarQube failed to start after $RETRIES attempts${NC}"
        echo -e "${YELLOW}Check logs with: docker-compose -f $COMPOSE_FILE logs${NC}"
        exit 1
    fi
    echo -n "."
    sleep 3
done

echo -e "\n${GREEN}✓ SonarQube is ready!${NC}"

# Check if sonar-scanner is installed
echo -e "\n${YELLOW}Checking for sonar-scanner...${NC}"
if ! command -v sonar-scanner &> /dev/null; then
    echo -e "${YELLOW}⚠ sonar-scanner not found${NC}"
    echo -e "${BLUE}Install it using one of these methods:${NC}"
    echo -e "  macOS:   ${GREEN}brew install sonar-scanner${NC}"
    echo -e "  Linux:   Download from https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/"
    echo -e "  Windows: Download from https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/"
    SCANNER_INSTALLED=false
else
    echo -e "${GREEN}✓ sonar-scanner found${NC}"
    SCANNER_INSTALLED=true
fi

# Display next steps
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}\n"

echo -e "${BLUE}1. Access SonarQube:${NC}"
echo -e "   Open: ${GREEN}$SONAR_URL${NC}"
echo -e "   Login: ${GREEN}admin${NC} / ${GREEN}admin${NC}"
echo -e "   You'll be prompted to change the password\n"

echo -e "${BLUE}2. Create Project:${NC}"
echo -e "   - Go to Projects → Create Project → Manually"
echo -e "   - Project key: ${GREEN}$PROJECT_KEY${NC}"
echo -e "   - Display name: ${GREEN}$PROJECT_NAME${NC}"
echo -e "   - Click 'Set Up' → Choose 'Locally'"
echo -e "   - Generate a token and save it\n"

echo -e "${BLUE}3. Run Your First Scan:${NC}"
if [ "$SCANNER_INSTALLED" = true ]; then
    echo -e "   ${GREEN}sonar-scanner \\${NC}"
    echo -e "     ${GREEN}-Dsonar.projectKey=$PROJECT_KEY \\${NC}"
    echo -e "     ${GREEN}-Dsonar.host.url=$SONAR_URL \\${NC}"
    echo -e "     ${GREEN}-Dsonar.token=YOUR_TOKEN_HERE${NC}\n"
else
    echo -e "   ${YELLOW}First install sonar-scanner (see above)${NC}\n"
fi

echo -e "${BLUE}4. Configure Quality Gate:${NC}"
echo -e "   Follow the guide in SONARQUBE_SETUP.md\n"

echo -e "${BLUE}5. Set up GitHub Actions:${NC}"
echo -e "   - Add secrets to GitHub: SONAR_TOKEN and SONAR_HOST_URL"
echo -e "   - See SONARQUBE_SETUP.md for details\n"

echo -e "${YELLOW}To stop SonarQube:${NC}"
echo -e "   ${GREEN}docker-compose -f $COMPOSE_FILE down${NC}\n"

echo -e "${YELLOW}To view logs:${NC}"
echo -e "   ${GREEN}docker-compose -f $COMPOSE_FILE logs -f${NC}\n"

echo -e "${BLUE}📖 Full documentation: ${GREEN}SONARQUBE_SETUP.md${NC}\n"
