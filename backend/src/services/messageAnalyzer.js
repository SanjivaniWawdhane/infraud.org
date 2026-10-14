/**
 * Message Analyzer Service
 * 
 * Provides transparent, explainable heuristic analysis and threat pattern detection
 * for suspicious SMS, WhatsApp forwards, email bodies, and text messages.
 * 
 * Core Detection Categories:
 * 1. Credential & OTP/PIN Harvesting (Critical Risk)
 * 2. Urgent Threats & Coercion (Electricity cuts, Account blocks, Police/Arrest warrants)
 * 3. Fake Prizes, Lotteries & Task/Job Fraud (KBC, YouTube like, Part-time Telegram)
 * 4. Fake KYC & Deactivation Warnings (PAN update, YONO rewards, APK downloads)
 * 5. Embedded Identifier Extraction & Analysis (URLs, Phone numbers, UPI handles)
 * 
 * Contextual Principles:
 * - Benign everyday communication is NOT penalized simply for containing words like "bank" or "account".
 * - Clean messages with no suspicious indicators return 'insufficient_evidence' (Low Risk).
 * - Never fetches or visits extracted URLs over the network.
 * - Does NOT store message content or query logs to disk.
 */

const { analyzeUrl } = require('./urlAnalyzer');
const { analyzePhoneNumber } = require('./phoneAnalyzer');

/**
 * Validates and sanitizes message input string.
 * @param {string} rawInput 
 * @returns {{ valid: boolean, sanitized?: string, error?: string, statusCode?: number }}
 */
function validateMessageInput(rawInput) {
  if (rawInput === undefined || rawInput === null) {
    return {
      valid: false,
      error: 'Missing message content in request body. Expected: { "message": "..." }',
      statusCode: 400
    };
  }

  if (typeof rawInput !== 'string') {
    return {
      valid: false,
      error: 'Message content must be a valid text string.',
      statusCode: 400
    };
  }

  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: 'A non-empty message string is required.',
      statusCode: 400
    };
  }

  // Reject excessively long inputs to prevent DoS (max 2,000 characters for an SMS/message payload)
  if (trimmed.length > 2000) {
    return {
      valid: false,
      error: 'Message exceeds the maximum allowed length of 2,000 characters.',
      statusCode: 413
    };
  }

  return {
    valid: true,
    sanitized: trimmed
  };
}

/**
 * Safely extracts embedded URLs from raw text without visiting them.
 * @param {string} text 
 * @returns {string[]} Array of unique extracted URLs
 */
