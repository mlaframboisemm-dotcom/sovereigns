# Verification Monitoring & Alerting Configuration
**Purpose:** Ensure all PASS verdicts have external proof verification  
**Safety Rule:** No operation is PASS without `externalProof.status === 'verified'`

---

## Monitoring Architecture

### Real-Time Verification Status
```
┌─────────────────────────────────────┐
│  /api/verification/status           │
│  (Poll every 5 minutes)             │
└────────────┬────────────────────────┘
             │
             ├─→ Blockchain Providers (4)
             │   ├─ Etherscan
             │   ├─ PolygonScan
             │   ├─ BaseScan
             │   └─ BscScan
             │
             ├─→ Exchange Providers (2)
             │   ├─ Coinbase
             │   └─ Kraken
             │
             ├─→ Email Providers (1)
             │   └─ MailerSend
             │
             └─→ SMS Providers (2)
                 ├─ Twilio
                 └─ MailerSend SMS
```

### Verdict Validation Pipeline
```
Operation Executed
    ↓
Internal Success Check
    ↓ (must be true)
External Proof Request
    ↓
Proof Status Check
    ↓
  /─────────────────────────────────\
  │  Status → Verdict                 │
  ├─ verified → PASS (200)            │
  ├─ pending → INCOMPLETE (202)       │
  ├─ failed → FAIL (400)              │
  └─ unavailable → INCOMPLETE (202)   │
  \─────────────────────────────────/
    ↓
Return Response with ExternalProof
    ↓
Log & Alert (if issues)
    ↓
Monitor Dashboard Update
```

---

## Dashboard Metrics

### Primary Metrics
```
Total Operations: [Count]
├─ PASS (200): [Count] [%]
├─ INCOMPLETE (202): [Count] [%]
└─ FAIL (400): [Count] [%]

Provider Status:
├─ Blockchain: [Etherscan, PolygonScan, BaseScan, BscScan]
├─ Exchange: [Coinbase, Kraken]
├─ Email: [MailerSend]
└─ SMS: [Twilio, MailerSend SMS]

Response Times (seconds):
├─ Blockchain: [avg] [p95] [p99]
├─ Exchange: [avg] [p95] [p99]
├─ Email: [avg] [p95] [p99]
└─ SMS: [avg] [p95] [p99]

Verification Latency:
├─ 0-1s: [Count] [%]
├─ 1-5s: [Count] [%]
├─ 5-30s: [Count] [%]
└─ >30s: [Count] [%] ⚠️
```

---

## Alert Configuration

### Alert 1: PASS Without External Proof
```
Name: PASS_WITHOUT_PROOF
Condition: verdict = 'PASS' AND (externalProof IS NULL OR externalProof.status != 'verified')
Severity: CRITICAL
Notification: 
  - Email: ops-team@company.com
  - PagerDuty: Critical priority
  - Slack: #security-alerts
Response Time: Immediate (< 5 minutes)
Action: 
  1. Page on-call engineer
  2. Investigate transaction
  3. Check external provider status
  4. Assess if rollback needed
```

### Alert 2: Provider Connectivity Lost
```
Name: PROVIDER_OFFLINE
Condition: provider.status = 'failed' OR provider.lastResponse > 300s
Severity: CRITICAL (if all providers down), WARNING (single provider)
Notification:
  - Email: ops-team@company.com
  - Slack: #provider-status
Response Time: 15 minutes
Action:
  1. Check provider status page
  2. Verify network connectivity
  3. Check API credentials
  4. Consider fallback providers
```

### Alert 3: High Failure Rate
```
Name: HIGH_FAILURE_RATE
Condition: (FAIL_count / total_operations * 100) > 10% over 5 minutes
Severity: WARNING
Notification: Email + Slack
Response Time: 30 minutes
Action:
  1. Analyze recent failures
  2. Check provider APIs
  3. Review error logs
  4. Escalate if pattern continues
```

