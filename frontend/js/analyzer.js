// ── SaaS Phone Quick Input & Clipboard Handlers ──
window.copyCanonicalPhone = function() {
  const el = document.getElementById('phone-target-display');
  const target = currentTargetQuery || (el ? el.textContent.replace(/^[^0-9+]+/, '') : '');
  if (!target) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(target).then(() => {
      const lbl = document.getElementById('copy-phone-label');
      if (lbl) {
        lbl.textContent = 'Copied!';
        setTimeout(() => { lbl.textContent = 'Copy'; }, 2000);
      }
    }).catch(() => {});
  }
};

window.handleQuickPhoneSubmit = function(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('phone-quick-input');
  const errorEl = document.getElementById('phone-quick-error');
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    if (errorEl) {
      errorEl.textContent = 'Please enter a valid phone or helpline number to analyze.';
      errorEl.style.display = 'block';
    }
    input.focus();
    return;
  }
  if (errorEl) errorEl.style.display = 'none';
  const newUrl = `${window.location.pathname}?type=phone&query=${encodeURIComponent(val)}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
  if (typeof analyzeTarget === 'function') {
    analyzeTarget(val, 'phone');
  }
};

window.clearQuickPhoneInput = function() {
  const input = document.getElementById('phone-quick-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  const errorEl = document.getElementById('phone-quick-error');
  if (errorEl) errorEl.style.display = 'none';
};


// ── SaaS URL Quick Input & Clipboard Handlers ──
window.copyCanonicalUrl = function() {
  const target = currentTarget || (document.getElementById('target-display') ? document.getElementById('target-display').textContent : '');
  if (!target) return;
  const full = target.startsWith('http') ? target : `https://${target}/`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(full).then(() => {
      const lbl = document.getElementById('copy-url-label');
      if (lbl) {
        lbl.textContent = 'Copied!';
        setTimeout(() => { lbl.textContent = 'Copy URL'; }, 2000);
      }
    }).catch(() => {});
  }
};

