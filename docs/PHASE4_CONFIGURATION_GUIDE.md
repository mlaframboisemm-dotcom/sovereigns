# Phase 4: Configuration & Testing Guide
**Status:** External Verification System Ready for Configuration  
**Date:** 2026-07-03

---

## Overview

Phase 4 transitions the Sovereign Wealth Terminal from infrastructure deployment to production readiness. All external provider credentials must be configured for full verification coverage.

---

## Configuration Checklist

### ✅ 1. Blockchain Verification (Etherscan/PolygonScan/BaseScan/BscScan)

These APIs verify blockchain transactions on block explorers.

#### Ethereum Mainnet (Etherscan)
- [ ] Go to https://etherscan.io/apis
- [ ] Create/login to account
- [ ] Generate API key
- [ ] Add to `.env`: `ETHERSCAN_API_KEY="your_key_here"`
- [ ] Test with: `curl "https://api.etherscan.io/api?module=account&action=balance&address=0x...&apikey=YOUR_KEY"`

#### Polygon Network (PolygonScan)
- [ ] Go to https://polygonscan.com/apis
- [ ] Create/login to account
- [ ] Generate API key
- [ ] Add to `.env`: `POLYGON_API_KEY="your_key_here"`

#### Base Network (BaseScan)
- [ ] Go to https://basescan.org/apis
- [ ] Create/login to account
- [ ] Generate API key
- [ ] Add to `.env`: `BASESCAN_API_KEY="your_key_here"`

#### Binance Smart Chain (BscScan)
- [ ] Go to https://bscscan.com/apis
- [ ] Create/login to account
- [ ] Generate API key
- [ ] Add to `.env`: `BSCSCAN_API_KEY="your_key_here"`

---

### ✅ 2. Exchange Verification (Coinbase + Kraken)

These APIs verify cryptocurrency orders and trades.

#### Coinbase Professional
- [ ] Go to https://coinbase.com/settings/developers
- [ ] Create new API key
- [ ] Grant permissions: `orders`, `accounts` (READ)
- [ ] Generate API Secret
- [ ] Add to `.env`:
  ```
  COINBASE_API_KEY_ID="your_key_id"
  COINBASE_API_SECRET_RAW="your_secret"
  ```
- [ ] Test connection in `/api/verification/status` endpoint

#### Kraken Exchange
- [ ] Go to https://www.kraken.com/settings/api
- [ ] Create new API key
- [ ] Grant permissions: `Query Orders`, `View Trade History`
- [ ] Generate API Secret
- [ ] Add to `.env`:
  ```
  KRAKEN_API_KEY="your_key"
  KRAKEN_API_SECRET="your_secret"
  ```
- [ ] Test connection in `/api/verification/status` endpoint

---

### ✅ 3. Email Verification (MailerSend)

Email delivery verification ensures emails are actually delivered.

#### MailerSend Setup
- [ ] Go to https://www.mailersend.com
- [ ] Create account and verify domain
- [ ] Navigate to Settings > API Tokens
- [ ] Create new API token (Full Access)
- [ ] Add to `.env`: `MAILERSEND_API_KEY="your_token"`
- [ ] Verify sender email: `MAILERSEND_SENDER="your@domain.com"`
- [ ] Optional SMS: Get SMS API key and add `MAILERSEND_SMS_FROM="+1XXXXXXXXXX"`

#### SMTP Fallback (Optional)
- [ ] Configure SMTP provider (Gmail, SendGrid, etc.)
- [ ] Add to `.env`:
  ```
  SMTP_HOST="smtp.gmail.com"
  SMTP_PORT="587"
  SMTP_USER="your_email@gmail.com"
  SMTP_PASS="your_app_password"
  ```

---

### ✅ 4. SMS Verification (Twilio + MailerSend SMS)

SMS delivery verification ensures alerts are actually sent.

#### Twilio Setup
- [ ] Go to https://www.twilio.com/console
- [ ] Get Account SID and Auth Token
- [ ] Verify phone number for receiving SMS
- [ ] Add to `.env`:
  ```
  TWILIO_ACCOUNT_SID="your_sid"
  TWILIO_AUTH_TOKEN="your_token"
  TWILIO_PHONE_NUMBER="+1XXXXXXXXXX"
  ```

#### MailerSend SMS (Alternative)
- [ ] Already have MailerSend account from email setup
- [ ] Navigate to SMS Settings
- [ ] Add to `.env`:
  ```
  MAILERSEND_SMS_FROM="+1XXXXXXXXXX"
  ```

---

### ✅ 5. Blockchain Wallet Configuration

Configure the wallet that will execute blockchain operations.

