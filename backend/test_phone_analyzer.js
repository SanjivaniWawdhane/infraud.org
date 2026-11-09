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
console.log('\nTest 4: Standard Valid Indian Mobile (Unverified Private Subscriber)');
const r4 = analyzePhoneNumber('9822123456');
assert(r4.success === true, 'Successfully analyzes Indian 10-digit number');
assert(r4.normalized.e164 === '+919822123456', 'Correctly normalizes to +919822123456');
assert(r4.normalized.countryCode === 'IN', 'Identifies country as IN');
assert(r4.lineType === 'MOBILE', 'Identifies line type as MOBILE');
assert(r4.validationStatus === 'VALID', 'Validation status is VALID');
assert(r4.riskScore === 25, 'Assigns baseline caution score (25%) for unverified private mobile');
assert(r4.signals.some(s => s.id === 'UNVERIFIED_PRIVATE_SUBSCRIBER'), 'Flags as UNVERIFIED_PRIVATE_SUBSCRIBER');

// 5. TRAI 140 Telemarketing Series
console.log('\nTest 5: TRAI 140 Telemarketing Series');
const r5 = analyzePhoneNumber('1409876543');
assert(r5.success === true, 'Successfully analyzes TRAI 140 number');
assert(r5.signals.some(s => s.id === 'TRAI_140_TELEMARKETING'), 'Identifies TRAI 140 Telemarketing signal');
assert(r5.riskScore === 60, 'Assigns 60% risk score for commercial telemarketing');

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
console.log('\nTest 8: Indian Toll-Free Number (1800) SBI Official');
const r8 = analyzePhoneNumber('1800112211');
assert(r8.success === true, 'Parses Indian 1800 number');
assert(r8.lineType === 'TOLL_FREE', 'Identifies TOLL_FREE line type');
assert(r8.signals.some(s => s.id === 'SBI_OFFICIAL_HELPLINE'), 'Identifies SBI Official Helpline');
assert(r8.riskScore === 5, 'Assigns verified low risk score (5%) for official helpline');

// 9. Digital Arrest Scam Sample
console.log('\nTest 9: Digital Arrest Extortion Scam');
const r9 = analyzePhoneNumber('+91 80102 37029');
assert(r9.success === true, 'Analyzes Digital Arrest scam sample');
assert(r9.riskScore >= 90, 'Assigns Critical threat score (>=90%) for Digital Arrest scam');
assert(r9.signals.some(s => s.id === 'DIGITAL_ARREST_EXTORTION' || s.id === 'COMMUNITY_REPORTED_SCAM'), 'Identifies Digital Arrest extortion signal');

// 10. FedEx Courier Scam Sample
console.log('\nTest 10: FedEx Contraband Parcel Scam');
const r10 = analyzePhoneNumber('+91 98765 43210');
assert(r10.success === true, 'Analyzes FedEx scam sample');
assert(r10.riskScore >= 90, 'Assigns Critical threat score (>=90%) for FedEx scam');
assert(r10.signals.some(s => s.id === 'FEDEX_SEIZURE_SCAM'), 'Identifies FedEx scam signal');

// 11. Electricity Due Scam Sample
console.log('\nTest 11: Electricity Bill Disconnection Scam');
const r11 = analyzePhoneNumber('+91 70001 23456');
assert(r11.success === true, 'Analyzes Electricity Due scam sample');
assert(r11.riskScore >= 85, 'Assigns Critical threat score (>=85%) for Electricity scam');
assert(r11.signals.some(s => s.id === 'ELECTRICITY_BILL_SCAM'), 'Identifies Electricity bill scam signal');

console.log('\n====================================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('====================================================');

if (failed > 0) process.exit(1);