### Alert 4: Response Time Degradation
```
Name: RESPONSE_TIME_DEGRADED
Condition: avg_response_time > 30s OR p95_response_time > 60s
Severity: WARNING
Notification: Email + Slack
Response Time: 30 minutes
Action:
  1. Check provider response times
  2. Check network latency
  3. Review application logs
  4. Consider scaling/optimization
```

### Alert 5: Incomplete Verdict Spike
```
Name: INCOMPLETE_SPIKE
Condition: (INCOMPLETE_count / total * 100) > 50% over 10 minutes
Severity: WARNING
Notification: Email + Slack
Response Time: 15 minutes
Action:
  1. Investigate which providers are slow
  2. Check blockchain network congestion
  3. Verify provider API status
  4. Consider async processing
```

---

## Monitoring Endpoints

### Endpoint 1: Verification Status
```
GET /api/verification/status
Response Time: < 2 seconds
Polling Frequency: Every 5 minutes
Alert Threshold: > 30 seconds

Success Criteria:
- HTTP 200
- All providers status: verified | unavailable
- No "failed" status
```

### Endpoint 2: Verification Report
```
GET /api/verification/report
Response Time: < 5 seconds
Polling Frequency: Every hour
Alert Threshold: Report validation failure

Success Criteria:
- HTTP 200
- finalStatus: VERIFIED
- No forbidden claims
- All operations have external proof
```

### Endpoint 3: Operation History
```
GET /api/verification/operations?limit=100
Response Time: < 2 seconds
Polling Frequency: Real-time or periodic
Analysis: Calculate metrics

Success Criteria:
- 100% of PASS verdicts have verified external proof
- FAIL rate < 10%
- INCOMPLETE verdicts resolve within 60 seconds
```

---

## Logging Configuration

### Log Levels
```
ERROR: Any operation without external proof for PASS verdict
ERROR: Provider connectivity failures
ERROR: Report validation failures
WARN: INCOMPLETE verdicts persisting > 60 seconds
WARN: Response times > 30 seconds
INFO: All PASS verdicts with verified proof
INFO: Provider status changes
DEBUG: Detailed verification process
```

### Log Format
```
[TIMESTAMP] [LEVEL] [COMPONENT] [MESSAGE]
{
  operation: "blockchain_transfer",
  verdict: "PASS",
  internalSuccess: true,
  externalProof: {
    status: "verified",
    provider: "etherscan",
    confirmations: 12,
    referenceId: "0x..."
  },
  latency_ms: 2450,
  timestamp: "2026-07-03T12:34:56Z"
}
```

### Log Retention
```
ERROR logs: 90 days
WARN logs: 30 days
INFO logs: 7 days
DEBUG logs: 24 hours
```

---

## Success Metrics (SLAs)

### Availability
```
Blockchain Providers: 99.9%
Exchange Providers: 99.5%
Email Provider: 99.9%
SMS Providers: 99.0%
Overall System: 99.0%
```

### Performance
```
Verification Latency (p95): 5 seconds
Status Check Response: < 2 seconds
Report Generation: < 5 seconds
INCOMPLETE Resolution: < 60 seconds
```

### Accuracy
```
PASS verdicts with verified proof: 100%
False positives (alerts): < 1%
Provider accuracy: > 99%
Proof object completeness: 100%
```

---

## Dashboard Configuration

