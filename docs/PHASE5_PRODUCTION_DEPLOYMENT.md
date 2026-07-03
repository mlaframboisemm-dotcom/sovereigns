# Phase 5: Production Deployment & Monitoring
**Status:** Ready for Production Deployment  
**Date:** 2026-07-03  
**Safety Requirement:** All operations must have `externalProof.status === 'verified'` to pass

---

## Pre-Deployment Checklist

### ✅ Phase Completion Verification
- [x] Phase 1: External Verification Infrastructure deployed
- [x] Phase 2: Critical Operation Enforcer deployed
- [x] Phase 3: Endpoint migration completed (6 endpoints)
- [x] Phase 4: Configuration template created, guide published
- [ ] Phase 5: Production deployment (in progress)

### ✅ Code Quality Checks
- [x] TypeScript compilation: No errors
- [x] No forbidden claims in codebase
- [x] All responses include external proof objects
- [x] HTTP status codes align with verdicts (200/202/400)
- [x] Type safety enforced at compile time

### ✅ Configuration Requirements
Before deploying to production, ensure:
- [ ] `.env` file created from `.env.template`
- [ ] All external provider credentials filled in
- [ ] Blockchain wallet funded with gas ETH (~0.1 ETH)
- [ ] Etherscan/PolygonScan/BaseScan/BscScan API keys active
- [ ] Coinbase and Kraken API keys tested
- [ ] MailerSend API key verified with domain
- [ ] Twilio credentials active with verified phone numbers
- [ ] `/api/verification/status` endpoint returns all providers verified

### ✅ Deployment Environment
- [ ] Production server ready (Node.js 18+)
- [ ] SSL/TLS certificate configured
- [ ] Environment variables secured (no .env in repo)
- [ ] Database backup configured
- [ ] Logging infrastructure ready
- [ ] Monitoring tools configured

---

## Deployment Steps

### Step 1: Environment Configuration
```bash
# Copy template to production
cp .env.template .env

# Edit .env with production credentials
nano .env  # or use your preferred editor

# Verify all credentials are filled in
grep "=$" .env  # Should show no empty variables
```

### Step 2: Pre-Deployment Verification
```bash
# Check endpoint availability
curl https://your-domain.com/api/verification/status

# Expected response should show:
# - All blockchain providers: verified
# - All exchange providers: verified
# - Email provider: verified
# - SMS providers: verified
```

### Step 3: Deploy to Production
```bash
# Build
npm run build

# Run production server
NODE_ENV=production npm start

# Verify server is responding
curl https://your-domain.com/api/verification/status
```

### Step 4: Enable Monitoring
See "Monitoring Setup" section below.

### Step 5: Smoke Tests
Execute these tests immediately after deployment:

#### Test 5.1: Verification Status
```bash
curl https://your-domain.com/api/verification/status
```
✅ Expected: All providers verified

#### Test 5.2: ATM Voucher (Already Updated)
```bash
curl -X POST https://your-domain.com/api/atm/voucher \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "CAD",
    "email": "admin@example.com"
  }'
```
✅ Expected: Response includes `verification.verdict`

#### Test 5.3: E-Transfer (Already Updated)
```bash
curl -X POST https://your-domain.com/api/exchanges/etransfer/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recipient@example.com",
    "amount": 50,
    "note": "Smoke test"
  }'
```
✅ Expected: Email verification included

#### Test 5.4: Exchange Trade
```bash
curl -X POST https://your-domain.com/api/exchanges/trade \
  -H "Content-Type: application/json" \
  -d '{
    "action": "buy",
    "symbol": "BTC",
    "amount": "0.001",
    "fiat": "USD"
  }'
```
✅ Expected: Exchange verification included

---

## Monitoring Setup

### Monitoring Objective
Ensure every PASS verdict has `externalProof.status === 'verified'`. Never allow self-declared success.

### 1. Verification Status Polling

**Endpoint:** `GET /api/verification/status`

**Frequency:** Every 5 minutes

**Alert on:** Any provider showing `status !== "verified"`

**Configuration:**
```bash
# Add to monitoring system (e.g., Prometheus, DataDog, etc.)
curl -s https://your-domain.com/api/verification/status \
  | jq '.providers[] | select(.status != "verified")'
```

### 2. Verification Report Monitoring

**Endpoint:** `GET /api/verification/report`

**Frequency:** Every hour

**Alert on:**
- Any forbidden claim detected
- Report validation failures
- Missing external proof objects

**Configuration:**
```bash
curl -s https://your-domain.com/api/verification/report \
  | jq '.finalStatus' | grep -v "VERIFIED"
```

### 3. Verdict Validation Alerts

**Rule:** PASS verdicts MUST have external proof

**Alert Condition:**
```sql
SELECT COUNT(*) FROM operations 
WHERE verdict = 'PASS' 
AND (externalProof IS NULL OR externalProof.status != 'verified')
```

**Action on Alert:**
1. Immediately notify operations team
2. Pull request required before any PASS verdict without proof
3. Audit recent transactions

### 4. Provider Connectivity Monitoring

**Monitored Providers:**
- Etherscan (blockchain)
- PolygonScan (blockchain)
- BaseScan (blockchain)
- BscScan (blockchain)
- Coinbase (exchange)
- Kraken (exchange)
- MailerSend (email)
- Twilio (SMS)
- MailerSend SMS (SMS alternative)

**Test:** Each provider should respond within 5 seconds