function extractUrls(text) {
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+|(?:[a-zA-Z0-9-]+\.)+(?:com|in|org|net|xyz|top|live|online|site|biz|link|vip|icu|app|tk|ml|ga|cf|gq|ly|io|me|co|gd)(?:\/[^\s<>"'{}|\\^`]*)?/gi;
  const matches = text.match(urlRegex) || [];
  const uniqueUrls = [];
  
  for (const match of matches) {
    let clean = match.replace(/[.,;:!?)]+$/, ''); // Strip trailing punctuation
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    if (!uniqueUrls.includes(clean)) {
      uniqueUrls.push(clean);
    }
  }

  return uniqueUrls;
}

/**
 * Safely extracts potential Indian/international phone numbers from raw text.
 * @param {string} text 
 * @returns {string[]}
 */
function extractPhoneNumbers(text) {
  const phoneRegex = /(?:\+?91[\s-]?)?[6-9]\d{9}|140\d{7}|1800[\s-]?\d{6,7}/g;
  const matches = text.match(phoneRegex) || [];
  const unique = [];

  for (const m of matches) {
    const clean = m.trim();
    if (!unique.includes(clean)) {
      unique.push(clean);
    }
  }

  return unique;
}

/**
 * Safely extracts potential UPI handles from raw text.
 * @param {string} text 
 * @returns {string[]}
 */
function extractUpiHandles(text) {
  const upiRegex = /[a-zA-Z0-9.\-_]{2,64}@(okhdfcbank|okaxis|oksbi|okicici|paytm|ybl|ibl|axl|apl|fbl|barodampay|upi|idfcbank|freecharge|airtel|postbank|indus|kotak|dbs|citi|unionbank|federal|canarabank|centralbank|pnb)/gi;
  const matches = text.match(upiRegex) || [];
  return [...new Set(matches.map(m => m.toLowerCase()))];
}

/**
 * Analyzes a text message for scam, manipulation, urgency, and credential-theft signals.
 * @param {string} rawMessage - Plain text message from user
 * @returns {object} Explainable evaluation result
 */
function analyzeMessage(rawMessage) {
  const validation = validateMessageInput(rawMessage);
  if (!validation.valid) {
    return {
      success: false,
      statusCode: validation.statusCode,
      error: validation.error
    };
  }

  const message = validation.sanitized;
  const lowerMsg = message.toLowerCase();
  const signals = [];
  const recommendations = [];
  let rawScore = 0;

  // 1. Extract Embedded Indicators
  const extractedUrls = extractUrls(message);
  const extractedPhones = extractPhoneNumbers(message);
  const extractedUpis = extractUpiHandles(message);

  // ----------------------------------------------------
  // Category 1: Credential, OTP, and PIN Theft Requests
  // ----------------------------------------------------
  const credentialHarvestingPatterns = [
    { regex: /(?:share|send|enter|give|provide|forward|verify).{0,35}(?:otp|one\s*time\s*password|pin|upi\s*pin|mpin|cvv|password|secret\s*code)/i, title: 'Direct Request for OTP, PIN, or Password' },
    { regex: /(?:enter|type).{0,25}(?:upi\s*pin|mpin).{0,25}(?:receive|claim|accept|credit)/i, title: 'PIN-to-Receive Money Fraud Pattern' },
    { regex: /(?:anydesk|teamviewer|rustdesk|quicksupport)/i, title: 'Remote Access Tool Installation Coercion' }
  ];

  for (const item of credentialHarvestingPatterns) {
    if (item.regex.test(lowerMsg)) {
      signals.push({
        id: 'CREDENTIAL_THEFT_REQUEST',
        title: item.title,
        description: 'The message instructs or coaxes the recipient to share or enter confidential authentication credentials (OTP, UPI PIN, CVV, or remote screen-sharing tools). Legitimate institutions will NEVER request secret credentials.',
        severity: 'critical',
        weight: 50
      });
      rawScore += 50;
      recommendations.push('NEVER share OTPs, PINs, or CVVs. Legitimate bank staff, police, and customer support representatives never ask for these details.');
      break; // Avoid double counting
    }
  }

  // ----------------------------------------------------
  // Category 2: Urgency, Panic & Coercion Indicators
  // ----------------------------------------------------
  const electricityThreat = /(?:electricity|power|bijli|mseb|bses|dhbvn|tneb).{0,50}(?:disconnect|cut|suspend|unpaid|bill\s+due|contact\s+(?:officer|at))|(?:dear\s+(?:consumer|customer).{0,35}electricity)|(वीज\s+बिल\s+भरले\s+नाही|बिजली\s+कट|बिजली\s+बिल)/i.test(lowerMsg);
  const accountBlockThreat = /(?:account|sim|card|services?)\s+(?:will\s+be|has\s+been)\s+(?:blocked|suspended|deactivated|frozen|terminated)\s+(?:within|today|immediately|in\s+\d+\s+hours?)|(खाते\s+ब्लॉक|अकाउंट\s+ब्लॉक)/i.test(lowerMsg);
  const authorityThreat = /(?:arrest\s*warrant|cbi\s*officer|police\s*department|customs\s*officer|illegal\s*(?:parcel|courier|drugs)|narcotics|digital\s*arrest)/i.test(lowerMsg);

  if (electricityThreat) {
    signals.push({
      id: 'ELECTRICITY_DISCONNECTION_THREAT',
      title: 'Electricity Disconnection Scam Pattern',
      description: 'Matches the widespread utility scam pattern claiming electricity/power will be disconnected tonight. Power distribution companies follow formal billing notices and never send arbitrary disconnection SMS warnings with personal mobile contact numbers.',
      severity: 'high',
      weight: 40
    });
    rawScore += 40;
    recommendations.push('Do NOT call phone numbers provided in disconnection SMS messages. Verify your electricity bill directly on your official state discom portal or consumer app.');
  } else if (accountBlockThreat) {
    signals.push({
      id: 'ACCOUNT_SUSPENSION_URGENCY',
      title: 'Fabricated Account Suspension Urgency',
      description: 'Creates artificial panic claiming an account or SIM card will be deactivated immediately unless action is taken. Scammers use urgency to bypass critical thinking.',
      severity: 'high',
      weight: 35
    });
    rawScore += 35;
    recommendations.push('Do NOT click links in account suspension warnings. Contact your bank or service provider through the official helpline printed on your physical card or official website.');
  }

  if (authorityThreat) {
    signals.push({
      id: 'AUTHORITY_COERCION_IMPERSONATION',
      title: 'Law Enforcement / Digital Arrest Coercion',
      description: 'Impersonates Police, Customs, CBI, or courier services threatening legal prosecution, intercepted parcels, or narcotics charges. There is no legal procedure known as "digital arrest" via phone or video call in India.',
      severity: 'critical',
      weight: 50
    });
    rawScore += 50;
    recommendations.push('Immediately disconnect and report calls or messages claiming your Aadhaar or phone is implicated in courier/drug cases to the National Cyber Crime Helpline at 1930.');
  }

  // ----------------------------------------------------
  // Category 3: Fake Prizes, Lotteries & Task/Job Fraud
  // ----------------------------------------------------
  const lotteryPrizePattern = /(?:won|winner|winning|congratulations|selected\s+for|lucky\s+draw)\s+(?:a\s+prize|₹?\s*\d+\s*(?:lakh|crore|thousand|usd|\$)|kbc\s*(?:lottery|prize)|gift\s*card|reward\s*points)/i.test(lowerMsg);
  const taskJobPattern = /(?:earn|daily\s*income|work\s*from\s*home|part\s*time\s*job)\s+(?:₹?\s*\d+[-–]\d+|\d+k|\d+\s*(?:per\s*day|\/day|\/hour))\s+(?:like\s*youtube|subscribe\s*videos?|telegram\s*tasks?|rating\s*hotels?|crypto\s*task)/i.test(lowerMsg);

  if (lotteryPrizePattern) {
    signals.push({
      id: 'LOTTERY_PRIZE_SCAM',
      title: 'Unrealistic Prize or Lottery Claim',
      description: 'Promises large cash rewards, lottery windfalls (e.g. KBC), or valuable prizes that the recipient never enrolled in. These invariably request an upfront "processing fee" or "tax transfer".',
      severity: 'high',
      weight: 35
    });
    rawScore += 35;
    recommendations.push('You cannot win a lottery or prize you never entered. Never pay any "processing fee", "GST", or "registration charge" to claim an unsolicited prize.');
  }

  if (taskJobPattern) {
    signals.push({
      id: 'TASK_JOB_SCAM',
      title: 'Task-Based Work-From-Home Scam',
      description: 'Matches the funnel of task-based scams promising high daily pay for liking videos, rating hotels, or completing Telegram tasks. Victims are lured with small initial payouts before being asked for large deposit transfers.',
      severity: 'high',
      weight: 40
    });
    rawScore += 40;
    recommendations.push('Legitimate corporations do not hire anonymous workers via WhatsApp or Telegram to "like videos" for thousands of rupees per day.');
  }

  // ----------------------------------------------------
  // Category 4: Fake KYC & Bank Reward Points Expiry
  // ----------------------------------------------------
  const kycDeactivationPattern = /(?:update|complete|verify).{0,35}(?:kyc|pan\s*(?:card)?|aadhaar|bank\s*account|profile)|(sbi\s*reward\s*points?|hdfc\s*points?|icici\s*points?)\s+(?:expire|worth|redeem)/i.test(lowerMsg);
  const apkDownloadPattern = /\.apk\b|\bdownload\s+(?:app|file|update)\s+from/i.test(lowerMsg);

  if (kycDeactivationPattern) {
    signals.push({
      id: 'FAKE_KYC_UPDATE_ALERT',
      title: 'Phishing KYC / Reward Points Lure',
      description: 'Claims your bank KYC is pending or valuable reward points are expiring today. Directs recipients to credential-harvesting phishing forms.',
      severity: 'high',
      weight: 35
    });
    rawScore += 35;
    recommendations.push('Banks never ask customers to update KYC via third-party web links or WhatsApp messages. Visit your local bank branch or use the verified official net-banking app.');
  }

  if (apkDownloadPattern) {
    signals.push({
      id: 'SUSPICIOUS_APK_PAYLOAD',
      title: 'Unverified APK / Sideloading Lure',
      description: 'Encourages the recipient to download or install an Android Application Package (.apk) file outside the official Google Play Store. Highly correlated with financial banking trojans and SMS-stealing malware.',
      severity: 'critical',
      weight: 45
    });
    rawScore += 45;
    recommendations.push('NEVER install .apk files received via SMS, WhatsApp, or third-party links. Malicious apps can silently intercept your banking OTPs.');
  }

  // ----------------------------------------------------
  // Category 5: Embedded Link Heuristic Evaluation
  // ----------------------------------------------------
  let embeddedUrlResult = null;
  if (extractedUrls.length > 0) {
    // Analyze the primary embedded link using the existing urlAnalyzer service
    const primaryUrl = extractedUrls[0];
    embeddedUrlResult = analyzeUrl(primaryUrl);

    if (embeddedUrlResult && embeddedUrlResult.success) {
      if (embeddedUrlResult.riskScore >= 45) {
        signals.push({
          id: 'SUSPICIOUS_EMBEDDED_LINK',
          title: `Suspicious Embedded Link (${embeddedUrlResult.riskLevel.toUpperCase()})`,
          description: `The message embeds link '${primaryUrl}' which exhibits significant phishing or infrastructure risk anomalies: ${embeddedUrlResult.signals.map(s => s.title).slice(0, 2).join('; ')}.`,
          severity: 'high',
          weight: Math.round(embeddedUrlResult.riskScore * 0.5)
        });
        rawScore += Math.round(embeddedUrlResult.riskScore * 0.5);
      } else {
        signals.push({
          id: 'EMBEDDED_LINK_DETECTED',
          title: 'Embedded Web Link Present',
          description: `Message contains an external link: ${primaryUrl}. Always confirm the destination domain before tapping.`,
          severity: 'low',
          weight: 10
        });
        rawScore += 10;
      }
    }
  }

  // ----------------------------------------------------
  // Category 6: Baseline for Normal / Benign Messages
  // ----------------------------------------------------
  if (signals.length === 0) {
    signals.push({
      id: 'NO_SUSPICIOUS_PATTERNS',
      title: 'No Common Scam Heuristics Detected',
      description: 'The message does not contain common phishing triggers, coercion language, fake lottery claims, or OTP theft patterns.',
      severity: 'low',
      weight: 0
    });
    rawScore = 10; // Baseline low risk
    recommendations.push('No obvious scam keywords were detected in this message. However, always verify caller and sender identity before sharing information.');
  }

  // ----------------------------------------------------
  // Scoring & Risk Level Computation
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

  const assessmentStatus = signals.length === 1 && signals[0].id === 'NO_SUSPICIOUS_PATTERNS'
    ? 'insufficient_evidence'
    : 'heuristic_signals_detected';

  return {
    success: true,
    target: message,
    assessmentStatus,
    riskScore,
    riskLevel,
    signalsCount: signals.length,
    signals,
    embeddedUrls: extractedUrls,
    embeddedPhones: extractedPhones,
    embeddedUpis: extractedUpis,
    extractedIndicators: {
      urls: extractedUrls,
      phones: extractedPhones,
      upis: extractedUpis,
      embeddedUrlAnalysis: embeddedUrlResult
    },
    metadata: {
      charCount: message.length,
      wordCount: message.trim().split(/\s+/).filter(Boolean).length
    },
    recommendations,
    disclaimer: 'This evaluation is strictly based on heuristic text pattern analysis and structural signal detection. It does not replace professional law enforcement investigation or guarantee total safety.'
  };
}

module.exports = {
  validateMessageInput,
  extractUrls,
  extractPhoneNumbers,
  extractUpiHandles,
  analyzeMessage
};
