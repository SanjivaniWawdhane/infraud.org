/**
 * URL Analyzer Service
 * 
 * Provides transparent, explainable heuristic analysis for submitted URLs.
 * 
 * IMPORTANT CONSTRAINTS & SECURITY PRINCIPLES:
 * - Does NOT fetch or visit the submitted URL.
 * - Does NOT make network requests or follow redirects.
 * - Does NOT claim integration with real threat intelligence or external databases.
 * - Does NOT invent domain age, hosting details, or NLP threat findings.
 * - Produces deterministic risk scores from 0 to 100 based strictly on visible URL structure.
 * - Clearly disclaims that a score does not guarantee safety nor confirm fraud.
 */

// Curated list of high-abuse / low-barrier TLDs frequently abused in disposable phishing campaigns
const SUSPICIOUS_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', // Historical free ccTLDs
  'top', 'xyz', 'icu', 'buzz', 'club', 'work', 'rest', 'fit', 'surf', 'click', 'link', 'online', 'site'
]);

// Common phishing & credential-theft keywords
const PHISHING_KEYWORDS = [
  'login', 'signin', 'log-in', 'sign-in',
  'verify', 'verification', 'authenticate', 'auth',
  'secure', 'security', 'account', 'update',
  'kyc', 'refund', 'banking', 'wallet',
  'password', 'credential', 'support', 'helpdesk',
  'claim', 'reward', 'bonus', 'free-gift'
];

// Brand names commonly targeted by homograph or subdomain impersonation
const TARGETED_BRANDS = [
  'paypal', 'amazon', 'netflix', 'apple', 'microsoft',
  'google', 'facebook', 'instagram', 'whatsapp', 'telegram',
  'paytm', 'phonepe', 'sbi', 'hdfc', 'icici', 'axisbank'
];

/**
 * Validates input URL string and parses it safely.
 * @param {string} rawInput 
 * @returns {{ valid: boolean, parsed?: URL, error?: string, statusCode?: number }}
 */
function validateUrlInput(rawInput) {
  if (typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      valid: false,
      error: 'A valid URL string is required in the request body.',
      statusCode: 400
    };
  }

  const trimmed = rawInput.trim();

  // Reject excessively long inputs
  if (trimmed.length > 2048) {
    return {
      valid: false,
      error: 'Submitted URL exceeds the maximum allowed length of 2048 characters.',
      statusCode: 413
    };
  }

  // Parse URL safely
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return {
      valid: false,
      error: 'The submitted URL is malformed or improperly formatted.',
      statusCode: 400
    };
  }

  // Accept only HTTP and HTTPS protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: `Unsupported scheme '${parsed.protocol}'. Only HTTP and HTTPS URLs are accepted.`,
      statusCode: 400
    };
  }

  // Ensure hostname is non-empty
  if (!parsed.hostname || parsed.hostname.trim() === '') {
    return {
      valid: false,
      error: 'The submitted URL does not contain a valid hostname.',
      statusCode: 400
    };
  }

  return { valid: true, parsed };
}

/**
 * Checks if a string is an IPv4 or IPv6 address.
 * @param {string} hostname 
 * @returns {boolean}
 */
function isIpAddress(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '');

  // IPv4 regex (0.0.0.0 to 255.255.255.255)
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  if (ipv4Regex.test(host)) return true;

  // IPv6 contains colons
  if (host.includes(':')) return true;

  return false;
}

/**
 * Analyzes a URL using transparent, explainable heuristic signals.
 * @param {string} rawUrl 
 * @returns {object} Analysis result
 */
