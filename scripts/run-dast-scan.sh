#!/bin/bash

# DAST Security Testing Script using OWASP ZAP
# This script runs OWASP ZAP baseline and full scans against the CPSK Job Connect application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_URL="${TARGET_URL:-http://host.docker.internal:3000}"
REPORT_DIR="docs/security-reports/dast"
SCAN_TYPE="${1:-baseline}" # baseline, full, or api

echo -e "${BLUE}🔒 CPSK Job Connect - DAST Security Testing${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
    exit 1
fi

# Check if the application is running
echo -e "${BLUE}📡 Checking if application is running on port 3000...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Application doesn't seem to be running on port 3000${NC}"
    echo -e "${YELLOW}Please run 'npm run dev' in another terminal${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Pull latest ZAP image
echo -e "${BLUE}📦 Pulling latest OWASP ZAP Docker image...${NC}"
docker pull ghcr.io/zaproxy/zaproxy:stable

# Run the appropriate scan
case $SCAN_TYPE in
    baseline)
        echo -e "${GREEN}🔍 Running ZAP Baseline Scan (Passive Only)${NC}"
        echo -e "${BLUE}Target: $TARGET_URL${NC}\n"

        docker run -v "$(pwd):/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable \
            zap-baseline.py \
            -t "$TARGET_URL" \
            -r "$REPORT_DIR/zap-baseline-report.html" \
            -J "$REPORT_DIR/zap-baseline-report.json" \
            -w "$REPORT_DIR/zap-baseline-report.md"

        echo -e "\n${GREEN}✅ Baseline scan complete!${NC}"
        echo -e "${BLUE}Reports saved to: $REPORT_DIR${NC}"
        ;;

    full)
        echo -e "${GREEN}🔍 Running ZAP Full Scan (Active + Passive)${NC}"
        echo -e "${YELLOW}⚠️  Warning: This scan will actively test for vulnerabilities${NC}"
        echo -e "${YELLOW}    and may take longer to complete${NC}"
        echo -e "${BLUE}Target: $TARGET_URL${NC}\n"

        docker run -v "$(pwd):/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable \
            zap-full-scan.py \
            -t "$TARGET_URL" \
            -r "$REPORT_DIR/zap-full-report.html" \
            -J "$REPORT_DIR/zap-full-report.json" \
            -w "$REPORT_DIR/zap-full-report.md"

        echo -e "\n${GREEN}✅ Full scan complete!${NC}"
        echo -e "${BLUE}Reports saved to: $REPORT_DIR${NC}"
        ;;

    api)
        echo -e "${GREEN}🔍 Running ZAP API Scan${NC}"
        echo -e "${BLUE}Target: $TARGET_URL/api${NC}\n"

        # Create a simple API definition for scanning
        cat > "$REPORT_DIR/api-targets.txt" <<EOF
http://localhost:3000/api/auth/signin
http://localhost:3000/api/auth/signup
http://localhost:3000/api/students/profile
http://localhost:3000/api/students/documents
http://localhost:3000/api/students/applications
http://localhost:3000/api/students/verify-email
http://localhost:3000/api/students/send-verification
http://localhost:3000/api/jobs
http://localhost:3000/api/jobs/apply
http://localhost:3000/api/jobs/filter
http://localhost:3000/api/companies/profile
EOF

        docker run -v "$(pwd):/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable \
            zap-baseline.py \
            -t "$TARGET_URL/api" \
            -r "$REPORT_DIR/zap-api-report.html" \
            -J "$REPORT_DIR/zap-api-report.json"

        echo -e "\n${GREEN}✅ API scan complete!${NC}"
        echo -e "${BLUE}Reports saved to: $REPORT_DIR${NC}"
        ;;

    *)
        echo -e "${RED}❌ Error: Invalid scan type '$SCAN_TYPE'${NC}"
        echo -e "${YELLOW}Usage: $0 [baseline|full|api]${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}📊 DAST Scan Summary${NC}"
echo -e "${BLUE}===================${NC}"
echo -e "Scan Type: ${GREEN}$SCAN_TYPE${NC}"
echo -e "Target URL: ${BLUE}$TARGET_URL${NC}"
echo -e "Reports Location: ${BLUE}$REPORT_DIR${NC}"

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Review the HTML report in your browser"
echo -e "2. Check the JSON report for detailed findings"
echo -e "3. Address any HIGH or MEDIUM severity issues"
echo -e "4. Run 'npm run security:dast:report' to generate a summary report"

exit 0
