/**
 * External Verification System - Test & Demonstration
 * 
 * This script demonstrates how the verification system enforces external proof
 * for all critical operations.
 */

import {
  createTestResult,
  determineVerdict,
  verifyBlockchainTx,
  verifyExchangeOrder,
  verifyEmailDelivery,
  ProofObject,
  TestResult,
} from './src/lib/external-verification.js';

import {
  generateVerificationReport,
  formatReportAsMarkdown,
  validateReport,
} from './src/lib/truth-based-reporter.js';

import {
  createEnforcer,
  enforceExternalProofRequirement,
} from './src/lib/critical-operations-enforcer.js';

// ============================================================================
// DEMO 1: Attempting to create a test result without external proof (FAILS)
// ============================================================================

console.log('📋 DEMO 1: Safety Check - No unverified PASS verdicts');
console.log('─'.repeat(60));

try {
  // ❌ This should throw - attempting PASS without external proof
  const invalidResult: TestResult = {
    internalResult: { success: true, data: { amount: '100' } },
    externalProof: null, // 🚨 MISSING PROOF
    verdict: 'PASS', // 🚨 INVALID
  };

  console.log('Attempting to create PASS verdict without external proof...');
  enforceExternalProofRequirement(invalidResult);
  console.log('❌ ERROR: Safety check failed to detect violation!');
} catch (error: any) {
  console.log('✅ Safety check caught violation:', error.message.split('\n')[0]);
}

console.log();

// ============================================================================
// DEMO 2: Correct test result structure with external proof
// ============================================================================

console.log('📋 DEMO 2: Correct test result with external proof');
console.log('─'.repeat(60));

const mockBlockchainProof: ProofObject = {
  type: 'blockchain',
  status: 'verified',
  referenceId: '0xabc123def456',
  rawResponse: { confirmations: 12, status: '1' },
  timestamp: new Date().toISOString(),
  externalSource: 'Etherscan',
  confirmations: 12,
};

const validResult = createTestResult(
  true, // Internal success
  { txHash: '0xabc123def456', amount: '1.0 ETH' },
  mockBlockchainProof,
);

console.log(`Verdict: ${validResult.verdict}`);
console.log(`External Status: ${validResult.externalProof?.status}`);
console.log(`✅ Test PASSES because both internal AND external verification succeeded`);

console.log();

// ============================================================================
// DEMO 3: Incomplete test (external verification pending)
// ============================================================================

console.log('📋 DEMO 3: Incomplete test - external verification pending');
console.log('─'.repeat(60));

const pendingProof: ProofObject = {
  type: 'email',
  status: 'pending',
  referenceId: 'msg_123456',
  rawResponse: { message: 'Email sent - delivery status pending' },
  timestamp: new Date().toISOString(),
};

const incompleteResult = createTestResult(
  true,
  { recipient: 'user@example.com', subject: 'Payment confirmation' },
  pendingProof,
);

console.log(`Verdict: ${incompleteResult.verdict}`);
console.log(`External Status: ${incompleteResult.externalProof?.status}`);
console.log(`⏳ Test is INCOMPLETE - awaiting external provider confirmation`);
console.log(`   (Will become PASS once provider confirms delivery)`);

console.log();

// ============================================================================
// DEMO 4: Failed test (external verification failed)
// ============================================================================

console.log('📋 DEMO 4: Failed test - external verification failed');
console.log('─'.repeat(60));

const failedProof: ProofObject = {
  type: 'exchange',
  status: 'failed',
  referenceId: 'order_123',
  rawResponse: { error: 'Order not found on exchange' },
  timestamp: new Date().toISOString(),
};

const failedResult = createTestResult(
  true, // Internal said success
  { orderId: 'order_123', asset: 'ETH', amount: '1.0' },
  failedProof,
);

console.log(`Verdict: ${failedResult.verdict}`);
console.log(`External Status: ${failedResult.externalProof?.status}`);
console.log(`❌ Test FAILS - exchange could not verify the order`);
console.log(`   (External system says operation didn't happen)`);

console.log();

// ============================================================================
// DEMO 5: Test Report Generation
// ============================================================================

console.log('📋 DEMO 5: Truth-Based Test Report Generation');
console.log('─'.repeat(60));

// Create sample test results
const categories = [
  {
    name: 'Blockchain Operations',
    tests: [
      createTestResult(
        true,
        { txHash: '0xabc123' },
        { type: 'blockchain', status: 'verified', referenceId: '0xabc123', rawResponse: {}, timestamp: new Date().toISOString(), confirmations: 5 } as ProofObject,
      ),
      createTestResult(
        true,
        { txHash: '0xdef456' },
        { type: 'blockchain', status: 'pending', referenceId: '0xdef456', rawResponse: {}, timestamp: new Date().toISOString() } as ProofObject,
      ),
    ],
  },
  {
    name: 'Exchange Operations',
    tests: [
      createTestResult(
        true,
        { orderId: 'order_1' },
        { type: 'exchange', status: 'verified', referenceId: 'order_1', rawResponse: {}, timestamp: new Date().toISOString(), externalSource: 'Coinbase' } as ProofObject,
      ),
      createTestResult(
        true,
        { orderId: 'order_2' },
        { type: 'exchange', status: 'failed', referenceId: 'order_2', rawResponse: {}, timestamp: new Date().toISOString() } as ProofObject,
      ),
    ],
  },
];

