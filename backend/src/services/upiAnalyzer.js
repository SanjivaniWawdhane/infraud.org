/**
 * UPI ID Analyzer Service
 * 
 * Provides transparent, explainable heuristic analysis and syntax validation
 * for Indian Unified Payments Interface (UPI) Virtual Payment Addresses (VPAs).
 * 
 * IMPORTANT CONSTRAINTS & SECURITY PRINCIPLES:
 * - Does NOT request, collect, or store UPI PINs, OTPs, or passwords.
 * - Does NOT claim connection to bank internal switches or real-time account status.
 * - Does NOT declare any UPI ID "safe" merely due to absence of reports.
 * - Does NOT invent scores, user profiles, or artificial AI detections.
 * - Clearly separates syntax validity from fraud reputation.
 * - Produces deterministic risk scores from 0 to 100 based on explainable signals.
 */

const fs = require('fs');
const path = require('path');

// Common recognized NPCI PSP (Payment Service Provider) and bank handles
const RECOGNIZED_PSP_HANDLES = new Set([
  'okhdfcbank', 'okaxis', 'oksbi', 'okicici', 'paytm', 'ybl', 'ibl', 'axl', 'apl',
  'fbl', 'barodampay', 'upi', 'idfcbank', 'freecharge', 'airtel', 'postbank', 'indus',
  'kotak', 'dbs', 'citi', 'unionbank', 'federal', 'canarabank', 'centralbank', 'pnb',
  'aubank', 'yesbank', 'rbl', 'scb', 'hsbc', 'allbank', 'andb', 'bandhan', 'cbh',
  'corp', 'cosmos', 'denabank', 'equitas', 'iob', 'jsbp', 'kvb', 'mahb', 'obc',
  'psb', 'sib', 'syndicate', 'tjsb', 'uco', 'vijb', 'waaxis', 'wahdfc', 'waicici', 'wasbi'
]);

// High-risk social engineering keywords frequently used in imposter payment handles
const SOCIAL_ENGINEERING_KEYWORDS = [
  'refund', 'cashback', 'lottery', 'reward', 'bonus', 'prize',
  'kyc', 'support', 'helpline', 'customercare', 'customer-care', 'helpdesk',
  'cbi', 'police', 'customs', 'income-tax', 'incometax', 'telecom', 'trai',
  'fedex', 'courier', 'arrest', 'verification', 'unblock', 'fraud-cell'
];

// Major brands and financial institutions targeted in impersonation handles
const TARGETED_BRANDS = [
  'sbi', 'hdfc', 'icici', 'axis', 'pnb', 'bob', 'phonepe', 'paytm',
  'googlepay', 'gpay', 'amazon', 'flipkart', 'netflix', 'apple', 'microsoft',
  'airtel', 'jio', 'swiggy', 'zomato', 'olx', 'irctc'
];

/**
 * Validates the raw input string against structural NPCI UPI VPA rules.
 * @param {any} rawInput 
 * @returns {{ valid: boolean, error?: string, statusCode?: number, sanitized?: string, username?: string, psp?: string }}
 */
function validateUpiInput(rawInput) {
  if (rawInput === undefined || rawInput === null) {
    return {
      valid: false,
      error: 'Missing UPI ID in request. Expected a non-empty string.',
      statusCode: 400
    };
  }

  if (typeof rawInput !== 'string') {
    return {
      valid: false,
      error: 'Invalid input type. UPI ID must be a string.',
      statusCode: 400
    };
  }

  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: 'A valid, non-empty UPI ID is required.',
      statusCode: 400
    };
  }

  if (trimmed.length > 128) {
    return {
      valid: false,
      error: 'Submitted UPI ID exceeds the maximum allowed length of 128 characters.',
      statusCode: 413
    };
  }

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: 'Submitted UPI ID is too short to be a valid handle.',
      statusCode: 400
    };
  }

  // UPI IDs must contain exactly one '@' character separating handle and provider
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) {
    return {
      valid: false,
      error: 'Invalid UPI format: Missing "@" separator. Format must be username@bank (e.g., name@okhdfcbank).',
      statusCode: 400
    };
  }

  if (atCount > 1) {
    return {
      valid: false,
      error: 'Invalid UPI format: Contains multiple "@" separators. Only one "@" is permitted.',
      statusCode: 400
    };
  }

  const parts = trimmed.split('@');
  const username = parts[0];
  const psp = parts[1];

  // Username validation: 2 to 50 alphanumeric characters + allowable dot, hyphen, underscore
  if (!username || username.length < 2 || username.length > 50) {
    return {
      valid: false,
      error: `Invalid UPI handle username: Must be between 2 and 50 characters (current length: ${username.length}).`,
      statusCode: 400
    };
  }

  // Username syntax: must not start or end with punctuation, no consecutive dots
  const usernameRegex = /^[a-zA-Z0-9]+([.\-_][a-zA-Z0-9]+)*$/;
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: 'Invalid UPI handle username: Can only contain letters, numbers, dots, hyphens, and underscores. Cannot start or end with punctuation or contain consecutive dots.',
      statusCode: 400
    };
  }

  // PSP handle validation: 2 to 30 characters, alphanumeric with optional dot
  if (!psp || psp.length < 2 || psp.length > 30) {
    return {
      valid: false,
      error: `Invalid UPI PSP handle: Must be between 2 and 30 characters (current length: ${psp.length}).`,
      statusCode: 400
    };
  }

  const pspRegex = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/;
  if (!pspRegex.test(psp)) {
    return {
      valid: false,
      error: 'Invalid UPI PSP handle: Must contain only letters, numbers, or dots (e.g. okhdfcbank, paytm, ybl).',
      statusCode: 400
    };
  }

  return {
    valid: true,
    sanitized: trimmed.toLowerCase(),
    username: username.toLowerCase(),
    psp: psp.toLowerCase()
  };
}

