# Security Specification & Hardening Plan

This document details the security specification, on-chain data invariants, "Dirty Dozen" threat payloads, and test suite definitions for the **Marshall Sovereign Wealth Terminal**'s Firestore implementation.

---

## 1. On-Chain Data Invariants

1. **User Profile Invariant**: A user profile must match the authentic user ID (`request.auth.uid`). No user can write or modify a user profile document representing another UID.
2. **Wallet Access Invariant**: A wallet cannot be created or updated without a verified owner ID matching the signed-in user's UID. All wallet document IDs must be structured, bounded, and validated.
3. **Transaction Integrity Invariant**: All transactions must be tagged with the authentic creator's UID. The transaction status cannot be modified from `confirmed` or `failed` back to `pending`.
4. **Audit Log Append-Only Invariant**: Audit log documents cannot be edited or deleted once written. Only create operations are permitted.
5. **Sovereign Treasury Isolation**: High-security sovereign assets and PIN configurations under `/sovereign` must be strictly restricted to the authentic owner or sandbox bypasses.

---

## 2. The "Dirty Dozen" Threat Payloads

The following 12 payloads represent attacks designed to bypass the laws of Identity, Integrity, and State. These must be rejected with `PERMISSION_DENIED`.

### Attack 1: User Profile Spoofing
- **Target**: `/users/attacker_uid`
- **Payload**: `{ "userId": "victim_uid", "email": "victim@domain.com", "mfaEnabled": false }`
- **Violation**: Attacker attempts to claim ownership of another user's profile.

### Attack 2: Wallet Identity Hijack
- **Target**: `/users/victim_uid/wallets/wallet_123`
- **Payload**: `{ "walletId": "wallet_123", "userId": "victim_uid", "name": "Hijacked Wallet", "address": "0xAttacker", "encryptedPrivateKey": "...", "chainType": "Ethereum" }`
- **Violation**: Attacker attempts to inject a wallet into a victim's collection.

### Attack 3: Ghost Field Injection (Shadow Update)
- **Target**: `/users/victim_uid`
- **Payload**: `{ "userId": "victim_uid", "email": "victim@domain.com", "mfaEnabled": false, "isAdmin": true }`
- **Violation**: Injecting unrequested or privileged configuration parameters into user profiles.

### Attack 4: Transaction Back-dating
- **Target**: `/users/victim_uid/transactions/tx_123`
- **Payload**: `{ "txId": "tx_123", "userId": "victim_uid", "walletId": "wallet_123", "chain": "Ethereum", "type": "send", "fromAddress": "0xVictim", "toAddress": "0xAttacker", "amount": "1000", "status": "confirmed", "timestamp": "2020-01-01T00:00:00Z" }`
- **Violation**: Spoofing transaction timestamps to historical dates.

### Attack 5: Terminal State Transition Shortcut
- **Target**: `/users/victim_uid/transactions/tx_123`
- **Payload**: Transitioning from `confirmed` to `pending` to re-execute a payout.
- **Violation**: Attempting to alter terminal status.

### Attack 6: Massive Payload DOS Attack
- **Target**: `/users/victim_uid/wallets/wallet_123`
- **Payload**: `{ "name": "A" * 1000000, "address": "0x..." }`
- **Violation**: Buffer overflow/Denial-of-wallet through payload bloat.

### Attack 7: ID Path Poisoning
- **Target**: `/users/victim_uid/wallets/VERY_LONG_JUNK_ID_%%%_$$$`
- **Payload**: `{ "walletId": "VERY_LONG_JUNK_ID_%%%_$$$", ... }`
- **Violation**: Injecting special characters or massive strings as document IDs.

### Attack 8: Audit Log Alteration
- **Target**: `/users/victim_uid/auditLogs/log_123`
- **Payload**: `{ "action": "MALICIOUS_CLEANUP", "details": "Deleting evidence" }` (on update or delete)
- **Violation**: Modifying audit logs.

### Attack 9: Sovereign PIN Spoofing
- **Target**: `/users/victim_uid/sovereign/config`
- **Payload**: `{ "sovereignPin": "123456" }`
- **Violation**: Setting a self-assigned pin bypass.

### Attack 10: Email Verification Spoofing
- **Target**: `/users/victim_uid`
- **Payload**: Attacking verification rules using unverified accounts.
- **Violation**: Accessing documents with `email_verified == false`.

### Attack 11: PII Cross-Read Leak
- **Target**: `/users/victim_uid`
- **Operation**: `get` requested by `attacker_uid`.
- **Violation**: Attempting to read another user's secure profile.

### Attack 12: Orphaned Record Write
- **Target**: `/users/victim_uid/transactions/tx_123` (associated with a non-existent wallet)
- **Violation**: Writing transactional history without an associated wallet.

---

## 3. Test Runner Specification

All tests compile and evaluate Firestore operations locally or against mock databases to ensure compliance.

```typescript
// firestore.rules.test.ts
// Automated validation of ruleset stability against the "Dirty Dozen" payloads.
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Verification suite executed during hardening cycles.
```