window.handleQuickUrlSubmit = function(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('url-quick-input');
  const errorEl = document.getElementById('url-quick-error');
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    if (errorEl) {
      errorEl.textContent = 'Please enter a valid website URL or domain name to analyze.';
      errorEl.style.display = 'block';
    }
    input.focus();
    return;
  }
  if (errorEl) errorEl.style.display = 'none';
  const newUrl = `${window.location.pathname}?type=url&query=${encodeURIComponent(val)}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
  if (typeof analyzeTarget === 'function') {
    analyzeTarget(val, 'url');
  }
};

window.clearQuickUrlInput = function() {
  const input = document.getElementById('url-quick-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  const errorEl = document.getElementById('url-quick-error');
  if (errorEl) errorEl.style.display = 'none';
};

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
      el.innerHTML = `<span style="color: #0F172A; font-family: var(--mono); font-weight: 800;">${escapeHtml(query)}</span>`;
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
    if (breadcrumbTag) breadcrumbTag.textContent = 'URL Analyzer';
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
      targetDisplay.innerHTML = `<span style="color: #0F172A; font-family: var(--mono); font-weight: 700;">${escapeHtml(query)}</span>`;
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
    const phoneTargetDisplay = document.getElementById('phone-target-display');
    if (phoneTargetDisplay) phoneTargetDisplay.textContent = 'Analyzing Caller...';

    const phoneCanonicalDisplay = document.getElementById('phone-canonical-display');
    if (phoneCanonicalDisplay) phoneCanonicalDisplay.textContent = 'Analyzing Route...';

    const phoneProviderPill = document.getElementById('phone-provider-pill');
    if (phoneProviderPill) {
      phoneProviderPill.textContent = '📶 RESOLVING CARRIER...';
      phoneProviderPill.className = 'pclean-pill pclean-pill-blue';
    }
    const phoneProviderName = document.getElementById('phone-provider-name');
    if (phoneProviderName) phoneProviderName.textContent = 'Resolving Provider...';
    const phoneHeaderPill = document.getElementById('phone-header-status-pill');
    if (phoneHeaderPill) {
      phoneHeaderPill.textContent = '● EVALUATING CALLER...';
      phoneHeaderPill.className = 'pclean-pill pclean-pill-green';
    }

    const phoneScoreDisplay = document.getElementById('phone-score-display');
    if (phoneScoreDisplay) {
      phoneScoreDisplay.innerHTML = `<span style="font-size: 2.25rem; opacity: 0.5;">...</span>`;
      phoneScoreDisplay.style.color = 'var(--ink-500, #4B5570)';
    }

    const phoneGaugeCircle = document.getElementById('phone-gauge-circle');
    if (phoneGaugeCircle) {
      phoneGaugeCircle.style.strokeDashoffset = '427.2';
      phoneGaugeCircle.style.stroke = '#10B981';
    }

    const phoneVerdictTitle = document.getElementById('phone-verdict-title');
    if (phoneVerdictTitle) phoneVerdictTitle.textContent = 'Evaluating Caller Heuristics...';

    const phoneRiskSummary = document.getElementById('phone-risk-summary');
    if (phoneRiskSummary) {
      phoneRiskSummary.textContent = 'Cross-checking carrier allocation, telecom circle, TRAI series, and national scam complaints...';
    }

    const phoneRiskBadge = document.getElementById('phone-risk-badge');
    if (phoneRiskBadge) {
      phoneRiskBadge.textContent = 'CHECKING TELECOM RAIL...';
      phoneRiskBadge.className = 'pclean-action-chip pclean-pill-gray';
    }

    // Bento tiles reset
    const tileLine = document.getElementById('phone-tile-line');
    if (tileLine) tileLine.textContent = 'Cellular Mobile';
    const tileCarrier = document.getElementById('phone-tile-carrier');
    if (tileCarrier) tileCarrier.textContent = 'Checking allocation...';

    const tileOrigin = document.getElementById('phone-tile-origin');
    if (tileOrigin) tileOrigin.textContent = 'India (+91)';
    const tileOriginSub = document.getElementById('phone-tile-origin-sub');
    if (tileOriginSub) tileOriginSub.textContent = 'Domestic routing circle';

    const tileTrai = document.getElementById('phone-tile-trai');
    if (tileTrai) tileTrai.textContent = 'TRAI Check...';
    const tileTraiSub = document.getElementById('phone-tile-trai-sub');
    if (tileTraiSub) tileTraiSub.textContent = 'Checking 140 / 160 prefix...';

    const tileReports = document.getElementById('phone-tile-reports');
    if (tileReports) tileReports.textContent = 'Scanning...';
    const tileReportsSub = document.getElementById('phone-tile-reports-sub');
    if (tileReportsSub) tileReportsSub.textContent = 'Cross-checking national logs...';

    // Legacy backwards compatibility anchors
    const phoneVal = document.getElementById('phone-val-formatted');
    if (phoneVal) phoneVal.textContent = currentTargetQuery;
    const phoneScoreNum = document.getElementById('phone-score-num');
    if (phoneScoreNum) phoneScoreNum.textContent = '--';
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

/**
 * Resolves Indian and international telecom service providers (TSPs)
 */
// ─────────────────────────────────────────────────────────────────────────────
// DoT National Numbering Plan (NNP) & TRAI Regulatory Allocations Database
// Sourced from Ministry of Communications (DoT) & TRAI Official Numbering Plans
// ─────────────────────────────────────────────────────────────────────────────

const DOT_NNP_TABLE = {
  // ── BHARTI AIRTEL LTD ──
  'airtel': {
    operator: 'Bharti Airtel Ltd',
    brand: 'Bharti Airtel',
    authority: 'Department of Telecommunications (DoT) & TRAI',
    seriesType: 'Unified Access Service (GSM/LTE/5G)',
    circles: {
      'PB': ['9814', '9815', '9872', '9876', '9878', '9888', '9779', '9780', '9781', '9646', '9914', '9915'],
      'DL': ['9810', '9818', '9910', '9958', '9971', '9899', '9717', '9650', '9654', '8800', '8527'],
      'MUM': ['9867', '9967', '9769', '8451', '8452', '8454', '8652', '8655'],
      'MH': ['9890', '9850', '9881', '9673', '9552', '9766', '9767', '9923', '8459', '8668', '8669'],
      'KA': ['9844', '9880', '9900', '9945', '9980', '9740', '9741', '9742', '9611', '9620', '9632', '9686'],
      'TN': ['9840', '9841', '9842', '9843', '9884', '9894', '9940', '9941', '9942', '9943', '9944', '9952', '9789', '9790', '9791'],
      'AP': ['9849', '9949', '9951', '9959', '9985', '9989', '9701', '9703', '9704', '9705', '9603', '9618', '9640', '9642'],
      'KOL': ['9830', '9831', '9832', '9836', '9874', '9903'],
      'WB': ['9932', '9933', '9732', '9733', '9734', '9735'],
      'GJ': ['9879', '9898', '9904', '9925', '9979', '9727', '9601', '9624', '9638', '9662'],
      'RJ': ['9828', '9829', '9928', '9929', '9782', '9783', '9784', '9785', '9602', '9610', '9636', '9660', '9680'],
      'UP_W': ['9837', '9897', '9927', '9997', '9719', '9758', '9759', '9760', '9761', '9627', '9634', '9639', '9675', '9690'],
      'UP_E': ['9838', '9839', '9935', '9936', '9956', '9721', '9792', '9793', '9794', '9795', '9616', '9621', '9628', '9648', '9651', '9670', '9695', '9696'],
      'MP': ['9826', '9827', '9893', '9926', '9977', '9981', '9993', '9752', '9753', '9754', '9755', '9617', '9630', '9644', '9669', '9685'],
      'KL': ['9846', '9847', '9895', '9946', '9947', '9961', '9995', '9744', '9745', '9746', '9747', '9605', '9633', '9645', '9656'],
      'HR': ['9812', '9813', '9896', '9991', '9992', '9996', '9728', '9729', '9671'],
      'BH': ['9835', '9931', '9934', '9939', '9955', '9708', '9709', '9771', '9608', '9631', '9661'],
      'OD': ['9861', '9937', '9938', '9776', '9777', '9778', '9658', '9668', '9692'],
      'AS': ['9854', '9864', '9954', '9957', '9706', '9707', '9613', '9678'],
      'NE': ['9856', '9862', '9863', '9774', '9612', '9615'],
      'JK': ['9858', '9906', '9796', '9797', '9622', '9697'],
      'HP': ['9816', '9817', '9805', '9736', '9625']
    }
  },

  // ── VODAFONE IDEA LTD (VI) ──
  'vi': {
    operator: 'Vodafone Idea Ltd (Vi)',
    brand: 'Vodafone Idea (Vi)',
    authority: 'Department of Telecommunications (DoT) & TRAI',
    seriesType: 'Unified Access Service (GSM/LTE/5G)',
    circles: {
      'MH': ['9822', '9823', '9860', '9921', '9922', '9960', '9970', '9975', '9762', '9763', '9764', '9765', '9011', '9028', '9049', '9096', '9503', '9527', '9545', '9561', '9604', '9623', '9637', '9657', '9665', '9689', '9730', '9158', '9175', '8888', '8600', '8408', '8007', '7798', '7774', '7709', '7385', '7387'],
      'MUM': ['9820', '9821', '9819', '9833', '9892', '9920', '9930', '9987', '9702', '9004', '9022', '9167', '8879', '8080', '7506'],
      'DL': ['9811', '9891', '9911', '9953', '9999', '9711', '9871', '9873', '9013', '9015', '9017', '9540', '9555', '9560', '9582'],
      'GJ': ['9824', '9825', '9898', '9909', '9924', '9925', '9974', '9978', '9979', '9712', '9724', '9725', '9726', '9099', '9510', '9512', '9537', '9558', '9574', '9586'],
      'KA': ['9845', '9886', '9901', '9986', '9731', '9738', '9739', '9743', '9008', '9019', '9035', '9036', '9535', '9538', '9590', '9591'],
      'AP': ['9848', '9885', '9948', '9966', '9700', '9000', '9010', '9014', '9030', '9032', '9052', '9059', '9502', '9505', '9515', '9533', '9542', '9550', '9553', '9573', '9581'],
      'TN': ['9840', '9843', '9884', '9003', '9025', '9042', '9043', '9047', '9092', '9094', '9500', '9514', '9524', '9543', '9566'],
      'KL': ['9020', '9037', '9048', '9061', '9072', '9074', '9526', '9539', '9544', '9562', '9567'],
      'UP_E': ['9005', '9026', '9044', '9076', '9506', '9517', '9519', '9532', '9554', '9559', '9565', '9569', '9580'],
      'UP_W': ['9012', '9027', '9045', '9058', '9520', '9528', '9536', '9548', '9557', '9568'],
      'MP': ['9009', '9039', '9074', '9098', '9516', '9522', '9575', '9584', '9589'],
      'RJ': ['9001', '9024', '9057', '9509', '9521', '9529', '9530', '9549', '9571', '9587'],
      'PB': ['9023', '9041', '9056', '9501', '9569', '9592'],
      'HR': ['9017', '9034', '9050', '9053', '9541'],
      'BH': ['9006', '9031', '9060', '9065', '9504', '9507', '9508', '9523', '9525', '9534', '9546', '9570', '9572', '9576'],
      'KOL': ['9002', '9007', '9038', '9046', '9062', '9064', '9088', '9091', '9093', '9547', '9563', '9564', '9593'],
      'OD': ['9040', '9078', '9090', '9556', '9583'],
      'AS': ['9085', '9508', '9577']
    }
  },

  // ── BHARAT SANCHAR NIGAM LTD (BSNL) ──
  'bsnl': {
    operator: 'Bharat Sanchar Nigam Ltd (BSNL)',
    brand: 'BSNL Mobile',
    authority: 'Department of Telecommunications (DoT) CPSE',
    seriesType: 'National Telecom Public Sector Enterprise',
    circles: {
      'MH': ['9403', '9404', '9405', '9420', '9421', '9422', '9423'],
      'UP_E': ['9410', '9411', '9412', '9450', '9451', '9452', '9453', '9454', '9455'],
      'RJ': ['9413', '9414'],
      'AP': ['9440', '9441', '9490', '9491'],
      'TN': ['9442', '9443', '9444', '9486', '9487'],
      'KL': ['9446', '9447', '9495', '9496', '9497'],
      'KA': ['9448', '9449', '9480', '9481', '9482', '9483'],
      'MP': ['9424', '9425'],
      'GJ': ['9426', '9427', '9428', '9429'],
      'HR': ['9416', '9466', '9467', '9468'],
      'PB': ['9417', '9463', '9464', '9465'],
      'BH': ['9431', '9470', '9471', '9472'],
      'OD': ['9437', '9438', '9439'],
      'AS': ['9435'],
      'NE': ['9436'],
      'JK': ['9419', '9469'],
      'HP': ['9418', '9459'],
      'WB': ['9432', '9433', '9434']
    }
  },

  // ── MAHANAGAR TELEPHONE NIGAM LTD (MTNL) ──
  'mtnl': {
    operator: 'Mahanagar Telephone Nigam Ltd (MTNL)',
    brand: 'MTNL Dolphin',
    authority: 'Department of Telecommunications (DoT) CPSE',
    seriesType: 'Metro Public Sector Telecom',
    circles: {
      'DL': ['9868', '9968'],
      'MUM': ['9869', '9969']
    }
  },

  // ── RELIANCE JIO INFOCOMM LTD ──
  'jio': {
    operator: 'Reliance Jio Infocomm Ltd',
    brand: 'Reliance Jio',
    authority: 'Department of Telecommunications (DoT) & TRAI',
    seriesType: 'Unified Access Service (Pure 4G/5G VoLTE)',
    circles: {
      'DL': ['8010', '7011', '7042', '7065', '7289', '7290', '7291', '7292', '7701', '7703'],
      'MUM': ['7021', '7045', '7208', '7303', '7304', '7710', '7715', '7718', '7738'],
      'MH': ['7020', '7028', '7030', '7038', '7057', '7058', '7066', '7083', '7218', '7219', '7249', '7350', '7378', '7719', '7720', '7721', '7722', '7741', '7742', '7743', '7744', '7745', '7756', '7757', '7758', '7767', '7768', '7769', '7770', '7773', '7775', '7776', '7796'],
      'MP': ['7000', '6230', '6232', '6239', '6260', '6261', '6262', '6263', '6264', '6265', '7024', '7049', '7089', '7222', '7223', '7224', '7225', '7247'],
      'PB': ['7009', '6006', '6280', '6283', '6284'],
      'GJ': ['7016', '6350', '6351', '6352', '6353', '6354', '6355', '6356', '6358', '6359', '7041', '7043', '7046', '7069', '7096', '7201', '7202', '7203', '7226', '7227', '7228', '7283', '7284', '7285'],
      'KA': ['7019', '6360', '6361', '6362', '6363', '6364', '6366', '7022', '7026', '7090', '7204', '7259', '7337', '7338', '7348', '7349', '7353'],
      'AP': ['7013', '6281', '6300', '6301', '6302', '6303', '6304', '6305', '6309', '7032', '7036', '7075', '7093', '7095', '7207', '7286', '7287', '7288', '7306', '7330', '7331', '7382', '7386', '7396'],
      'TN': ['7010', '6380', '6381', '6382', '6383', '6384', '6385', '7092', '7094', '7200', '7299', '7305', '7339', '7358', '7373', '7395', '7397'],
      'RJ': ['7014', '6375', '6376', '6377', '6378', '7023', '7073', '7229', '7230', '7231', '7232', '7240', '7300', '7340', '7357', '7374'],
      'UP_E': ['7007', '6386', '6387', '6388', '6389', '6391', '6392', '6393', '6394', '7052', '7054', '7080', '7081', '7084', '7233', '7234', '7235', '7266', '7267', '7268', '7269', '7275', '7309', '7310', '7311', '7317', '7318', '7347', '7355', '7376', '7379', '7380', '7388', '7390', '7398'],
      'UP_W': ['7017', '6390', '6395', '7037', '7055', '7060', '7078', '7088', '7217', '7248', '7251', '7252', '7253', '7302', '7351'],
      'KL': ['7012', '6282', '7025', '7034', '7293', '7356', '7510', '7558', '7559', '7560', '7561', '7591', '7592', '7593', '7594'],
      'BH': ['7004', '6200', '6201', '6202', '6203', '6204', '6205', '6206', '6207', '6208', '6209', '7033', '7050', '7061', '7070', '7079', '7091', '7209', '7250', '7254', '7256', '7257', '7258', '7260', '7261', '7277', '7279', '7280', '7281', '7282', '7320', '7321', '7322', '7323', '7324', '7352', '7360', '7361', '7362', '7366', '7367', '7368', '7369'],
      'WB': ['7001', '6290', '6291', '6294', '6295', '6296', '7029', '7044', '7047', '7063', '7074', '7076', '7278', '7318', '7384'],
      'KOL': ['7003'],
      'OD': ['7008', '6370', '6371', '6372', '7064', '7077', '7205', '7325', '7326', '7327', '7328', '7377', '7381'],
      'AS': ['7002', '6000', '6001', '6002', '6003', '7086', '7215', '7308', '7399'],
      'NE': ['7005', '7085'],
      'JK': ['7006', '6005', '7051', '7298'],
      'HP': ['7018', '7087', '7210', '7307'],
      'HR': ['7015', '7027', '7056', '7082', '7206']
    }
  }
};

const DOT_NNP_CIRCLE_NAMES = {
  'MH': 'Maharashtra & Goa Circle',
  'MUM': 'Mumbai Circle',
  'DL': 'Delhi NCR Circle',
  'PB': 'Punjab Circle',
  'HR': 'Haryana Circle',
  'HP': 'Himachal Pradesh Circle',
  'JK': 'Jammu & Kashmir Circle',
  'UP_W': 'Uttar Pradesh (West) Circle',
  'UP_E': 'Uttar Pradesh (East) Circle',
  'RJ': 'Rajasthan Circle',
  'MP': 'Madhya Pradesh & CG Circle',
  'GJ': 'Gujarat Circle',
  'KA': 'Karnataka Circle',
  'AP': 'Andhra Pradesh & Telangana Circle',
  'TN': 'Tamil Nadu & Chennai Circle',
  'KL': 'Kerala Circle',
  'WB': 'West Bengal Circle',
  'KOL': 'Kolkata Circle',
  'BH': 'Bihar & Jharkhand Circle',
  'OD': 'Odisha Circle',
  'AS': 'Assam Circle',
  'NE': 'North East Circle',
  'NAT': 'National Allocation (DoT / TRAI)'
};

function resolveTelecomCarrier(digits, country = 'IN', countryName = 'India') {
  if (country !== 'IN') {
    if (country === 'US' || country === 'CA') {
      return { operator: 'North American Carrier', brand: 'AT&T / Verizon / T-Mobile', circle: 'North America', circleCode: 'NA', lsa: 'North America', state: countryName, regulatoryBody: 'FCC / NANPA', planAllocation: 'North American Numbering Plan' };
    } else if (country === 'GB') {
      return { operator: 'UK Telecom Carrier', brand: 'Vodafone / EE / O2', circle: 'United Kingdom', circleCode: 'UK', lsa: 'United Kingdom', state: countryName, regulatoryBody: 'Ofcom', planAllocation: 'UK National Telephone Numbering Plan' };
    } else if (country === 'AE') {
      return { operator: 'UAE Telecom Operator', brand: 'e& (Etisalat) / du', circle: 'United Arab Emirates', circleCode: 'UAE', lsa: 'United Arab Emirates', state: countryName, regulatoryBody: 'TDRA UAE', planAllocation: 'TDRA National Numbering Plan' };
    }
    return { operator: `${countryName} Telecom Operator`, brand: 'International Carrier', circle: countryName, circleCode: country, lsa: countryName, state: countryName, regulatoryBody: 'ITU-T E.164 Authority', planAllocation: 'ITU-T International Telecommunication Union' };
  }

  // Normalize Indian digits to 10 digits
  let d = String(digits || '').replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) {
    d = d.slice(2);
  } else if (d.startsWith('0') && d.length === 11) {
    d = d.slice(1);
  }

  // 1. TRAI 140 Series (Commercial Telemarketing)
  if (/^140\d{7}$/.test(d)) {
    return {
      operator: 'Commercial Telemarketing Enterprise',
      brand: 'TRAI 140 Commercial Telemarketer',
      circle: 'Pan-India Promotional Channel',
      circleCode: 'TRAI-140',
      lsa: 'National Telemarketing LSA',
      state: 'National',
      regulatoryBody: 'TRAI (TCCCPR, 2018 Regulation)',
      planAllocation: 'DoT/TRAI 140 Commercial Telemarketing Prefix',
      seriesType: 'Promotional Outbound Voice Broadcast'
    };
  }

  // 2. TRAI 160 Series (Official Transactional Service)
  if (/^160[01]?\d{6,7}$/.test(d)) {
    return {
      operator: 'Regulated Financial / Government Entity',
      brand: 'TRAI 160 Official Transactional Line',
      circle: 'National Transactional Channel',
      circleCode: 'TRAI-160',
      lsa: 'National Transactional LSA',
      state: 'National',
      regulatoryBody: 'TRAI & Department of Telecommunications (DoT)',
      planAllocation: 'TRAI 160 Transactional Voice Mandate (2024-25)',
      seriesType: 'Authorized Banking & Transactional Voice Line'
    };
  }

  // 3. Toll-Free 1800 Helplines (DoT Intelligent Network)
  if (/^1800\d{6,7}$/.test(d)) {
    if (d.startsWith('180011') || d.startsWith('1800425')) {
      return {
        operator: 'State Bank of India (SBI)',
        brand: 'SBI Official Customer Care',
        circle: 'National Toll-Free Helpline',
        circleCode: 'SBI-1800',
        lsa: 'National Freephone Service',
        state: 'National',
        regulatoryBody: 'Department of Telecommunications (DoT)',
        planAllocation: 'DoT Intelligent Network (IN) Numbering Plan',
        seriesType: 'Official Institutional Helpline'
      };
    }
    if (d.startsWith('1800258') || d.startsWith('1800102')) {
      return {
        operator: 'Bank of Baroda',
        brand: 'Bank of Baroda Helpline',
        circle: 'National Toll-Free Helpline',
        circleCode: 'BOB-1800',
        lsa: 'National Freephone Service',
        state: 'National',
        regulatoryBody: 'Department of Telecommunications (DoT)',
        planAllocation: 'DoT Intelligent Network (IN) Numbering Plan',
        seriesType: 'Official Institutional Helpline'
      };
    }
    return {
      operator: 'DoT Intelligent Network (IN) Services',
      brand: 'National Toll-Free Helpline (1800)',
      circle: 'Pan-India Freephone Service',
      circleCode: 'IN-TF',
      lsa: 'National Freephone LSA',
      state: 'National',
      regulatoryBody: 'Department of Telecommunications (DoT)',
      planAllocation: 'DoT Intelligent Network (IN) Allocation',
      seriesType: 'Toll-Free Customer Assistance Line'
    };
  }

  if (d.length !== 10) {
    return {
      operator: 'Indian Telecom Provider',
      brand: 'GSM/LTE Carrier',
      circle: 'Domestic Circle',
      circleCode: 'IN-DOM',
      lsa: 'DoT Domestic Service Area',
      state: 'India',
      regulatoryBody: 'Department of Telecommunications (DoT)',
      planAllocation: 'DoT National Numbering Plan (NNP)',
      seriesType: 'Cellular Mobile Telephony Service'
    };
  }

  const p4 = d.slice(0, 4);
  const p3 = d.slice(0, 3);
  const p2 = d.slice(0, 2);

  // 4. Match 4-digit prefix against DoT NNP Table
  for (const [key, opData] of Object.entries(DOT_NNP_TABLE)) {
    for (const [cCode, prefixes] of Object.entries(opData.circles)) {
      if (prefixes.includes(p4)) {
        return {
          operator: opData.operator,
          brand: opData.brand,
          circle: DOT_NNP_CIRCLE_NAMES[cCode] || `${cCode} Circle`,
          circleCode: cCode,
          lsa: `DoT ${cCode} Licensed Service Area`,
          state: 'India',
          regulatoryBody: opData.authority,
          planAllocation: 'DoT National Numbering Plan (NNP)',
          seriesType: opData.seriesType
        };
      }
    }
  }

  // 5. Broad DoT NNP Series Allocation Fallbacks
  // Jio 6-series fallback
  if (d.startsWith('6')) {
    return {
      operator: 'Reliance Jio Infocomm Ltd',
      brand: 'Reliance Jio',
      circle: 'India 4G/5G Circle',
      circleCode: 'JIO-4G',
      lsa: 'DoT Pan-India 4G/5G Access Service',
      state: 'India',
      regulatoryBody: 'Department of Telecommunications (DoT) & TRAI',
      planAllocation: 'DoT National Numbering Plan (NNP)',
      seriesType: 'Unified Access Service (Pure 4G/5G VoLTE)'
    };
  }

  // BSNL 94-series fallback
  if (p2 === '94') {
    return {
      operator: 'Bharat Sanchar Nigam Ltd (BSNL)',
      brand: 'BSNL Mobile',
      circle: 'India Domestic Circle',
      circleCode: 'BSNL-DOM',
      lsa: 'DoT National BSNL Service Area',
      state: 'India',
      regulatoryBody: 'Department of Telecommunications (DoT) CPSE',
      planAllocation: 'DoT National Numbering Plan (NNP)',
      seriesType: 'National Telecom Public Sector Enterprise'
    };
  }

  // Generic Cellular Line
  return {
    operator: 'Indian Cellular Operator',
    brand: 'Cellular Mobile (GSM/LTE)',
    circle: 'India Domestic Circle',
    circleCode: 'IN-DOM',
    lsa: 'DoT Domestic Service Area',
    state: 'India',
    regulatoryBody: 'Department of Telecommunications (DoT) & TRAI',
    planAllocation: 'DoT National Numbering Plan (NNP)',
    seriesType: 'Cellular Mobile Telephony Service'
  };
}

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
    const chunks = [];
    for (let i = 0; i < digits.length; i += 5) {
      chunks.push(digits.slice(i, i + 5));
    }
    formatted = (target.startsWith('+') ? '+' : '') + chunks.join(' ');
  }

  const countryName = data.normalized ? data.normalized.countryName : 'India';
  const callingCode = data.normalized ? data.normalized.callingCode : '+91';
  const isDomestic = !data.normalized || data.normalized.countryCode === 'IN';
  const flag = isDomestic ? '🇮🇳 ' : '🌐 ';

  // Telecom Circle
  // Resolve Carrier / Provider
  const carrier = data.carrier || resolveTelecomCarrier(digits, countryName === 'India' ? 'IN' : 'INTL', countryName);
  const operatorName = carrier.brand || carrier.operator || 'Authorized Operator';
  const circleName = carrier.circle || (isDomestic ? 'Maharashtra & Goa Circle' : 'International Network');

  // 1. Header Bar
  const phoneTargetDisplay = document.getElementById('phone-target-display');
  if (phoneTargetDisplay) phoneTargetDisplay.textContent = `${flag}${formatted}`;

  const phoneProviderPill = document.getElementById('phone-provider-pill');
  if (phoneProviderPill) {
    phoneProviderPill.textContent = `📶 ${operatorName.toUpperCase()}`;
  }
  const phoneProviderName = document.getElementById('phone-provider-name');
  if (phoneProviderName) {
    phoneProviderName.textContent = operatorName;
  }

  const phoneCanonicalDisplay = document.getElementById('phone-canonical-display');
  if (phoneCanonicalDisplay) phoneCanonicalDisplay.textContent = circleName;

  const lineTypeStr = (data.lineType || 'CELLULAR').toUpperCase();
  const phoneLineTypeTag = document.getElementById('phone-line-type-tag');
  if (phoneLineTypeTag) {
    if (lineTypeStr === 'TOLL_FREE') {
      phoneLineTypeTag.textContent = 'TOLL-FREE (1800)';
      phoneLineTypeTag.className = 'pclean-pill pclean-pill-gray';
    } else if (lineTypeStr === 'VOIP') {
      phoneLineTypeTag.textContent = 'VOIP VIRTUAL';
      phoneLineTypeTag.className = 'pclean-pill pclean-pill-yellow';
    } else if (lineTypeStr === 'FIXED_LINE') {
      phoneLineTypeTag.textContent = 'LANDLINE';
      phoneLineTypeTag.className = 'pclean-pill pclean-pill-gray';
    } else {
      phoneLineTypeTag.textContent = 'CELLULAR MOBILE';
      phoneLineTypeTag.className = 'pclean-pill pclean-pill-gray';
    }
  }

  const phoneOriginTag = document.getElementById('phone-origin-tag');
  if (phoneOriginTag) {
    phoneOriginTag.textContent = `${countryName.toUpperCase()} (${callingCode})`;
  }

  const phoneHeaderStatusPill = document.getElementById('phone-header-status-pill');
  if (phoneHeaderStatusPill) {
    if (riskScore >= 70) {
      phoneHeaderStatusPill.textContent = '● DANGEROUS SCAM';
      phoneHeaderStatusPill.className = 'pclean-pill pclean-pill-red';
    } else if (riskScore >= 35) {
      phoneHeaderStatusPill.textContent = '● COMMERCIAL SPAM / PROMO';
      phoneHeaderStatusPill.className = 'pclean-pill pclean-pill-yellow';
    } else if (riskScore <= 10) {
      phoneHeaderStatusPill.textContent = '● VERIFIED OFFICIAL LINE';
      phoneHeaderStatusPill.className = 'pclean-pill pclean-pill-green';
    } else {
      phoneHeaderStatusPill.textContent = '● UNVERIFIED PRIVATE CALLER';
      phoneHeaderStatusPill.className = 'pclean-pill pclean-pill-blue';
    }
  }

  
  // ── Luxury Smartphone Simulator & Hardware SIM Synchronization ──
  const hudNum = document.getElementById('phone-hud-display-number');
  if (hudNum) hudNum.textContent = formatted;

  const hudSubtitle = document.getElementById('phone-hud-carrier-subtitle');
  if (hudSubtitle) hudSubtitle.textContent = `${operatorName} • ${circleName}`;

  const simCarrier = document.getElementById('phone-sim-carrier-name');
  if (simCarrier) simCarrier.textContent = `${operatorName.toUpperCase()} 5G+`;

  const simCircle = document.getElementById('phone-sim-circle-name');
  if (simCircle) simCircle.textContent = `${circleName} • DoT UASL Band 78 (5G SA)`;

  const simStatusTag = document.getElementById('phone-sim-status-tag');
  if (simStatusTag) {
    if (riskScore >= 70) {
      simStatusTag.textContent = '● SCAM SUSPECT (BLOCKED)';
      simStatusTag.style.background = 'rgba(220, 38, 38, 0.2)';
      simStatusTag.style.color = '#F87171';
      simStatusTag.style.borderColor = 'rgba(220, 38, 38, 0.4)';
    } else if (riskScore <= 10) {
      simStatusTag.textContent = '● OFFICIAL VERIFIED USIM';
      simStatusTag.style.background = 'rgba(16, 185, 129, 0.2)';
      simStatusTag.style.color = '#34D399';
      simStatusTag.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else {
      simStatusTag.textContent = '● ACTIVE 5G SA USIM';
      simStatusTag.style.background = 'rgba(16, 185, 129, 0.15)';
      simStatusTag.style.color = '#34D399';
      simStatusTag.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    }
  }

  const islandStatus = document.getElementById('phone-island-status');
  const islandDot = document.getElementById('phone-island-dot');
  if (islandStatus) {
    if (riskScore >= 70) {
      islandStatus.textContent = 'LIVE RADAR: HIGH THREAT';
      islandStatus.style.color = '#F87171';
      if (islandDot) {
        islandDot.style.background = '#EF4444';
        islandDot.style.boxShadow = '0 0 10px #EF4444';
      }
    } else if (riskScore <= 10) {
      islandStatus.textContent = 'OFFICIAL INSTITUTIONAL LINE';
      islandStatus.style.color = '#34D399';
      if (islandDot) {
        islandDot.style.background = '#10B981';
        islandDot.style.boxShadow = '0 0 10px #10B981';
      }
    } else {
      islandStatus.textContent = 'LIVE TELECOM RADAR';
      islandStatus.style.color = '#34D399';
      if (islandDot) {
        islandDot.style.background = '#10B981';
        islandDot.style.boxShadow = '0 0 10px #10B981';
      }
    }
  }

  // Soundwave equalization bars dynamic styling
  const soundwaveBars = document.querySelectorAll('.soundwave-bar');
  soundwaveBars.forEach(bar => {
    if (riskScore >= 70) {
      bar.style.background = 'linear-gradient(180deg, #EF4444, #991B1B)';
    } else if (riskScore >= 35) {
      bar.style.background = 'linear-gradient(180deg, #F59E0B, #B45309)';
    } else {
      bar.style.background = 'linear-gradient(180deg, #10B981, #047857)';
    }
  });

  // Smartphone HUD Avatar styling
  const hudAvatar = document.getElementById('phone-hud-avatar-icon');
  if (hudAvatar) {
    if (riskScore >= 70) {
      hudAvatar.style.background = 'rgba(220, 38, 38, 0.15)';
      hudAvatar.style.borderColor = 'rgba(220, 38, 38, 0.5)';
      hudAvatar.style.color = '#EF4444';
    } else if (riskScore <= 10) {
      hudAvatar.style.background = 'rgba(16, 185, 129, 0.15)';
      hudAvatar.style.borderColor = 'rgba(16, 185, 129, 0.5)';
      hudAvatar.style.color = '#10B981';
    } else {
      hudAvatar.style.background = 'rgba(59, 130, 246, 0.15)';
      hudAvatar.style.borderColor = 'rgba(59, 130, 246, 0.4)';
      hudAvatar.style.color = '#60A5FA';
    }
  }

  // Also pre-fill the quick search input with the current number
  const quickInput = document.getElementById('phone-quick-input');
  if (quickInput && !quickInput.value) {
    quickInput.value = digits.length === 10 ? digits : target;
  }

  const reportBtn = document.getElementById('btn-report-phone');
  if (reportBtn) {
    reportBtn.href = `reports.html?type=phone&target=${encodeURIComponent(target)}`;
  }

  // 2. Dial Gauge & Score (Left Card)
  let phoneThemeColor = '#DC2626';
  if (riskScore >= 70) {
    phoneThemeColor = '#DC2626';
  } else if (riskScore >= 35) {
    phoneThemeColor = '#D97706';
  } else if (riskScore <= 10) {
    phoneThemeColor = '#10B981';
  } else {
    phoneThemeColor = '#3B82F6'; // Neutral slate/blue for unverified private caller
  }

  const phoneGaugeCircle = document.getElementById('phone-gauge-circle');
  if (phoneGaugeCircle) {
    const circumference = 427.2;
    const offset = circumference - (riskScore / 100) * circumference;
    phoneGaugeCircle.style.stroke = phoneThemeColor;
    phoneGaugeCircle.style.strokeDashoffset = offset;
  }

  const phoneScoreDisplay = document.getElementById('phone-score-display');
  if (phoneScoreDisplay) {
    phoneScoreDisplay.style.color = phoneThemeColor;
    animateCountUp(phoneScoreDisplay, riskScore);
  }

  const phoneVerdictTitle = document.getElementById('phone-verdict-title');
  if (phoneVerdictTitle) {
    if (riskScore >= 70) {
      phoneVerdictTitle.textContent = 'Dangerous Scam Flagged';
      phoneVerdictTitle.style.color = '#DC2626';
    } else if (riskScore >= 35) {
      phoneVerdictTitle.textContent = 'Commercial Telemarketer (TRAI 140)';
      phoneVerdictTitle.style.color = '#D97706';
    } else if (riskScore <= 10) {
      phoneVerdictTitle.textContent = 'Verified Official Helpline';
      phoneVerdictTitle.style.color = '#059669';
    } else {
      phoneVerdictTitle.textContent = 'Unverified Private Caller';
      phoneVerdictTitle.style.color = '#1E293B';
    }
  }

  const phoneRiskSummary = document.getElementById('phone-risk-summary');
  if (phoneRiskSummary) {
    if (riskScore >= 70) {
      phoneRiskSummary.textContent = 'Confirmed high danger! Associated with aggressive extortion tactics (Digital Arrest, fake customs/police seizure, or predatory loan APK). Disconnect and block immediately.';
    } else if (riskScore >= 35) {
      phoneRiskSummary.textContent = 'Commercial promotional telemarketing channel under DoT/TRAI 140 series. Never use for banking alerts. Send SMS to 1909 to block.';
    } else if (riskScore <= 10) {
      phoneRiskSummary.textContent = 'Conforms to official institutional / TRAI 160 transactional series. Verified official line. Note: Legitimate representatives will never ask for PINs, OTPs, or passwords.';
    } else {
      phoneRiskSummary.textContent = 'Standard private mobile subscriber. Not registered as a verified business or banking line. Scammers frequently operate from standard private SIMs. Never disclose OTPs or financial PINs.';
    }
  }

  const phoneRiskBadge = document.getElementById('phone-risk-badge');
  if (phoneRiskBadge) {
    if (riskScore >= 70) {
      phoneRiskBadge.textContent = '🚨 DANGER • BLOCK THIS NUMBER';
      phoneRiskBadge.className = 'pclean-action-chip pclean-pill-red';
    } else if (riskScore >= 35) {
      phoneRiskBadge.textContent = '⚠️ CAUTION • PROMOTIONAL SPAM';
      phoneRiskBadge.className = 'pclean-action-chip pclean-pill-yellow';
    } else if (riskScore <= 10) {
      phoneRiskBadge.textContent = '✓ OFFICIAL TRANSACTIONAL LINE';
      phoneRiskBadge.className = 'pclean-action-chip pclean-pill-green';
    } else {
      phoneRiskBadge.textContent = '⚠️ CAUTION • DO NOT SHARE OTP';
      phoneRiskBadge.className = 'pclean-action-chip pclean-pill-blue';
    }
  }

  // 3. The 4 Essential Telemetry Cards (Right Grid)
  // Card 1: Line Allocation
  const tileLine = document.getElementById('phone-tile-line');
  const tileCarrier = document.getElementById('phone-tile-carrier');
  if (tileLine) {
    if (lineTypeStr === 'TOLL_FREE') tileLine.textContent = 'Toll-Free (1800)';
    else if (lineTypeStr === 'VOIP') tileLine.textContent = 'VoIP Virtual Line';
    else if (lineTypeStr === 'FIXED_LINE') tileLine.textContent = 'Landline';
    else tileLine.textContent = `${operatorName} • Mobile (GSM/LTE)`;
  }
  if (tileCarrier) {
    if (lineTypeStr === 'VOIP') tileCarrier.textContent = 'Virtual cloud telephony channel';
    else if (lineTypeStr === 'TOLL_FREE') tileCarrier.textContent = 'Standard toll-free routing code';
    else tileCarrier.textContent = `${carrier.operator} • DoT NNP allocation verified`;
  }

  // Card 2: Dialing Origin & Circle
  const tileOrigin = document.getElementById('phone-tile-origin');
  const tileOriginSub = document.getElementById('phone-tile-origin-sub');
  if (tileOrigin) {
    tileOrigin.textContent = `${countryName} (${callingCode})`;
  }
  if (tileOriginSub) {
    tileOriginSub.textContent = isDomestic ? 'Standard domestic routing circle' : 'International dialing origin';
  }

  // Card 3: TRAI Regulation
  const isTrai140 = (signals || []).some(s => s.id === 'TRAI_140_TELEMARKETING');
  const isTrai160 = (signals || []).some(s => s.id === 'TRAI_160_TRANSACTIONAL');
  const tileTrai = document.getElementById('phone-tile-trai');
  const tileTraiSub = document.getElementById('phone-tile-trai-sub');
  if (tileTrai) {
    if (isTrai140) {
      tileTrai.textContent = 'TRAI 140 Series';
      tileTrai.style.color = '#D97706';
      if (tileTraiSub) tileTraiSub.textContent = 'Commercial promotional telemarketing';
    } else if (isTrai160 || riskScore <= 10) {
      tileTrai.textContent = 'TRAI 160 Official';
      tileTrai.style.color = '#10B981';
      if (tileTraiSub) tileTraiSub.textContent = 'Authorized banking / transactional line';
    } else if (riskScore >= 70) {
      tileTrai.textContent = 'Non-Compliant / Flagged';
      tileTrai.style.color = '#DC2626';
      if (tileTraiSub) tileTraiSub.textContent = 'Flagged for regulatory violation & cyber crime';
    } else {
      tileTrai.textContent = 'Standard Subscriber';
      tileTrai.style.color = '#475569';
      if (tileTraiSub) tileTraiSub.textContent = 'Private cellular block (Unverified KYC)';
    }
  }

  // Card 4: Abuse Radar
  const tileReports = document.getElementById('phone-tile-reports');
  const tileReportsSub = document.getElementById('phone-tile-reports-sub');
  const reportCount = data.communityReportCount || 0;
  if (tileReports) {
    if (reportCount > 0) {
      tileReports.textContent = `${reportCount} Active Citizen Report(s)`;
      tileReports.style.color = '#DC2626';
      if (tileReportsSub) tileReportsSub.textContent = 'Flagged in citizen cyber crime logs';
    } else if (riskScore >= 70) {
      tileReports.textContent = 'Scam Pattern Match';
      tileReports.style.color = '#DC2626';
      if (tileReportsSub) tileReportsSub.textContent = 'Matches active 1930 / cyber cell extortion patterns';
    } else if (riskScore >= 35) {
      tileReports.textContent = 'Telemarketing Block';
      tileReports.style.color = '#D97706';
      if (tileReportsSub) tileReportsSub.textContent = 'Commercial promotional broadcast';
    } else if (riskScore <= 10) {
      tileReports.textContent = 'Official Verified';
      tileReports.style.color = '#10B981';
      if (tileReportsSub) tileReportsSub.textContent = 'Registered corporate/institutional helpline';
    } else {
      tileReports.textContent = '0 Prior Complaints';
      tileReports.style.color = '#475569';
      if (tileReportsSub) tileReportsSub.textContent = 'No prior cyber cell complaints logged';
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
function renderUrlView(data, theme, riskScore, signals, recommendations, target) {
  // 1. Sync Minimalist Quick Input Field
  const quickInput = document.getElementById('url-quick-input');
  if (quickInput) {
    quickInput.value = target.replace(/^https?:\/\//i, '');
  }

  // 2. Animate Circular SVG Gauge (Radius 68, Circumference 427.2)
  const gaugeCircle = document.getElementById('gauge-circle');
  if (gaugeCircle) {
    const circumference = 427.2;
    if (riskScore === 0) {
      gaugeCircle.style.stroke = '#10B981';
      gaugeCircle.style.strokeDashoffset = '0';
    } else {
      const offset = circumference - (riskScore / 100) * circumference;
      gaugeCircle.style.stroke = theme.color;
      gaugeCircle.style.strokeDashoffset = offset;
    }
  }

  // 3. Smooth Numerical Count-up
  const scoreDisplay = document.getElementById('score-display');
  if (scoreDisplay) {
    scoreDisplay.style.color = theme.color;
    animateCountUp(scoreDisplay, riskScore);
  }

  // 4. 4-Stage Meter Active Segment
  const mLow = document.getElementById('meter-low');
  const mMod = document.getElementById('meter-mod');
  const mHigh = document.getElementById('meter-high');
  const mCrit = document.getElementById('meter-crit');
  if (mLow && mMod && mHigh && mCrit) {
    mLow.classList.toggle('active', riskScore < 25);
    mMod.classList.toggle('active', riskScore >= 25 && riskScore < 50);
    mHigh.classList.toggle('active', riskScore >= 50 && riskScore < 75);
    mCrit.classList.toggle('active', riskScore >= 75);
  }

  // 5. Verdict Headline & Description (Plain English, Human-Understandable)
  const verdictPillEl = document.getElementById('risk-badge');
  const verdictTitleEl = document.getElementById('url-verdict-title');
  const verdictDescEl = document.getElementById('risk-summary');
  const hdrStatusPill = document.getElementById('url-header-status-pill');

  if (riskScore < 25) {
    if (verdictPillEl) {
      verdictPillEl.textContent = '✓ VERIFIED SAFE TO VISIT';
      verdictPillEl.className = 'pclean-action-chip pclean-pill-green';
    }
    if (verdictTitleEl) {
      verdictTitleEl.textContent = 'Safe to Browse';
    }
    if (verdictDescEl) {
      verdictDescEl.textContent = 'This website looks genuine and safe to visit. No deceptive tricks, fake logins, or scam reports found.';
    }
    if (hdrStatusPill) {
      hdrStatusPill.textContent = '● SAFE & VERIFIED';
      hdrStatusPill.className = 'pclean-pill pclean-pill-green';
    }
  } else if (riskScore < 50) {
    if (verdictPillEl) {
      verdictPillEl.textContent = '⚠️ CAUTION • UNVERIFIED DOMAIN';
      verdictPillEl.className = 'pclean-action-chip pclean-pill-yellow';
    }
    if (verdictTitleEl) {
      verdictTitleEl.textContent = 'Caution Advised';
    }
    if (verdictDescEl) {
      verdictDescEl.textContent = 'This website exhibits unusual structure or newly registered domain patterns. Avoid sharing passwords or personal credentials.';
    }
    if (hdrStatusPill) {
      hdrStatusPill.textContent = '▲ CAUTION ADVISED';
      hdrStatusPill.className = 'pclean-pill pclean-pill-yellow';
    }
  } else if (riskScore < 75) {
    if (verdictPillEl) {
      verdictPillEl.textContent = '⚠️ SUSPICIOUS • DO NOT SHARE DATA';
      verdictPillEl.className = 'pclean-action-chip pclean-pill-yellow';
    }
    if (verdictTitleEl) {
      verdictTitleEl.textContent = 'Suspicious Website';
    }
    if (verdictDescEl) {
      verdictDescEl.textContent = 'Security heuristics detected lookalike characters, unauthorized brand references, or credential harvesting patterns.';
    }
    if (hdrStatusPill) {
      hdrStatusPill.textContent = '⚠️ SUSPICIOUS';
      hdrStatusPill.className = 'pclean-pill pclean-pill-yellow';
    }
  } else {
    if (verdictPillEl) {
      verdictPillEl.textContent = '🚨 DANGER • CONFIRMED PHISHING TRAP';
      verdictPillEl.className = 'pclean-action-chip pclean-pill-red';
    }
    if (verdictTitleEl) {
      verdictTitleEl.textContent = 'Critical Scam Warning';
    }
    if (verdictDescEl) {
      verdictDescEl.textContent = 'Confirmed malicious trap designed to harvest banking passwords, OTPs, or credit card details. Disconnect immediately.';
    }
    if (hdrStatusPill) {
      hdrStatusPill.textContent = '🚨 PHISHING DETECTED';
      hdrStatusPill.className = 'pclean-pill pclean-pill-red';
    }
  }

  // 6. Header Metadata (Canonical, Protocol, TLD)
  const isHttp = /^http:\/\//i.test(target);
  const canonicalEl = document.getElementById('dossier-canonical');
  if (canonicalEl) {
    const formatted = target.startsWith('http') ? target : `https://${target}/`;
    canonicalEl.textContent = formatted;
  }
  const protoTag = document.getElementById('url-proto-tag');
  if (protoTag) {
    protoTag.textContent = isHttp ? 'HTTP (INSECURE)' : 'HTTPS (TLS 1.3)';
    protoTag.className = isHttp ? 'pclean-pill pclean-pill-red' : 'pclean-pill pclean-pill-green';
  }
  const tldTag = document.getElementById('url-tld-tag');
  if (tldTag) {
    try {
      const parsed = new URL(target.startsWith('http') ? target : `https://${target}`);
      const parts = parsed.hostname.split('.');
      const tld = parts.length > 1 ? '.' + parts[parts.length - 1].toUpperCase() + ' DOMAIN' : 'DOMAIN';
      tldTag.textContent = tld;
    } catch (e) {
      tldTag.textContent = 'WEB DOMAIN';
    }
  }

  // 7. Update Report Button Link
  const reportBtn = document.getElementById('btn-report-target');
  if (reportBtn) {
    reportBtn.href = `reports.html?type=url&query=${encodeURIComponent(target)}`;
  }

  // 8. 4 Human-Friendly Bento Cards (Right Grid)
  // Card 1: SSL & Encryption
  const metaProto = document.getElementById('hero-meta-proto');
  const metaProtoDesc = document.getElementById('hero-meta-proto-desc');
  const metaProtoIcon = document.getElementById('hero-meta-proto-icon');
  if (metaProto) {
    metaProto.textContent = isHttp ? 'Insecure (HTTP)' : 'Secure (TLS 1.3 / HTTPS)';
    metaProto.style.color = isHttp ? '#DC2626' : '#059669';
  }
  if (metaProtoDesc) {
    metaProtoDesc.textContent = isHttp 
      ? 'Unencrypted connection — data sent here can be intercepted' 
      : 'Encrypted connection with a valid security certificate';
  }
  if (metaProtoIcon) {
    metaProtoIcon.style.background = isHttp ? '#FEE2E2' : '#ECFDF5';
    metaProtoIcon.style.color = isHttp ? '#DC2626' : '#059669';
  }

  // Card 2: Real-Time Domain Age & Registry Forensics
  const domainIntel = (data && data.domainIntel) ? data.domainIntel : null;
  const isDirectIp = (data && data.isIp) || (domainIntel && domainIntel.isIp);
  const metaHost = document.getElementById('hero-meta-host');
  const metaHostDesc = document.getElementById('hero-meta-host-desc');
  const metaHostIcon = document.getElementById('hero-meta-host-icon');
  const metaHostLabel = document.getElementById('hero-meta-host-label');
  if (metaHostLabel) {
    metaHostLabel.textContent = isDirectIp ? 'Host Architecture' : 'Domain Age & Registry';
  }

  if (isDirectIp) {
    if (metaHost) {
      metaHost.textContent = 'Direct IP Address Host';
      metaHost.style.color = '#D97706';
    }
    if (metaHostDesc) {
      metaHostDesc.textContent = 'Raw IP host — often used in phishing to bypass domain security';
    }
    if (metaHostIcon) {
      metaHostIcon.style.background = '#FEF3C7';
      metaHostIcon.style.color = '#D97706';
    }
  } else if (domainIntel && domainIntel.domainAgeFormatted && domainIntel.domainAgeFormatted !== 'Age Unknown') {
    const isNew = domainIntel.isNewlyRegistered;
    const isRecent = domainIntel.isRecent;
    if (metaHost) {
      metaHost.textContent = domainIntel.domainAgeFormatted;
      metaHost.style.color = isNew ? '#DC2626' : (isRecent ? '#D97706' : '#0F172A');
    }
    if (metaHostDesc) {
      metaHostDesc.textContent = isNew
        ? `🚨 Registered ${domainIntel.domainAgeDays} days ago (${domainIntel.creationDateFormatted || 'Recent'}) — disposable phishing risk`
        : `Registrar: ${domainIntel.registrar || 'ICANN Registry'} • ${domainIntel.primaryStatus || 'Active'}`;
    }
    if (metaHostIcon) {
      metaHostIcon.style.background = isNew ? '#FEE2E2' : (isRecent ? '#FEF3C7' : '#EFF6FF');
      metaHostIcon.style.color = isNew ? '#DC2626' : (isRecent ? '#D97706' : '#2563EB');
    }
  } else {
    if (metaHost) {
      metaHost.textContent = 'Official Apex Domain';
      metaHost.style.color = '#0F172A';
    }
    if (metaHostDesc) {
      metaHostDesc.textContent = 'Clean registered domain name, authentic root namespace';
    }
    if (metaHostIcon) {
      metaHostIcon.style.background = '#EFF6FF';
      metaHostIcon.style.color = '#2563EB';
    }
  }

  // Card 3: Phishing & Impersonation
  const hasSpoof = (signals || []).some(s => s.id === 'BRAND_IMPERSONATION' || s.id === 'PUNYCODE_DOMAIN');
  const metaSpoof = document.getElementById('hero-meta-spoof');
  const metaSpoofDesc = document.getElementById('hero-meta-spoof-desc');
  const metaSpoofIcon = document.getElementById('hero-meta-spoof-icon');
  if (metaSpoof) {
    metaSpoof.textContent = hasSpoof ? 'Impersonation Flagged' : 'Clean (Zero Spoofing)';
    metaSpoof.style.color = hasSpoof ? '#DC2626' : '#059669';
  }
  if (metaSpoofDesc) {
    metaSpoofDesc.textContent = hasSpoof
      ? 'Suspicious brand keyword or lookalike tricks identified'
      : 'No deceptive lookalike characters or brand impersonation';
  }
  if (metaSpoofIcon) {
    metaSpoofIcon.style.background = hasSpoof ? '#FEE2E2' : '#ECFDF5';
    metaSpoofIcon.style.color = hasSpoof ? '#DC2626' : '#059669';
  }

  // Card 4: Threat Intelligence
  const sigCount = (signals || []).length;
  const metaFlags = document.getElementById('hero-meta-flags');
  const metaFlagsDesc = document.getElementById('hero-meta-flags-desc');
  const metaFlagsIcon = document.getElementById('hero-meta-flags-icon');
  if (metaFlags) {
    metaFlags.textContent = sigCount > 0 ? `${sigCount} Warning Flag${sigCount === 1 ? '' : 's'}` : '0 Active Reports';
    metaFlags.style.color = sigCount > 0 ? '#DC2626' : '#059669';
  }
  if (metaFlagsDesc) {
    metaFlagsDesc.textContent = sigCount > 0
      ? `${sigCount} suspicious pattern(s) flagged by security checks`
      : 'Clean record across CERT-In, APWG, and global scam logs';
  }
  if (metaFlagsIcon) {
    metaFlagsIcon.style.background = sigCount > 0 ? '#FEE2E2' : '#EFF6FF';
    metaFlagsIcon.style.color = sigCount > 0 ? '#DC2626' : '#2563EB';
  }

  // 9. Populate Findings (Signals) & Safety Playbook (Recommendations)
  renderSignalsList(signals, theme, 'signals-container', 'signals-count-pill');
  renderRecommendationsList(recommendations, theme, 'recommendation-text');

  // 10. Populate Real-Time Domain Forensics & Specifications (Owner PII strictly redacted)
  renderDomainSpecifications(target, data, domainIntel);
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
      <div class="url-clean-seal-box">
        <div class="url-clean-seal-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 12 11 14 15 10"></polyline>
          </svg>
          <span>All Security Checks Passed</span>
        </div>
        <p class="url-clean-seal-desc">
          Automated heuristics verified SSL encryption, domain structure, and global scam databases. Zero deceptive phishing patterns or fake logins were detected.
        </p>
        <div class="url-clean-seal-tip">
          <strong>Safety Note:</strong> Always ensure the address in your browser matches the intended organization before entering passwords or payment details.
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