const report = generateVerificationReport(categories, 'production');

console.log(`Final Status: ${report.finalStatus}`);
console.log(`Verified Tests: ${report.externalVerified}/${report.totalTests}`);
console.log(`Incomplete: ${report.incomplete}`);
console.log(`Failed: ${report.failed}`);
console.log();

// Validate report for safety violations
const validation = validateReport(report);
if (validation.valid) {
  console.log('✅ Report passes all safety checks');
} else {
  console.log('❌ Report has safety violations:');
  validation.errors.forEach(err => console.log(`   - ${err}`));
}

console.log();

// ============================================================================
// DEMO 6: Markdown Report Format
// ============================================================================

console.log('📋 DEMO 6: Markdown Report Output (excerpt)');
console.log('─'.repeat(60));

const markdown = formatReportAsMarkdown(report);
const lines = markdown.split('\n').slice(0, 30); // First 30 lines
console.log(lines.join('\n'));

console.log();
console.log('... (full report truncated for demo)');
console.log();

// ============================================================================
// DEMO 7: Forbidden Claims Detection
// ============================================================================

console.log('📋 DEMO 7: Forbidden Claims Detection');
console.log('─'.repeat(60));

const forbiddenClaims = [
  'PRODUCTION READY',
  'ALL SYSTEMS PASS',
  'real-world confirmed',
  '104/104 TESTS PASSED',
  'FULLY VERIFIED',
];

console.log('These claims are now FORBIDDEN unless finalStatus === "VERIFIED":');
forbiddenClaims.forEach((claim, i) => {
  console.log(`  ${i + 1}. ❌ "${claim}"`);
});

console.log();
console.log('Current report status:', report.finalStatus);
if (report.finalStatus !== 'VERIFIED') {
  console.log('→ Cannot use any forbidden claims in current state');
}

console.log();

// ============================================================================
// DEMO 8: Critical Operation Enforcer
// ============================================================================

console.log('📋 DEMO 8: Critical Operation Enforcer Example');
console.log('─'.repeat(60));

async function demonstrateEnforcer() {
  const enforcer = createEnforcer('atm');

  console.log('Attempting to issue ATM voucher with external verification...');

  try {
    const result = await enforcer.issueAtmVoucherWithTracking(
      '100.00',
      'CAD',
      'ATM-ABC123',
      '654321',
    );

    console.log(`✅ ATM Voucher Result:`);
    console.log(`   Verdict: ${result.verdict}`);
    console.log(`   Status: ${result.externalProof?.status}`);
    console.log(`   Reference: ${result.externalProof?.referenceId}`);
    console.log(`   Reason: ${result.reason || 'ATM voucher tracked for redemption'}`);
  } catch (error: any) {
    console.log(`❌ Enforcer error: ${error.message}`);
  }
}

await demonstrateEnforcer();

console.log();

// ============================================================================
// SUMMARY
// ============================================================================

console.log('═'.repeat(60));
console.log('🔐 EXTERNAL VERIFICATION SYSTEM - SUMMARY');
console.log('═'.repeat(60));
console.log();
console.log('✅ IMPLEMENTED:');
console.log('   1. ProofObject structure for all external verification');
console.log('   2. Strict PASS rule: internal success AND external verified');
console.log('   3. Safety enforcement: PASS without proof throws error');
console.log('   4. Truth-based reports: VERIFIED, INCOMPLETE, NOT VERIFIED only');
console.log('   5. Forbidden claims enforcement for unverified status');
console.log('   6. CriticalOperationEnforcer for all critical operations');
console.log('   7. External provider verification: blockchain, exchange, email, SMS, bank, ATM');
console.log();
console.log('📊 KEY METRICS:');
console.log(`   - Test categories with verification: ${categories.length}`);
console.log(`   - Total operations tracked: ${report.totalTests}`);
console.log(`   - Externally verified: ${report.externalVerified}`);
console.log(`   - Pending external confirmation: ${report.incomplete}`);
console.log(`   - Failed external verification: ${report.failed}`);
console.log();
console.log('🚀 NEXT STEPS:');
console.log('   1. Integrate CriticalOperationEnforcer into all critical endpoints');
console.log('   2. Configure external API credentials in .env');
console.log('   3. Monitor /api/verification/status for provider availability');
console.log('   4. Generate reports via /api/verification/report');
console.log();
console.log('═'.repeat(60));
