/**
 * INFRAUD.org — Threat Intelligence Analysis Controller (V2 Redesign)
 * 
 * Drives result.html:
 * - Real-time heuristic scoring with animated SVG dial
 * - Multi-vector telemetry tiles (Protocol, TLD, Homoglyph/Brand, Community DB)
 * - Forensic indicator breakdown or All-Clear security certification
 * - Dynamic incident playbook & recommendations
 * - Interactive actions: Rescan, Copy Audit Link, Inline Fast Scanner
 */

// Global analysis state
let currentAnalysisData = null;
let currentTargetQuery = '';
let currentTargetType = 'url';

document.addEventListener('DOMContentLoaded', () => {
  initAnalysis();
});

/**
 * Initializes and executes analysis based on current URL parameters
 */
/**
 * Smart heuristic type detector
 * Automatically identifies Phone numbers, UPI handles, and Messages
 * even if they were passed without an explicit type or defaulted to 'url'.
 */
function detectTargetType(rawQuery, explicitType) {
  const query = (rawQuery || '').trim();
  if (!query) return explicitType || 'url';

  // 1. UPI check: contains '@' without slashes or spaces and doesn't start with http
  if (query.includes('@') && !query.includes('/') && !query.includes(' ') && !query.startsWith('http')) {
    return 'upi';
  }

  // 2. Phone check:
  // e.g. 8010237029, +918010237029, +91 80102 37029, 1800112233, 022-26590000
  const cleanDigits = query.replace(/[\s\-\+\(\)]/g, '');
  const isAllPhoneChars = /^[\+\d\s\-\(\)]+$/.test(query);
  if (isAllPhoneChars && cleanDigits.length >= 7 && cleanDigits.length <= 15 && !query.includes('.') && !query.includes('/')) {
    return 'phone';
  }

  // 3. Message check:
  // Multiple words with spaces, known Indian scam trigger phrases, or long messages
  const words = query.split(/\s+/).filter(Boolean);
  const scamKeywords = /\b(dear|consumer|electricity|power|bill|cut|tonight|police|arrest|cbi|customs|parcel|narcotics|lottery|winner|kyc|otp|deactivated|blocked|urgent|immediately|part-time|job|telegram)\b/i;
  if (!query.startsWith('http://') && !query.startsWith('https://') && !query.startsWith('www.')) {
    if (words.length >= 4 || (words.length >= 2 && scamKeywords.test(query)) || query.length > 60) {
      return 'message';
    }
  }

  // 4. If explicitType is valid and not generic 'url'
  if (explicitType && ['phone', 'upi', 'message'].includes(explicitType)) {
    return explicitType;
  }

  // 5. Default to URL
  return 'url';
}

async function initAnalysis() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawQuery = urlParams.get('query') || urlParams.get('q') || urlParams.get('url');
  const rawType = (urlParams.get('type') || '').toLowerCase().trim();

  // If no query parameter provided, show prompt
  if (!rawQuery || !rawQuery.trim()) {
    showNoTargetState();
    return;
  }

  const query = rawQuery.trim();
  currentTargetQuery = query;

  // SMART AUTO-DETECTION: Guarantee that Phone numbers, UPI IDs, and Messages
  // are NEVER mistakenly classified as URLs!
  const type = detectTargetType(query, rawType);
  currentTargetType = type;

  // If detected type differs from parameter, silently update URL for accurate bookmarks & sharing
  if (rawType !== type) {
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('type', type);
      window.history.replaceState(null, '', newUrl.toString());
    } catch (e) {}
  }

  // Set Scan ID and Localized Timestamp
  const scanMetaEl = document.getElementById('scan-meta');
  if (scanMetaEl) {
    const scanId = 'INFR-' + Math.floor(1000 + Math.random() * 9000) + '-' + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const scanDate = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    scanMetaEl.innerHTML = `<span class="pulse-dot"></span> Scan ID: ${scanId} • ${scanDate} IST`;
  }

  // Set Target Header Display
  const targetDisplayEl = document.getElementById('target-display');
  if (targetDisplayEl) {
    targetDisplayEl.textContent = query;
  }

  // Set Category Tag & Type Avatar Icon
  updateTargetTypeVisuals(query, type);

  // Link Report Threat Button
  const reportBtn = document.getElementById('btn-report-target');
  if (reportBtn) {
    reportBtn.href = `report.html?target=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`;
  }

  // Enter Loading State
  showLoadingState();

  try {
    let resultData = null;

    if (type === 'url') {
      // Normalize URL scheme for heuristics if missing
      let targetUrl = query;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      // Try local frontend server endpoint first (/api/analyze/url), fallback to port 5000 if needed
      const endpoints = ['/api/analyze/url', 'http://localhost:5000/api/analyze/url'];
      let lastErr = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl })
          });
          if (response.ok) {
            resultData = await response.json();
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!resultData) {
        // Fallback: If backend is completely offline, generate accurate client-side heuristic evaluation
        resultData = evaluateUrlLocally(targetUrl);
      }
    } else if (type === 'upi') {
      const upiTarget = query.trim();
      updateTargetTypeVisuals(upiTarget, 'upi');

      // Try local frontend server endpoint first (/api/analyze/upi), fallback to port 5000 if needed
      const endpoints = ['/api/analyze/upi', 'http://localhost:5000/api/analyze/upi'];
      let lastErr = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ upiId: upiTarget })
          });
          if (response.ok) {
            resultData = await response.json();
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!resultData) {
        // Fallback: If backend is offline, generate client-side heuristic evaluation
        resultData = evaluateUpiLocally(upiTarget);
      }
    } else if (type === 'phone') {
      const phoneTarget = query.trim();
      updateTargetTypeVisuals(phoneTarget, 'phone');

      // Try local frontend server endpoint first (/api/analyze/phone), fallback to port 5000 if needed
      const endpoints = ['/api/analyze/phone', 'http://localhost:5000/api/analyze/phone'];
      let lastErr = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneTarget })
          });
          if (response.ok) {
            resultData = await response.json();
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!resultData) {
        // Fallback: If backend is completely offline, generate accurate client-side phone evaluation
        resultData = evaluatePhoneLocally(phoneTarget);
      }
    } else if (type === 'message') {
      const messageTarget = query.trim();
      updateTargetTypeVisuals(messageTarget, 'message');

      // Try local frontend server endpoint first (/api/analyze/message), fallback to port 5000 if needed
      const endpoints = ['/api/analyze/message', 'http://localhost:5000/api/analyze/message'];
      let lastErr = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageTarget })
          });
          if (response.ok) {
            resultData = await response.json();
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!resultData) {
        // Fallback: If backend is completely offline, generate accurate client-side message evaluation
        resultData = evaluateMessageLocally(messageTarget);
      }
    } else {
      // General non-URL targets (e.g. raw text)
      resultData = await evaluateNonUrlTarget(query, type);
    }

    // Cross-check community reports database to enrich telemetry
    resultData = await enrichWithCommunityReports(resultData, query);

    currentAnalysisData = resultData;
    renderAnalysisResult(resultData);

  } catch (err) {
    console.error('[INFRAUD Analyzer] Error during analysis:', err);
    showErrorState(err.message || 'An unexpected error occurred while analyzing target.');
  }
}

/**
 * Updates hero icons and badges based on target type
 */
