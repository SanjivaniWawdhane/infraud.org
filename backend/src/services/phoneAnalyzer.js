/**
 * Phone Number Analyzer Service
 * 
 * Provides transparent, explainable heuristic analysis and numbering-plan validation
 * for submitted phone numbers using ITU-T E.164 and TRAI regulatory standards.
 * 
 * IMPORTANT CONSTRAINTS & SECURITY PRINCIPLES:
 * - Does NOT scrape government registries or bypass CAPTCHAs.
 * - Does NOT expose private personal information (PII) or caller names.
 * - Does NOT store phone numbers or query histories to persistent disk.
 * - Does NOT invent fake reputation metrics, carrier doxxing, or fabricated threat data.
 * - Distinguishes between 'VALID', 'POSSIBLE', and 'MALFORMED' numbering plans.
 * - Supports default Indian numbering plan (IN / +91) as well as international formats.
 * - Explicitly recognizes DoT/TRAI 140 (telemarketing) and 160 (transactional) series.
 * - Never claims format validation proves active SIM status, subscriber identity, or total safety.
 */

const { parsePhoneNumberFromString, isPossiblePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js/max');

// Native international region name resolver
let regionNames;
try {
  regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
} catch (e) {
  regionNames = { of: (code) => code };
}

/**
 * Validates and sanitizes phone input string.
 * @param {string} rawInput 
 * @returns {{ valid: boolean, sanitized?: string, error?: string, statusCode?: number }}
 */
function validatePhoneInput(rawInput) {
  if (rawInput === undefined || rawInput === null) {
    return {
      valid: false,
      error: 'Missing phone number in request body. Expected: { "phone": "+919876543210" }',
      statusCode: 400
    };
  }

  if (typeof rawInput !== 'string') {
    return {
      valid: false,
      error: 'Phone number must be a valid text string.',
      statusCode: 400
    };
  }

  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: 'A non-empty phone number string is required.',
      statusCode: 400
    };
  }

  // Reject absurdly long strings to prevent DoS
  if (trimmed.length > 50) {
    return {
      valid: false,
      error: 'Submitted phone number exceeds maximum allowed input length of 50 characters.',
      statusCode: 413
    };
  }

  return {
    valid: true,
    sanitized: trimmed
  };
}

/**
 * Checks if a normalized string belongs to the TRAI 140 or 160 series.
 * @param {string} nationalNumber - Digits without country code
 * @param {string} countryCode - ISO 2-letter country code (e.g. 'IN')
 */
function checkTraiSeries(nationalNumber, countryCode) {
  if (countryCode !== 'IN') return null;

  const digits = nationalNumber.replace(/\D/g, '');

  // 140 Series: DoT / TRAI Commercial Telemarketing Prefix (10 digits starting with 140)
  if (/^140\d{7}$/.test(digits)) {
    return {
      type: 'TRAI_140_TELEMARKETING',
      title: 'TRAI 140 Series (Commercial Telemarketing)',
      description: 'This number falls under the DoT/TRAI 140 series reserved strictly for commercial telemarketing and promotional communications. It should never be used for personal matters, bank security calls, or courier alerts.',
      severity: 'medium',
      weight: 25
    };
  }

  // 160 Series: TRAI 2024/2025 mandate for transactional/service calls by financial entities
  if (/^160[01]\d{6}$/.test(digits) || /^160\d{7}$/.test(digits)) {
    return {
      type: 'TRAI_160_TRANSACTIONAL',
      title: 'TRAI 160 Series (Official Transactional Service Call)',
      description: 'This number conforms to the DoT/TRAI 160 series designated for service and transactional voice communications from regulated financial and governmental entities (RBI, SEBI, IRDAI). Note: Legitimate representatives will never ask for your PIN, OTP, or password.',
      severity: 'low',
      weight: 5
    };
  }

  return null;
}

/**
 * Analyzes a phone number using strict telecom standards and transparent heuristics.
 * @param {string} rawPhone - Raw phone number string from client
 * @param {string} [defaultCountry='IN'] - Default country ISO code if not prefixed with '+'
 * @returns {object} Explainable evaluation result
 */