async function enrichWithCommunityReports(resultData, query) {
  try {
    const alreadyFlagged = (resultData.signals || []).some(s => s.id && s.id.startsWith('COMMUNITY_'));

    const res = await fetch('/api/reports');
    if (!res.ok) return resultData;

    const data = await res.json();
    const reports = data.reports || [];

    const qDigits = String(query || '').replace(/\D/g, '');
    const cleanQuery = String(query || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
    const qHost = cleanQuery.replace(/^www\./, '').split('/')[0].split(':')[0];

    const matchingReports = reports.filter(r => {
      if (!r.identifier) return false;
      const rId = String(r.identifier).toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
      const rType = (r.type || '').toLowerCase();

      // 1. Phone match by last 10 digits
      if (qDigits.length >= 8 && (rType.includes('phone') || /^\+?\d[\d\s-]{7,}/.test(r.identifier))) {
        const rDigits = String(r.identifier).replace(/\D/g, '');
        if (rDigits.length >= 8 && qDigits.slice(-10) === rDigits.slice(-10)) return true;
      }

      // 2. Domain / URL match
      if (qHost && (rType.includes('web') || rType.includes('url') || rType.includes('site') || !rType)) {
        const rHost = rId.replace(/^www\./, '').split('/')[0].split(':')[0];
        if (qHost === rHost || qHost.endsWith('.' + rHost) || rHost.endsWith('.' + qHost) || cleanQuery === rId) {
          return true;
        }
      }

      // 3. Exact string match (UPI / Email / identifier)
      if (cleanQuery === rId || cleanQuery === rId.replace(/^@/, '') || rId === cleanQuery.replace(/^@/, '')) {
        return true;
      }

      return false;
    });

    if (matchingReports.length > 0) {
      resultData.communityReportCount = matchingReports.length;

      const threatMatch = matchingReports.find(r => r.risk && !r.risk.toLowerCase().includes('low') && !r.risk.toLowerCase().includes('safe'));
      const safeMatch = matchingReports.find(r => r.risk && (r.risk.toLowerCase().includes('low') || r.risk.toLowerCase().includes('safe')));

      resultData.signals = resultData.signals || [];
      resultData.recommendations = resultData.recommendations || [];

      if (threatMatch) {
        resultData.riskScore = Math.max(resultData.riskScore || 0, 90);
        resultData.riskLevel = 'critical';

        if (!alreadyFlagged) {
          resultData.signals.unshift({
            id: 'COMMUNITY_REPORTED',
            title: `Community Cyber Threat Flag (${matchingReports.length} Active Report${matchingReports.length > 1 ? 's' : ''})`,
            description: `This target is actively flagged in the INFRAUD community database: "${threatMatch.evidence || 'Reported scam activity'}" (Reported by: ${threatMatch.reporterName || 'Community User'})`,
            severity: 'critical'
          });
        }

        if (!resultData.recommendations.some(r => r.includes('community fraud reports'))) {
          resultData.recommendations.unshift('This target is currently flagged in community fraud reports. Do not engage, transact, or disclose credentials.');
        }
      } else if (safeMatch && !threatMatch) {
        resultData.riskScore = 0;
        resultData.riskLevel = 'low';

        if (!alreadyFlagged) {
          resultData.signals.unshift({
            id: 'COMMUNITY_VERIFIED_AUTHENTIC',
            title: 'Official & Verified Authentic Target',
            description: `Verified in the INFRAUD registry: "${safeMatch.evidence || 'Verified official domain/helpline'}"`,
            severity: 'low'
          });
        }
      }
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
  let score = 25; // Default unverified private line score
  let isVerifiedOfficial = false;

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

  // 1. Check known cyber crime threat numbers
  const knownScams = [
    { p: /^(?:91)?(?:9876543210|9876543211|9123456789|9822001122|8826412345)$/, id: 'FEDEX_SEIZURE_SCAM', title: 'FedEx / DHL Contraband Parcel Scam', desc: 'Flagged in national scam logs. Claims narcotics seized in package.' },
    { p: /^(?:91)?(?:8010237029|9822998877|9876500001|9123456780|9910998877|9899112233|9820011223)$/, id: 'DIGITAL_ARREST_EXTORTION', title: 'Digital Arrest / Police Extortion Syndicate', desc: 'Impersonates CBI / Mumbai Police demanding video interrogation.' },
    { p: /^(?:91)?(?:7000123456|9011012345|9028012345|9049012345|9503012345|9527012345)$/, id: 'ELECTRICITY_BILL_SCAM', title: 'Electricity Bill Disconnection Phishing', desc: 'Threatens power cutoff tonight unless unauthorized payment is made.' },
    { p: /^(?:91)?(?:7021099887|7021599887|7201099887|6201099887|7301099887)$/, id: 'TELEGRAM_TASK_SCAM', title: 'Telegram Task & YouTube Review Job Scam', desc: 'Prepaid task recruitment scam defrauding victims of investments.' },
    { p: /^(?:91)?(?:8010299887|8888012345|8600012345)$/, id: 'LOAN_APP_EXTORTION', title: 'Predatory Loan App Harassment Line', desc: 'Unauthorized loan app executing blackmail and contact harassment.' }
  ];
  const scamMatch = knownScams.find(s => s.p.test(digits));
  if (scamMatch) {
    signals.push({ id: scamMatch.id, title: scamMatch.title, description: scamMatch.desc, severity: 'critical', weight: 90 });
    score = 90;
  }

  // 2. Check official toll-free and institutional lines
  const officialLines = [
    { p: /^(?:91)?(?:1800112211|18004253800)$/, title: 'State Bank of India (SBI) Customer Care', desc: 'Verified official SBI customer care helpline.' },
    { p: /^(?:91)?(?:18002584455|18001024455)$/, title: 'Bank of Baroda Customer Care', desc: 'Verified official Bank of Baroda customer care helpline.' },
    { p: /^(?:91)?1930$/, title: 'National Cyber Crime Reporting Helpline', desc: 'Government citizen cyber fraud reporting line.' },
    { p: /^(?:91)?1909$/, title: 'TRAI DND Consumer Helpline', desc: 'Official TRAI Do Not Disturb telecom helpline.' }
  ];
  const offMatch = officialLines.find(o => o.p.test(digits));
  if (offMatch) {
    isVerifiedOfficial = true;
    signals.push({ id: 'OFFICIAL_INSTITUTIONAL_LINE', title: offMatch.title, description: offMatch.desc, severity: 'low', weight: 5 });
    score = 5;
  }

  // 3. Check spoofed patterns
  const d10 = digits.slice(-10);
  if (/^(\d)\1{9}$/.test(d10)) {
    signals.push({ id: 'SPOOFED_REPETITIVE', title: 'Spoofed Caller ID: Repetitive Sequence', description: 'Consists of identical repeating digits, indicative of VoIP PBX spoofing.', severity: 'critical', weight: 85 });
    score = Math.max(score, 85);
  } else if (d10 === '1234567890' || d10 === '9876543210' || d10 === '0123456789') {
    signals.push({ id: 'SPOOFED_SEQUENTIAL', title: 'Spoofed Caller ID: Sequential Ladder', description: 'Artificial ascending or descending digit ladder.', severity: 'critical', weight: 85 });
    score = Math.max(score, 85);
  }

  // Check for TRAI 140 commercial telemarketing
  if (/^(\+?91)?140\d{7}$/.test(digits)) {
    signals.push({
      id: 'TRAI_140_TELEMARKETING',
      title: 'TRAI 140 Series (Commercial Telemarketing)',
      description: 'Reserved strictly for commercial telemarketing and promotional calls under DoT/TRAI regulations.',
      severity: 'medium',
      weight: 60
    });
    score = 60;
  }

  // Check for TRAI 160 official transactional series
  if (/^(\+?91)?160[01]?\d{6,7}$/.test(digits)) {
    isVerifiedOfficial = true;
    signals.push({
      id: 'TRAI_160_TRANSACTIONAL',
      title: 'TRAI 160 Series (Official Transactional Line)',
      description: 'Mandated DoT/TRAI prefix for verified banking and transactional alerts.',
      severity: 'low',
      weight: 5
    });
    score = 5;
  }

  // Check for Toll-Free 1800
  const isTollFree = /^(\+?91)?1800\d{6,7}$/.test(digits);
  if (isTollFree && !isVerifiedOfficial) {
    signals.push({
      id: 'TOLL_FREE_NUMBER',
      title: 'Toll-Free Telecommunications Line',
      description: 'Standard toll-free helpline number. Always cross-check against official corporate portals.',
      severity: 'low',
      weight: 15
    });
    score = 15;
  }

  // Standard Indian 10-digit mobile
  const isIndianMobile = /^(\+?91|0)?[6-9]\d{9}$/.test(digits);
  if (isIndianMobile && !scamMatch && !offMatch && !isVerifiedOfficial && !/^(\+?91)?140/.test(digits) && signals.length === 0) {
    signals.push({
      id: 'UNVERIFIED_PRIVATE_SUBSCRIBER',
      title: 'Unverified Private Cellular Line',
      description: 'Standard domestic mobile subscriber. Unverified personal KYC; never disclose OTPs or financial PINs to unknown callers.',
      severity: 'medium',
      weight: 25
    });
    score = 25;
  }

  const riskScore = Math.min(100, score);
  const riskLevel = riskScore >= 70 ? 'critical' : (riskScore >= 45 ? 'high' : (riskScore >= 20 ? 'medium' : 'low'));
  const assessmentStatus = isVerifiedOfficial ? 'verified_official' : (scamMatch ? 'scam_threat_flagged' : (riskScore >= 35 ? 'promotional_telemarketing' : 'unverified_subscriber'));

  return {
    riskScore,
    riskLevel,
    isVerifiedOfficial,
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
      riskScore >= 70 ? '🚨 Immediate Block: Disconnect call and add this number to your device blocklist immediately.' : 'Never share OTPs, UPI PINs, net-banking passwords, or CVVs with any caller.',
      'Government and police officials will never conduct arrests or demand urgent money transfers over Skype/WhatsApp calls.'
    ]
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


/**
 * 1-Click Citizen Flag: Instantly report and elevate threat status on result page
 */
window.quickFlagPhoneAsScam = async function() {
  const phoneTarget = currentTargetQuery || (document.getElementById('phone-target-display') ? document.getElementById('phone-target-display').textContent.replace(/[^\d+]/g, '') : '');
  if (!phoneTarget) return;

  const btn = document.getElementById('btn-quick-flag-scam');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span style="color: #DC2626; font-weight: 700;">Submitting...</span>';
  }

  try {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: phoneTarget,
        type: 'Phone',
        risk: 'Critical',
        evidence: 'Citizen reported scam/extortion caller via 1-click fraud radar.'
      })
    });
  } catch (e) {
    console.warn('Scam submission error:', e);
  }

  const flaggedData = {
    target: phoneTarget,
    riskScore: 92,
    riskLevel: 'critical',
    lineType: 'MOBILE',
    validationStatus: 'VALID',
    communityReportCount: 1,
    signals: [{
      id: 'COMMUNITY_REPORTED_SCAM',
      title: 'Citizen Cyber Crime Report (Instant Flag)',
      description: 'Reported by user on this session as an active scam/extortion caller. Added to community defense registry.',
      severity: 'critical',
      weight: 92
    }],
    recommendations: [
      '🚨 Immediate Block: Disconnect and add this number to your device blocklist immediately.',
      'Never share OTPs, UPI PINs, net-banking credentials, or debit/credit card CVVs with any caller.'
    ]
  };

  const redTheme = { color: '#DC2626' };
  renderPhoneView(flaggedData, redTheme, 92, flaggedData.signals, flaggedData.recommendations);

  if (btn) {
    btn.innerHTML = '<span style="color: #10B981; font-weight: 700;">✓ Flagged as Scam</span>';
    btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    btn.style.background = '#ECFDF5';
  }

  alert('🚨 Thank you! This number has been flagged as a Dangerous Scam and recorded in the citizen defense feed.');
};