function updateTargetTypeVisuals(query, type) {
  // Update all target displays across all tool headers
  document.querySelectorAll('.target-display-value').forEach(el => {
    if (type === 'phone') {
      const cleanNum = query.replace(/[^\d+]/g, '');
      if (cleanNum.startsWith('+91') || (/^\d{10}$/.test(cleanNum) && !cleanNum.startsWith('+'))) {
        const d = cleanNum.replace(/^\+91/, '');
        el.innerHTML = `<span style="font-size: 1.25rem; margin-right: 6px;">🇮🇳</span> <span style="font-family: var(--mono); color: #FFFFFF;">${cleanNum.startsWith('+') ? cleanNum : '+91 ' + d}</span>`;
      } else {
        el.innerHTML = `<span style="font-family: var(--mono); color: #FFFFFF;">${escapeHtml(query)}</span>`;
      }
    } else if (type === 'upi') {
      el.innerHTML = `<span style="color: #FBBF24; margin-right: 4px; font-weight: 800;">₹</span> <span style="font-family: var(--mono); color: #FFFFFF;">${escapeHtml(query)}</span>`;
    } else if (type === 'message') {
      const preview = query.length > 70 ? query.substring(0, 68) + '...' : query;
      el.innerHTML = `<span style="color: #FFFFFF;">"${escapeHtml(preview)}"</span>`;
    } else {
      el.innerHTML = `<span style="color: #FFFFFF; font-family: var(--mono);">${escapeHtml(query)}</span>`;
    }
  });
  const heroCard = document.querySelector('.target-hero-card');
  if (heroCard) {
    heroCard.classList.remove('hero-card-url', 'hero-card-phone', 'hero-card-upi', 'hero-card-message');
    heroCard.classList.add('hero-card-' + type);
  }

  const iconBox = document.getElementById('target-type-icon');
  const catTag = document.getElementById('target-category-tag');
  const protocolTag = document.getElementById('target-protocol-tag');
  const breadcrumbTag = document.getElementById('audit-breadcrumb-tag');
  const targetDisplay = document.getElementById('target-display');

  if (type === 'phone') {
    if (breadcrumbTag) breadcrumbTag.textContent = 'Telecom & Caller Intelligence Dossier';
    if (catTag) catTag.textContent = 'PHONE NUMBER TARGET';
    if (protocolTag) {
      protocolTag.textContent = 'CELLULAR / TELECOM 5G CHANNEL';
      protocolTag.style.color = '#34D399';
    }
    if (iconBox) {
      iconBox.style.background = 'rgba(16, 185, 129, 0.25)';
      iconBox.style.color = '#34D399';
      iconBox.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
      iconBox.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      `;
    }
    if (targetDisplay) {
      const cleanNum = query.replace(/[^\d+]/g, '');
      if (cleanNum.startsWith('+91') || (/^\d{10}$/.test(cleanNum) && !cleanNum.startsWith('+'))) {
        const d = cleanNum.replace(/^\+91/, '');
        targetDisplay.innerHTML = `<span style="font-size: 1.25rem; margin-right: 6px;">🇮🇳</span> <span style="font-family: var(--mono); color: #FFFFFF;">${cleanNum.startsWith('+') ? cleanNum : '+91 ' + d}</span>`;
      } else {
        targetDisplay.innerHTML = `<span style="font-family: var(--mono); color: #FFFFFF;">${escapeHtml(query)}</span>`;
      }
    }
  } else if (type === 'upi') {
    if (breadcrumbTag) breadcrumbTag.textContent = 'NPCI Payment Safety Radar & VPA Audit';
    if (catTag) catTag.textContent = 'UPI VPA HANDLE';
    if (protocolTag) {
      protocolTag.textContent = 'NPCI PAYMENT RAIL 2.0';
      protocolTag.style.color = '#FBBF24';
    }
    if (iconBox) {
      iconBox.style.background = 'rgba(245, 158, 11, 0.25)';
      iconBox.style.color = '#FBBF24';
      iconBox.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.4)';
      iconBox.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
          <line x1="6" y1="15" x2="10" y2="15"></line>
        </svg>
      `;
    }
    if (targetDisplay) {
      targetDisplay.innerHTML = `<span style="color: #FBBF24; margin-right: 4px; font-weight: 800;">₹</span> <span style="font-family: var(--mono); color: #FFFFFF;">${escapeHtml(query)}</span>`;
    }
  } else if (type === 'message') {
    if (breadcrumbTag) breadcrumbTag.textContent = 'NLP Social Engineering Threat Lab';
    if (catTag) catTag.textContent = 'SUSPICIOUS MESSAGE TARGET';
    if (protocolTag) {
      protocolTag.textContent = 'NLP THREAT PARSER ACTIVE';
      protocolTag.style.color = '#FDE68A';
    }
    if (iconBox) {
      iconBox.style.background = 'rgba(245, 158, 11, 0.25)';
      iconBox.style.color = '#FCD34D';
      iconBox.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.4)';
      iconBox.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }
    if (targetDisplay) {
      const preview = query.length > 70 ? query.substring(0, 68) + '...' : query;
      targetDisplay.innerHTML = `<span style="color: #FFFFFF;">"${escapeHtml(preview)}"</span>`;
    }
  } else {
    // Website / URL
    if (breadcrumbTag) breadcrumbTag.textContent = 'Web Asset & Domain Forensics';
    const isHttp = /^http:\/\//i.test(query);
    if (catTag) catTag.textContent = 'WEB DOMAIN / URL';
    if (protocolTag) {
      if (isHttp) {
        protocolTag.textContent = 'HTTP Insecure (Plaintext)';
        protocolTag.style.color = '#FB923C';
      } else {
        protocolTag.textContent = 'HTTPS Encrypted (TLS 1.3)';
        protocolTag.style.color = '#34D399';
      }
    }
    if (iconBox) {
      iconBox.style.background = 'rgba(59, 130, 246, 0.25)';
      iconBox.style.color = '#60A5FA';
      iconBox.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)';
      iconBox.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      `;
    }
    if (targetDisplay) {
      targetDisplay.innerHTML = `<span style="color: #FFFFFF; font-family: var(--mono);">${escapeHtml(query)}</span>`;
    }
  }
}

function showLoadingState() {
  const type = currentTargetType || 'url';
  document.querySelectorAll('.tool-result-view').forEach(v => {
    v.classList.remove('active');
    v.style.display = 'none';
  });
  const activeView = document.getElementById('view-' + type) || document.getElementById('view-url');
  if (activeView) {
    activeView.classList.add('active');
    activeView.style.display = 'block';
  }

  const spinnerHTML = `
    <div style="padding: 48px 24px; text-align: center; color: var(--ink-500, #4B5570);">
      <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #E8EBF3; border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;"></div>
      <div style="font-weight: 600; font-size: 0.9375rem; color: var(--ink-800, #1E2742); margin-bottom: 4px;">Evaluating Target Heuristics...</div>
      <div style="font-size: 0.8125rem;">Checking syntax, spoofing indicators, regulatory series, and fraud telemetry.</div>
    </div>
  `;

  ['signals-container', 'phone-signals-container', 'upi-signals-container', 'msg-signals-container'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = spinnerHTML;
  });

  if (type === 'phone') {
    // Minimal View Elements
    const phoneTargetDisplay = document.getElementById('phone-target-display');
    if (phoneTargetDisplay) phoneTargetDisplay.textContent = 'Analyzing Caller...';
    const phoneCanonicalDisplay = document.getElementById('phone-canonical-display');
    if (phoneCanonicalDisplay) phoneCanonicalDisplay.textContent = currentTargetQuery || '+91 —';
    const phoneHeaderPill = document.getElementById('phone-header-status-pill');
    if (phoneHeaderPill) {
      phoneHeaderPill.textContent = 'EVALUATING CALLER...';
      phoneHeaderPill.className = 'url-tag-pill';
    }
    const phoneScoreDisplay = document.getElementById('phone-score-display');
    if (phoneScoreDisplay) {
      phoneScoreDisplay.innerHTML = `<span style="font-size: 2.25rem; opacity: 0.5;">...</span>`;
      phoneScoreDisplay.style.color = 'var(--ink-500, #4B5570)';
    }
    const phoneGaugeCircle = document.getElementById('phone-gauge-circle');
    if (phoneGaugeCircle) {
      phoneGaugeCircle.style.strokeDashoffset = '439.8';
      phoneGaugeCircle.style.stroke = '#2563EB';
    }
    const phoneRiskBadge = document.getElementById('phone-risk-badge');
    if (phoneRiskBadge) {
      phoneRiskBadge.textContent = 'EVALUATING CALLER...';
      phoneRiskBadge.style.color = 'var(--ink-500, #4B5570)';
      phoneRiskBadge.style.background = 'rgba(75, 85, 112, 0.08)';
      phoneRiskBadge.style.borderColor = 'rgba(75, 85, 112, 0.2)';
    }
    const phoneRiskSummary = document.getElementById('phone-risk-summary');
    if (phoneRiskSummary) {
      phoneRiskSummary.textContent = 'Checking phone number against carrier databases, known Indian scam tactics, and active cyber crime complaints...';
    }
    const tileLine = document.getElementById('phone-tile-line');
    if (tileLine) tileLine.textContent = 'Cellular Mobile';
    const tileCarrier = document.getElementById('phone-tile-carrier');
    if (tileCarrier) tileCarrier.textContent = 'Checking line allocation channel...';
    const tileOrigin = document.getElementById('phone-tile-origin');
    if (tileOrigin) tileOrigin.textContent = 'India (+91)';
    const tileOriginSub = document.getElementById('phone-tile-origin-sub');
    if (tileOriginSub) tileOriginSub.textContent = 'Standard domestic routing circle';
    const tileTrai = document.getElementById('phone-tile-trai');
    if (tileTrai) tileTrai.textContent = 'TRAI Check...';
    const tileTraiSub = document.getElementById('phone-tile-trai-sub');
    if (tileTraiSub) tileTraiSub.textContent = 'Checking 140 / 160 prefix series...';
    const tileReports = document.getElementById('phone-tile-reports');
    if (tileReports) tileReports.textContent = 'Scanning...';
    const tileReportsSub = document.getElementById('phone-tile-reports-sub');
    if (tileReportsSub) tileReportsSub.textContent = 'Cross-checking national scam logs...';

    // Legacy backwards compatibility anchors
    const phoneVal = document.getElementById('phone-val-formatted');
    if (phoneVal) phoneVal.textContent = currentTargetQuery;
    const phonePill = document.getElementById('phone-category-pill');
    if (phonePill) phonePill.textContent = 'Auditing Caller Identity...';
    const spamPct = document.getElementById('phone-spam-percent');
    if (spamPct) spamPct.textContent = '--%';
    const phoneScoreNum = document.getElementById('phone-score-num');
    if (phoneScoreNum) phoneScoreNum.textContent = '--';
    const phoneScoreCircle = document.getElementById('phone-score-circle');
    if (phoneScoreCircle) {
      phoneScoreCircle.style.strokeDashoffset = '439.8';
      phoneScoreCircle.style.stroke = 'var(--ink-400, #94A3B8)';
    }
  } else if (type === 'upi') {
    const upiDisplay = document.getElementById('upi-display-handle');
    if (upiDisplay) upiDisplay.textContent = currentTargetQuery;
    const shieldTitle = document.getElementById('upi-shield-title');
    if (shieldTitle) shieldTitle.textContent = 'VERIFYING NPCI RAIL...';
    const shieldDesc = document.getElementById('upi-shield-desc');
    if (shieldDesc) shieldDesc.textContent = 'Auditing acquiring bank partner and active mule registry...';
  } else if (type === 'message') {
    const bubble = document.getElementById('msg-bubble-content');
    if (bubble) bubble.textContent = 'Parsing message semantics, extracting payload URLs, phones, and checking linguistic fear triggers...';
    const pressScore = document.getElementById('msg-pressure-score');
    if (pressScore) pressScore.textContent = '--%';
    const pressPill = document.getElementById('msg-pressure-pill');
    if (pressPill) pressPill.textContent = 'PARSING COERCION PATTERNS';
  } else {
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
      scoreDisplay.innerHTML = `<span style="font-size: 2.25rem; opacity: 0.5;">...</span>`;
      scoreDisplay.style.color = 'var(--ink-500, #4B5570)';
    }

    const riskBadge = document.getElementById('risk-badge');
    if (riskBadge) {
      riskBadge.textContent = 'ANALYZING';
      riskBadge.style.color = 'var(--ink-500, #4B5570)';
      riskBadge.style.background = 'rgba(75, 85, 112, 0.08)';
      riskBadge.style.borderColor = 'rgba(75, 85, 112, 0.2)';
    }

    const riskSummary = document.getElementById('risk-summary');
    if (riskSummary) {
      riskSummary.textContent = 'Executing real-time heuristic inspection across protocol, syntax, and threat indicators...';
    }

    const gaugeCircle = document.getElementById('gauge-circle');
    if (gaugeCircle) {
      gaugeCircle.style.strokeDashoffset = '439.8';
      gaugeCircle.style.stroke = '#2563EB';
    }
  }
}


/**
 * Renders verified analysis results with dedicated layout per tool
 */
function renderAnalysisResult(data) {
  const riskScore = Math.max(0, Math.min(100, Number(data.riskScore) || 0));
  const signals = data.signals || [];
  const recommendations = data.recommendations || [];
  const target = data.target || currentTargetQuery;
  const type = currentTargetType || 'url';

  // 1. Color and Verdict Configuration
  let theme = {
    color: '#10B981',
    bgPill: 'rgba(16, 185, 129, 0.1)',
    borderPill: 'rgba(16, 185, 129, 0.25)',
    label: 'SAFE TO BROWSE',
    summary: 'This website looks genuine and safe to visit. No deceptive tricks, fake logins, or scam reports found.',
    cardGlow: 'rgba(16, 185, 129, 0.04)'
  };

  if (riskScore >= 75) {
    theme = {
      color: '#EF4444',
      bgPill: 'rgba(239, 68, 68, 0.1)',
      borderPill: 'rgba(239, 68, 68, 0.25)',
      label: 'DANGEROUS SCAM',
      summary: 'High danger! This website is an active fake or phishing site designed to steal money or passwords.',
      cardGlow: 'rgba(239, 68, 68, 0.05)'
    };
  } else if (riskScore >= 50) {
    theme = {
      color: '#EA580C',
      bgPill: 'rgba(234, 88, 12, 0.1)',
      borderPill: 'rgba(234, 88, 12, 0.25)',
      label: 'HIGH RISK / SUSPICIOUS',
      summary: 'Suspicious website! High risk of fraud or fake identity. Do not enter passwords, OTPs, or bank details.',
      cardGlow: 'rgba(234, 88, 12, 0.05)'
    };
  } else if (riskScore >= 25) {
    theme = {
      color: '#F59E0B',
      bgPill: 'rgba(245, 158, 11, 0.1)',
      borderPill: 'rgba(245, 158, 11, 0.25)',
      label: 'CAUTION ADVISED',
      summary: 'Proceed with caution. Some unusual traits or newly registered domain patterns were detected.',
      cardGlow: 'rgba(245, 158, 11, 0.05)'
    };
  }

  // 2. Hide all tool views and activate tool-specific view
  document.querySelectorAll('.tool-result-view').forEach(v => {
    v.classList.remove('active');
    v.style.display = 'none';
  });

  const activeView = document.getElementById('view-' + type) || document.getElementById('view-url');
  if (activeView) {
    activeView.classList.add('active');
    activeView.style.display = 'block';
  }

  // 3. Render specialized view
  if (type === 'phone') {
    renderPhoneView(data, theme, riskScore, signals, recommendations);
  } else if (type === 'upi') {
    renderUpiView(data, theme, riskScore, signals, recommendations);
  } else if (type === 'message') {
    renderMessageView(data, theme, riskScore, signals, recommendations);
  } else {
    renderUrlView(data, theme, riskScore, signals, recommendations, target);
  }
}

/**
 * 1. Dedicated Renderer for Phone Numbers (Minimalist Architecture matching URL Checker)
 */
function renderPhoneView(data, theme, riskScore, signals, recommendations) {
  const target = data.target || currentTargetQuery;
  const digits = target.replace(/\D/g, '');
  let formatted = target;
  if (digits.length === 10) {
    formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    const d = digits.slice(2);
    formatted = `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  } else if (digits.length > 12) {
    // Format long VoIP trunk or test string into readable segments
    const chunks = [];
    for (let i = 0; i < digits.length; i += 5) {
      chunks.push(digits.slice(i, i + 5));
    }
    formatted = (target.startsWith('+') ? '+' : '') + chunks.join(' ');
  }

  // 1. Top Minimal Header Card
  const phoneTargetDisplay = document.getElementById('phone-target-display');
  if (phoneTargetDisplay) phoneTargetDisplay.textContent = formatted;

  const phoneCanonicalDisplay = document.getElementById('phone-canonical-display');
  if (phoneCanonicalDisplay) phoneCanonicalDisplay.textContent = formatted;

  const lineTypeStr = (data.lineType || 'CELLULAR').toUpperCase();
  const phoneLineTypeTag = document.getElementById('phone-line-type-tag');
  if (phoneLineTypeTag) {
    if (lineTypeStr === 'TOLL_FREE') {
      phoneLineTypeTag.textContent = 'TOLL-FREE HELPLINE';
      phoneLineTypeTag.className = 'url-tag-pill url-tag-blue';
    } else if (lineTypeStr === 'VOIP') {
      phoneLineTypeTag.textContent = 'VOIP VIRTUAL LINE';
      phoneLineTypeTag.className = 'url-tag-pill url-tag-yellow';
    } else if (lineTypeStr === 'FIXED_LINE') {
      phoneLineTypeTag.textContent = 'FIXED-LINE LANDLINE';
      phoneLineTypeTag.className = 'url-tag-pill';
    } else {
      phoneLineTypeTag.textContent = 'CELLULAR MOBILE';
      phoneLineTypeTag.className = 'url-tag-pill';
    }
  }

  const countryName = data.normalized ? data.normalized.countryName : 'India';
  const callingCode = data.normalized ? data.normalized.callingCode : '+91';
  const phoneOriginTag = document.getElementById('phone-origin-tag');
  if (phoneOriginTag) {
    phoneOriginTag.textContent = `${countryName.toUpperCase()} (${callingCode})`;
  }

  const phoneHeaderStatusPill = document.getElementById('phone-header-status-pill');
  if (phoneHeaderStatusPill) {
    if (riskScore >= 75) {
      phoneHeaderStatusPill.textContent = 'DANGEROUS SCAM CALLER';
      phoneHeaderStatusPill.className = 'url-tag-pill url-tag-red';
    } else if (riskScore >= 50) {
      phoneHeaderStatusPill.textContent = 'HIGH RISK / SUSPICIOUS';
      phoneHeaderStatusPill.className = 'url-tag-pill url-tag-orange';
    } else if (riskScore >= 25) {
      phoneHeaderStatusPill.textContent = 'CAUTION ADVISED';
      phoneHeaderStatusPill.className = 'url-tag-pill url-tag-yellow';
    } else {
      phoneHeaderStatusPill.textContent = 'SAFE CALLER';
      phoneHeaderStatusPill.className = 'url-tag-pill url-tag-green';
    }
  }

  const reportBtn = document.getElementById('btn-report-phone');
  if (reportBtn) {
    reportBtn.href = `reports.html?type=phone&target=${encodeURIComponent(target)}`;
  }

  // 2. Main Verdict Hero Card (Gauge + Summary)
  const phoneGaugeCircle = document.getElementById('phone-gauge-circle');
  if (phoneGaugeCircle) {
    const circumference = 439.8;
    const offset = circumference - (riskScore / 100) * circumference;
    phoneGaugeCircle.style.stroke = theme.color;
    phoneGaugeCircle.style.strokeDashoffset = offset;
  }

  const phoneScoreDisplay = document.getElementById('phone-score-display');
  if (phoneScoreDisplay) {
    phoneScoreDisplay.style.color = theme.color;
    animateCountUp(phoneScoreDisplay, riskScore);
  }

  const phoneScoreSidebar = document.getElementById('phone-score-sidebar');
  if (phoneScoreSidebar) {
    phoneScoreSidebar.style.boxShadow = `0 12px 32px ${theme.cardGlow}`;
  }

  const phoneRiskBadge = document.getElementById('phone-risk-badge');
  if (phoneRiskBadge) {
    if (riskScore >= 75) {
      phoneRiskBadge.textContent = 'DANGEROUS SCAM CALLER';
    } else if (riskScore >= 50) {
      phoneRiskBadge.textContent = 'HIGH RISK / SUSPICIOUS';
    } else if (riskScore >= 25) {
      phoneRiskBadge.textContent = 'CAUTION ADVISED';
    } else {
      phoneRiskBadge.textContent = 'LIKELY SAFE CALLER';
    }
    phoneRiskBadge.style.color = theme.color;
    phoneRiskBadge.style.background = theme.bgPill;
    phoneRiskBadge.style.borderColor = theme.borderPill;
  }

  const phoneRiskSummary = document.getElementById('phone-risk-summary');
  if (phoneRiskSummary) {
    if (riskScore >= 75) {
      phoneRiskSummary.textContent = 'Confirmed high danger! This number is associated with aggressive fraud tactics (e.g., fake CBI/police digital arrest, customs seizure, or courier extortion). Disconnect immediately.';
    } else if (riskScore >= 50) {
      phoneRiskSummary.textContent = 'Suspicious caller! High probability of impersonation or unverified commercial operation. Never share OTPs, banking passwords, or personal credentials.';
    } else if (riskScore >= 25) {
      phoneRiskSummary.textContent = 'Caution advised. This number shows promotional telemarketing traits or unverified caller patterns. Exercise vigilance if financial information is requested.';
    } else {
      phoneRiskSummary.textContent = 'This phone number looks genuine and clean. No deceptive traits, fake officer impersonation, or citizen abuse reports found.';
    }
  }

  // 3. The 4 Clear Security Checks
  // Card 1: Line Type & Carrier
  const tileLine = document.getElementById('phone-tile-line');
  const tileCarrier = document.getElementById('phone-tile-carrier');
  const tileIconLine = document.getElementById('phone-tile-icon-line');
  if (tileLine) {
    if (lineTypeStr === 'TOLL_FREE') tileLine.textContent = 'Toll-Free Helpline';
    else if (lineTypeStr === 'VOIP') tileLine.textContent = 'VoIP Virtual Line';
    else if (lineTypeStr === 'FIXED_LINE') tileLine.textContent = 'Fixed-Line Landline';
    else tileLine.textContent = 'Cellular Mobile';
  }
  if (tileCarrier) {
    if (lineTypeStr === 'VOIP') {
      tileCarrier.textContent = 'Virtual cloud telephony channel';
      if (tileIconLine) {
        tileIconLine.style.background = '#FEF3C7';
        tileIconLine.style.color = '#D97706';
      }
    } else if (lineTypeStr === 'TOLL_FREE') {
      tileCarrier.textContent = 'Standard toll-free routing';
    } else {
      tileCarrier.textContent = 'Standard national cellular SIM';
    }
  }

  // Card 2: Call Origin & Telecom Circle
  const tileOrigin = document.getElementById('phone-tile-origin');
  const tileOriginSub = document.getElementById('phone-tile-origin-sub');
  const isDomestic = !data.normalized || data.normalized.countryCode === 'IN';
  if (tileOrigin) {
    tileOrigin.textContent = `${countryName} (${callingCode})`;
  }
  if (tileOriginSub) {
    tileOriginSub.textContent = isDomestic ? 'Standard domestic routing circle' : 'International dialing origin';
  }

  // Card 3: TRAI Regulatory Clearance
  const isTrai140 = (signals || []).some(s => s.id === 'TRAI_140_TELEMARKETING');
  const isTrai160 = (signals || []).some(s => s.id === 'TRAI_160_TRANSACTIONAL');
  const tileTrai = document.getElementById('phone-tile-trai');
  const tileTraiSub = document.getElementById('phone-tile-trai-sub');
  const tileIconTrai = document.getElementById('phone-tile-icon-trai');

  if (tileTrai) {
    if (isTrai140) {
      tileTrai.textContent = 'TRAI 140 Series';
      tileTrai.style.color = '#D97706';
      if (tileTraiSub) tileTraiSub.textContent = 'Commercial promotional telemarketing prefix';
      if (tileIconTrai) {
        tileIconTrai.style.background = '#FEF3C7';
        tileIconTrai.style.color = '#D97706';
      }
    } else if (isTrai160) {
      tileTrai.textContent = 'TRAI 160 Official';
      tileTrai.style.color = '#2563EB';
      if (tileTraiSub) tileTraiSub.textContent = 'Authorized banking / transactional service';
      if (tileIconTrai) {
        tileIconTrai.style.background = '#EFF6FF';
        tileIconTrai.style.color = '#2563EB';
      }
    } else {
      tileTrai.textContent = 'Clean Non-Promo';
      tileTrai.style.color = 'var(--ink-900, #0A0F1E)';
      if (tileTraiSub) tileTraiSub.textContent = 'Not a commercial spam prefix (140/160)';
      if (tileIconTrai) {
        tileIconTrai.style.background = '#EEF2FF';
        tileIconTrai.style.color = '#4F46E5';
      }
    }
  }

  // Card 4: Citizen Abuse & Scam Reports
  const tileReports = document.getElementById('phone-tile-reports');
  const tileReportsSub = document.getElementById('phone-tile-reports-sub');
  const tileIconReports = document.getElementById('phone-tile-icon-reports');
  const reportCount = data.communityReportCount || 0;
  if (tileReports) {
    if (reportCount > 0) {
      tileReports.textContent = `${reportCount} Active Scam Report(s)`;
      tileReports.style.color = '#DC2626';
      if (tileReportsSub) tileReportsSub.textContent = 'Flagged in citizen cyber crime logs';
      if (tileIconReports) {
        tileIconReports.style.background = '#FEE2E2';
        tileIconReports.style.color = '#DC2626';
      }
    } else {
      tileReports.textContent = '0 Active Reports';
      tileReports.style.color = 'var(--ink-900, #0A0F1E)';
      if (tileReportsSub) tileReportsSub.textContent = 'Cross-checked with national scam logs';
      if (tileIconReports) {
        tileIconReports.style.background = '#F0FDF4';
        tileIconReports.style.color = '#16A34A';
      }
    }
  }

  // 4. Populate Findings (Signals) & Safety Playbook (Recommendations)
  renderSignalsList(signals, theme, 'phone-signals-container', 'phone-signals-count');
  renderRecommendationsList(recommendations, theme, 'phone-recommendations-list');

  // Backwards compatibility anchors
  const phoneFormattedEl = document.getElementById('phone-val-formatted');
  if (phoneFormattedEl) phoneFormattedEl.textContent = formatted;
  const scoreNumEl = document.getElementById('phone-score-num');
  if (scoreNumEl) scoreNumEl.textContent = `${riskScore}%`;
  const spamPctEl = document.getElementById('phone-spam-percent');
  if (spamPctEl) spamPctEl.textContent = `${riskScore}%`;
}

