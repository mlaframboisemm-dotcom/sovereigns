import fs from 'fs';
import path from 'path';

/**
 * Marshall Effect - Forensic Ledger Reconciliation Engine
 */
export async function runForensicScan(ledgerPath = './ledger_db.json') {
  console.log(`[MARSHALL EFFECT] Initiating forensic scan on: ${ledgerPath}`);
  
  if (!fs.existsSync(ledgerPath)) {
    console.error(`Ledger file not found at: ${ledgerPath}`);
    return { success: false, error: 'Ledger file missing' };
  }

  const raw = fs.readFileSync(ledgerPath, 'utf-8');
  const ledger = JSON.parse(raw);
  const entries = ledger.entries || [];

  const discrepancies = [];
  const anomalies = [];
  const velocityAlerts = [];

  // 1. Value Spike Detection (Thresholds: Yield > 1 ETH, Outbound Transfer > $50,000 USD/CAD)
  for (const entry of entries) {
    const { amount, currency, action, source } = entry.payload || {};
    
    if (action === 'yield.reward') {
      if (currency === 'ETH' && amount > 1.0) {
        anomalies.push({
          type: 'VALUE_SPIKE',
          entryId: entry.id,
          message: `Unusually high yield reward detected: ${amount} ${currency} from source "${source}"`
        });
      }
    }

    if (action === 'settlement.withdrawal') {
      if (amount > 50000) {
        anomalies.push({
          type: 'VALUE_SPIKE',
          entryId: entry.id,
          message: `Large outbound withdrawal detected: ${amount} ${currency} to ${entry.payload.recipient}`
        });
      }
    }
  }

  // 2. Circular Transaction Detection (Wallet -> Kraken -> Coinbase -> Wallet)
  // We trace transactions of the same asset and amount within a close window
  const exchangeTransfers = entries.filter(e => e.payload && e.payload.action === 'exchange.transfer');
  for (const t1 of exchangeTransfers) {
    const amount = t1.payload.amount;
    const currency = t1.payload.currency;
    
    // Look for a second hop where t1.recipient is t2.source
    const secondHops = exchangeTransfers.filter(t2 => 
      t2.payload.source === t1.payload.recipient && 
      t2.payload.amount === amount && 
      t2.payload.currency === currency &&
      new Date(t2.createdAt) > new Date(t1.createdAt)
    );

    for (const t2 of secondHops) {
      // Look for a third hop where t2.recipient is t3.source and t3.recipient is t1.source (closing the loop)
      const thirdHops = exchangeTransfers.filter(t3 => 
        t3.payload.source === t2.payload.recipient && 
        t3.payload.recipient === t1.payload.source &&
        t3.payload.amount === amount && 
        t3.payload.currency === currency &&
        new Date(t3.createdAt) > new Date(t2.createdAt)
      );

      if (thirdHops.length > 0) {
        anomalies.push({
          type: 'CIRCULAR_LOOP',
          entryIds: [t1.id, t2.id, thirdHops[0].id],
          message: `Circular transaction loop detected: ${t1.payload.source} -> ${t2.payload.source} -> ${thirdHops[0].payload.source} -> ${t1.payload.source} for ${amount} ${currency}`
        });
      }
    }
  }

  // 3. Timing Irregularities (Weekend/After-Hours Surges)
  // Standard operating hours: Monday-Friday, 8 AM - 6 PM UTC
  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const hour = date.getUTCHours();
    
    const isWeekend = (day === 0 || day === 6);
    const isAfterHours = (hour < 8 || hour >= 18);

    if ((isWeekend || isAfterHours) && entry.payload && entry.payload.action === 'settlement.withdrawal') {
      anomalies.push({
        type: 'TIMING_IRREGULARITY',
        entryId: entry.id,
        message: `High-value withdrawal initiated during off-hours/weekend: ${date.toISOString()} (${isWeekend ? 'Weekend' : 'After-Hours'})`
      });
    }
  }

  // 4. Velocity Analysis (High-frequency bursty transactions, >3 txs in 60s)
  const windowMs = 60 * 1000;
  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    const currentTimes = new Date(current.createdAt).getTime();
    const burst = [current];

    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      const other = entries[j];
      const otherTime = new Date(other.createdAt).getTime();
      const diff = otherTime - currentTimes;

      if (diff > 0 && diff <= windowMs && other.payload?.source === current.payload?.source) {
        burst.push(other);
      }
    }

    if (burst.length > 3) {
      const burstIds = burst.map(b => b.id);
      // Ensure we don't log duplicate warnings
      if (!velocityAlerts.some(v => v.entryIds.includes(current.id))) {
        velocityAlerts.push({
          type: 'HIGH_VELOCITY_BURST',
          entryIds: burstIds,
          message: `High velocity burst detected: ${burst.length} transactions executed within a 60-second window from "${current.payload.source}"`
        });
      }
    }
  }

  // 5. Side-by-Side Matching (Staking provider verification)
  const KNOWN_STAKING_PROVIDERS = ['Kiln Staking Pool', 'Figment Staking Pool', 'Lido Finance'];
  for (const entry of entries) {
    if (entry.payload?.action === 'yield.reward') {
      const source = entry.payload.source;
      if (!KNOWN_STAKING_PROVIDERS.includes(source)) {
        discrepancies.push({
          type: 'UNAUTHORIZED_YIELD_SOURCE',
          entryId: entry.id,
          message: `Yield reward source "${source}" is not in the verified whitelist.`
        });
      }
    }
  }

  // Generate Report Markdown
  const report = {
    scanTime: new Date().toISOString(),
    totalScanned: entries.length,
    discrepancies,
    anomalies,
    velocityAlerts
  };

  return report;
}

// Runnable script logic
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('ledger_reconciliation.js') || 
  process.argv[1].endsWith('ledger_reconciliation')
);

if (isDirectRun) {
  runForensicScan().then(report => {
    console.log('\n==================================================');
    console.log('MARSHALL EFFECT FORENSIC AUDIT RESULTS');
    console.log('==================================================');
    console.log(`Scan Date: ${report.scanTime}`);
    console.log(`Total Entries Scanned: ${report.totalScanned}`);
    
    console.log('\n--- DISCREPANCIES ---');
    if (report.discrepancies.length === 0) console.log('None found.');
    else report.discrepancies.forEach(d => console.log(`[${d.type}] ${d.message} (ID: ${d.entryId})`));

    console.log('\n--- ANOMALIES ---');
    if (report.anomalies.length === 0) console.log('None found.');
    else report.anomalies.forEach(a => console.log(`[${a.type}] ${a.message}`));

    console.log('\n--- VELOCITY ALERTS ---');
    if (report.velocityAlerts.length === 0) console.log('None found.');
    else report.velocityAlerts.forEach(v => console.log(`[${v.type}] ${v.message}`));
    console.log('==================================================\n');
  }).catch(err => {
    console.error('Forensic scan script failed:', err);
  });
}