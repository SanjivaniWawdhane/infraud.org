/**
 * Automated Test Suite for Phone Analyzer Service
 */

const { analyzePhoneNumber, validatePhoneInput } = require('./src/services/phoneAnalyzer');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🧪 Starting Phone Analyzer Automated Test Suite');
console.log('====================================================\n');

// 1. Empty / Missing Input
console.log('Test 1: Empty and Missing Inputs');
const r1 = analyzePhoneNumber('');
assert(r1.success === false && r1.statusCode === 400, 'Rejects empty input with 400');
const r1b = analyzePhoneNumber(null);
assert(r1b.success === false && r1b.statusCode === 400, 'Rejects null input with 400');

// 2. Malformed / Alphabetical characters
console.log('\nTest 2: Malformed Characters');
const r2 = analyzePhoneNumber('hello-scam-123');
assert(r2.success === true && r2.validationStatus === 'MALFORMED', 'Detects malformed letters');
assert(r2.riskScore >= 60, 'Assigns high risk score to malformed input');

// 3. Impossibly Short Number
console.log('\nTest 3: Impossibly Short Digits');
const r3 = analyzePhoneNumber('+91 98');
assert(r3.success === true && (r3.validationStatus === 'MALFORMED' || r3.validationStatus === 'INVALID_FORMAT'), 'Detects too short number');

// 4. Standard Valid Indian Mobile (+91)
console.log('\nTest 4: Standard Valid Indian Mobile');
const r4 = analyzePhoneNumber('9876543210');
assert(r4.success === true, 'Successfully analyzes Indian 10-digit number');
assert(r4.normalized.e164 === '+919876543210', 'Correctly normalizes to +919876543210');
assert(r4.normalized.countryCode === 'IN', 'Identifies country as IN');
assert(r4.lineType === 'MOBILE', 'Identifies line type as MOBILE');
assert(r4.validationStatus === 'VALID', 'Validation status is VALID');
assert(r4.assessmentStatus === 'insufficient_evidence', 'Flags insufficient_evidence for clean number');

// 5. TRAI 140 Telemarketing Series
console.log('\nTest 5: TRAI 140 Telemarketing Series');
const r5 = analyzePhoneNumber('1409876543');
assert(r5.success === true, 'Successfully analyzes TRAI 140 number');
assert(r5.signals.some(s => s.id === 'TRAI_140_TELEMARKETING'), 'Identifies TRAI 140 Telemarketing signal');
assert(r5.riskScore >= 20, 'Increases risk score for telemarketing channel');

// 6. Valid International Number (US)
console.log('\nTest 6: Valid International Number (US)');
const r6 = analyzePhoneNumber('+1 415 555 2671');
assert(r6.success === true, 'Successfully parses international number');
assert(r6.normalized.countryCode === 'US', 'Identifies country as US');
assert(r6.signals.some(s => s.id === 'INTERNATIONAL_CALLER_CODE'), 'Adds International Caller warning signal');

// 7. Invalid/Unsupported Country Calling Code
console.log('\nTest 7: Invalid Country Code');
const r7 = analyzePhoneNumber('+999 12345678');
assert(r7.success === true && r7.validationStatus === 'INVALID_FORMAT', 'Flags unallocated international code');

// 8. Toll-free Number (1800)
console.log('\nTest 8: Indian Toll-Free Number (1800)');
const r8 = analyzePhoneNumber('1800111222');
assert(r8.success === true, 'Parses Indian 1800 number');
assert(r8.lineType === 'TOLL_FREE', 'Identifies TOLL_FREE line type');
assert(r8.signals.some(s => s.id === 'TOLL_FREE_NUMBER'), 'Emits TOLL_FREE informational signal');

console.log('\n====================================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('====================================================');

if (failed > 0) process.exit(1);