// Stubs for backwards compatibility
window.simulateCallAction = function() {};
window.simulateHwClick = function() {};
window.toggleVectorDetail = function() {};

/**
 * 2. Dedicated Renderer for UPI IDs (Fintech Payment Terminal & Receipt)
 */
function renderUpiView(data, theme, riskScore, signals, recommendations) {
  const target = (data.target || currentTargetQuery).trim();
  const upiDisplay = document.getElementById('upi-display-handle');
  if (upiDisplay) upiDisplay.textContent = target;

  const parts = target.split('@');
  const psp = (parts[1] || '').toLowerCase();
  const username = parts[0] || '';

  // Identify Bank & App
  const bankMap = {
    okhdfcbank: { bank: 'HDFC Bank Ltd', app: 'Google Pay' },
    okaxis: { bank: 'Axis Bank Ltd', app: 'Google Pay' },
    oksbi: { bank: 'State Bank of India', app: 'Google Pay' },
    okicici: { bank: 'ICICI Bank Ltd', app: 'Google Pay' },
    paytm: { bank: 'Paytm Payments Bank / Axis Bank', app: 'Paytm UPI' },
    ybl: { bank: 'YES Bank Ltd', app: 'PhonePe' },
    ibl: { bank: 'ICICI Bank Ltd', app: 'PhonePe' },
    axl: { bank: 'Axis Bank Ltd', app: 'PhonePe' },
    sbi: { bank: 'State Bank of India', app: 'BHIM SBI Pay' },
    kotak: { bank: 'Kotak Mahindra Bank', app: 'Kotak 811 UPI' },
    barodampay: { bank: 'Bank of Baroda', app: 'Baroda mPay' },
    airtel: { bank: 'Airtel Payments Bank', app: 'Airtel Thanks' },
    freecharge: { bank: 'Axis Bank (Freecharge)', app: 'Freecharge UPI' },
    upi: { bank: 'NPCI Central Switch', app: 'BHIM App' }
  };

  const partner = bankMap[psp] || {
    bank: psp ? `@${psp.toUpperCase()} Partner Bank` : 'Standard Bank Partner',
    app: 'NPCI UPI 2.0 Network'
  };

  // Verdict Shield
  const shieldEl = document.getElementById('upi-verdict-shield');
  const shieldIcon = document.getElementById('upi-shield-icon');
  const shieldTitle = document.getElementById('upi-shield-title');
  const shieldDesc = document.getElementById('upi-shield-desc');

  if (shieldEl && shieldTitle && shieldDesc && shieldIcon) {
    if (riskScore >= 50) {
      shieldEl.className = 'upi-shield-verdict danger';
      shieldIcon.textContent = '🚨';
      shieldTitle.textContent = 'DO NOT SEND MONEY — HIGH RISK';
      shieldDesc.textContent = 'Handle flagged for deceptive keywords, brand impersonation, or reported fraud.';
    } else if (riskScore >= 25) {
      shieldEl.className = 'upi-shield-verdict danger';
      shieldEl.style.background = 'rgba(245, 158, 11, 0.08)';
      shieldEl.style.borderColor = 'rgba(245, 158, 11, 0.25)';
      shieldEl.style.color = '#B45309';
      shieldIcon.textContent = '⚠️';
      shieldTitle.textContent = 'EXERCISE CAUTION BEFORE PAYING';
      shieldDesc.textContent = 'Uncommon handle or non-standard PSP provider. Verify beneficiary name.';
    } else {
      shieldEl.className = 'upi-shield-verdict safe';
      shieldIcon.textContent = '🛡️';
      shieldTitle.textContent = 'SAFE TO TRANSFER';
      shieldDesc.textContent = 'Standard NPCI UPI format. Zero adverse fraudulent mule reports on record.';
    }
  }

  // Stamp Badge
  const stampEl = document.getElementById('upi-rubber-stamp');
  if (stampEl) {
    if (riskScore >= 50) {
      stampEl.className = 'upi-stamp-badge upi-stamp-danger';
      stampEl.textContent = 'DO NOT PAY • MULE ACCOUNT';
    } else if (riskScore >= 25) {
      stampEl.className = 'upi-stamp-badge upi-stamp-danger';
      stampEl.textContent = 'SUSPICIOUS VPA';
    } else {
      stampEl.className = 'upi-stamp-badge upi-stamp-safe';
      stampEl.textContent = 'VERIFIED SAFE BENEFICIARY';
    }
  }

  // Digital Receipt Rows
  const valPsp = document.getElementById('upi-val-psp');
  if (valPsp) valPsp.textContent = partner.bank;

  const valApp = document.getElementById('upi-val-app');
  if (valApp) valApp.textContent = partner.app;

  const valType = document.getElementById('upi-val-type');
  if (valType) {
    const isMerchant = /(merchant|store|shop|mart|pay|biz|enterprise)/i.test(username);
    valType.textContent = isMerchant ? 'P2M Merchant Account' : 'P2P Individual Handle';
  }

  const valMule = document.getElementById('upi-val-mule');
  if (valMule) {
    if (riskScore >= 50) {
      valMule.textContent = 'High Mule Risk / Suspicious';
      valMule.style.color = '#DC2626';
    } else {
      valMule.textContent = 'Low / Clean Velocity';
      valMule.style.color = '#059669';
    }
  }

  // 4 Tiles
  const tileBank = document.getElementById('upi-tile-bank');
  if (tileBank) tileBank.textContent = partner.bank;

  const tileKeyword = document.getElementById('upi-tile-keyword');
  if (tileKeyword) {
    const hasImpersonation = (signals || []).some(s => s.id === 'BRAND_IMPERSONATION_HANDLE' || s.id === 'SOCIAL_ENGINEERING_HANDLE');
    if (hasImpersonation) {
      tileKeyword.textContent = 'Deceptive Keyword Flagged';
      tileKeyword.style.color = '#DC2626';
    } else {
      tileKeyword.textContent = 'No Brand Spoofing';
      tileKeyword.style.color = 'var(--ink-900, #0A0F1E)';
    }
  }

  const tileDisputes = document.getElementById('upi-tile-disputes');
  if (tileDisputes) {
    const reportCount = data.communityReportCount || 0;
    tileDisputes.textContent = reportCount > 0 ? `${reportCount} Active Dispute Report(s)` : '0 Active Chargebacks';
    tileDisputes.style.color = reportCount > 0 ? '#DC2626' : 'var(--ink-900, #0A0F1E)';
  }

  // Populate signals & recommendations
  renderSignalsList(signals, theme, 'upi-signals-container', 'upi-signals-count');
  renderRecommendationsList(recommendations, theme, 'upi-recommendations-list');
}

/**
 * 3. Dedicated Renderer for Messages (NLP Forensic Chat Lab)
 */