/**
 * Searches local community reports database for existing complaints matching this UPI ID.
 * @param {string} normalizedUpi 
 * @param {Array<any>} [customReports] 
 * @returns {Array<any>}
 */
function findCommunityReports(normalizedUpi, customReports) {
  if (Array.isArray(customReports)) {
    return customReports.filter(r => 
      r.identifier && 
      r.identifier.toLowerCase().trim() === normalizedUpi && 
      r.status === 'approved'
    );
  }

  const candidateDirs = [
    path.resolve(__dirname, '../../frontend/data/reports.json'),
    path.resolve(__dirname, '../../data/reports.json'),
    path.resolve(__dirname, '../../../frontend/data/reports.json')
  ];

  for (const filePath of candidateDirs) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list.filter(r => 
            r.identifier && 
            r.identifier.toLowerCase().trim() === normalizedUpi && 
            r.status === 'approved'
          );
        }
      } catch (e) {
        // Continue fallback search
      }
    }
  }

  return [];
}

/**
 * Performs explainable, heuristic analysis on a UPI ID.
 * @param {string} rawInput 
 * @param {object} [options]
 * @param {Array<any>} [options.mockReports]
 * @returns {object}
 */
function analyzeUpi(rawInput, options = {}) {
  const validation = validateUpiInput(rawInput);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      statusCode: validation.statusCode || 400
    };
  }

  const { sanitized: normalizedUpi, username, psp } = validation;
  const signals = [];
  let rawScore = 0;

  // ----------------------------------------------------
  // Signal 1: Social Engineering Keywords in Username
  // ----------------------------------------------------
  const detectedKeywords = SOCIAL_ENGINEERING_KEYWORDS.filter(kw => username.includes(kw));
  if (detectedKeywords.length > 0) {
    const isMultiple = detectedKeywords.length > 1;
    signals.push({
      id: 'SOCIAL_ENGINEERING_HANDLE',
      title: 'High-Risk Deceptive Keywords in Handle',
      description: `The handle contains words frequently used in social engineering and phishing attacks: ${detectedKeywords.slice(0, 4).join(', ')}. Scammers commonly masquerade as refund or support channels.`,
      severity: isMultiple ? 'critical' : 'high',
      weight: isMultiple ? 45 : 35
    });
    rawScore += isMultiple ? 45 : 35;
  }

  // ----------------------------------------------------
  // Signal 2: Brand Impersonation on Third-Party PSP
  // ----------------------------------------------------
  const detectedBrands = TARGETED_BRANDS.filter(brand => username.includes(brand));
  if (detectedBrands.length > 0) {
    // If username includes brand name and also keywords or is not on official company domain
    const isImpersonating = detectedKeywords.length > 0 || (psp !== detectedBrands[0] && !psp.includes(detectedBrands[0]));
    if (isImpersonating) {
      signals.push({
        id: 'BRAND_IMPERSONATION_HANDLE',
        title: 'Suspected Brand / Institution Impersonation',
        description: `The handle username incorporates recognized institution name '${detectedBrands[0]}' on PSP handle '${psp}'. Legitimate enterprises do not collect customer payments through generic third-party VPAs.`,
        severity: 'high',
        weight: 35
      });
      rawScore += 35;
    }
  }

  // ----------------------------------------------------
  // Signal 3: Excessive Punctuation / Deceptive Formatting
  // ----------------------------------------------------
  const punctuationCount = (username.match(/[.\-_]/g) || []).length;
  if (punctuationCount >= 3) {
    signals.push({
      id: 'EXCESSIVE_PUNCTUATION',
      title: 'Irregular Punctuation in Handle',
      description: `The handle contains multiple separators (${punctuationCount} symbols). Scammers frequently use complex punctuation patterns to mimic official subdomains.`,
      severity: 'low',
      weight: 10
    });
    rawScore += 10;
  }

  // ----------------------------------------------------
  // Signal 4: Unrecognized PSP Handle
  // ----------------------------------------------------
  const isRecognizedPsp = RECOGNIZED_PSP_HANDLES.has(psp);
  if (!isRecognizedPsp) {
    signals.push({
      id: 'UNRECOGNIZED_PSP_HANDLE',
      title: 'Uncommon or Non-Standard Bank PSP',
      description: `The handle provider '@${psp}' is not in our verified registry of major NPCI banking PSPs. It may belong to a newly authorized bank, cooperative bank, or custom sub-merchant rail.`,
      severity: 'low',
      weight: 15
    });
    rawScore += 15;
  }

  // ----------------------------------------------------
  // Signal 5: Corroborated Community Reports
  // ----------------------------------------------------
  const matchedReports = findCommunityReports(normalizedUpi, options.mockReports);
  if (matchedReports.length > 0) {
    const count = matchedReports.length;
    signals.push({
      id: 'COMMUNITY_REPORTED_FRAUD',
      title: 'Prior Fraud Reports Found',
      description: `This exact UPI ID has ${count} confirmed report(s) in the community scam repository. Evidence indicates prior fraudulent activity.`,
      severity: 'critical',
      weight: 50
    });
    rawScore += 50;
  }

  // ----------------------------------------------------
  // Risk Score & Status Computation
  // ----------------------------------------------------
  const riskScore = Math.min(100, Math.max(0, rawScore));

  let riskLevel;
  if (riskScore >= 70) {
    riskLevel = 'critical';
  } else if (riskScore >= 45) {
    riskLevel = 'high';
  } else if (riskScore >= 20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  let assessmentStatus;
  if (matchedReports.length > 0) {
    assessmentStatus = 'reputation_signals_detected';
  } else if (signals.length > 0) {
    assessmentStatus = 'heuristic_signals_detected';
  } else {
    assessmentStatus = 'insufficient_evidence';
  }

  // ----------------------------------------------------
  // Actionable Safety Recommendations
  // ----------------------------------------------------
  const recommendations = [
    'Remember the Golden Rule: Entering your UPI PIN ALWAYS transfers money OUT of your bank account. You NEVER need to enter your PIN to receive money, refunds, or cashback.',
    'Always verify the registered legal beneficiary name displayed on your UPI app (Google Pay, PhonePe, Paytm, BHIM) before confirming any transfer.'
  ];

  if (detectedKeywords.length > 0 || detectedBrands.length > 0) {
    recommendations.push('Do NOT send payments to customer support, refund desks, or helpline handles found via Google searches or social media. Official institutions will never ask for transfers via personal handles.');
  }

  if (matchedReports.length > 0) {
    recommendations.push('High-risk warning: This recipient handle has been flagged in fraud reports. Cease communication immediately and report to the National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in).');
  }

  if (signals.length === 0) {
    recommendations.push('No obvious scam keywords or past community reports were found. However, exercise standard caution as new or freshly created payment handles cannot be certified safe by syntax alone.');
  }

  return {
    success: true,
    target: rawInput.trim(),
    normalizedUpiId: normalizedUpi,
    validationStatus: 'valid_syntax',
    assessmentStatus,
    handleDetails: {
      username,
      psp,
      isRecognizedPsp
    },
    riskScore,
    riskLevel,
    signalsCount: signals.length,
    signals,
    evidence: {
      communityReportsFound: matchedReports.length,
      reputationSourcesChecked: ['community_database']
    },
    recommendations,
    disclaimer: 'This evaluation is based strictly on transparent format heuristics and available fraud reports. A low score does not verify the identity of the account holder, nor does it guarantee transaction safety. Always independently confirm the recipient before sending funds.'
  };
}

module.exports = {
  validateUpiInput,
  analyzeUpi,
  RECOGNIZED_PSP_HANDLES,
  SOCIAL_ENGINEERING_KEYWORDS
};