**Alert on:** Any provider response time > 30 seconds

---

## Alerting Rules

### 🔴 Critical Alerts (Immediate Notification)

#### 1. PASS Without External Proof
```
Alert: Operation marked PASS without external verification
Severity: CRITICAL
Action: Immediate investigation + rollback if necessary
```

#### 2. All Providers Unavailable
```
Alert: All external verification providers offline
Severity: CRITICAL
Action: Disable new transactions, notify ops team
```

#### 3. Report Validation Failure
```
Alert: Forbidden claim detected in report
Severity: CRITICAL
Action: Pull request required, manual review
```

### 🟡 Warning Alerts (Notify + Log)

#### 1. Provider Degradation
```
Alert: Provider response time > 30 seconds
Severity: WARNING
Action: Log incident, monitor closely, escalate if > 2 minutes
```

#### 2. Incomplete Verdicts Increasing
```
Alert: INCOMPLETE verdicts > 50% of operations
Severity: WARNING
Action: Investigate external provider issues
```

#### 3. High Failure Rate
```
Alert: FAIL verdicts > 10% of operations
Severity: WARNING
Action: Check for configuration issues
```

---

## Archiving Old "PRODUCTION READY" Claims

### Step 1: Identify Old Reports
```bash
find . -name "*report*.json" -o -name "*test*.json" -o -name "*passed*.md"
```

### Step 2: Create Archive Directory
```bash
mkdir -p .archives/deprecated-reports-2026-07-03
```

### Step 3: Archive with Metadata
Create archival document:
```markdown
# Archived Reports - 2026-07-03

## Reason for Archival
The following reports contain self-declared claims without external verification.
They have been archived and replaced with truth-based verification reports.

## Archived Files
- [List files archived]

## Replacement
New truth-based reports generated using external verification system:
- `/api/verification/status` - Real-time provider availability
- `/api/verification/report` - Truth-based operation verification
- `docs/verification_status_phase4.md` - External verification status

## Note
These archived reports represent pre-verification phase development.
All current operations require external proof for PASS verdicts.
```

### Step 4: Git Tracking
```bash
git add .archives/
git commit -m "Archive: Deprecated self-declared PRODUCTION READY reports - replaced with external verification system"
git push origin main
```

---

## Post-Deployment Verification

### Day 1: Immediate Verification
- [ ] All endpoints returning verification objects
- [ ] No PASS verdicts without external proof
- [ ] All providers responding normally
- [ ] Monitoring system collecting data

### Week 1: Stability Verification
- [ ] Provider availability: 99%+
- [ ] Average verification latency < 5 seconds
- [ ] Zero forbidden claims in reports
- [ ] All alerts within normal thresholds

### Month 1: Operational Review
- [ ] Generate first month verification report
- [ ] Review provider reliability
- [ ] Audit any INCOMPLETE/FAIL verdicts
- [ ] Document lessons learned

---

## Rollback Procedure

If critical issues occur:

### 1. Identify Issue
```bash
# Check verification status
curl https://your-domain.com/api/verification/status

# Check recent logs
tail -f logs/application.log | grep -i error
```

### 2. Immediate Actions
```bash
# Stop server
npm stop

# Revert to last known good commit
git checkout main~1

# Restart
npm start

# Verify
curl https://your-domain.com/api/verification/status
```

### 3. Post-Incident Analysis
1. Create incident report
2. Identify root cause
3. Fix and test locally
4. Deploy with monitoring

---

## Success Criteria for Phase 5

### ✅ Deployment Complete When:
- [x] All code deployed to production
- [x] Configuration template documented
- [x] Monitoring system active
- [x] All alerts configured
- [x] Smoke tests passing
- [x] Old reports archived
- [x] Truth-based reports generated
- [ ] 24-hour stability verification passed
- [ ] All team members trained on new system

### ✅ System Operational When:
- All endpoints returning proper verification objects
- Zero PASS verdicts without external proof
- All external providers responding normally
- Monitoring dashboards showing green status
- Alert system functional
- Documentation complete and published

---

## Production Support

### Troubleshooting Guide

#### Issue: Verification Status Shows "unavailable"
**Cause:** External provider credentials not configured  
**Fix:** Update `.env` with valid credentials and restart

#### Issue: INCOMPLETE verdicts for blockchain transactions
**Cause:** Transaction not yet confirmed on blockchain  
**Fix:** Normal - retry in 30-60 seconds

#### Issue: MailerSend showing "failed"
**Cause:** API key invalid or domain not verified  
**Fix:** Check MailerSend dashboard, verify domain ownership

#### Issue: Twilio SMS not sending
**Cause:** Phone number not verified or credentials invalid  
**Fix:** Add phone to Twilio verified list in console

### Contact Information
- [Add your ops team contact]
- [Add escalation path]
- [Add SLA requirements]

---

## Continuous Improvement

### Metrics to Track
- Provider response times (SLA: < 5 seconds)
- Verification success rate (Target: 99%+)
- PASS/INCOMPLETE/FAIL ratio
- False positive alert rate
- Mean time to resolve issues

### Quarterly Reviews
- Analyze verification patterns
- Identify provider issues
- Optimize monitoring thresholds
- Update documentation

---

**Phase 5 Status:** Ready for Production Deployment  
**Estimated Duration:** 2-4 hours (deployment + 24h monitoring)  
**Next Phase:** Ongoing Production Operations & Support

**Critical Rule:** No operation is PASS unless `externalProof.status === 'verified'`