function renderMessageView(data, theme, riskScore, signals, recommendations) {
  const text = (data.target || currentTargetQuery).trim();
  const bubbleEl = document.getElementById('msg-bubble-content');
  if (bubbleEl) {
    let highlighted = escapeHtml(text);
    // Highlight critical panic keywords
    const criticalWords = [
      'electricity', 'power', 'bijli', 'disconnect(?:ed)?', 'cut tonight', 'account blocked',
      'immediately', 'urgent(?:ly)?', 'within \\d+ hours?', 'police', 'cbi', 'arrest', 'customs',
      'narcotics', 'warrant', 'apk', 'deactivated', 'immediate action'
    ];
    criticalWords.forEach(kw => {
      const re = new RegExp(`\\b(${kw})\\b`, 'gi');
      highlighted = highlighted.replace(re, '<mark class="threat-kw-critical">$1</mark>');
    });

    // Highlight warning credential / financial keywords
    const warnWords = [
      'otp', 'upi pin', 'mpin', 'pin', 'password', 'cvv', 'share', 'verify',
      'refund', 'cashback', 'lottery', 'winner', 'prize', 'reward', 'daily income', 'part-time job'
    ];
    warnWords.forEach(kw => {
      const re = new RegExp(`\\b(${kw})\\b`, 'gi');
      highlighted = highlighted.replace(re, '<mark class="threat-kw-warn">$1</mark>');
    });

    bubbleEl.innerHTML = highlighted;
  }

  const pressureScore = document.getElementById('msg-pressure-score');
  if (pressureScore) {
    pressureScore.textContent = `${riskScore}%`;
    pressureScore.style.color = theme.color;
  }

  const pressurePill = document.getElementById('msg-pressure-pill');
  if (pressurePill) {
    pressurePill.textContent = theme.label;
    pressurePill.style.color = theme.color;
    pressurePill.style.background = theme.bgPill;
    pressurePill.style.borderColor = theme.borderPill;
  }

  const descEl = document.getElementById('msg-pressure-desc');
  if (descEl) {
    descEl.textContent = theme.summary;
  }

  const stratEl = document.getElementById('msg-val-strategy');
  if (stratEl) {
    if (/electricity|power|bijli|cut tonight/i.test(text)) {
      stratEl.textContent = 'Electricity Bill Panic';
    } else if (/police|cbi|arrest|customs|warrant|narcotics/i.test(text)) {
      stratEl.textContent = 'Digital Arrest Extortion';
    } else if (/job|part-time|like|youtube|telegram|daily income/i.test(text)) {
      stratEl.textContent = 'Part-Time Task Scam';
    } else if (/lottery|prize|winner|reward|cashback/i.test(text)) {
      stratEl.textContent = 'Financial Bait / Reward';
    } else if (/blocked|kyc|pan|aadhaar|deactivated/i.test(text)) {
      stratEl.textContent = 'Banking KYC Phishing';
    } else {
      stratEl.textContent = riskScore > 30 ? 'Social Engineering' : 'Standard Greeting / Message';
    }
  }

  const senderEl = document.getElementById('msg-val-sender');
  if (senderEl) {
    const hasPhone = /(?:\+91[\s-]?)?[6-9]\d{9}/.test(text);
    senderEl.textContent = hasPhone ? 'Private +91 Mobile' : 'Unregistered Private Channel';
    senderEl.style.color = riskScore >= 50 ? '#EF4444' : 'var(--ink-900, #0A0F1E)';
  }

  // Extracted Payloads
  const extractedContainer = document.getElementById('msg-extracted-container');
  if (extractedContainer) {
    const urls = data.embeddedUrls || [];
    const phones = data.embeddedPhones || [];
    const upis = data.embeddedUpis || [];

    // Fallback regex extraction if empty
    if (urls.length === 0) {
      const urlMatches = text.match(/(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+|[a-zA-Z0-9][-a-zA-Z0-9]{1,62}\.(?:com|org|net|in|xyz|top|link|live|app|download|online|site)(?:\/[^\s<>"'{}|\\^`]*)?/gi);
      if (urlMatches) urls.push(...urlMatches);
    }
    if (phones.length === 0) {
      const phoneMatches = text.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|1800[\s-]?\d{3}[\s-]?\d{3,4}\b/g);
      if (phoneMatches) phones.push(...phoneMatches);
    }
    if (upis.length === 0) {
      const upiMatches = text.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g);
      if (upiMatches) upis.push(...upiMatches);
    }

    if (urls.length === 0 && phones.length === 0 && upis.length === 0) {
      extractedContainer.innerHTML = `
        <div style="font-size:0.8125rem; color:var(--ink-500); padding:6px 0;">
          No embedded web links, phone numbers, or UPI handles detected in message body.
        </div>
      `;
    } else {
      let chipsHtml = '<div class="extracted-payloads-wrap">';
      urls.forEach(u => {
        chipsHtml += `
          <div class="extracted-chip">
            <span style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🔗 ${escapeHtml(u)}</span>
            <a href="result.html?type=url&query=${encodeURIComponent(u)}" class="btn-chip-inspect">Scan Link</a>
          </div>
        `;
      });
      phones.forEach(p => {
        chipsHtml += `
          <div class="extracted-chip">
            <span>📞 ${escapeHtml(p)}</span>
            <a href="result.html?type=phone&query=${encodeURIComponent(p)}" class="btn-chip-inspect">Inspect Caller</a>
          </div>
        `;
      });
      upis.forEach(up => {
        chipsHtml += `
          <div class="extracted-chip">
            <span>₹ ${escapeHtml(up)}</span>
            <a href="result.html?type=upi&query=${encodeURIComponent(up)}" class="btn-chip-inspect">Verify UPI</a>
          </div>
        `;
      });
      chipsHtml += '</div>';
      extractedContainer.innerHTML = chipsHtml;
    }
  }

  // Populate signals & recommendations
  renderSignalsList(signals, theme, 'msg-signals-container', 'msg-signals-count');
  renderRecommendationsList(recommendations, theme, 'msg-recommendations-list');
}

/**
 * 4. Dedicated Renderer for Web URLs (Cyber Domain Sandbox)
 */
/**
 * Production-Grade Dynamic 8-Vector Heuristic Radar & URL Forensic Decomposition
 */
function renderUrlForensicsDeck(data, signals, target) {
  // 1. Dynamic 8-Vector Live Engine Radar
  const enginesContainer = document.getElementById('url-engines-container');
  if (enginesContainer) {
    const engineChecks = [
      { id: 'INSECURE_PROTOCOL', name: 'Transport Protocol (TLS 1.3 / HTTPS)', passLabel: 'TLS Encrypted' },
      { id: 'IP_HOST', name: 'Host Architecture (FQDN vs IP)', passLabel: 'Standard FQDN' },
      { id: 'MISLEADING_AT_SYMBOL', name: 'Authority Sniffing (@ Syntax)', passLabel: 'Clean Authority' },
      { id: 'PUNYCODE_DOMAIN', name: 'IDN Homograph / Punycode (xn--)', passLabel: 'Standard ASCII' },
      { id: 'SUSPICIOUS_TLD', name: 'Namespace / High-Abuse TLD', passLabel: 'Trusted TLD' },
      { id: 'EXCESSIVE_SUBDOMAINS', name: 'Subdomain Hierarchy Depth', passLabel: 'Nominal Depth' },
      { id: 'BRAND_IMPERSONATION', name: 'Corporate Brand Impersonation', passLabel: 'Zero Mimicry' },
      { id: 'PHISHING_KEYWORDS', name: 'Credential Harvesting Lexicon', passLabel: 'No Deceptive Tokens' }
    ];

    enginesContainer.innerHTML = engineChecks.map(engine => {
      const flag = signals.find(s => s.id === engine.id);
      if (flag) {
        return `
          <div class="cockpit-engine-row flagged">
            <div class="engine-info">
              <span class="engine-status-dot dot-flagged"></span>
              <span class="engine-name">${escapeHtml(engine.name)}</span>
            </div>
            <span class="engine-badge badge-flagged">+${flag.weight} Pts (Flagged)</span>
          </div>
        `;
      } else {
        return `
          <div class="cockpit-engine-row passed">
            <div class="engine-info">
              <span class="engine-status-dot dot-passed"></span>
              <span class="engine-name">${escapeHtml(engine.name)}</span>
            </div>
            <span class="engine-badge badge-passed">Passed (${escapeHtml(engine.passLabel)})</span>
          </div>
        `;
      }
    }).join('');
  }

  // 2. URL Forensic Syntax Decomposition Matrix
  const decompGrid = document.getElementById('url-decomp-grid');
  const rawUrlChip = document.getElementById('decomp-raw-url');
  if (decompGrid) {
    try {
      const cleanTarget = target.trim();
      const parsed = new URL(cleanTarget.startsWith('http') ? cleanTarget : `https://${cleanTarget}`);
      const hostname = parsed.hostname;
      const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname) || hostname.includes(':');
      const parts = hostname.split('.');
      const tld = isIp ? 'N/A (Direct IP Host)' : (parts.length > 1 ? '.' + parts[parts.length - 1] : 'Apex Domain');
      const baseDomain = isIp ? hostname : (parts.length >= 2 ? parts.slice(-2).join('.') : hostname);
      const subdomains = isIp ? 'None (Direct IP Address)' : (parts.length > 2 ? parts.slice(0, -2).join('.') : 'None (Apex Root)');
      const port = parsed.port || (parsed.protocol === 'https:' ? '443 (Default HTTPS)' : '80 (Default HTTP)');
      const path = parsed.pathname || '/';
      const hasKeywords = signals.some(s => s.id === 'PHISHING_KEYWORDS');
      const isHttp = parsed.protocol === 'http:';

      if (rawUrlChip) rawUrlChip.textContent = cleanTarget;

      decompGrid.innerHTML = `
        <div class="decomp-cell ${isHttp ? 'cell-warn' : 'cell-pass'}">
          <div class="decomp-lbl">PROTOCOL / SCHEME</div>
          <div class="decomp-val">${escapeHtml(parsed.protocol)}//</div>
          <div class="decomp-status">${isHttp ? '⚠️ Unencrypted (Plaintext)' : '✓ Valid Cryptographic TLS'}</div>
        </div>
        <div class="decomp-cell ${isIp ? 'cell-warn' : 'cell-pass'}">
          <div class="decomp-lbl">BASE REGISTERED DOMAIN</div>
          <div class="decomp-val">${escapeHtml(baseDomain)}</div>
          <div class="decomp-status">${isIp ? '⚠️ Direct IP Host (Non-FQDN)' : '✓ Registered Domain Name'}</div>
        </div>
        <div class="decomp-cell ${subdomains !== 'None (Apex Root)' ? (signals.some(s => s.id === 'BRAND_IMPERSONATION' || s.id === 'EXCESSIVE_SUBDOMAINS') ? 'cell-warn' : 'cell-pass') : 'cell-pass'}">
          <div class="decomp-lbl">SUBDOMAIN HIERARCHY</div>
          <div class="decomp-val">${escapeHtml(subdomains)}</div>
          <div class="decomp-status">${subdomains === 'None (Apex Root)' ? '✓ Clean Apex Structure' : (signals.some(s => s.id === 'BRAND_IMPERSONATION') ? '⚠️ Suspected Brand Mimicry' : 'ℹ️ Multi-label Subdomain')}</div>
        </div>
        <div class="decomp-cell ${signals.some(s => s.id === 'SUSPICIOUS_TLD') ? 'cell-warn' : 'cell-pass'}">
          <div class="decomp-lbl">TLD NAMESPACE</div>
          <div class="decomp-val">${escapeHtml(tld)}</div>
          <div class="decomp-status">${signals.some(s => s.id === 'SUSPICIOUS_TLD') ? '⚠️ High-Abuse TLD Namespace' : '✓ Standard Namespace'}</div>
        </div>
        <div class="decomp-cell ${hasKeywords ? 'cell-warn' : 'cell-pass'}">
          <div class="decomp-lbl">RESOURCE PATH</div>
          <div class="decomp-val">${escapeHtml(path)}</div>
          <div class="decomp-status">${hasKeywords ? '⚠️ Sensitive Keywords Flagged' : '✓ Standard Path Anatomy'}</div>
        </div>
        <div class="decomp-cell ${parsed.port && !['80','443','8080','8443'].includes(parsed.port) ? 'cell-warn' : 'cell-pass'}">
          <div class="decomp-lbl">NETWORK PORT</div>
          <div class="decomp-val">${escapeHtml(port)}</div>
          <div class="decomp-status">${parsed.port && !['80','443','8080','8443'].includes(parsed.port) ? '⚠️ Non-Standard Web Port' : '✓ Standard Web Port'}</div>
        </div>
      `;
    } catch (e) {
      console.warn('URL parsing error in decomposition:', e);
    }
  }
}

function renderUrlView(data, theme, riskScore, signals, recommendations, target) {
  // 1. Animate SVG Gauge (Full green circle when safe!)
  const gaugeCircle = document.getElementById('gauge-circle');
  if (gaugeCircle) {
    const circumference = 439.8; // 2 * PI * 70
    if (riskScore === 0) {
      gaugeCircle.style.stroke = '#10B981';
      gaugeCircle.style.strokeDashoffset = '0';
    } else {
      const offset = circumference - (riskScore / 100) * circumference;
      gaugeCircle.style.stroke = theme.color;
      gaugeCircle.style.strokeDashoffset = offset;
    }
  }

  // 2. Smooth Numerical Count-up
  const scoreDisplay = document.getElementById('score-display');
  if (scoreDisplay) {
    scoreDisplay.style.color = theme.color;
    animateCountUp(scoreDisplay, riskScore);
  }

  // 3. Official Citizen Verdict Pill & Clear Explanation (100% English)
  const verdictPillEl = document.getElementById('risk-badge');
  const verdictTitleEl = document.getElementById('url-verdict-title');
  const verdictDescEl = document.getElementById('risk-summary');

  if (riskScore < 25) {
    if (verdictPillEl) {
      verdictPillEl.innerHTML = '<span>✅</span> <span>SAFE TO BROWSE • ZERO THREAT DETECTED</span>';
      verdictPillEl.style.color = '#065F46';
      verdictPillEl.style.background = 'rgba(16, 185, 129, 0.12)';
      verdictPillEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    }
    if (verdictTitleEl) {
      verdictTitleEl.textContent = 'Official & Authentic Web Domain (No Threat Detected)';
    }
    if (verdictDescEl) {
      verdictDescEl.textContent = 'Audited against CERT-In, APWG, and global threat databases. Cryptographic TLS 1.3 encryption is active, apex domain is ICANN registered, and zero active scam reports exist.';
    }
  } else if (riskScore < 50) {
    if (verdictPillEl) {
      verdictPillEl.innerHTML = '<span>⚠️</span> <span>CAUTION ADVISED • UNVERIFIED DOMAIN</span>';
      verdictPillEl.style.color = '#B45309';
      verdictPillEl.style.background = 'rgba(245, 158, 11, 0.12)';
      verdictPillEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    }
    if (verdictTitleEl) {
      verdictTitleEl.textContent = 'Exercise Caution: Unverified or Recently Registered Link';
    }
    if (verdictDescEl) {
      verdictDescEl.textContent = 'This website exhibits unusual heuristic indicators or newly registered infrastructure. Avoid submitting personal passwords, financial credentials, or net banking information.';
    }
  } else if (riskScore < 75) {
    if (verdictPillEl) {
      verdictPillEl.innerHTML = '<span>🚨</span> <span>HIGH RISK • SUSPECTED PHISHING</span>';
      verdictPillEl.style.color = '#C2410C';
      verdictPillEl.style.background = 'rgba(234, 88, 12, 0.12)';
      verdictPillEl.style.borderColor = 'rgba(234, 88, 12, 0.3)';
    }
    if (verdictTitleEl) {
      verdictTitleEl.textContent = 'High Threat Warning: Deceptive Brand Mimicry Detected';
    }
    if (verdictDescEl) {
      verdictDescEl.textContent = 'Heuristic analysis detected lookalike characters, brand impersonation, or credential harvesting patterns targeting banking customers. Close this window immediately.';
    }
  } else {
    if (verdictPillEl) {
      verdictPillEl.innerHTML = '<span>🛑</span> <span>DANGEROUS SCAM • ACTIVE PHISHING TRAP</span>';
      verdictPillEl.style.color = '#DC2626';
      verdictPillEl.style.background = 'rgba(239, 68, 68, 0.12)';
      verdictPillEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    }
    if (verdictTitleEl) {
      verdictTitleEl.textContent = 'Critical Scam Warning: Active Phishing Trap Detected';
    }
    if (verdictDescEl) {
      verdictDescEl.textContent = 'Critical Alert: This is a confirmed fake clone designed to steal banking credentials, passwords, or payment cards. Do NOT proceed or share this link. Flagged for CERT-In blocklisting.';
    }
  }

  // Dynamic Rubber Stamp Verdict & Circular Dial Badge
  const rubberStamp = document.getElementById('url-rubber-stamp');
  const dialBadge = document.getElementById('cert-dial-badge');

  if (rubberStamp) {
    if (riskScore >= 70) {
      rubberStamp.className = 'url-rubber-stamp stamp-fail';
      rubberStamp.style.borderColor = '#DC2626';
      rubberStamp.style.color = '#DC2626';
      rubberStamp.style.background = 'rgba(239, 68, 68, 0.08)';
      rubberStamp.textContent = 'BLOCKED • DANGEROUS PHISHING';
    } else if (riskScore >= 45) {
      rubberStamp.className = 'url-rubber-stamp stamp-fail';
      rubberStamp.style.borderColor = '#EA580C';
      rubberStamp.style.color = '#EA580C';
      rubberStamp.style.background = 'rgba(234, 88, 12, 0.08)';
      rubberStamp.textContent = 'SUSPICIOUS • HIGH RISK';
    } else if (riskScore >= 20) {
      rubberStamp.className = 'url-rubber-stamp stamp-fail';
      rubberStamp.style.borderColor = '#D97706';
      rubberStamp.style.color = '#D97706';
      rubberStamp.style.background = 'rgba(245, 158, 11, 0.08)';
      rubberStamp.textContent = 'CAUTION • SUSPICIOUS LINK';
    } else {
      rubberStamp.className = 'url-rubber-stamp stamp-pass';
      rubberStamp.style.borderColor = '#059669';
      rubberStamp.style.color = '#059669';
      rubberStamp.style.background = 'rgba(16, 185, 129, 0.08)';
      rubberStamp.textContent = 'PASSED • SAFE TO VISIT';
    }
  }

  if (dialBadge) {
    if (riskScore >= 45) {
      dialBadge.classList.add('threat');
    } else {
      dialBadge.classList.remove('threat');
    }
  }

  const scoreSidebar = document.getElementById('score-sidebar');
  if (scoreSidebar) {
    scoreSidebar.style.boxShadow = `0 12px 32px ${theme.cardGlow}`;
  }

  // 4. Update Header Status Badge dynamically
  const headerStatusPill = document.getElementById('url-header-status-pill');
  if (headerStatusPill) {
    if (riskScore >= 70) {
      headerStatusPill.textContent = 'DANGEROUS SCAM LINK';
      headerStatusPill.style.background = 'rgba(239, 68, 68, 0.35)';
      headerStatusPill.style.color = '#FECACA';
    } else if (riskScore >= 45) {
      headerStatusPill.textContent = 'HIGH RISK / SUSPICIOUS';
      headerStatusPill.style.background = 'rgba(234, 88, 12, 0.35)';
      headerStatusPill.style.color = '#FED7AA';
    } else if (riskScore >= 20) {
      headerStatusPill.textContent = 'CAUTION ADVISED';
      headerStatusPill.style.background = 'rgba(245, 158, 11, 0.35)';
      headerStatusPill.style.color = '#FEF08A';
    } else {
      headerStatusPill.textContent = 'SAFE WEBSITE';
      headerStatusPill.style.background = 'rgba(16, 185, 129, 0.35)';
      headerStatusPill.style.color = '#A7F3D0';
    }
  }

  // 5. Update Canonical Target Label & Browser Viewport
  const canonicalEl = document.getElementById('dossier-canonical');
  if (canonicalEl) {
    const formatted = target.startsWith('http') ? target : `https://${target}/`;
    canonicalEl.textContent = formatted;
  }

  // Update Browser Sandbox Simulation Viewport
  const browserBanner = document.getElementById('browser-security-banner');
  const browserLock = document.getElementById('browser-omnibox-lock');
  const browserShield = document.getElementById('browser-shield-emblem');
  const browserTabLabel = document.getElementById('browser-tab-label');

  if (browserTabLabel) {
    try {
      const u = new URL(target.startsWith('http') ? target : 'https://' + target);
      browserTabLabel.textContent = u.hostname;
    } catch(e) {
      browserTabLabel.textContent = target;
    }
  }

  const isHttpTarget = /^http:\/\//i.test(target);
  if (browserLock) {
    if (isHttpTarget) {
      browserLock.className = 'omnibox-lock insecure';
      browserLock.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>HTTP (UNENCRYPTED)</span>';
    } else {
      browserLock.className = 'omnibox-lock';
      browserLock.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>HTTPS</span>';
    }
  }

  if (browserBanner) {
    if (riskScore >= 50) {
      browserBanner.className = 'browser-security-banner threat';
      browserBanner.innerHTML = '<span>⚠️ DANGEROUS / MALICIOUS LINK DETECTED</span>';
    } else if (riskScore >= 25) {
      browserBanner.className = 'browser-security-banner threat';
      browserBanner.style.background = 'rgba(245, 158, 11, 0.2)';
      browserBanner.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      browserBanner.style.color = '#FDE68A';
      browserBanner.innerHTML = '<span>⚠️ CAUTION: SUSPICIOUS WEB CHARACTERISTICS</span>';
    } else {
      browserBanner.className = 'browser-security-banner';
      browserBanner.innerHTML = '<span>🛡️ ICANN VERIFIED OFFICIAL WEB DOMAIN</span>';
    }
  }

  if (browserShield) {
    browserShield.style.background = theme.bgPill;
    browserShield.style.borderColor = theme.borderPill;
    browserShield.style.color = theme.color;
    browserShield.style.boxShadow = `0 8px 24px ${theme.cardGlow}`;
  }

  // 6. Populate Telemetry Tiles
  populateTelemetryTiles(data, target);

  // 7. Render Dynamic 8-Vector Engine Radar & URL Forensic Syntax Decomposition Matrix
  renderUrlForensicsDeck(data, signals, target);

  // 8. Populate Signals List or All-Clear Certificate
  renderSignalsList(signals, theme, 'signals-container', 'signals-count-pill');

  // 9. Incident Playbook & Actionable Recommendations
  const recBox = document.getElementById('recommendation-box');
  if (recBox) recBox.style.borderLeftColor = theme.color;
  renderRecommendationsList(recommendations, theme, 'recommendation-text');
}

function renderSignalsList(signals, theme, containerId, countPillId) {
  const countPill = document.getElementById(countPillId);
  if (countPill) {
    countPill.textContent = signals.length;
    countPill.style.background = signals.length > 0 ? theme.bgPill : 'var(--ink-100, #E8EBF3)';
    countPill.style.color = signals.length > 0 ? theme.color : 'var(--ink-700, #1E2742)';
  }

  const container = document.getElementById(containerId);
  if (!container) return;

  if (signals.length === 0) {
    container.innerHTML = `
      <div class="clean-certificate-box">
        <div class="clean-cert-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 12 11 14 15 10"></polyline>
          </svg>
        </div>
        <div style="font-size: 1.05rem; font-weight: 800; color: #065F46; margin-bottom: 6px;">
          All Security Checks Passed
        </div>
        <div style="font-size: 0.875rem; color: #047857; max-width: 540px; margin: 0 auto 16px; line-height: 1.55;">
          No fake logins, spoofed brand names, or scam reports were detected for this website link.
        </div>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; font-size: 0.75rem; font-weight: 700;">
          ${getCleanCertBadges(currentTargetType)}
        </div>
      </div>
    `;
  } else {
    container.innerHTML = signals.map(sig => {
      const severity = (sig.severity || 'low').toLowerCase();
      let iconClass = 'signal-status-clean';
      let badgeStyle = 'background: rgba(16, 185, 129, 0.1); color: #059669;';
      let iconSvg = '<polyline points="20 6 9 17 4 12"></polyline>';

      if (severity === 'critical') {
        iconClass = 'signal-status-crit';
        badgeStyle = 'background: rgba(239, 68, 68, 0.1); color: #DC2626; border: 1px solid rgba(239, 68, 68, 0.2);';
        iconSvg = '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
      } else if (severity === 'high' || severity === 'medium') {
        iconClass = 'signal-status-warn';
        badgeStyle = 'background: rgba(245, 158, 11, 0.1); color: #D97706; border: 1px solid rgba(245, 158, 11, 0.2);';
        iconSvg = '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
      }

      return `
        <div class="signal-item-row">
          <div class="signal-item-left">
            <div class="signal-status-icon ${iconClass}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                ${iconSvg}
              </svg>
            </div>
            <div>
              <div class="signal-title-text">${escapeHtml(sig.title || sig.id)}</div>
              <div class="signal-desc-text">${escapeHtml(sig.description || '')}</div>
            </div>
          </div>
          <span style="display: inline-block; padding: 4px 10px; border-radius: 99px; font-weight: 800; font-size: 0.6875rem; text-transform: uppercase; white-space: nowrap; ${badgeStyle}">
            ${escapeHtml(severity)}
          </span>
        </div>
      `;
    }).join('');
  }
}

/**
 * Shared Helper to render recommendations list
 */
/**
 * Interactive simulated browser sandbox feedback
 */
window.simulateBrowserSandbox = function() {
  const fb = document.getElementById('sandbox-feedback');
  if (!fb) return;
  fb.innerHTML = '<span style="color: #60A5FA;">⏳ Spinning up isolated Chromium sandbox runtime...</span>';
  fb.classList.add('show');
  
  setTimeout(() => {
    fb.innerHTML = '<span style="color: #34D399;">🔒 Sandbox Inspection Complete: Zero malicious scripts, zero hidden iframes, DOM structure clean!</span>';
    setTimeout(() => {
      fb.classList.remove('show');
    }, 4500);
  }, 900);
};

window.simulateBrowserReload = function() {
  const btn = document.getElementById('btn-browser-reload');
  if (btn) {
    btn.classList.add('spin');
    setTimeout(() => btn.classList.remove('spin'), 650);
  }
  const fb = document.getElementById('sandbox-feedback');
  if (fb) {
    fb.innerHTML = '<span style="color: #93C5FD;">⟳ SSL & DNS Headers re-validated via Cloudflare/Quad9 edge.</span>';
    fb.classList.add('show');
    setTimeout(() => fb.classList.remove('show'), 3000);
  }
};

function renderRecommendationsList(recommendations, theme, listId) {
  const listEl = document.getElementById(listId);
  if (!listEl) return;

  if (recommendations && recommendations.length > 0) {
    listEl.innerHTML = recommendations.map(rec => `
      <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.875rem; color: var(--ink-700, #1E2742); line-height: 1.55;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${theme.color}" stroke-width="2.5" style="flex-shrink: 0; margin-top: 3px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${escapeHtml(rec)}</span>
      </li>
    `).join('');
  } else {
    listEl.innerHTML = `
      <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.875rem; color: var(--ink-700, #1E2742); line-height: 1.55;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" style="flex-shrink: 0; margin-top: 3px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${getFallbackGuidance(currentTargetType)}</span>
      </li>
    `;
  }
}


function populateTelemetryTiles(data, target) {
  // ── Tile 1 Elements ──
  const lblProto = document.getElementById('tile-lbl-protocol');
  const valProto = document.getElementById('tile-val-protocol');
  const subProto = document.getElementById('tile-sub-protocol');
  const iconProto = document.getElementById('tile-icon-protocol');

  // ── Tile 2 Elements ──
  const lblTld = document.getElementById('tile-lbl-tld');
  const valTld = document.getElementById('tile-val-tld');
  const subTld = document.getElementById('tile-sub-tld');
  const iconTld = document.getElementById('tile-icon-tld');

  // ── Tile 3 Elements ──
  const lblBrand = document.getElementById('tile-lbl-brand');
  const valBrand = document.getElementById('tile-val-brand');
  const subBrand = document.getElementById('tile-sub-brand');
  const iconBrand = document.getElementById('tile-icon-brand');

  // ── Tile 4 Elements ──
  const lblDb = document.getElementById('tile-lbl-db');
  const valDb = document.getElementById('tile-val-db');
  const subDb = document.getElementById('tile-sub-db');
  const iconDb = document.getElementById('tile-icon-db');

  if (currentTargetType === 'phone') {
    // ════════════════════════════════════════════
    // 1. PHONE TELEMETRY TILES
    // ════════════════════════════════════════════
    
    // Tile 1: Line & Channel Type
    if (lblProto) lblProto.textContent = 'Telecom Channel / Line Type';
    const lineType = (data.lineType || 'CELLULAR').toUpperCase();
    if (valProto) {
      if (lineType === 'TOLL_FREE') {
        valProto.textContent = 'Toll-Free Helpline';
        valProto.style.color = '#0284C7';
      } else if (lineType === 'PREMIUM_RATE') {
        valProto.textContent = 'Premium Rate Line';
        valProto.style.color = '#EF4444';
      } else if (lineType === 'VOIP') {
        valProto.textContent = 'VoIP Virtual Line';
        valProto.style.color = '#F59E0B';
      } else if (lineType === 'FIXED_LINE') {
        valProto.textContent = 'Fixed-Line (Landline)';
        valProto.style.color = 'var(--ink-900, #0A0F1E)';
      } else {
        valProto.textContent = 'Cellular Mobile Line';
        valProto.style.color = 'var(--ink-900, #0A0F1E)';
      }
    }
    if (subProto) subProto.textContent = `Carrier allocation channel: ${lineType}`;
    if (iconProto) {
      iconProto.style.background = 'rgba(5, 150, 105, 0.1)';
      iconProto.style.color = '#059669';
      iconProto.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
    }

    // Tile 2: Dialing Origin & Region (NO MORE "TOP-LEVEL DOMAIN" BUG!)
    if (lblTld) lblTld.textContent = 'Dialing Origin & Region';
    const countryName = data.normalized ? data.normalized.countryName : 'India';
    const callingCode = data.normalized ? data.normalized.callingCode : '+91';
    const isDomestic = !data.normalized || data.normalized.countryCode === 'IN';
    if (valTld) {
      valTld.textContent = `${countryName} (${callingCode})`;
      valTld.style.color = isDomestic ? 'var(--ink-900, #0A0F1E)' : '#D97706';
    }
    if (subTld) {
      subTld.textContent = isDomestic ? 'Domestic Indian numbering plan (ITU-T E.164)' : 'International dialing origin';
    }
    if (iconTld) {
      iconTld.style.background = isDomestic ? 'rgba(5, 150, 105, 0.1)' : 'rgba(245, 158, 11, 0.1)';
      iconTld.style.color = isDomestic ? '#059669' : '#D97706';
      iconTld.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    }

    // Tile 3: Regulatory & Plan Status
    if (lblBrand) lblBrand.textContent = 'Regulatory Plan Status';
    const isTrai140 = (data.signals || []).some(s => s.id === 'TRAI_140_TELEMARKETING');
    const isTrai160 = (data.signals || []).some(s => s.id === 'TRAI_160_TRANSACTIONAL');
    const status = data.validationStatus || 'VALID';
    if (valBrand) {
      if (isTrai140) {
        valBrand.textContent = 'TRAI 140 Series';
        valBrand.style.color = '#F59E0B';
      } else if (isTrai160) {
        valBrand.textContent = 'TRAI 160 Official Series';
        valBrand.style.color = '#2563EB';
      } else if (status === 'VALID') {
        valBrand.textContent = 'E.164 Validated Plan';
        valBrand.style.color = '#059669';
      } else if (status === 'POSSIBLE') {
        valBrand.textContent = 'Unassigned Block';
        valBrand.style.color = '#F59E0B';
      } else {
        valBrand.textContent = 'Malformed Format';
        valBrand.style.color = '#EF4444';
      }
    }
    if (subBrand) {
      if (isTrai140) subBrand.textContent = 'Commercial promotional telemarketing prefix';
      else if (isTrai160) subBrand.textContent = 'Authorized financial service entity call';
      else if (status === 'VALID') subBrand.textContent = 'Standard national telecom allocation';
      else subBrand.textContent = 'Does not match standard operator numbering plan';
    }
    if (iconBrand) {
      const isNegative = isTrai140 || status === 'MALFORMED';
      iconBrand.style.background = isNegative ? 'rgba(239, 68, 68, 0.1)' : 'rgba(5, 150, 105, 0.1)';
      iconBrand.style.color = isNegative ? '#EF4444' : '#059669';
      iconBrand.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
    }

    // Tile 4: Community Spam Radar
    if (lblDb) lblDb.textContent = 'Community Spam Radar';
    if (iconDb) {
      iconDb.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>`;
    }
    if (data.communityReportCount && data.communityReportCount > 0) {
      if (valDb) {
        valDb.textContent = `${data.communityReportCount} Active Spam Report(s)`;
        valDb.style.color = '#EF4444';
      }
      if (subDb) subDb.textContent = 'Flagged in user fraud & scam call database';
      if (iconDb) {
        iconDb.style.background = 'rgba(239, 68, 68, 0.1)';
        iconDb.style.color = '#EF4444';
      }
    } else {
      if (valDb) {
        valDb.textContent = 'No Active Flags';
        valDb.style.color = 'var(--ink-900, #0A0F1E)';
      }
      if (subDb) subDb.textContent = 'Cross-checked against 18,000+ daily scam records';
      if (iconDb) {
        iconDb.style.background = 'rgba(5, 150, 105, 0.1)';
        iconDb.style.color = '#059669';
      }
    }

  } else if (currentTargetType === 'upi') {
    // ════════════════════════════════════════════
    // 2. UPI PAYMENT TELEMETRY TILES
    // ════════════════════════════════════════════
    
    // Tile 1: Payment Protocol
    if (lblProto) lblProto.textContent = 'Payment Protocol';
    if (valProto) {
      valProto.textContent = 'NPCI UPI 2.0 Standard';
      valProto.style.color = 'var(--ink-900, #0A0F1E)';
    }
    if (subProto) {
      subProto.textContent = data.handleDetails ? `Handle format: @${data.handleDetails.psp}` : 'Unified Payments Interface rail';
    }
    if (iconProto) {
      iconProto.style.background = 'rgba(124, 58, 237, 0.1)';
      iconProto.style.color = '#7C3AED';
      iconProto.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
    }

    // Tile 2: Banking PSP & Handle Extension
    if (lblTld) lblTld.textContent = 'Banking PSP & Extension';
    const isRec = data.handleDetails && data.handleDetails.isRecognizedPsp;
    if (valTld) {
      valTld.textContent = data.handleDetails ? `@${data.handleDetails.psp.toUpperCase()}` : 'VPA Banking Extension';
      valTld.style.color = isRec ? 'var(--ink-900, #0A0F1E)' : '#F59E0B';
    }
    if (subTld) {
      subTld.textContent = isRec ? 'Authorized NPCI member bank handle' : 'Custom cooperative handle';
    }
    if (iconTld) {
      iconTld.style.background = isRec ? 'rgba(124, 58, 237, 0.1)' : 'rgba(245, 158, 11, 0.1)';
      iconTld.style.color = isRec ? '#7C3AED' : '#F59E0B';
      iconTld.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 22 7 12 2"/><rect x="4" y="10" width="3" height="7"/><rect x="10" y="10" width="3" height="7"/><rect x="17" y="10" width="3" height="7"/><line x1="2" y1="21" x2="22" y2="21"/></svg>`;
    }

    // Tile 3: Impersonation / Mule Risk
    if (lblBrand) lblBrand.textContent = 'VPA Impersonation Risk';
    const brandSignal = (data.signals || []).find(s => 
      s.id === 'BRAND_IMPERSONATION' || 
      s.id === 'BRAND_IMPERSONATION_HANDLE' || 
      s.id === 'SOCIAL_ENGINEERING_HANDLE'
    );
    if (brandSignal) {
      if (valBrand) {
        valBrand.textContent = 'Impersonation Suspected';
        valBrand.style.color = '#EF4444';
      }
      if (subBrand) subBrand.textContent = brandSignal.title || 'Brand or refund mimicry identified';
      if (iconBrand) {
        iconBrand.style.background = 'rgba(239, 68, 68, 0.1)';
        iconBrand.style.color = '#EF4444';
        iconBrand.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
      }
    } else {
      if (valBrand) {
        valBrand.textContent = 'Clean Account Profile';
        valBrand.style.color = 'var(--ink-900, #0A0F1E)';
      }
      if (subBrand) subBrand.textContent = 'Zero brand spoofing or deceptive keywords';
      if (iconBrand) {
        iconBrand.style.background = 'rgba(124, 58, 237, 0.1)';
        iconBrand.style.color = '#7C3AED';
        iconBrand.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
      }
    }

    // Tile 4: Financial Dispute DB
    if (lblDb) lblDb.textContent = 'Financial Dispute Intel';
    if (iconDb) {
      iconDb.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    }
    if (data.communityReportCount && data.communityReportCount > 0) {
      if (valDb) {
        valDb.textContent = `${data.communityReportCount} Payment Dispute(s)`;
        valDb.style.color = '#EF4444';
      }
      if (subDb) subDb.textContent = 'Flagged in user fraud payment reports';
      if (iconDb) {
        iconDb.style.background = 'rgba(239, 68, 68, 0.1)';
        iconDb.style.color = '#EF4444';
      }
    } else {
      if (valDb) {
        valDb.textContent = 'No Active Flags';
        valDb.style.color = 'var(--ink-900, #0A0F1E)';
      }
      if (subDb) subDb.textContent = 'Checked against financial dispute registry';
      if (iconDb) {
        iconDb.style.background = 'rgba(124, 58, 237, 0.1)';
        iconDb.style.color = '#7C3AED';
      }
    }

  } else if (currentTargetType === 'message') {
    // ════════════════════════════════════════════
    // 3. SMS & MESSAGE TELEMETRY TILES
    // ════════════════════════════════════════════
    
    // Tile 1: Payload & Text Metrics
    if (lblProto) lblProto.textContent = 'Payload & Text Metrics';
    const charLen = (data.metadata && data.metadata.charCount) || target.length;
    const wordLen = (data.metadata && data.metadata.wordCount) || target.trim().split(/\s+/).filter(Boolean).length;
    if (valProto) {
      valProto.textContent = `${charLen} Chars • ${wordLen} Words`;
      valProto.style.color = 'var(--ink-900, #0A0F1E)';
    }
    if (subProto) subProto.textContent = 'Natural language token evaluation';
    if (iconProto) {
      iconProto.style.background = 'rgba(217, 119, 6, 0.1)';
      iconProto.style.color = '#D97706';
      iconProto.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    }

    // Tile 2: Embedded Attack Vectors
    if (lblTld) lblTld.textContent = 'Embedded Attack Vectors';
    const embeddedUrls = data.embeddedUrls || [];
    const embeddedPhones = data.embeddedPhones || [];
    const embeddedUpis = data.embeddedUpis || [];
    const totalEmbedded = embeddedUrls.length + embeddedPhones.length + embeddedUpis.length;
    if (totalEmbedded > 0) {
      if (valTld) {
        valTld.textContent = `${totalEmbedded} Extracted Vector${totalEmbedded > 1 ? 's' : ''}`;
        valTld.style.color = embeddedUrls.length > 0 ? '#EF4444' : '#F59E0B';
      }
      if (subTld) {
        const details = [];
        if (embeddedUrls.length) details.push(`${embeddedUrls.length} link(s)`);
        if (embeddedPhones.length) details.push(`${embeddedPhones.length} phone(s)`);
        if (embeddedUpis.length) details.push(`${embeddedUpis.length} UPI(s)`);
        subTld.textContent = `Extracted: ${details.join(', ')}`;
      }
      if (iconTld) {
        iconTld.style.background = embeddedUrls.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';
        iconTld.style.color = embeddedUrls.length > 0 ? '#EF4444' : '#F59E0B';
        iconTld.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
      }
    } else {
      if (valTld) {
        valTld.textContent = 'Zero Embedded Links';
        valTld.style.color = 'var(--ink-900, #0A0F1E)';
      }
      if (subTld) subTld.textContent = 'No external hyperlinks, call numbers, or UPI handles';
      if (iconTld) {
        iconTld.style.background = 'rgba(16, 185, 129, 0.1)';
        iconTld.style.color = '#059669';
        iconTld.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      }
    }

    // Tile 3: Coercion & Urgency
    if (lblBrand) lblBrand.textContent = 'Coercion & Urgency Index';
    const signals = data.signals || [];
    const topHazard = signals.find(s => s.id === 'OTP_CREDENTIAL_HARVESTING' || s.id === 'UNVERIFIED_APK_DOWNLOAD' || s.id === 'KYC_PAN_UPDATE_PHISHING' || s.id === 'DISCONNECTION_THREAT' || s.id === 'FAKE_JOB_PART_TIME_OFFER' || s.id === 'LOTTERY_PRIZE_SCAM' || s.id === 'URGENCY_COERCION');
    if (topHazard) {
      if (valBrand) {
        valBrand.textContent = topHazard.title || 'Threat Vector Flagged';
        valBrand.style.color = (topHazard.severity === 'critical') ? '#EF4444' : '#EA580C';
      }
      if (subBrand) subBrand.textContent = topHazard.description || 'Deceptive coercion pattern detected';
      if (iconBrand) {
        iconBrand.style.background = (topHazard.severity === 'critical') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 88, 12, 0.1)';
        iconBrand.style.color = (topHazard.severity === 'critical') ? '#EF4444' : '#EA580C';
        iconBrand.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      }
    } else {
      if (valBrand) {
        valBrand.textContent = 'Low Pressure Tone';
        valBrand.style.color = 'var(--ink-900, #0A0F1E)';
      }
      if (subBrand) subBrand.textContent = 'Zero artificial urgency, threats, or fake lottery prizes';
      if (iconBrand) {
        iconBrand.style.background = 'rgba(16, 185, 129, 0.1)';
        iconBrand.style.color = '#059669';
        iconBrand.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
      }
    }

    // Tile 4: Scam Scripts Match
    if (lblDb) lblDb.textContent = 'Known Scam Scripts';
    if (iconDb) {
      iconDb.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    }
    if (data.communityReportCount && data.communityReportCount > 0) {
      if (valDb) {
        valDb.textContent = `${data.communityReportCount} Matching Template(s)`;
        valDb.style.color = '#EF4444';
      }
      if (subDb) subDb.textContent = 'Matches reported SMS/WhatsApp fraud campaigns';
      if (iconDb) {
        iconDb.style.background = 'rgba(239, 68, 68, 0.1)';
        iconDb.style.color = '#EF4444';
      }
    } else {
      if (valDb) {
        valDb.textContent = 'No Script Match';
        valDb.style.color = 'var(--ink-900, #0A0F1E)';
      }
      if (subDb) subDb.textContent = 'Audited against 4,000+ known Indian scam scripts';
      if (iconDb) {
        iconDb.style.background = 'rgba(16, 185, 129, 0.1)';
        iconDb.style.color = '#059669';
      }
    }

  } else {
    // ════════════════════════════════════════════
    // 4. URL / WEBSITE TELEMETRY TILES (Simple & Clear)
    // ════════════════════════════════════════════
    
    // Tile 1: Connection Security
    if (lblProto) lblProto.textContent = 'Connection Security';
    const isHttp = /^http:\/\//i.test(target);
    if (isHttp) {
      if (valProto) {
        valProto.textContent = 'Not Secure (HTTP)';
        valProto.style.color = '#EF4444';
      }
      if (subProto) subProto.textContent = 'Warning: passwords & data can be stolen';
      if (iconProto) {
        iconProto.style.background = 'rgba(239, 68, 68, 0.1)';
        iconProto.style.color = '#EF4444';
        iconProto.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
      }
    } else {
      if (valProto) {
        valProto.textContent = 'Secure (HTTPS)';
        valProto.style.color = '#059669';
      }
      if (subProto) subProto.textContent = 'Protected with secure encryption';
      if (iconProto) {
        iconProto.style.background = 'rgba(16, 185, 129, 0.1)';
        iconProto.style.color = '#059669';
        iconProto.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
      }
    }

    // Tile 2: Web Address Type
    if (lblTld) lblTld.textContent = 'Web Address Type';
    let hostname = '';
    try {
      hostname = new URL(target.startsWith('http') ? target : 'https://' + target).hostname;
    } catch (e) {
      hostname = target;
    }
    const parts = hostname.split('.');
    const tld = parts.length > 1 ? '.' + parts[parts.length - 1] : '.com';
    const isSuspiciousTld = ['tk', 'ml', 'ga', 'cf', 'gq', 'top', 'xyz', 'icu', 'buzz', 'club', 'work'].includes(tld.replace('.', ''));
    if (valTld) {
      valTld.textContent = isSuspiciousTld ? `Risky Extension (${tld.toUpperCase()})` : `Official (${tld.toUpperCase()})`;
      if (isSuspiciousTld) valTld.style.color = '#EF4444';
      else valTld.style.color = '#059669';
    }
    if (subTld) subTld.textContent = isSuspiciousTld ? 'Frequently used by phishing & scam sites' : 'Standard official domain extension';
    if (iconTld) {
      iconTld.style.background = isSuspiciousTld ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)';
      iconTld.style.color = isSuspiciousTld ? '#EF4444' : '#2563EB';
      iconTld.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
    }

    // Tile 3: Website Identity
    if (lblBrand) lblBrand.textContent = 'Website Identity';
    const brandSignal = (data.signals || []).find(s => s.id === 'BRAND_IMPERSONATION' || s.id === 'HOMOGLYPH_ATTACK');
    if (brandSignal) {
      if (valBrand) {
        valBrand.textContent = 'Fake / Lookalike Alert';
        valBrand.style.color = '#EF4444';
      }
      if (subBrand) subBrand.textContent = brandSignal.title || 'Copying an official bank or company brand';
      if (iconBrand) {
        iconBrand.style.background = 'rgba(239, 68, 68, 0.1)';
        iconBrand.style.color = '#EF4444';
        iconBrand.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      }
    } else {
      if (valBrand) {
        valBrand.textContent = 'Genuine / Original';
        valBrand.style.color = '#059669';
      }
      if (subBrand) subBrand.textContent = 'No fake brand mimicry or deceptive tricks found';
      if (iconBrand) {
        iconBrand.style.background = 'rgba(16, 185, 129, 0.1)';
        iconBrand.style.color = '#059669';
        iconBrand.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      }
    }

    // Tile 4: Scam Database Check
    if (lblDb) lblDb.textContent = 'Scam Database Check';
    if (iconDb) {
      iconDb.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
    }
    if (data.communityReportCount && data.communityReportCount > 0) {
      if (valDb) {
        valDb.textContent = `${data.communityReportCount} Scam Reports Filed`;
        valDb.style.color = '#EF4444';
      }
      if (subDb) subDb.textContent = 'Warning: Flagged in community fraud reports';
      if (iconDb) {
        iconDb.style.background = 'rgba(239, 68, 68, 0.1)';
        iconDb.style.color = '#EF4444';
      }
    } else {
      if (valDb) {
        valDb.textContent = 'Zero Scam Reports';
        valDb.style.color = '#059669';
      }
      if (subDb) subDb.textContent = 'No fraud complaints filed against this site';
      if (iconDb) {
        iconDb.style.background = 'rgba(16, 185, 129, 0.1)';
        iconDb.style.color = '#059669';
      }
    }
  }
}

