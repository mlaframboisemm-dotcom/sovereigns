# Implementation Plan — Enforcing 100% Real-World Production Flows (No Simulations)

To satisfy the constraint of running only real-world production flows without any mock/simulated fallbacks, we will audit and modify `server.ts` to remove the simulation fallback logic from the key transactional routes. 

If any on-chain private key or exchange API credential is missing, or if the live API request fails, the server will immediately return an authentic error response (e.g. `400 Bad Request` or `502 Bad Gateway`) instead of generating mock hashes or queuing mock entries into a virtual mempool.

---

## Proposed Changes

### [MODIFY] [server.ts](file:///c:/Users/WINNNEER/Downloads/marshall_sovereign_terminal_MASTER_PRODUCTION/sovereign_terminal_master/server.ts)

We will modify the four key transactional endpoints:

#### 1. On-Chain Token Transfer Endpoint (`/api/wallet/send`)
Disable mock transaction hash creation when `MARSHALL_WALLET_PRIVATE_KEY` is missing.

```diff
@@ -883,31 +883,8 @@
   }
 
   const privKey = process.env.MARSHALL_WALLET_PRIVATE_KEY;
   if (!privKey) {
-    const simulatedHash = '0x' + crypto.randomBytes(32).toString('hex');
-    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
-    submitToVirtualMempool({
-      txId,
-      hash: simulatedHash,
-      type: 'send',
-      asset: asset || 'ETH',
-      amount,
-      fromAddress: '0x58B178F7EEe92fe888c0A1684D5FE6b78C0Ff99f',
-      toAddress,
-      chain: 'Ethereum',
-      status: 'pending',
-      notes: note || ''
-    });
-
-    return res.json({
-      success: true,
-      hash: simulatedHash,
-      from: '0x58B178F7EEe92fe888c0A1684D5FE6b78C0Ff99f',
-      to: toAddress,
-      amount,
-      asset: asset || 'ETH',
-      isSimulated: true,
-      message: `Transaction submitted to Virtual Mempool. Queued for validation. Hash: ${simulatedHash}`,
-      timestamp: new Date().toISOString()
-    });
+    return res.status(400).json({ error: 'Marshall Wallet Private Key is not seeded on the host server. Real transaction execution is required.' });
   }
 
   try {
```

#### 2. Portfolio State Anchor Endpoint (`/api/wallet/settle-broadcast`)
Disable simulated state anchoring when `MARSHALL_WALLET_PRIVATE_KEY` is missing.

```diff
@@ -977,33 +977,8 @@
     const gasPriceResult = await provider.getFeeData();
     const currentGasPrice = gasPriceResult.gasPrice ? ethers.formatUnits(gasPriceResult.gasPrice, 'gwei') : '25.0';
 
     if (!privKey) {
-      const simulatedHash = '0x' + crypto.randomBytes(32).toString('hex');
-      const mockBlock = blockNumber + 1;
-      
-      submitToVirtualMempool({
-        txId: `settle_${Math.random().toString(36).substring(2, 11)}`,
-        hash: simulatedHash,
-        type: 'settlement',
-        asset: 'ETH',
-        amount: '0.00',
-        fromAddress: '0x58B178F7EEe92fe888c0A1684D5FE6b78C0Ff99f',
-        toAddress: 'State Anchor Contract',
-        chain: 'Ethereum',
-        status: 'pending',
-        notes: `State Hash: ${stateHash || '0xae8f7311'}`
-      });
-
-      return res.json({
-        success: true,
-        hash: simulatedHash,
-        blockNumber: mockBlock,
-        blockHash: '0x' + crypto.randomBytes(32).toString('hex'),
-        gasPrice: currentGasPrice,
-        stateHash: stateHash || '0xae8f7311',
-        isRealBroadcast: false,
-        from: '0x58B178F7EEe92fe888c0A1684D5FE6b78C0Ff99f',
-        message: `Successfully broadcasted virtual settlement anchor to Sovereign Enclave. Merkle state hash permanently queued for mining. Hash: ${simulatedHash}`,
-        timestamp: new Date().toISOString()
-      });
+      return res.status(400).json({ error: 'Marshall Wallet Private Key is not seeded on the host server. Real state anchor execution is required.' });
     }
 
     // Execute an actual, live 0-ETH broadcast anchoring the State Hash on the Ethereum blockchain
```