### Real-Time Dashboard (Updated every 5 minutes)
```
┌──────────────────────────────────────────────────┐
│ Sovereign Wealth Terminal - Verification Status  │
├──────────────────────────────────────────────────┤
│                                                  │
│ Overall Status: [🟢 VERIFIED]                   │
│                                                  │
│ Providers (9 total):                            │
│ ├─ Etherscan [🟢 verified] <2s                  │
│ ├─ PolygonScan [🟢 verified] <1s                │
│ ├─ BaseScan [🟢 verified] <1s                   │
│ ├─ BscScan [🟢 verified] <2s                    │
│ ├─ Coinbase [🟢 verified] <3s                   │
│ ├─ Kraken [🟢 verified] <2s                     │
│ ├─ MailerSend [🟢 verified] <4s                 │
│ ├─ Twilio [🟢 verified] <3s                     │
│ └─ MailerSend SMS [🟢 verified] <2s             │
│                                                  │
│ Operation Verdicts (24h):                       │
│ ├─ PASS: 4,523 [97%] 🟢                         │
│ ├─ INCOMPLETE: 89 [2%] 🟡                       │
│ └─ FAIL: 38 [1%] 🔴                             │
│                                                  │
│ Verification Latency (p95):                     │
│ ├─ Blockchain: 3.2s                            │
│ ├─ Exchange: 4.1s                              │
│ ├─ Email: 2.8s                                 │
│ └─ SMS: 2.1s                                   │
│                                                  │
│ Active Alerts: 0                                │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Detailed Operations View
```
Recent Operations:
┌─────────────────────────────────────────────────┐
│ Time      │ Operation      │ Verdict │ Latency │
├─────────────────────────────────────────────────┤
│ 12:34:56  │ Blockchain Tx  │ PASS    │ 2.3s   │
│ 12:34:45  │ Exchange Trade │ PASS    │ 4.1s   │
│ 12:34:34  │ Email Delivery │ PASS    │ 1.8s   │
│ 12:34:23  │ Blockchain Tx  │ PASS    │ 2.8s   │
│ 12:34:12  │ SMS Alert      │ PASS    │ 1.9s   │
└─────────────────────────────────────────────────┘
```

---

## Automated Remediation

### Auto-Remediation Rules

#### 1. Provider Timeout Recovery
```
IF provider.response_time > 60s
THEN:
  1. Retry with exponential backoff (3 attempts)
  2. Switch to alternative provider if available
  3. Return INCOMPLETE verdict
  4. Alert if all retries fail
```

#### 2. Rate Limit Handling
```
IF provider returns 429 (rate limit)
THEN:
  1. Queue operation for retry
  2. Return INCOMPLETE verdict
  3. Retry after 60 seconds
  4. Alert if rate limit persists > 5 minutes
```

#### 3. Authentication Failure
```
IF provider returns 401/403
THEN:
  1. Check credentials in .env
  2. Alert ops team immediately
  3. Return INCOMPLETE verdict
  4. Do NOT retry without manual intervention
```

---

## Testing Monitoring

### Test 1: Simulate Provider Failure
```bash
# Temporarily disable Etherscan API key
# Verify alert triggers within 5 minutes
# Check dashboard shows provider as "failed"
# Verify operations get INCOMPLETE verdict
# Re-enable and verify recovery
```

### Test 2: Verify Alert Routing
```bash
# Trigger artificial alert condition
# Verify all notification channels receive alert
# Check alert contains appropriate severity
# Verify runbook link in alert
```

### Test 3: Dashboard Accuracy
```bash
# Execute 10 test operations
# Verify dashboard shows all operations
# Check verdict accuracy (100% should have external proof)
# Verify latency times are realistic
```

---

## Incident Response

### Incident Severity Levels

#### P1 (Critical)
- PASS without external proof
- All providers offline
- Report validation failure
- Response: Immediate (page on-call)

#### P2 (High)
- Single provider offline > 15 minutes
- > 50% INCOMPLETE verdicts
- Response: 15 minutes

#### P3 (Medium)
- Provider response time degraded (but < 60s)
- > 10% FAIL rate
- Response: 1 hour

#### P4 (Low)
- Single provider timeout (auto-recovered)
- Alert false positive
- Response: 4 hours

---

**Monitoring Status:** Ready for Production  
**Alert Routing:** Email, Slack, PagerDuty (configure as needed)  
**Dashboard Updates:** Real-time (5-minute polling)  
**SLA Compliance:** 99%+ verification availability