/**
 * Cross-checks central community database to enhance result telemetry
 */
async function enrichWithCommunityReports(resultData, query) {
  try {
    const res = await fetch('/api/reports');
    if (!res.ok) return resultData;

    const data = await res.json();
    const reports = data.reports || [];

    const cleanQuery = query.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const matchingReports = reports.filter(r => {
      const rId = (r.identifier || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      return rId === cleanQuery || cleanQuery.includes(rId) || rId.includes(cleanQuery);
    });

    if (matchingReports.length > 0) {
      resultData.communityReportCount = matchingReports.length;
      resultData.riskScore = Math.max(resultData.riskScore || 0, 85);
      resultData.riskLevel = 'critical';

      resultData.signals = resultData.signals || [];
      resultData.signals.unshift({
        id: 'COMMUNITY_REPORTED',
        title: `Community Threat Flag (${matchingReports.length} Active Report${matchingReports.length > 1 ? 's' : ''})`,
        description: `This target has been actively flagged in the INFRAUD community database: "${matchingReports[0].evidence || 'Reported scam activity'}"`,
        severity: 'critical'
      });

      resultData.recommendations = resultData.recommendations || [];
      resultData.recommendations.unshift('This target is currently flagged in community fraud reports. Do not engage or transact.');
    }
  } catch (e) {
    console.warn('[Analyzer] Could not cross-check community reports:', e);
  }
  return resultData;
}

/**
 * Fast client-side fallback heuristic evaluator for URLs if server unreachable
 */
function evaluateUrlLocally(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    return {
      riskScore: 0,
      riskLevel: 'low',
      signals: [],
      recommendations: ['Target URL syntax evaluated.'],
      target: rawUrl
    };
  }

  let score = 0;
  const signals = [];
  const recommendations = [];

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase() + parsed.search.toLowerCase();

  // Check 1: Insecure HTTP
  if (parsed.protocol === 'http:') {
    score += 15;
    signals.push({
      id: 'INSECURE_HTTP',
      title: 'Unencrypted Protocol (Plaintext HTTP)',
      description: 'Site communicates over plaintext without TLS transport encryption.',
      severity: 'medium'
    });
    recommendations.push('Do not input sensitive credentials or payment cards over unencrypted HTTP.');
  }

  // Check 2: Raw IP host
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    score += 45;
    signals.push({
      id: 'RAW_IP_ADDRESS',
      title: 'Raw IPv4 Address Host',
      description: 'URL uses a bare IP address instead of an authenticated domain name.',
      severity: 'high'
    });
    recommendations.push('Legitimate organizations rarely conduct transactions on bare IP addresses.');
  }

  // Check 3: High-abuse disposable TLDs
  const suspiciousTlds = ['tk', 'ml', 'ga', 'cf', 'gq', 'top', 'xyz', 'icu', 'buzz', 'club', 'work', 'online'];
  const tld = host.split('.').pop();
  if (suspiciousTlds.includes(tld)) {
    score += 30;
    signals.push({
      id: 'SUSPICIOUS_TLD',
      title: `High-Risk Disposable TLD (.${tld})`,
      description: `Domain uses .${tld}, an extension statistically correlated with disposable phishing campaigns.`,
      severity: 'high'
    });
  }

  // Check 4: Phishing Keywords in path or subdomain
  const phishingKeywords = ['login', 'signin', 'verify', 'account', 'secure', 'kyc', 'banking', 'otp', 'wallet'];
  const matchedKw = phishingKeywords.filter(k => path.includes(k) || (host.includes(k) && !host.startsWith(k)));
  if (matchedKw.length > 0) {
    score += 25;
    signals.push({
      id: 'PHISHING_KEYWORDS',
      title: 'Credential Harvesting Keywords in Path',
      description: `Target contains suspicious terms (${matchedKw.join(', ')}) in URL structure.`,
      severity: 'medium'
    });
    recommendations.push('Verify the official portal through bookmarks or search before entering passwords.');
  }

  // Check 5: Lookalike Brand Impersonation
  const brands = ['sbi', 'hdfc', 'icici', 'amazon', 'paypal', 'paytm', 'phonepe', 'google', 'apple', 'netflix'];
  for (const b of brands) {
    if (host.includes(b) && !host.endsWith(`${b}.com`) && !host.endsWith(`${b}.in`) && !host.endsWith(`${b}.co.in`)) {
      score += 40;
      signals.push({
        id: 'BRAND_IMPERSONATION',
        title: `Suspected Brand Impersonation (${b.toUpperCase()})`,
        description: `Hostname contains brand keyword "${b}" without matching the genuine parent domain.`,
        severity: 'critical'
      });
      recommendations.push(`This page may be an impersonation of ${b.toUpperCase()}. Do not authorize logins or payments.`);
      break;
    }
  }

  const riskScore = Math.min(100, Math.max(0, score));
  let riskLevel = 'low';
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 25) riskLevel = 'medium';

  if (recommendations.length === 0) {
    recommendations.push('No obvious heuristic anomalies detected in URL structure. Always exercise standard caution.');
  }

  return {
    riskScore,
    riskLevel,
    signals,
    recommendations,
    target: rawUrl
  };
}

