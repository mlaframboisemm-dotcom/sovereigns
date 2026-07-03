# 🔄 Endpoint Migration Guide - External Verification Integration

**Purpose:** Step-by-step guide for adding external verification to remaining critical endpoints  
**Target:** All financial, blockchain, messaging, and payment operations

---

## Pattern 1: Blockchain Transfer Verification

### Current Code (BEFORE)
```typescript
app.post('/api/wallet/send', async (req, res) => {
  const { to, amount, asset } = req.body;
  
  try {
    const tx = await wallet.sendTransaction({ to, value: amount });
    const txHash = tx.hash;
    
    // ❌ Returns success without external verification
    return res.json({
      success: true,
      txHash,
      message: 'Transaction sent'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Updated Code (AFTER)
```typescript
import { createEnforcer } from './src/lib/critical-operations-enforcer.js';

app.post('/api/wallet/send', async (req, res) => {
  const { to, amount, asset } = req.body;
  
  try {
    const tx = await wallet.sendTransaction({ to, value: amount });
    const txHash = tx.hash;
    
    // ✅ Apply external verification
    const enforcer = createEnforcer('blockchain');
    const verificationResult = await enforcer.executeBlockchainTransfer(
      'ethereum',
      txHash,
      amount,
      to
    );
    
    // ✅ Return with verification status
    return res.json({
      success: true,
      txHash,
      message: 'Transaction sent',
      verification: {
        verdict: verificationResult.verdict,
        status: verificationResult.externalProof?.status,
        confirmations: verificationResult.externalProof?.confirmations,
        externalSource: verificationResult.externalProof?.externalSource
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Key Changes
1. Import: `import { createEnforcer }`
2. Create enforcer: `const enforcer = createEnforcer('blockchain')`
3. Call verification: `const verificationResult = await enforcer.executeBlockchainTransfer(...)`
4. Include in response: Add `verification` object with verdict and status
5. Behavior: Returns INCOMPLETE if external proof pending, FAIL if verification fails

---

## Pattern 2: Exchange Order Verification

### Current Code (BEFORE)
```typescript
app.post('/api/exchanges/trade', async (req, res) => {
  const { action, symbol, amount } = req.body;
  
  try {
    const orderId = await executeCoinbaseOrder(action, symbol, amount);
    
    // ❌ Returns success without exchange verification
    return res.json({
      success: true,
      orderId,
      message: `${action} order placed`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Updated Code (AFTER)
```typescript
app.post('/api/exchanges/trade', async (req, res) => {
  const { action, symbol, amount } = req.body;
  
  try {
    const orderId = await executeCoinbaseOrder(action, symbol, amount);
    
    // ✅ Apply external verification
    const enforcer = createEnforcer('exchange');
    const verificationResult = await enforcer.executeExchangeTrade(
      'coinbase',
      orderId,
      symbol,
      amount,
      action as 'buy' | 'sell'
    );
    
    // ✅ Return with verification status
    return res.json({
      success: true,
      orderId,
      message: `${action} order placed`,
      verification: {
        verdict: verificationResult.verdict,
        status: verificationResult.externalProof?.status,
        exchange: verificationResult.externalProof?.externalSource
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

---

## Pattern 3: Email Delivery Verification

### Current Code (BEFORE)
```typescript
async function sendETransferEmail(email: string, subject: string, html: string) {
  try {
    const result = await mailerSend.email.send({
      from: sender,
      to: email,
      subject,
      html
    });
    
    // ❌ Doesn't track delivery verification
    console.log(`Email sent to ${email}`);
    return;
  } catch (error) {
    console.error(`Email failed: ${error.message}`);
  }
}
```

### Updated Code (AFTER)
```typescript
async function sendETransferEmail(email: string, subject: string, html: string) {
  try {
    const result = await mailerSend.email.send({
      from: sender,
      to: email,
      subject,
      html
    });
    
    const messageId = result.data?.id || result.id;
    
    // ✅ Apply external verification
    const enforcer = createEnforcer('email');
    const verificationResult = await enforcer.sendEmailWithVerification(
      email,
      subject,
      messageId,
      'mailersend'
    );
    
    // ✅ Log verification status
    console.log(`Email sent to ${email}`);
    console.log(`Verification: ${verificationResult.verdict} (${verificationResult.externalProof?.status})`);
    
    return { success: true, messageId, verification: verificationResult };
  } catch (error) {
    console.error(`Email failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

---

## Pattern 4: SMS Delivery Verification

### Current Code (BEFORE)
```typescript
async function sendSMSAlert(phone: string, message: string) {
  try {
    const response = await fetch('https://api.twilio.com/...', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${authHeader}` },
      body: new URLSearchParams({ To: phone, From: twilioFrom, Body: message })
    });
    
    // ❌ Doesn't verify delivery
    console.log(`SMS sent to ${phone}`);
    return;
  } catch (error) {
    console.error(`SMS failed: ${error.message}`);
  }
}
```

### Updated Code (AFTER)
```typescript
async function sendSMSAlert(phone: string, message: string) {
  try {
    const response = await fetch('https://api.twilio.com/...', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${authHeader}` },
      body: new URLSearchParams({ To: phone, From: twilioFrom, Body: message })
    });
    
    const data = await response.json();
    const messageId = data.sid; // Twilio message ID
    
    // ✅ Apply external verification
    const enforcer = createEnforcer('sms');
    const verificationResult = await enforcer.sendSmsWithVerification(
      phone,
      message,
      messageId,
      'twilio'
    );
    
    // ✅ Log verification status
    console.log(`SMS sent to ${phone}`);
    console.log(`Verification: ${verificationResult.verdict} (${verificationResult.externalProof?.status})`);
    
    return { success: true, messageId, verification: verificationResult };
  } catch (error) {
    console.error(`SMS failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

---

## Pattern 5: Payment Processing Verification

### Current Code (BEFORE)
```typescript
app.post('/api/payment/process', async (req, res) => {
  const { amount, recipient, processor } = req.body;
  
  try {
    // Execute payment on external processor
    const result = await initiatePayment(amount, recipient);
    
    // ❌ Just returns success
    return res.json({
      success: true,
      message: 'Payment processed'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Updated Code (AFTER)
```typescript
app.post('/api/payment/process', async (req, res) => {
  const { amount, recipient, processor } = req.body;
  
  try {
    // Execute payment on external processor
    const result = await initiatePayment(amount, recipient);
    const processorRefId = result.referenceId; // Must get processor ref
    
    if (!processorRefId) {
      return res.status(400).json({ error: 'Processor did not return reference ID' });
    }
    
    // ✅ Apply external verification
    const enforcer = createEnforcer('payment');
    const verificationResult = await enforcer.processPaymentWithVerification(
      amount,
      'USD',
      recipient,
      processor,
      processorRefId
    );
    
    // ✅ Return with processor reference tracking
    return res.json({
      success: true,
      message: 'Payment processed',
      processorRef: processorRefId,
      verification: {
        verdict: verificationResult.verdict,
        status: verificationResult.externalProof?.status,
        processorRef: verificationResult.externalProof?.referenceId,
        note: 'Awaiting external processor confirmation'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Key Points
- **Must** get processor reference ID from external system
- If no ref ID: return error and don't attempt verification
- Verification status will be "pending" until processor confirms
- Never mark as "PASS" until processor confirms

---

## Pattern 6: Multi-Step Operation with Polling

### Current Code (BEFORE)
```typescript
app.post('/api/settlement/execute', async (req, res) => {
  const { amount, target } = req.body;
  
  try {
    // Step 1: Initiate settlement
    const txHash = await initiateSettlement(amount, target);
    
    // Step 2: Wait for confirmation (but don't verify)
    const confirmed = await waitForConfirmation(txHash);
    
    // ❌ Returns success without external verification
    return res.json({
      success: true,
      txHash,
      confirmed,
      message: 'Settlement completed'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Updated Code (AFTER)
```typescript
app.post('/api/settlement/execute', async (req, res) => {
  const { amount, target } = req.body;
  
  try {
    // Step 1: Initiate settlement
    const txHash = await initiateSettlement(amount, target);
    
    // Step 2: Apply external verification with polling
    const enforcer = createEnforcer('blockchain');
    const verificationResult = await enforcer.executeBlockchainTransfer(
      'ethereum',
      txHash,
      amount,
      target
    );
    
    // Step 3: Return based on verification status
    if (verificationResult.verdict === 'PASS') {
      // Settlement verified externally
      return res.json({
        success: true,
        txHash,
        message: 'Settlement completed and verified',
        verification: {
          verdict: 'PASS',
          confirmations: verificationResult.externalProof?.confirmations,
          status: 'verified'
        }
      });
    } else if (verificationResult.verdict === 'INCOMPLETE') {
      // Waiting for external confirmation
      return res.status(202).json({
        pending: true,
        txHash,
        message: 'Settlement initiated, awaiting external confirmation',
        verification: {
          verdict: 'INCOMPLETE',
          status: 'pending',
          checkAgainIn: '30 seconds'
        }
      });
    } else {
      // Verification failed
      return res.status(400).json({
        success: false,
        txHash,
        error: 'Settlement verification failed',
        verification: {
          verdict: 'FAIL',
          status: 'failed'
        }
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### HTTP Status Code Mapping
- `200 OK` - Operation verified (PASS)
- `202 Accepted` - Operation pending external verification (INCOMPLETE)
- `400 Bad Request` - Operation failed external verification (FAIL)
- `500 Server Error` - Internal error

---

## Common Mistakes to Avoid

### ❌ MISTAKE 1: Missing Import
```typescript
// ❌ Won't work
const result = await enforcer.executeBlockchainTransfer(...);

// ✅ Correct
import { createEnforcer } from './src/lib/critical-operations-enforcer.js';
const enforcer = createEnforcer('blockchain');
const result = await enforcer.executeBlockchainTransfer(...);
```

### ❌ MISTAKE 2: Not Checking Verification Result
```typescript
// ❌ Wrong - assumes always PASS
const result = await enforcer.executeBlockchainTransfer(...);
return res.json({ success: true, ... }); // Might be INCOMPLETE or FAIL!

// ✅ Correct - check verdict
const result = await enforcer.executeBlockchainTransfer(...);
if (result.verdict === 'PASS') {
  return res.json({ success: true, ... });
} else if (result.verdict === 'INCOMPLETE') {
  return res.status(202).json({ pending: true, ... });
} else {
  return res.status(400).json({ error: 'Verification failed', ... });
}
```

### ❌ MISTAKE 3: Returning PASS without External Proof
```typescript
// ❌ SAFETY VIOLATION - will throw error
return res.json({
  success: true,
  verdict: 'PASS',
  externalProof: null  // 🚨 Missing proof!
});

// ✅ Correct - include proof from verificationResult
return res.json({
  success: true,
  verdict: verificationResult.verdict,
  verification: verificationResult.externalProof
});
```

### ❌ MISTAKE 4: Not Handling Environment Variable Missing
```typescript
// ❌ Will fail if env var missing
const apiKey = process.env.EXTERNAL_API_KEY;
const result = await verifyWithApi(apiKey, data);

// ✅ Correct - provide graceful handling
const apiKey = process.env.EXTERNAL_API_KEY;
if (!apiKey) {
  // Return INCOMPLETE instead of failing
  return { verdict: 'INCOMPLETE', status: 'unavailable' };
}
const result = await verifyWithApi(apiKey, data);
```

---

## Testing Checklist

Before deploying updated endpoint:

- [ ] Import statement correct and no syntax errors
- [ ] Enforcer created with correct operation type
- [ ] Enforcer method called with all required parameters
- [ ] Verification result checked before responding
- [ ] Different response statuses for PASS/INCOMPLETE/FAIL
- [ ] External proof included in response
- [ ] Error handling for missing credentials
- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] Endpoint tested with mock data
- [ ] Report shows verification status correctly

---

## Deployment Steps

### Per Endpoint

1. **Code**: Update endpoint following pattern above
2. **Test**: Run endpoint with test data
3. **Verify**: Check response includes verification object
4. **Commit**: `git add server.ts && git commit -m "Add external verification to /api/..."`
5. **Deploy**: Push to production

### Full System

1. Update all critical endpoints (10-15 endpoints)
2. Configure all `.env` variables
3. Run full test suite
4. Generate new verification report
5. Archive old test reports
6. Deploy to production
7. Monitor verification system status

---

## Verification Provider Status Checks

Before deploying, verify external providers are accessible:

```bash
# Check Ethereum block explorer
curl https://api.etherscan.io/api?module=account&action=balance&address=0x

# Check Coinbase API
curl https://api.coinbase.com/api/v3/brokerage/accounts

# Check MailerSend
curl https://api.mailersend.com/v1/providers

# Check Twilio
curl https://api.twilio.com/2010-04-01/Accounts
```

If any provider is unreachable, verify status page and credentials.

---

## Support

For implementation questions, refer to:
- `EXTERNAL_VERIFICATION_SYSTEM.md` - Full system documentation
- `IMPLEMENTATION_CHECKLIST.md` - Overall progress tracking
- `scripts/test-verification-system.ts` - Working examples

---

**Last Updated:** July 3, 2026  
**Status:** Ready for integration  
**Estimated Time:** 2-3 hours for all endpoints