function analyzePhoneNumber(rawPhone, defaultCountry = 'IN') {
  const validation = validatePhoneInput(rawPhone);
  if (!validation.valid) {
    return {
      success: false,
      statusCode: validation.statusCode,
      error: validation.error
    };
  }

  const input = validation.sanitized;
  const signals = [];
  let rawScore = 0;

  // Basic sanity check: ensure input contains at least some digits
  const digitCount = (input.match(/\d/g) || []).length;
  const hasLetters = /[a-zA-Z]/.test(input);

  if (hasLetters || digitCount < 4) {
    signals.push({
      id: 'MALFORMED_INPUT_SYNTAX',
      title: 'Malformed Phone Number Syntax',
      description: 'The submitted input contains alphabetic characters or too few numeric digits to represent an operative telephone numbering plan.',
      severity: 'high',
      weight: 65
    });

    return {
      success: true,
      target: input,
      normalized: null,
      lineType: 'UNKNOWN',
      validationStatus: 'MALFORMED',
      assessmentStatus: 'heuristic_signals_detected',
      riskScore: 65,
      riskLevel: 'high',
      signalsCount: signals.length,
      signals,
      recommendations: [
        'Verify the digits and country code of the contact before replying or placing calls.',
        'Never return calls to garbled or automated international caller IDs.'
      ],
      disclaimer: 'This evaluation verifies telephone numbering plan syntax and regulatory prefixes only. It does not verify live subscriber identity, SIM registration, or complete safety.'
    };
  }

  // Attempt parsing via libphonenumber-js with full metadata
  let parsed = null;
  try {
    parsed = parsePhoneNumberFromString(input, defaultCountry.toUpperCase());
  } catch (e) {
    // Parsing error handled below
  }

  // Handle case where library completely failed to parse
  if (!parsed) {
    signals.push({
      id: 'INVALID_NUMBERING_STRUCTURE',
      title: 'Unrecognized International Prefix or Plan',
      description: 'The number structure does not match any recognized national numbering plan or ITU-T E.164 allocation.',
      severity: 'medium',
      weight: 45
    });

    return {
      success: true,
      target: input,
      normalized: null,
      lineType: 'UNKNOWN',
      validationStatus: 'INVALID_FORMAT',
      assessmentStatus: 'heuristic_signals_detected',
      riskScore: 45,
      riskLevel: 'medium',
      signalsCount: signals.length,
      signals,
      recommendations: [
        'Check that the country code (+91 for India, +1 for US/Canada, etc.) was entered correctly.',
        'Beware of fraudulent missed calls originating from unknown numbering formats.'
      ],
      disclaimer: 'This evaluation verifies telephone numbering plan syntax and regulatory prefixes only. It does not verify live subscriber identity, SIM registration, or complete safety.'
    };
  }

  const isValid = parsed.isValid();
  const isPossible = parsed.isPossible();
  const country = parsed.country || defaultCountry.toUpperCase();
  const countryName = regionNames.of(country) || country;
  const callingCode = '+' + parsed.countryCallingCode;
  const nationalDigits = parsed.nationalNumber;
  const type = parsed.getType() || 'UNKNOWN';

  // ----------------------------------------------------
  // Heuristic 1: TRAI Special Regulatory Series (India)
  // ----------------------------------------------------
  const traiSignal = checkTraiSeries(nationalDigits, country);
  if (traiSignal) {
    signals.push({
      id: traiSignal.type,
      title: traiSignal.title,
      description: traiSignal.description,
      severity: traiSignal.severity,
      weight: traiSignal.weight
    });
    rawScore += traiSignal.weight;
  }

  // ----------------------------------------------------
  // Heuristic 2: Line Type Classification
  // ----------------------------------------------------
  if (type === 'PREMIUM_RATE') {
    signals.push({
      id: 'PREMIUM_RATE_SERVICE',
      title: 'Premium-Rate Calling Service',
      description: 'This is a premium-rate number (such as 1900 service). Calls or SMS to this number may incur exorbitant per-minute charges. Frequently abused in job scams, lottery schemes, and missed-call toll traps (Wangiri).',
      severity: 'high',
      weight: 40
    });
    rawScore += 40;
  } else if (type === 'TOLL_FREE') {
    signals.push({
      id: 'TOLL_FREE_NUMBER',
      title: 'Toll-Free Telecommunications Line',
      description: 'This is a toll-free customer assistance line (e.g. 1800 series). Scammers frequently post fake toll-free helpline numbers on Google Maps and social media to impersonate banks, airlines, and courier services. Verify against the official corporate website.',
      severity: 'low',
      weight: 5
    });
    rawScore += 5;
  } else if (type === 'VOIP') {
    signals.push({
      id: 'VOIP_VIRTUAL_NUMBER',
      title: 'Voice-over-IP (VoIP) Virtual Number',
      description: 'Identified as a virtual VoIP or cloud telephony line. While widely used by legitimate businesses, VoIP numbers can be procured remotely without physical SIM verification and are commonly used in impersonation scams.',
      severity: 'medium',
      weight: 25
    });
    rawScore += 25;
  }

  // ----------------------------------------------------
  // Heuristic 3: Validity vs Possibility Check
  // ----------------------------------------------------
  let validationStatus = 'INVALID_FORMAT';
  if (isValid) {
    validationStatus = 'VALID';
  } else if (isPossible) {
    validationStatus = 'POSSIBLE';
    signals.push({
      id: 'UNASSIGNED_OPERATOR_BLOCK',
      title: 'Possible Length but Unallocated Block',
      description: 'The number has the expected digit length for this region, but does not conform to an active operator numbering allocation. May represent spoofed or unassigned telecom infrastructure.',
      severity: 'medium',
      weight: 30
    });
    rawScore += 30;
  } else {
    validationStatus = 'INVALID_FORMAT';
    signals.push({
      id: 'IRREGULAR_DIGIT_LENGTH',
      title: 'Irregular National Numbering Length',
      description: 'The number digit count is invalid for this national numbering plan according to ITU-T standards.',
      severity: 'medium',
      weight: 35
    });
    rawScore += 35;
  }

  // ----------------------------------------------------
  // Heuristic 4: International Caller Context for Indian Users
  // ----------------------------------------------------
  if (country !== 'IN') {
    signals.push({
      id: 'INTERNATIONAL_CALLER_CODE',
      title: `International Origin (${countryName} / ${callingCode})`,
      description: `This number originates from ${countryName} (${callingCode}). If you received an unsolicited call claiming to be Indian Police, Customs, FedEx, or Indian Bank Security from an international code, it is almost certainly a spoofed impersonation attempt.`,
      severity: 'medium',
      weight: 20
    });
    rawScore += 20;
  }

  // ----------------------------------------------------
  // Baseline Signal for Clean Valid Standard Mobile/Landline
  // ----------------------------------------------------
  if (isValid && signals.length === 0) {
    signals.push({
      id: 'VALID_TELECOM_PLAN',
      title: 'Standard Telecom Numbering Plan',
      description: `Complies with ITU-T and national telecommunications numbering plans for ${countryName}. Assigned to ${type === 'FIXED_LINE' ? 'fixed-line (landline)' : 'mobile cellular'} block.`,
      severity: 'low',
      weight: 0
    });
    rawScore = 15; // Clean baseline
  }

  // Calculate final bounded risk score (0 to 100)
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

  // Determine assessment status
  let assessmentStatus;
  if (isValid && (signals.length === 1 && signals[0].id === 'VALID_TELECOM_PLAN')) {
    assessmentStatus = 'insufficient_evidence';
  } else {
    assessmentStatus = 'heuristic_signals_detected';
  }

  // ----------------------------------------------------
  // Actionable & Contextual Recommendations
  // ----------------------------------------------------
  const recommendations = [];

  recommendations.push('Never share OTPs, UPI PINs, net-banking credentials, or debit/credit card CVVs with any caller.');
  recommendations.push('Government officers, Police, and RBI officials will never call demanding immediate funds transfers or Skype/WhatsApp video interrogations.');

  if (traiSignal && traiSignal.type === 'TRAI_140_TELEMARKETING') {
    recommendations.push('This is a promotional telemarketing channel. You can report unsolicited commercial calls via the TRAI DND (Do Not Disturb) 1909 helpline.');
  }

  if (country !== 'IN') {
    recommendations.push('Exercise caution with unsolicited international incoming calls or job offers via WhatsApp from unknown overseas area codes.');
  }

  if (type === 'TOLL_FREE') {
    recommendations.push('Always cross-verify customer support numbers from the company\'s official verified mobile app or website, never from search engine ads.');
  }

  return {
    success: true,
    target: input,
    normalized: {
      e164: parsed.format('E.164'),
      international: parsed.formatInternational(),
      national: parsed.formatNational(),
      rfc3966: parsed.getURI(),
      countryCode: country,
      callingCode: callingCode,
      countryName: countryName
    },
    lineType: type,
    validationStatus,
    assessmentStatus,
    riskScore,
    riskLevel,
    signalsCount: signals.length,
    signals,
    recommendations,
    disclaimer: 'This evaluation verifies telephone numbering plan syntax and regulatory prefixes only. It does not verify live subscriber identity, SIM registration, or complete safety. Never disclose financial credentials or OTPs.'
  };
}

module.exports = {
  validatePhoneInput,
  checkTraiSeries,
  analyzePhoneNumber
};