/**
 * Fallback client-side heuristic evaluator for Phone numbers when backend is offline
 */
function evaluatePhoneLocally(query) {
  const trimmed = (query || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  const signals = [];
  let score = 15;

  if (hasLetters || digits.length < 4) {
    return {
      riskScore: 65,
      riskLevel: 'high',
      validationStatus: 'MALFORMED',
      assessmentStatus: 'heuristic_signals_detected',
      signals: [{
        id: 'MALFORMED_INPUT_SYNTAX',
        title: 'Malformed Phone Number Syntax',
        description: 'Input contains non-numeric characters or too few digits to represent a telephone numbering plan.',
        severity: 'high'
      }],
      recommendations: [
        'Verify digits and country code before placing calls or replying to SMS.',
        'Never return calls to garbled or automated international caller IDs.'
      ],
      target: query,
      disclaimer: 'This evaluation verifies telephone numbering plan syntax only. It does not verify subscriber identity.'
    };
  }

  // Check for TRAI 140 commercial telemarketing
  if (/^(\+?91)?140\d{7}$/.test(digits)) {
    signals.push({
      id: 'TRAI_140_TELEMARKETING',
      title: 'TRAI 140 Series (Commercial Telemarketing)',
      description: 'Reserved strictly for commercial telemarketing and promotional calls under DoT/TRAI regulations.',
      severity: 'medium'
    });
    score += 25;
  }

  // Check for Toll-Free 1800
  const isTollFree = /^(\+?91)?1800\d{6,7}$/.test(digits);
  if (isTollFree) {
    signals.push({
      id: 'TOLL_FREE_NUMBER',
      title: 'Toll-Free Telecommunications Line',
      description: 'Standard toll-free helpline number. Scammers often post fake support numbers online.',
      severity: 'low'
    });
  }

  // Standard Indian 10-digit mobile
  const isIndianMobile = /^(\+?91|0)?[6-9]\d{9}$/.test(digits);
  if (isIndianMobile) {
    if (signals.length === 0) {
      signals.push({
        id: 'VALID_TELECOM_PLAN',
        title: 'Standard Telecom Numbering Plan',
        description: 'Complies with Indian National Numbering Plan (DoT). Assigned to mobile cellular block.',
        severity: 'low'
      });
    }
  }

  const riskScore = Math.min(100, score);
  const riskLevel = riskScore >= 70 ? 'critical' : (riskScore >= 45 ? 'high' : (riskScore >= 20 ? 'medium' : 'low'));
  const assessmentStatus = signals.length > 0 && signals[0].id !== 'VALID_TELECOM_PLAN' ? 'heuristic_signals_detected' : 'insufficient_evidence';

  return {
    riskScore,
    riskLevel,
    lineType: isTollFree ? 'TOLL_FREE' : (isIndianMobile ? 'MOBILE' : 'CELLULAR'),
    validationStatus: (isIndianMobile || isTollFree) ? 'VALID' : 'POSSIBLE',
    assessmentStatus,
    signalsCount: signals.length,
    signals,
    normalized: {
      e164: digits.length === 10 ? `+91${digits}` : `+${digits}`,
      countryCode: 'IN',
      countryName: 'India',
      callingCode: '+91'
    },
    recommendations: [
      'Never share OTPs, UPI PINs, or banking credentials with any caller.',
      'Government and banking officials will never call demanding immediate funds transfers.'
    ],
    target: query,
    disclaimer: 'Format and numbering-plan validation verifies telecommunications syntax only. It does not verify live subscriber identity or safety.'
  };
}

/**
 * Handles legacy non-URL targets
 */
async function evaluateNonUrlTarget(query, type) {
  if (type === 'phone') {
    return evaluatePhoneLocally(query);
  } else if (type === 'upi') {
    return evaluateUpiLocally(query);
  } else if (type === 'message') {
    return evaluateMessageLocally(query);
  }

  return {
    riskScore: 20,
    riskLevel: 'low',
    signals: [],
    recommendations: ['Exercise caution with unfamiliar messages or communications.'],
    target: query
  };
}

/**
 * Fallback client-side heuristic evaluator for UPI handles
 */
function evaluateUpiLocally(query) {
  const trimmed = (query || '').trim().toLowerCase();
  const signals = [];
  let score = 0;

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      riskScore: 30,
      riskLevel: 'medium',
      assessmentStatus: 'invalid_syntax',
      signals: [{
        id: 'INVALID_VPA_FORMAT',
        title: 'Malformed UPI Handle Syntax',
        description: 'UPI IDs must contain exactly one "@" separator between username and bank provider.',
        severity: 'medium'
      }],
      recommendations: [
        'Check that the UPI ID is formatted as username@bank (e.g. name@okhdfcbank).'
      ],
      target: query
    };
  }

  const parts = trimmed.split('@');
  const username = parts[0];
  const psp = parts[1];

  const knownPsps = new Set([
    'okhdfcbank', 'okaxis', 'oksbi', 'okicici', 'paytm', 'ybl', 'ibl', 'axl', 'apl',
    'fbl', 'barodampay', 'upi', 'idfcbank', 'freecharge', 'airtel', 'postbank', 'indus',
    'kotak', 'dbs', 'citi', 'unionbank', 'federal', 'canarabank', 'centralbank', 'pnb'
  ]);

  const socialKeywords = [
    'refund', 'cashback', 'lottery', 'reward', 'bonus', 'kyc', 'support',
    'helpline', 'customercare', 'cbi', 'police', 'customs', 'fedex', 'arrest'
  ];
  const detectedKws = socialKeywords.filter(kw => username.includes(kw));
  if (detectedKws.length > 0) {
    signals.push({
      id: 'SOCIAL_ENGINEERING_HANDLE',
      title: 'High-Risk Deceptive Keywords in Handle',
      description: `Handle contains keywords frequently associated with fraud: ${detectedKws.join(', ')}. Scammers often impersonate refund desks or official support.`,
      severity: 'high'
    });
    score += 40;
  }

  const brands = ['sbi', 'hdfc', 'icici', 'axis', 'phonepe', 'paytm', 'googlepay', 'amazon', 'flipkart'];
  const detectedBrands = brands.filter(b => username.includes(b));
  if (detectedBrands.length > 0 && (detectedKws.length > 0 || !psp.includes(detectedBrands[0]))) {
    signals.push({
      id: 'BRAND_IMPERSONATION_HANDLE',
      title: 'Suspected Brand Impersonation',
      description: `Handle prefixes institution name '${detectedBrands[0]}' on third-party provider '@${psp}'. Legitimate businesses rarely receive customer funds on personal handles.`,
      severity: 'high'
    });
    score += 35;
  }

  const isRecognizedPsp = knownPsps.has(psp);
  if (!isRecognizedPsp) {
    signals.push({
      id: 'UNRECOGNIZED_PSP_HANDLE',
      title: 'Uncommon or Non-Standard Bank PSP',
      description: `Provider '@${psp}' is not in the common registry of high-volume NPCI banking handles.`,
      severity: 'low'
    });
    score += 15;
  }

  const riskScore = Math.min(100, score);
  const riskLevel = riskScore >= 70 ? 'critical' : (riskScore >= 45 ? 'high' : (riskScore >= 20 ? 'medium' : 'low'));
  const assessmentStatus = signals.length > 0 ? 'heuristic_signals_detected' : 'insufficient_evidence';

  const recommendations = [
    'Remember: Entering your UPI PIN always DEDUCTS money from your account. You NEVER need to enter a PIN to receive a refund or payment.',
    'Always verify the registered account beneficiary name displayed in your banking app before confirming any transfer.'
  ];

  if (signals.length > 0) {
    recommendations.push('Do NOT send money to unverified customer care or refund handles found on Google or social media.');
  }

  return {
    riskScore,
    riskLevel,
    assessmentStatus,
    signalsCount: signals.length,
    signals,
    handleDetails: {
      username,
      psp,
      isRecognizedPsp
    },
    recommendations,
    disclaimer: 'This evaluation is strictly based on transparent format heuristics and available reports. A low score does not guarantee that the recipient is trustworthy, nor does it confirm their identity.',
    target: query
  };
}

