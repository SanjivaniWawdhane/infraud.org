/**
 * Automated Test Suite for Message Analyzer Service
 */

const { analyzeMessage, validateMessageInput, extractUrls } = require('./src/services/messageAnalyzer');

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
console.log('🧪 Starting Message Analyzer Automated Test Suite');
console.log('====================================================\n');

// 1. Empty & Null Inputs
console.log('Test 1: Empty and Null Inputs');
const r1 = analyzeMessage('');
assert(r1.success === false && r1.statusCode === 400, 'Rejects empty message with 400');
const r1b = analyzeMessage(null);
assert(r1b.success === false && r1b.statusCode === 400, 'Rejects null input with 400');

// 2. Excessively Long Input (>2000 characters)
console.log('\nTest 2: Excessively Long Input');
const longText = 'A'.repeat(2005);
const r2 = analyzeMessage(longText);
assert(r2.success === false && r2.statusCode === 413, 'Rejects text > 2000 chars with 413');

// 3. Normal Everyday Benign Message
console.log('\nTest 3: Normal Everyday Benign Message');
const benignMsg = "Hey, let's meet at the coffee shop near the bank branch tomorrow at 10 AM.";
const r3 = analyzeMessage(benignMsg);
assert(r3.success === true, 'Successfully analyzes benign message');
assert(r3.riskLevel === 'low', 'Classifies everyday message as low risk');
assert(r3.assessmentStatus === 'insufficient_evidence', 'Sets assessmentStatus to insufficient_evidence');
assert(r3.signals.some(s => s.id === 'NO_SUSPICIOUS_PATTERNS'), 'Emits NO_SUSPICIOUS_PATTERNS signal');

// 4. Credential / OTP Theft
console.log('\nTest 4: Credential & OTP Theft Request');
const otpMsg = "Dear customer, your SBI NetBanking needs urgent verification. Share your 6-digit OTP to continue.";
const r4 = analyzeMessage(otpMsg);
assert(r4.success === true, 'Analyzes OTP theft message');
assert(r4.signals.some(s => s.id === 'CREDENTIAL_THEFT_REQUEST'), 'Detects CREDENTIAL_THEFT_REQUEST');
assert(r4.riskScore >= 50, 'Assigns high/critical risk score to OTP theft');

// 5. Electricity Disconnection Urgent Threat
console.log('\nTest 5: Electricity Disconnection Scam');
const elecMsg = "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because previous bill was not updated. Call officer 9876543210 immediately.";
const r5 = analyzeMessage(elecMsg);
assert(r5.success === true, 'Analyzes electricity threat');
assert(r5.signals.some(s => s.id === 'ELECTRICITY_DISCONNECTION_THREAT'), 'Detects ELECTRICITY_DISCONNECTION_THREAT');
assert(r5.extractedIndicators.phones.length > 0, 'Extracts phone number from message');

// 6. Fake Prize / KBC Lottery Claim
console.log('\nTest 6: Fake Prize / Lottery Scam');
const prizeMsg = "Congratulations! You have won a prize of Rs 25 Lakh in KBC Lucky Draw 2026. Contact manager.";
const r6 = analyzeMessage(prizeMsg);
assert(r6.success === true, 'Analyzes prize scam');
assert(r6.signals.some(s => s.id === 'LOTTERY_PRIZE_SCAM'), 'Detects LOTTERY_PRIZE_SCAM');

// 7. KYC Update with Embedded Suspicious Link
console.log('\nTest 7: KYC Update with Embedded URL');
const kycMsg = "Your bank account will be blocked today. Update your PAN card KYC immediately at http://sbi-secure-kyc-update.xyz/login";
const r7 = analyzeMessage(kycMsg);
assert(r7.success === true, 'Analyzes KYC phishing message');
assert(r7.signals.some(s => s.id === 'FAKE_KYC_UPDATE_ALERT' || s.id === 'ACCOUNT_SUSPENSION_URGENCY'), 'Detects KYC / suspension threat');
assert(r7.extractedIndicators.urls.length > 0, 'Extracts embedded URL');
assert(r7.signals.some(s => s.id === 'SUSPICIOUS_EMBEDDED_LINK'), 'Analyzes embedded link heuristics');
assert(r7.riskLevel === 'critical', 'Assigns critical risk level to composite phishing attack');

// 8. Multilingual / Marathi Text
console.log('\nTest 8: Multilingual / Marathi Text');
const marathiMsg = "तुमचे वीज बिल भरले नाही, आज रात्री वीज कापली जाईल. संपर्क साधा.";
const r8 = analyzeMessage(marathiMsg);
assert(r8.success === true, 'Handles Marathi Unicode text gracefully');
assert(r8.signals.some(s => s.id === 'ELECTRICITY_DISCONNECTION_THREAT'), 'Detects Marathi electricity disconnection threat');

// 9. URL Extraction Unit Test
console.log('\nTest 9: URL Extraction Helper');
const sampleUrls = extractUrls("Visit https://example.com/test and also check bit.ly/promo today.");
assert(sampleUrls.length === 2, 'Extracts both URLs correctly');

console.log('\n====================================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('====================================================');

if (failed > 0) process.exit(1);