- [ ] Generate or import Ethereum wallet with ethers.js
- [ ] Export private key (hex format, no 0x prefix)
- [ ] Add to `.env`: `MARSHALL_WALLET_PRIVATE_KEY="abc123def456..."`
- [ ] Fund wallet with ETH for gas fees (~0.1 ETH)
- [ ] Get wallet address
- [ ] Add to `.env`: `VITE_MARSHALL_ADDRESS="0x..."`

---

### ✅ 6. Verify Configuration

After filling in all credentials:

#### Check Verification Status Endpoint
```bash
curl http://localhost:3000/api/verification/status
```

Expected response (with all credentials configured):
```json
{
  "providers": {
    "blockchain": {
      "etherscan": { "status": "verified", "message": "Etherscan API connected" },
      "polygon": { "status": "verified", "message": "PolygonScan API connected" },
      "base": { "status": "verified", "message": "BaseScan API connected" },
      "bsc": { "status": "verified", "message": "BscScan API connected" }
    },
    "exchanges": {
      "coinbase": { "status": "verified", "message": "Coinbase API connected" },
      "kraken": { "status": "verified", "message": "Kraken API connected" }
    },
    "email": {
      "mailersend": { "status": "verified", "message": "MailerSend API connected" }
    },
    "sms": {
      "twilio": { "status": "verified", "message": "Twilio API connected" },
      "mailersend_sms": { "status": "verified", "message": "MailerSend SMS connected" }
    }
  },
  "finalStatus": "ALL_VERIFIED"
}
```

---

## Testing Phase 4

### Test 1: Verification Status Check
```bash
# Test endpoint availability
curl http://localhost:3000/api/verification/status
```
✅ Expected: All providers show "verified" status

### Test 2: Generate Truth-Based Report
```bash
# Get current verification report
curl http://localhost:3000/api/verification/report
```
✅ Expected: Report shows all operations with verification verdicts

### Test 3: Test Email Delivery
```bash
curl -X POST http://localhost:3000/api/exchanges/etransfer/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 100,
    "note": "Test transfer"
  }'
```
✅ Expected: Response includes email verification object with status

### Test 4: Test SMS Alert
```bash
curl -X POST http://localhost:3000/api/exchanges/etransfer/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1XXXXXXXXXX",
    "amount": 100,
    "notify": true
  }'
```
✅ Expected: Response includes SMS verification object with status

### Test 5: Test Blockchain Transaction
```bash
curl -X POST http://localhost:3000/api/wallet/send \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "0x742d35Cc6634C0532925a3b844Bc877e7f6985e4",
    "amount": "0.001",
    "asset": "ETH"
  }'
```
✅ Expected: Response includes blockchain verification with confirmations

---

## Troubleshooting

### "Verification Status: unavailable"
**Problem:** External provider credentials not configured  
**Solution:** Fill in missing API keys in `.env` file and restart server

### "Verdict: INCOMPLETE"
**Problem:** Operation completed but external system still processing  
**Solution:** Retry endpoint in 30-60 seconds (normal for blockchain)

### "Verdict: FAIL"
**Problem:** External system rejected operation  
**Solution:** Check error details in response and fix underlying issue

### Email Not Sending
**Problem:** MailerSend API key invalid or email not verified  
**Solution:** Verify domain in MailerSend console and check API key

### SMS Not Sending
**Problem:** Twilio credentials invalid or phone not verified  
**Solution:** Check Twilio console for verified numbers and credentials

---

## Phase 4 Completion Criteria

- [ ] `.env.template` created with all provider configs ✅
- [ ] `.env` file filled with valid credentials
- [ ] Verification status endpoint returns all providers verified
- [ ] Truth-based report generated at `/api/verification/report`
- [ ] All endpoints return verification objects with external proof
- [ ] No forbidden claims detected in reports
- [ ] Full integration test suite passes
- [ ] All HTTP status codes align with verdict (200/202/400)

---

## Next Steps (Phase 5)

Once Phase 4 is complete:

1. **Production Deployment**
   - Deploy verified configuration to production
   - Enable monitoring dashboard
   - Set up external verification alerts

2. **Monitoring Setup**
   - Monitor `/api/verification/status` for provider availability
   - Alert on any PASS verdict without external proof
   - Track verification latencies

3. **Documentation Update**
   - Archive old "PRODUCTION READY" claims
   - Publish truth-based reports
   - Document all verified operations

---

**Phase 4 Status:** Ready for Configuration  
**Estimated Duration:** 1-2 hours (once credentials obtained)  
**Next Phase:** Phase 5 Production Deployment