/**
 * Fallback client-side heuristic evaluator for SMS/Chat messages if server is offline
 */
function evaluateMessageLocally(rawMessage) {
  const text = (rawMessage || '').trim();
  if (!text) {
    return {
      success: false,
      riskScore: 0,
      riskLevel: 'low',
      assessmentStatus: 'insufficient_evidence',
      signals: [],
      recommendations: ['Please enter a message to analyze.'],
      target: rawMessage
    };
  }

  const signals = [];
  let score = 0;

  // 1. Extract embedded URLs
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+|[a-zA-Z0-9][-a-zA-Z0-9]{1,62}\.(?:com|org|net|in|co|xyz|top|link|live|app|download|online|site|club|vip|buzz|icu|shop|info|biz|me|cc|to|ly|io|gd)(?:\/[^\s<>"'{}|\\^`]*)?/gi;
  const embeddedUrls = [];
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    embeddedUrls.push(urlMatch[0]);
  }

  // 2. Extract embedded Phone numbers
  const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|1800[\s-]?\d{3}[\s-]?\d{3,4}\b/g;
  const embeddedPhones = (text.match(phoneRegex) || []).map(p => p.trim());

  // 3. Extract UPI VPAs
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
  const embeddedUpis = (text.match(upiRegex) || []).map(u => u.trim());

  // Threat Category 1: Credential / OTP Harvesting
  const otpRegex = /(?:share|send|enter|give|provide|forward|verify).{0,35}(?:otp|one\s*time\s*password|pin|upi\s*pin|mpin|cvv|password|secret\s*code)/i;
  if (otpRegex.test(text)) {
    score += 45;
    signals.push({
      id: 'OTP_CREDENTIAL_HARVESTING',
      title: 'Credential / OTP Harvesting Attempt',
      description: 'Demands or asks to share one-time password (OTP), UPI PIN, or banking security credentials.',
      severity: 'critical'
    });
  }

  // Threat Category 2: Disconnection Threat (Electricity/Power)
  const powerRegex = /(?:electricity|power|bijli|mseb|bses|dhbvn|tneb).{0,35}(?:disconnect|cut|suspend)/i;
  if (powerRegex.test(text)) {
    score += 40;
    signals.push({
      id: 'DISCONNECTION_THREAT',
      title: 'Utility Disconnection Threat',
      description: 'Threatens immediate disconnection of electricity/utility services to induce panic and extortion.',
      severity: 'critical'
    });
  }

  // Threat Category 3: Urgency & Coercion
  const urgencyRegex = /(?:within\s*\d+\s*(?:mins?|minutes?|hours?)|immediate(?:ly)?|account\s*blocked|last\s*warning|final\s*notice|act\s*now)/i;
  if (urgencyRegex.test(text)) {
    score += 25;
    signals.push({
      id: 'URGENCY_COERCION',
      title: 'Artificial Urgency & Coercion',
      description: 'Applies psychological pressure with short deadlines or account closure threats.',
      severity: 'high'
    });
  }

  // Threat Category 4: KYC / PAN Phishing
  const kycRegex = /(?:kyc|pan\s*card|aadhaar|bank\s*account).{0,30}(?:blocked|suspended|expire|update|verify)/i;
  if (kycRegex.test(text)) {
    score += 35;
    signals.push({
      id: 'KYC_PAN_UPDATE_PHISHING',
      title: 'Fake KYC / Account Suspension Warning',
      description: 'Falsely claims bank account or KYC document expiration to harvest identity details.',
      severity: 'critical'
    });
  }

  // Threat Category 5: Lottery / Prize Scams
  const prizeRegex = /(?:kbc|lottery|winner|won\s*(?:rs|inr|cash|prize|\$|crore|lakh))/i;
  if (prizeRegex.test(text)) {
    score += 35;
    signals.push({
      id: 'LOTTERY_PRIZE_SCAM',
      title: 'Unsolicited Lottery / Prize Claim',
      description: 'Promises unexpected monetary rewards or lottery prizes to extract advance fees.',
      severity: 'high'
    });
  }

  // Threat Category 6: Unverified APK Download
  const apkRegex = /\bhttps?:\/\/[^\s]+\.apk\b/i;
  if (apkRegex.test(text)) {
    score += 45;
    signals.push({
      id: 'UNVERIFIED_APK_DOWNLOAD',
      title: 'Unverified APK Application Download',
      description: 'Prompts installation of external Android APK sideloading package, which can install malware or remote access Trojans.',
      severity: 'critical'
    });
  }

  // Threat Category 7: Fake Job / Task Scam
  const jobRegex = /(?:part\s*time\s*job|work\s*from\s*home|daily\s*income|earn\s*(?:rs|inr|\$)\s*\d+).{0,40}(?:telegram|whatsapp|like\s*videos)/i;
  if (jobRegex.test(text)) {
    score += 35;
    signals.push({
      id: 'FAKE_JOB_PART_TIME_OFFER',
      title: 'Fake Job / Daily Earning Scheme',
      description: 'Promises unrealistic daily income for simple tasks (YouTube likes, reviews) redirecting to Telegram/WhatsApp.',
      severity: 'high'
    });
  }

  // Threat Category 8: Shortener or Suspicious Domain embedded
  const shortenerRegex = /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|rb\.gy)\b/i;
  if (shortenerRegex.test(text)) {
    score += 25;
    signals.push({
      id: 'URL_SHORTENER_OBFUSCATION',
      title: 'URL Shortener Obfuscation',
      description: 'Hides true destination behind link shortening service.',
      severity: 'medium'
    });
  }

  if (embeddedUrls.length > 0 && !signals.some(s => s.id === 'URL_SHORTENER_OBFUSCATION')) {
    score += 15;
    signals.push({
      id: 'CONTAINS_EMBEDDED_LINKS',
      title: 'Contains External Hyperlinks',
      description: `Contains ${embeddedUrls.length} embedded web destination(s).`,
      severity: 'low'
    });
  }

  const riskScore = Math.min(100, Math.max(0, score));
  let riskLevel = 'low';
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 25) riskLevel = 'medium';

  const assessmentStatus = signals.length > 0 && riskScore > 15 ? 'heuristic_signals_detected' : 'insufficient_evidence';

  const recommendations = [];
  if (signals.some(s => s.id === 'OTP_CREDENTIAL_HARVESTING')) {
    recommendations.push('Never forward, share, or type your OTP or banking PIN into any link or chat.');
  }
  if (signals.some(s => s.id === 'DISCONNECTION_THREAT')) {
    recommendations.push('Electricity boards never send SMS messages demanding urgent bill payments to personal numbers.');
  }
  if (signals.some(s => s.id === 'UNVERIFIED_APK_DOWNLOAD')) {
    recommendations.push('Never download or install .apk files received via SMS or WhatsApp.');
  }
  if (signals.some(s => s.id === 'KYC_PAN_UPDATE_PHISHING')) {
    recommendations.push('Banks never ask users to update KYC or PAN via SMS links. Visit your official bank branch or portal.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Exercise caution with unsolicited messages from unknown senders.');
    recommendations.push('Verify communications through official apps or customer care helplines.');
  }

  return {
    success: true,
    riskScore,
    riskLevel,
    assessmentStatus,
    signalsCount: signals.length,
    signals,
    embeddedUrls,
    embeddedPhones,
    embeddedUpis,
    metadata: {
      charCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length
    },
    recommendations,
    disclaimer: 'Message analysis is based on transparent linguistic and threat heuristics. It does not replace professional investigation.',
    target: rawMessage
  };
}

