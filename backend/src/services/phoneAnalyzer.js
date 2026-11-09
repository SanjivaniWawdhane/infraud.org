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

/**
 * Resolves Indian and international telecom service providers (TSPs)
 * based on DoT National Numbering Plan (NNP) and ITU-T standards.
 */
function resolveTelecomCarrier(digits, country = 'IN', countryName = 'India') {
  if (country !== 'IN') {
    if (country === 'US' || country === 'CA') {
      return { operator: 'North American Carrier', brand: 'AT&T / Verizon / T-Mobile', circle: 'North America', state: countryName };
    } else if (country === 'GB') {
      return { operator: 'UK Telecom Carrier', brand: 'Vodafone / EE / O2', circle: 'United Kingdom', state: countryName };
    } else if (country === 'AE') {
      return { operator: 'UAE Telecom Operator', brand: 'e& (Etisalat) / du', circle: 'United Arab Emirates', state: countryName };
    }
    return { operator: `${countryName} Telecom Operator`, brand: 'International Carrier', circle: countryName, state: countryName };
  }

  // Normalize Indian digits to 10 digits
  let d = String(digits || '').replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) {
    d = d.slice(2);
  } else if (d.startsWith('0') && d.length === 11) {
    d = d.slice(1);
  }

  if (d.length !== 10) {
    return { operator: 'Indian Telecom Provider', brand: 'GSM/LTE Carrier', circle: 'Domestic Circle', state: 'India' };
  }

  const p2 = d.slice(0, 2);
  const p3 = d.slice(0, 3);
  const p4 = d.slice(0, 4);

  // ── 1. BSNL & MTNL GOVT TELECOM ──
  if (p2 === '94') {
    let circle = 'Maharashtra & Goa Circle';
    if (['9403', '9404', '9405', '9420', '9421', '9422', '9423'].includes(p4)) circle = 'Maharashtra & Goa Circle';
    else if (['9410', '9411', '9412', '9450', '9451'].includes(p4)) circle = 'Uttar Pradesh Circle';
    else if (['9414', '9413'].includes(p4)) circle = 'Rajasthan Circle';
    else if (['9440', '9441'].includes(p4)) circle = 'Andhra Pradesh & Telangana';
    else if (['9443', '9444'].includes(p4)) circle = 'Tamil Nadu & Chennai';
    else if (['9445', '9446'].includes(p4)) circle = 'Kerala Circle';
    else if (['9448', '9449'].includes(p4)) circle = 'Karnataka Circle';
    return { operator: 'Bharat Sanchar Nigam Ltd (BSNL)', brand: 'BSNL Mobile', circle, state: 'National' };
  }
  if (['9868', '9968'].includes(p4)) {
    return { operator: 'Mahanagar Telephone Nigam Ltd (MTNL)', brand: 'MTNL Dolphin', circle: 'Delhi NCR Circle', state: 'Delhi' };
  }
  if (['9869', '9969'].includes(p4)) {
    return { operator: 'Mahanagar Telephone Nigam Ltd (MTNL)', brand: 'MTNL Dolphin', circle: 'Mumbai Circle', state: 'Maharashtra' };
  }

  // ── 2. RELIANCE JIO INFODOM ──
  // Jio 6-series (all 60, 62, 63 etc)
  if (d.startsWith('6')) {
    return { operator: 'Reliance Jio Infocomm Ltd', brand: 'Reliance Jio', circle: 'India 4G/5G Circle', state: 'India' };
  }
  // Jio 7-series (700-709, 720-739, 740-799)
  const jioPrefixes3 = [
    '700', '701', '702', '703', '704', '705', '706', '707', '708', '709',
    '720', '721', '722', '723', '724', '725', '726', '727', '728', '729',
    '730', '731', '732', '733', '734', '735', '736', '737', '738', '739',
    '740', '741', '742', '743', '744', '745', '746', '747', '748', '749',
    '750', '751', '752', '753', '754', '755', '756', '757', '758', '759',
    '760', '761', '762', '763', '764', '765', '766', '767', '768', '769',
    '770', '771', '772', '773', '774', '775', '776', '777', '778', '779',
    '780', '781', '782', '783', '784', '785', '786', '787', '788', '789',
    '790', '791', '792', '793', '794', '795', '796', '797', '798', '799',
    '800', '801', '805', '808', '809', '810', '812', '814', '816', '817',
    '820', '821', '822', '823', '824', '825', '826', '827', '828', '829',
    '830', '831', '832', '834', '835', '836', '837', '838', '839',
    '840', '841', '842', '843', '844', '845', '846', '847', '848', '849',
    '850', '851', '852', '853', '854', '855', '856', '857', '858', '859',
    '860', '861', '862', '863', '864', '865', '866', '867', '868', '869',
    '870', '871', '872', '873', '874', '875', '876', '877', '878', '879',
    '880', '881', '882', '883', '884', '885', '886', '887', '888', '889',
    '890', '891', '892', '893', '894', '895', '896', '897', '898', '899',
    '910', '912', '913', '914', '915', '916', '917', '918', '919',
    '920', '921', '922', '923', '924', '925', '926', '927', '928', '929',
    '930', '931', '932', '933', '934', '935', '936', '937', '938', '939'
  ];

  // Specific Vi (Vodafone Idea) 4-digit prefixes in Maharashtra & Pan-India
  const viPrefixes = [
    // Maharashtra & Goa Vi (Idea & Vodafone)
    '9822', '9823', '9860', '9921', '9922', '9960', '9970', '9975',
    '9762', '9763', '9764', '9765', '9011', '9028', '9049', '9096',
    '9503', '9527', '9545', '9561', '9604', '9623', '9637', '9657',
    '9665', '9689', '9730', '9158', '9175', '8888', '8600', '8408',
    '8007', '7798', '7774', '7709', '7385', '7387',
    // Mumbai Vi
    '9820', '9821', '9819', '9833', '9892', '9920', '9930', '9987',
    '9702', '9004', '9022', '9167', '8879', '8080', '7506',
    // Gujarat Vi
    '9824', '9825', '9898', '9909', '9924', '9925', '9974', '9978',
    '9979', '9712', '9724', '9725', '9726', '9727',
    // Delhi NCR Vi
    '9811', '9891', '9911', '9953', '9999', '9711', '9871', '9873',
    // Karnataka Vi
    '9845', '9886', '9901', '9986',
    // Andhra Vi
    '9848', '9885', '9948', '9966', '9700', '9000',
    // UP Vi
    '9839', '9838', '9935', '9936', '9415'
  ];

  // Specific Airtel 4-digit prefixes
  const airtelPrefixes = [
    // Maharashtra & Goa Airtel
    '9673', '9890', '9850', '9881', '9552', '9766', '9767', '9923',
    // Delhi NCR Airtel
    '9810', '9818', '9910', '9958', '9971', '9899', '9717', '9650', '9654',
    // Mumbai Airtel
    '9867', '9967', '9769', '9892',
    // Karnataka Airtel
    '9844', '9880', '9900', '9945', '9980', '9740', '9741', '9742',
    // Tamil Nadu & Chennai Airtel
    '9840', '9841', '9842', '9843', '9884', '9894', '9940', '9941', '9942', '9943', '9944', '9952',
    // Andhra Pradesh & Telangana Airtel
    '9849', '9949', '9951', '9959', '9985', '9989', '9701', '9703', '9704', '9705',
    // Kolkata & West Bengal Airtel
    '9830', '9831', '9832', '9836', '9874', '9903', '9932', '9933',
    // Gujarat Airtel
    '9879', '9898', '9904', '9925', '9979'
  ];

  // 1. Check Vi first if matches Vi prefixes
  if (viPrefixes.includes(p4)) {
    let circle = 'Maharashtra & Goa Circle';
    if (['9820', '9821', '9819', '9833', '9892', '9920', '9930', '9987', '9702', '9004', '9022', '9167', '8879', '8080', '7506'].includes(p4)) circle = 'Mumbai Circle';
    else if (['9811', '9891', '9911', '9953', '9999', '9711', '9871', '9873'].includes(p4)) circle = 'Delhi NCR Circle';
    else if (['9824', '9825', '9898', '9909', '9924', '9925', '9974', '9978', '9979', '9712', '9724', '9725', '9726', '9727'].includes(p4)) circle = 'Gujarat Circle';
    return { operator: 'Vodafone Idea Ltd (Vi)', brand: 'Vodafone Idea (Vi)', circle, state: 'India' };
  }

  // 2. Check Airtel if matches Airtel prefixes
  if (airtelPrefixes.includes(p4)) {
    let circle = 'Maharashtra & Goa Circle';
    if (['9810', '9818', '9910', '9958', '9971', '9899', '9717', '9650', '9654'].includes(p4)) circle = 'Delhi NCR Circle';
    else if (['9867', '9967', '9769'].includes(p4)) circle = 'Mumbai Circle';
    else if (['9844', '9880', '9900', '9945', '9980', '9740', '9741', '9742'].includes(p4)) circle = 'Karnataka Circle';
    else if (['9840', '9841', '9842', '9843', '9884', '9894', '9940', '9941', '9942', '9943', '9944', '9952'].includes(p4)) circle = 'Tamil Nadu & Chennai';
    else if (['9849', '9949', '9951', '9959', '9985', '9989', '9701', '9703', '9704', '9705'].includes(p4)) circle = 'Andhra Pradesh & Telangana';
    return { operator: 'Bharti Airtel Ltd', brand: 'Bharti Airtel', circle, state: 'India' };
  }

  // 3. Check Jio prefixes
  if (jioPrefixes3.includes(p3)) {
    return { operator: 'Reliance Jio Infocomm Ltd', brand: 'Reliance Jio', circle: 'India 4G/5G Circle', state: 'India' };
  }

  // 4. Clean fallback without hardcoded Airtel bias!
  if (['98', '99', '97', '96', '95', '91', '90', '88', '85', '81', '70'].includes(p2)) {
    return { operator: 'Indian Cellular Operator', brand: 'Cellular Mobile (GSM/LTE)', circle: 'India Domestic Circle', state: 'India' };
  }

  return { operator: 'Authorized Indian Telecom Provider', brand: 'Cellular Carrier', circle: 'Domestic Circle', state: 'India' };
}

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

    const carrierInfo = resolveTelecomCarrier(nationalDigits, country, countryName);

  return {
    success: true,
    target: input,
    carrier: carrierInfo,
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