function analyzeUrl(rawUrl) {
  const validation = validateUrlInput(rawUrl);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      statusCode: validation.statusCode
    };
  }

  const parsed = validation.parsed;
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const search = parsed.search.toLowerCase();

  const signals = [];
  let rawScore = 0;

  // ----------------------------------------------------
  // Signal 1: Insecure Protocol (HTTP vs HTTPS)
  // ----------------------------------------------------
  if (parsed.protocol === 'http:') {
    signals.push({
      id: 'INSECURE_PROTOCOL',
      title: 'Insecure HTTP Protocol',
      description: 'The URL uses unencrypted HTTP instead of HTTPS. While not proof of fraud, modern legitimate services almost universally use HTTPS for secure transmission.',
      severity: 'low',
      weight: 15
    });
    rawScore += 15;
  }

  // ----------------------------------------------------
  // Signal 2: Raw IP Address Hostname
  // ----------------------------------------------------
  const isIp = isIpAddress(hostname);
  if (isIp) {
    signals.push({
      id: 'IP_HOST',
      title: 'IP Address Used as Hostname',
      description: 'The URL specifies a numeric IP address directly rather than a registered domain name, a pattern frequently seen in phishing and temporary malicious servers.',
      severity: 'high',
      weight: 35
    });
    rawScore += 35;
  }

  // ----------------------------------------------------
  // Signal 3: Embedded Credentials or '@' Symbol
  // ----------------------------------------------------
  if (parsed.username || parsed.password || rawUrl.includes('@')) {
    signals.push({
      id: 'MISLEADING_AT_SYMBOL',
      title: 'Misleading Authority Syntax (@)',
      description: "The URL includes an '@' symbol in the authority component. Browsers ignore characters preceding the '@', which attackers use to disguise the true destination domain.",
      severity: 'high',
      weight: 30
    });
    rawScore += 30;
  }

  // ----------------------------------------------------
  // Signal 4: Punycode / Internationalized Domain Name
  // ----------------------------------------------------
  if (hostname.startsWith('xn--') || hostname.includes('.xn--')) {
    signals.push({
      id: 'PUNYCODE_DOMAIN',
      title: 'Punycode / Internationalized Domain Detected',
      description: "The domain uses Punycode encoding ('xn--'), which can be used in IDN homograph attacks to visually impersonate familiar domain names using visually identical foreign characters.",
      severity: 'medium',
      weight: 20
    });
    rawScore += 20;
  }

  // If not an IP, evaluate domain-specific structural patterns
  if (!isIp) {
    const domainParts = hostname.split('.');
    const tld = domainParts[domainParts.length - 1];

    // ----------------------------------------------------
    // Signal 5: Suspicious / High-Abuse TLD
    // ----------------------------------------------------
    if (SUSPICIOUS_TLDS.has(tld)) {
      signals.push({
        id: 'SUSPICIOUS_TLD',
        title: 'Uncommon / High-Abuse Top-Level Domain',
        description: `The URL uses the '.${tld}' TLD. Certain low-cost or free top-level domains are statistically observed more frequently in automated phishing and spam campaigns. This is a weak signal.`,
        severity: 'low',
        weight: 15
      });
      rawScore += 15;
    }

    // ----------------------------------------------------
    // Signal 6: Excessive Subdomain Depth
    // (e.g. login.secure.verify.bank.example.com has 5+ labels)
    // ----------------------------------------------------
    if (domainParts.length > 3) {
      signals.push({
        id: 'EXCESSIVE_SUBDOMAINS',
        title: 'Excessive Subdomain Levels',
        description: `The hostname contains ${domainParts.length} levels of subdomains. Complex subdomain chains are commonly used to mimic familiar brand names or conceal the actual registrar domain.`,
        severity: 'medium',
        weight: 20
      });
      rawScore += 20;
    }

    // ----------------------------------------------------
    // Signal 7: Excessive Hyphens in Hostname
    // (e.g. secure-login-bank-verification.com)
    // ----------------------------------------------------
    const hyphenCount = (hostname.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
      signals.push({
        id: 'EXCESSIVE_HYPHENS',
        title: 'Hyphen-Heavy Hostname Structure',
        description: `The domain contains ${hyphenCount} hyphens. Attackers frequently string together hyphens to construct convincing look-alike domain names for brand impersonation.`,
        severity: 'low',
        weight: 10
      });
      rawScore += 10;
    }

    // ----------------------------------------------------
    // Signal 8: Brand Impersonation in Subdomain
    // (e.g. paypal.com.attacker.com where attacker.com is base)
    // ----------------------------------------------------
    const baseDomain = domainParts.slice(-2).join('.');
    const matchedBrands = TARGETED_BRANDS.filter(brand => {
      const inSubdomain = hostname.includes(brand) && !baseDomain.startsWith(brand);
      return inSubdomain;
    });

    if (matchedBrands.length > 0) {
      signals.push({
        id: 'BRAND_IMPERSONATION',
        title: 'Possible Brand Name in Subdomain',
        description: `The hostname includes brand keyword(s) (${matchedBrands.join(', ')}) outside of the primary registered domain. This pattern is strongly correlated with spoofing and phishing attempts.`,
        severity: 'high',
        weight: 25
      });
      rawScore += 25;
    }
  }

  // ----------------------------------------------------
  // Signal 9: Phishing / Urgent / Financial Keywords
  // ----------------------------------------------------
  const targetText = `${hostname} ${pathname} ${search}`;
  const detectedKeywords = PHISHING_KEYWORDS.filter(kw => {
    const regex = new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i');
    return regex.test(targetText);
  });

  if (detectedKeywords.length > 0) {
    const isMultiple = detectedKeywords.length >= 2;
    signals.push({
      id: 'PHISHING_KEYWORDS',
      title: 'Sensitive Security / Authentication Keywords Detected',
      description: `The URL contains keywords often used in social engineering and credential-harvesting attacks: ${detectedKeywords.slice(0, 5).join(', ')}. Treated as a weak contextual signal.`,
      severity: isMultiple ? 'medium' : 'low',
      weight: isMultiple ? 20 : 10
    });
    rawScore += isMultiple ? 20 : 10;
  }

  // ----------------------------------------------------
  // Signal 10: Non-Standard Port
  // ----------------------------------------------------
  if (parsed.port && !['80', '443', '8080', '8443'].includes(parsed.port)) {
    signals.push({
      id: 'NON_STANDARD_PORT',
      title: 'Non-Standard Web Port',
      description: `The URL specifies port '${parsed.port}'. Legitimate public consumer services rarely operate on non-standard web ports.`,
      severity: 'low',
      weight: 10
    });
    rawScore += 10;
  }

  // ----------------------------------------------------
  // Scoring & Risk Level Computation
  // Deterministic 0-100 score capped
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
  if (signals.length === 0) {
    assessmentStatus = 'insufficient_evidence';
  } else {
    assessmentStatus = 'heuristic_signals_detected';
  }

  // ----------------------------------------------------
  // Contextual Recommendations
  // ----------------------------------------------------
  const recommendations = [];
  if (isIp) {
    recommendations.push('Do not enter passwords, credit card numbers, or private credentials on IP-based addresses.');
  }
  if (parsed.protocol === 'http:') {
    recommendations.push('Avoid submitting forms or sensitive information over unencrypted HTTP connections.');
  }
  if (signals.some(s => s.id === 'BRAND_IMPERSONATION' || s.id === 'PHISHING_KEYWORDS')) {
    recommendations.push('Navigate to the intended service by directly typing their verified domain in your browser instead of following this link.');
  }
  if (signals.length === 0) {
    recommendations.push('No obvious heuristic anomalies were detected in the URL structure. However, always exercise caution with unfamiliar links.');
  } else {
    recommendations.push('Verify the identity of the sender through a known, independent communication channel before taking action.');
  }

  return {
    success: true,
    target: rawUrl.trim(),
    normalizedUrl: parsed.href,
    riskScore,
    riskLevel,
    assessmentStatus,
    signalsCount: signals.length,
    signals,
    recommendations,
    disclaimer: 'This evaluation is strictly based on transparent URL structure heuristics. A low score does not guarantee safety, and a high score does not confirm fraud. Never enter credentials without independent verification.'
  };
}

module.exports = {
  validateUrlInput,
  analyzeUrl
};