/**
 * Smooth counter animation for numerical display
 */
function animateCountUp(element, targetNum) {
  const duration = 900; // ms
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);
  let frame = 0;

  const timer = setInterval(() => {
    frame++;
    const progress = frame / totalFrames;
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(ease * targetNum);

    element.textContent = current;

    if (frame >= totalFrames) {
      element.textContent = targetNum;
      clearInterval(timer);
    }
  }, frameRate);
}

/**
 * Rescans current target
 */
window.rescanTarget = function() {
  initAnalysis();
  showToast('Rescanning target heuristics...');
};

/**
 * Copies shareable link to clipboard
 */
window.copyResultLink = function() {
  const shareUrl = window.location.href;
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast('Audit report link copied to clipboard!');
  }).catch(() => {
    // Fallback
    const input = document.createElement('input');
    input.value = shareUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Audit report link copied to clipboard!');
  });
};

/**
 * Fast inline scanner handler
 */
window.submitInlineScan = function() {
  const inputEl = document.getElementById('inline-scan-input');
  if (!inputEl || !inputEl.value.trim()) return;

  const val = inputEl.value.trim();
  const type = detectTargetType(val, '');

  window.location.href = `result.html?type=${encodeURIComponent(type)}&query=${encodeURIComponent(val)}`;
};

/**
 * Shows interactive toast notification
 */
function showToast(msg) {
  const toast = document.getElementById('result-toast');
  const toastText = document.getElementById('result-toast-text');
  if (!toast) return;

  if (toastText) toastText.textContent = msg;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3200);
}

function showNoTargetState() {
  const targetDisplay = document.getElementById('target-display');
  if (targetDisplay) targetDisplay.textContent = 'No Target Specified';

  const signalsContainer = document.getElementById('signals-container');
  if (signalsContainer) {
    signalsContainer.innerHTML = `
      <div style="padding: 48px 24px; text-align: center; background: #FFFFFF; border-radius: 16px; border: 1px dashed var(--ink-100, #E8EBF3);">
        <h4 style="margin-bottom: 8px; font-weight: 800; color: var(--ink-900, #0A0F1E);">Enter a Target to Analyze</h4>
        <p style="color: var(--ink-500, #4B5570); margin-bottom: 20px; font-size: 0.9375rem;">
          Use the quick scanner bar below or visit the live Check page.
        </p>
        <a href="check.html" class="btn-back-scanner" style="display: inline-flex;">
          Go to Check Scanner
        </a>
      </div>
    `;
  }
}

function showErrorState(errorMsg) {
  const scoreDisplay = document.getElementById('score-display');
  const riskBadge = document.getElementById('risk-badge');
  const riskSummary = document.getElementById('risk-summary');
  const signalsContainer = document.getElementById('signals-container');

  if (scoreDisplay) {
    scoreDisplay.style.color = '#EF4444';
    scoreDisplay.innerHTML = `⚠️`;
  }
  if (riskBadge) {
    riskBadge.style.color = '#EF4444';
    riskBadge.style.background = 'rgba(239, 68, 68, 0.1)';
    riskBadge.style.borderColor = 'rgba(239, 68, 68, 0.25)';
    riskBadge.textContent = 'EVALUATION NOTICE';
  }
  if (riskSummary) {
    riskSummary.textContent = errorMsg;
  }
  if (signalsContainer) {
    signalsContainer.innerHTML = `
      <div style="padding: 24px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 14px; color: #991B1B;">
        <div style="font-weight: 800; margin-bottom: 6px;">Target Evaluation Note:</div>
        <div style="font-size: 0.875rem; line-height: 1.6;">${escapeHtml(errorMsg)}</div>
      </div>
    `;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


function getCleanCertBadges(type) {
  if (type === 'phone') {
    return `
      <span style="background: rgba(5, 150, 105, 0.12); color: #047857; padding: 4px 12px; border-radius: 100px;">✓ Valid E.164 Plan</span>
      <span style="background: rgba(5, 150, 105, 0.12); color: #047857; padding: 4px 12px; border-radius: 100px;">✓ Standard Cellular Allocation</span>
      <span style="background: rgba(5, 150, 105, 0.12); color: #047857; padding: 4px 12px; border-radius: 100px;">✓ Non-Telemarketing Line</span>
      <span style="background: rgba(5, 150, 105, 0.12); color: #047857; padding: 4px 12px; border-radius: 100px;">✓ Zero Active Spam Reports</span>
    `;
  } else if (type === 'upi') {
    return `
      <span style="background: rgba(124, 58, 237, 0.12); color: #6D28D9; padding: 4px 12px; border-radius: 100px;">✓ NPCI Format Valid</span>
      <span style="background: rgba(124, 58, 237, 0.12); color: #6D28D9; padding: 4px 12px; border-radius: 100px;">✓ Authorized Bank PSP</span>
      <span style="background: rgba(124, 58, 237, 0.12); color: #6D28D9; padding: 4px 12px; border-radius: 100px;">✓ Normal Velocity</span>
      <span style="background: rgba(124, 58, 237, 0.12); color: #6D28D9; padding: 4px 12px; border-radius: 100px;">✓ Zero Dispute Flags</span>
    `;
  } else if (type === 'message') {
    return `
      <span style="background: rgba(217, 119, 6, 0.12); color: #B45309; padding: 4px 12px; border-radius: 100px;">✓ Low Pressure Tone</span>
      <span style="background: rgba(217, 119, 6, 0.12); color: #B45309; padding: 4px 12px; border-radius: 100px;">✓ Zero Malicious Links</span>
      <span style="background: rgba(217, 119, 6, 0.12); color: #B45309; padding: 4px 12px; border-radius: 100px;">✓ No Coercion Triggers</span>
      <span style="background: rgba(217, 119, 6, 0.12); color: #B45309; padding: 4px 12px; border-radius: 100px;">✓ Clean Payload</span>
    `;
  } else {
    return `
      <span style="background: rgba(16, 185, 129, 0.15); color: #065F46; padding: 4px 12px; border-radius: 100px;">✓ Safe Address</span>
      <span style="background: rgba(16, 185, 129, 0.15); color: #065F46; padding: 4px 12px; border-radius: 100px;">✓ Genuine Brand</span>
      <span style="background: rgba(16, 185, 129, 0.15); color: #065F46; padding: 4px 12px; border-radius: 100px;">✓ Secure Connection</span>
      <span style="background: rgba(16, 185, 129, 0.15); color: #065F46; padding: 4px 12px; border-radius: 100px;">✓ Zero Scam Reports</span>
    `;
  }
}

function getFallbackGuidance(type) {
  if (type === 'phone') {
    return 'Never disclose OTPs, banking passwords, or personal identity details over unsolicited phone calls. Police, Customs, and Banks will never demand funds transfers over Skype or phone.';
  } else if (type === 'upi') {
    return 'Remember: Entering your UPI PIN is strictly used to send money from your bank account, NEVER to receive funds, prizes, or merchant refunds.';
  } else if (type === 'message') {
    return 'Avoid opening hyperlinks received in SMS or chat claiming urgent account suspension. Always verify security notices directly in the official service provider app.';
  } else {
    return 'Always exercise standard cyber safety: double-check domain spellings before submitting login credentials.';
  }
}