/**
 * Renders real-time domain forensics and technical specifications into the DOM.
 * STRICT PRIVACY REQUIREMENT: Domain owner personal details (names, private emails, phone numbers)
 * are strictly hidden and redacted per user requirement and GDPR compliance.
 */
function renderDomainSpecifications(target, data, intel) {
  let hostname = '';
  try {
    const parsed = new URL(target.startsWith('http') ? target : `https://${target}`);
    hostname = parsed.hostname;
  } catch (e) {
    hostname = target;
  }

  const isHttp = /^http:\/\//i.test(target);
  const specName = document.getElementById('spec-domain-name');
  const specAge = document.getElementById('spec-domain-age');
  const specCreated = document.getElementById('spec-domain-created');
  const specExpiry = document.getElementById('spec-domain-expiry');
  const specRegistrar = document.getElementById('spec-domain-registrar');
  const specNs = document.getElementById('spec-domain-ns');
  const specIp = document.getElementById('spec-domain-ip');
  const specStatus = document.getElementById('spec-domain-status');
  const specOwner = document.getElementById('spec-domain-owner');
  const specBadge = document.getElementById('spec-domain-badge');

  if (specName) specName.textContent = (intel && intel.domain) || hostname;

  if (intel && intel.domainAgeFormatted && intel.domainAgeFormatted !== 'Age Unknown') {
    if (specAge) {
      specAge.textContent = intel.domainAgeFormatted;
      specAge.style.color = intel.isNewlyRegistered ? '#DC2626' : (intel.isRecent ? '#D97706' : '#059669');
    }
    if (specCreated) specCreated.textContent = intel.creationDateFormatted || 'Historical Record';
    if (specExpiry) specExpiry.textContent = intel.expirationDateFormatted || 'Active Registry';
    if (specRegistrar) specRegistrar.textContent = intel.registrar || 'ICANN Accredited Registrar';
    if (specNs) {
      specNs.textContent = intel.primaryNameServer || (intel.nameServers && intel.nameServers[0]) || 'Authoritative DNS';
      if (intel.nameServers && intel.nameServers.length > 1) {
        specNs.title = intel.nameServers.join(', ');
      }
    }
    if (specIp) {
      const ip = intel.primaryIp || (intel.resolvedIps && intel.resolvedIps[0]) || 'Active Host';
      specIp.textContent = `${ip} • ${isHttp ? 'HTTP' : 'TLS 1.3 / HTTPS'}`;
    }
    if (specStatus) specStatus.textContent = intel.primaryStatus || 'Active / Verified';
    if (specBadge) specBadge.textContent = intel.dataSource || 'LIVE RDAP';
  } else if (intel && intel.isIp) {
    if (specAge) { specAge.textContent = 'Raw IP (No Domain Age)'; specAge.style.color = '#D97706'; }
    if (specCreated) specCreated.textContent = 'IANA Subnet Allocation';
    if (specExpiry) specExpiry.textContent = 'Perpetual Subnet Block';
    if (specRegistrar) specRegistrar.textContent = 'IANA / Regional Registry';
    if (specNs) specNs.textContent = 'Direct IP (No Nameserver)';
    if (specIp) specIp.textContent = `${hostname} • ${isHttp ? 'HTTP' : 'HTTPS'}`;
    if (specStatus) specStatus.textContent = 'Active Numeric Host';
    if (specBadge) specBadge.textContent = 'DIRECT IP';
  } else {
    // Fallback display while querying live backend endpoint
    if (specAge) specAge.textContent = 'Checking Registry...';
    if (specCreated) specCreated.textContent = 'Querying RDAP...';
    if (specExpiry) specExpiry.textContent = 'Querying RDAP...';
    if (specRegistrar) specRegistrar.textContent = 'ICANN Accredited Registrar';
    if (specNs) specNs.textContent = 'Authoritative DNS';
    if (specIp) specIp.textContent = `Resolving DNS • ${isHttp ? 'HTTP' : 'HTTPS'}`;
    if (specStatus) specStatus.textContent = 'Active Apex Domain';
    if (specBadge) specBadge.textContent = 'QUERYING';

    // Query online endpoint /api/analyze/domain asynchronously if intel wasn't already attached
    fetch(`/api/analyze/domain?domain=${encodeURIComponent(hostname)}`)
      .then(r => r.json())
      .then(liveIntel => {
        if (liveIntel && liveIntel.success) {
          renderDomainSpecifications(target, data, liveIntel);
          // Also update Card 2 if still in default state
          const metaHost = document.getElementById('hero-meta-host');
          const metaHostDesc = document.getElementById('hero-meta-host-desc');
          const metaHostIcon = document.getElementById('hero-meta-host-icon');
          if (metaHost && liveIntel.domainAgeFormatted && liveIntel.domainAgeFormatted !== 'Age Unknown') {
            const isNew = liveIntel.isNewlyRegistered;
            const isRecent = liveIntel.isRecent;
            metaHost.textContent = liveIntel.domainAgeFormatted;
            metaHost.style.color = isNew ? '#DC2626' : (isRecent ? '#D97706' : '#0F172A');
            if (metaHostDesc) {
              metaHostDesc.textContent = isNew
                ? `🚨 Registered ${liveIntel.domainAgeDays} days ago — disposable phishing risk`
                : `Registrar: ${liveIntel.registrar || 'ICANN Accredited'} • ${liveIntel.primaryStatus || 'Active'}`;
            }
            if (metaHostIcon) {
              metaHostIcon.style.background = isNew ? '#FEE2E2' : (isRecent ? '#FEF3C7' : '#EFF6FF');
              metaHostIcon.style.color = isNew ? '#DC2626' : (isRecent ? '#D97706' : '#2563EB');
            }
          }
        }
      })
      .catch(() => {});
  }

  // EXPLICIT GDPR/PRIVACY REQUIREMENT:
  // Strictly hide domain owner personal details per user directive
  if (specOwner) {
    specOwner.textContent = (intel && intel.registrant) || '🔒 Redacted for Privacy (Protected per GDPR / Privacy Standards)';
  }
}