#### 3. Exchange Order Placement Endpoint (`/api/exchanges/trade`)
Disable mock OTC order routing when Coinbase and Kraken API configurations fail or are missing.

```diff
@@ -1500,32 +1500,10 @@
 
   const bothFailed = (targetExchange === 'all') && !results.coinbase?.success && !results.kraken?.success;
   if (bothFailed) {
-    const simulatedHash = '0x' + crypto.randomBytes(32).toString('hex');
-    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
-    
-    submitToVirtualMempool({
-      txId,
-      hash: simulatedHash,
-      type: action.toLowerCase() === 'buy' ? 'receive' : 'send',
-      asset: symbol,
-      amount,
-      fromAddress: action.toLowerCase() === 'buy' ? `OTC Liquidity Pool (${symbol})` : '0x58B178F7EEe92fe888c0A1684D5FE6b78C0Ff99f',
-      toAddress: action.toLowerCase() === 'buy' ? '0x58B178F7EEe92fe888c0A1684D5FE6b78C0Ff99f' : `OTC Liquidity Pool (${symbol})`,
-      chain: 'Ethereum',
-      status: 'pending'
-    });
-
-    return res.json({
-      success: true,
-      action,
-      symbol,
-      amount,
-      timestamp: new Date().toISOString(),
-      executedReal: false,
-      txHash: simulatedHash,
-      results: {
-        simulated: { success: true, live: false, hash: simulatedHash }
-      },
-      message: `Sovereign OTC ${action.toUpperCase()} of ${amount} ${symbol} successfully routed to Virtual liquidity desk. Validation queued in mempool.`
-    });
+    const errors = [];
+    if (results.coinbase?.error) errors.push(`Coinbase: ${results.coinbase.error}`);
+    if (results.kraken?.error) errors.push(`Kraken: ${results.kraken.error}`);
+    return res.status(502).json({
+      error: `Failed to execute real order on exchanges. ${errors.join(' | ')}`
+    });
   }
```

#### 4. Exchange Swap Endpoint (`/api/exchanges/swap`)
Disable simulated swaps when Coinbase and Kraken swap executions fail or are missing.

```diff
@@ -1602,32 +1602,10 @@
 
   const bothFailed = (targetExchange === 'all') && !results.coinbase?.success && !results.kraken?.success;
   if (bothFailed) {
-    const simulatedHash = '0x' + crypto.randomBytes(32).toString('hex');
-    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
-    
-    submitToVirtualMempool({
-      txId,
-      hash: simulatedHash,
-      type: 'swap',
-      asset: fromAsset,
-      toAsset: toAsset,
-      amount,
-      fromAddress: '0x58B178F7EEe92fe888c0A1684D5FE6b78C0Ff99f',
-      toAddress: `Swap Pool (${fromAsset} ➔ ${toAsset})`,
-      chain: 'Ethereum',
-      status: 'pending'
-    });
-
-    return res.json({
-      success: true,
-      fromAsset,
-      toAsset,
-      amount,
-      timestamp: new Date().toISOString(),
-      executedReal: false,
-      txHash: simulatedHash,
-      results: {
-        simulated: { success: true, live: false, hash: simulatedHash }
-      },
-      message: 'Sovereign OTC swap successfully routed through Virtual Liquidity Pool. Transaction permanently queued for mining.'
-    });
+    const errors = [];
+    if (results.coinbase?.error) errors.push(`Coinbase: ${results.coinbase.error}`);
+    if (results.kraken?.error) errors.push(`Kraken: ${results.kraken.error}`);
+    return res.status(502).json({
+      error: `Failed to execute real swap on exchanges. ${errors.join(' | ')}`
+    });
   }
```

---

## Verification Plan

### Automated Verification
*   Compile client/server codebase (`npm run build`).
*   Re-package codebase to ZIP files.
