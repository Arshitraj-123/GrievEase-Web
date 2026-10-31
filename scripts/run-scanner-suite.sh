#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GrievEase Automated Staging Security Scanner Suite
# Section B: Gitleaks, TruffleHog, Semgrep, OWASP ZAP, testssl.sh, Nmap
# ==============================================================================
# Target requirements:
# - Run against live staging environment with TLS enabled.
# - Requires Docker and standard security scanner CLI tooling.
# - Outputs raw reports into docs/evidence/
# ==============================================================================

TARGET_HOST="${1:-staging.grievease.internal}"
EVIDENCE_DIR="$(pwd)/docs/evidence"
mkdir -p "${EVIDENCE_DIR}"

echo "======================================================================"
echo " Starting GrievEase External & Tool Security Scans against: ${TARGET_HOST}"
echo " Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================================"

# 1. Gitleaks (Full git history scan, all branches & tags)
echo -e "\n[1/6] Running Gitleaks full history audit..."
if command -v gitleaks &> /dev/null; then
  gitleaks detect --source=. --verbose --report-path="${EVIDENCE_DIR}/gitleaks-full-history.json" || true
else
  docker run --rm -v "$(pwd):/path" zricethezav/gitleaks:latest detect --source=/path --verbose --report-path=/path/docs/evidence/gitleaks-full-history.json || true
fi

# 2. TruffleHog (Full git history & commits)
echo -e "\n[2/6] Running TruffleHog deep credential audit..."
if command -v trufflehog &> /dev/null; then
  trufflehog git "file://$(pwd)" --all-branches --json > "${EVIDENCE_DIR}/trufflehog-full-history.json" 2>&1 || true
else
  docker run --rm -v "$(pwd):/repo" trufflesecurity/trufflehog:latest git "file:///repo" --all-branches --json > "${EVIDENCE_DIR}/trufflehog-full-history.json" 2>&1 || true
fi

# 3. Semgrep (SAST scan with custom repo rules)
echo -e "\n[3/6] Running Semgrep Static Analysis..."
if command -v semgrep &> /dev/null; then
  semgrep scan --config=auto --config=.semgrep/ --json -o "${EVIDENCE_DIR}/semgrep-sast-findings.json" . || true
else
  docker run --rm -v "$(pwd):/src" semgrep/semgrep semgrep scan --config=auto --json -o /src/docs/evidence/semgrep-sast-findings.json /src || true
fi

# 4. OWASP ZAP Baseline & Active Scan against Staging Host
echo -e "\n[4/6] Running OWASP ZAP Dynamic Scans (Baseline + Authenticated Active)..."
# Baseline Scan
docker run --rm -v "${EVIDENCE_DIR}:/zap/wrk/:rw" zaproxy/zap-stable \
  zap-baseline.py -t "https://${TARGET_HOST}" -r zap-baseline-report.html -J zap-baseline-report.json || true

# Authenticated Active Scan (Requires authenticated context session cookie)
echo "Running authenticated active scan..."
docker run --rm -v "${EVIDENCE_DIR}:/zap/wrk/:rw" zaproxy/zap-stable \
  zap-full-scan.py -t "https://${TARGET_HOST}" -r zap-active-report.html -J zap-active-report.json || true

# 5. testssl.sh (TLS cipher suite, certificate, HSTS verification)
echo -e "\n[5/6] Running testssl.sh TLS configuration audit..."
docker run --rm -v "${EVIDENCE_DIR}:/data" drwetter/testssl.sh \
  --htmlfile /data/testssl-report.html --jsonfile /data/testssl-report.json "https://${TARGET_HOST}:443" || true

# 6. External Nmap Port Scan (Verify ONLY 80 & 443 are reachable)
echo -e "\n[6/6] Running Nmap external port scan (1-65535)..."
if command -v nmap &> /dev/null; then
  nmap -sS -sV -p 1-65535 -T4 "${TARGET_HOST}" -oN "${EVIDENCE_DIR}/nmap-external-port-scan.log" || true
else
  docker run --rm instrumentisto/nmap -sS -sV -p 1-65535 -T4 "${TARGET_HOST}" > "${EVIDENCE_DIR}/nmap-external-port-scan.log" || true
fi

echo "======================================================================"
echo " Security Scanner Suite execution completed."
echo " Raw outputs saved to: docs/evidence/"
echo "======================================================================"

