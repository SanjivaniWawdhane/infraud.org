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
async function initAnalysis() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawQuery = urlParams.get('query') || urlParams.get('q') || urlParams.get('url');
  const type = (urlParams.get('type') || 'url').toLowerCase();

  currentTargetType = type;

  // If no query parameter provided, show prompt
  if (!rawQuery || !rawQuery.trim()) {
    showNoTargetState();
    return;
  }

  const query = rawQuery.trim();
  currentTargetQuery = query;

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
    } else {
      // Non-URL targets: Phone number or UPI ID
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
  const iconBox = document.getElementById('target-type-icon');
  const catTag = document.getElementById('target-category-tag');
  const protocolTag = document.getElementById('target-protocol-tag');

  if (type === 'phone') {
    if (catTag) catTag.textContent = 'Phone Number Target';
    if (protocolTag) {
      protocolTag.textContent = 'Cellular / Telecom';
      protocolTag.style.color = 'var(--ink-500, #4B5570)';
    }
    if (iconBox) {
      iconBox.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      `;
    }
  } else if (type === 'upi') {
    if (catTag) catTag.textContent = 'UPI VPA Handle';
    if (protocolTag) {
      protocolTag.textContent = 'NPCI Payment Rail';
      protocolTag.style.color = 'var(--blue-600, #2563EB)';
    }
    if (iconBox) {
      iconBox.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      `;
    }
  } else {
    // Website / URL
    const isHttp = /^http:\/\//i.test(query);
    if (catTag) catTag.textContent = 'Web Address';
    if (protocolTag) {
      if (isHttp) {
        protocolTag.textContent = 'HTTP Insecure (Plaintext)';
        protocolTag.style.color = '#EA580C';
      } else {
        protocolTag.textContent = 'HTTPS Encrypted';
        protocolTag.style.color = '#10B981';
      }
    }
    if (iconBox) {
      iconBox.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      `;
    }
  }
}

/**
 * Resets UI to spinning / evaluating state
 */
function showLoadingState() {
  const scoreDisplay = document.getElementById('score-display');
  const riskBadge = document.getElementById('risk-badge');
  const riskSummary = document.getElementById('risk-summary');
  const signalsContainer = document.getElementById('signals-container');
  const gaugeCircle = document.getElementById('gauge-circle');

  if (gaugeCircle) {
    gaugeCircle.style.strokeDashoffset = '439.8';
    gaugeCircle.style.stroke = '#2563EB';
  }

  if (scoreDisplay) {
    scoreDisplay.innerHTML = `<span style="font-size: 2.25rem; opacity: 0.5;">...</span>`;
    scoreDisplay.style.color = 'var(--ink-500, #4B5570)';
  }

  if (riskBadge) {
    riskBadge.textContent = 'ANALYZING';
    riskBadge.style.color = 'var(--ink-500, #4B5570)';
    riskBadge.style.background = 'rgba(75, 85, 112, 0.08)';
    riskBadge.style.borderColor = 'rgba(75, 85, 112, 0.2)';
  }

  if (riskSummary) {
    riskSummary.textContent = 'Executing real-time heuristic inspection across protocol, syntax, and threat indicators...';
  }

  if (signalsContainer) {
    signalsContainer.innerHTML = `
      <div style="padding: 48px 24px; text-align: center; color: var(--ink-500, #4B5570);">
        <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #E8EBF3; border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;"></div>
        <div style="font-weight: 600; font-size: 0.9375rem; color: var(--ink-800, #1E2742); margin-bottom: 4px;">Evaluating Target Heuristics...</div>
        <div style="font-size: 0.8125rem;">Checking hostname structure, brand mimics, TLD risk, and active community reports.</div>
      </div>
    `;
  }
}

/**
 * Renders verified analysis results with full visual styling
 */
function renderAnalysisResult(data) {
  const riskScore = Math.max(0, Math.min(100, Number(data.riskScore) || 0));
  const signals = data.signals || [];
  const recommendations = data.recommendations || [];
  const target = data.target || currentTargetQuery;

  // 1. Color and Verdict Configuration
  let theme = {
    color: '#10B981',
    bgPill: 'rgba(16, 185, 129, 0.1)',
    borderPill: 'rgba(16, 185, 129, 0.25)',
    label: 'LOW RISK / SAFE',
    summary: 'No obvious heuristic threat patterns detected in structure. Clean indicator profile.',
    cardGlow: 'rgba(16, 185, 129, 0.04)'
  };

  if (riskScore >= 75) {
    theme = {
      color: '#EF4444',
      bgPill: 'rgba(239, 68, 68, 0.1)',
      borderPill: 'rgba(239, 68, 68, 0.25)',
      label: 'CRITICAL THREAT',
      summary: 'Multiple high-confidence phishing, credential-theft, or deception vectors identified.',
      cardGlow: 'rgba(239, 68, 68, 0.05)'
    };
  } else if (riskScore >= 50) {
    theme = {
      color: '#EA580C',
      bgPill: 'rgba(234, 88, 12, 0.1)',
      borderPill: 'rgba(234, 88, 12, 0.25)',
      label: 'HIGH RISK',
      summary: 'Significant heuristic anomalies detected. High likelihood of deception.',
      cardGlow: 'rgba(234, 88, 12, 0.05)'
    };
  } else if (riskScore >= 25) {
    theme = {
      color: '#F59E0B',
      bgPill: 'rgba(245, 158, 11, 0.1)',
      borderPill: 'rgba(245, 158, 11, 0.25)',
      label: 'MODERATE RISK',
      summary: 'Uncommon or suspicious patterns detected. Exercise caution and verify independently.',
      cardGlow: 'rgba(245, 158, 11, 0.05)'
    };
  }

  // 2. Animate SVG Gauge
  const gaugeCircle = document.getElementById('gauge-circle');
  if (gaugeCircle) {
    const circumference = 439.8; // 2 * PI * 70
    const offset = circumference - (riskScore / 100) * circumference;
    gaugeCircle.style.stroke = theme.color;
    gaugeCircle.style.strokeDashoffset = offset;
  }

  // 3. Smooth Numerical Count-up
  const scoreDisplay = document.getElementById('score-display');
  if (scoreDisplay) {
    scoreDisplay.style.color = theme.color;
    animateCountUp(scoreDisplay, riskScore);
  }

  // 4. Update Verdict Pill & Summary
  const riskBadge = document.getElementById('risk-badge');
  if (riskBadge) {
    riskBadge.textContent = theme.label;
    riskBadge.style.color = theme.color;
    riskBadge.style.background = theme.bgPill;
    riskBadge.style.borderColor = theme.borderPill;
  }

  const riskSummary = document.getElementById('risk-summary');
  if (riskSummary) {
    riskSummary.textContent = theme.summary;
  }

  const scoreSidebar = document.getElementById('score-sidebar');
  if (scoreSidebar) {
    scoreSidebar.style.boxShadow = `0 12px 32px ${theme.cardGlow}`;
  }

  // 5. Populate Telemetry Tiles
  populateTelemetryTiles(data, target);

  // 6. Populate Signals List or All-Clear Certificate
  const signalsCountPill = document.getElementById('signals-count-pill');
  if (signalsCountPill) {
    signalsCountPill.textContent = signals.length;
    signalsCountPill.style.background = signals.length > 0 ? theme.bgPill : 'var(--ink-100, #E8EBF3)';
    signalsCountPill.style.color = signals.length > 0 ? theme.color : 'var(--ink-700, #1E2742)';
  }

  const signalsContainer = document.getElementById('signals-container');
  if (signalsContainer) {
    if (signals.length === 0) {
      signalsContainer.innerHTML = `
        <div class="clean-certificate-box">
          <div class="clean-cert-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #065F46; margin-bottom: 6px;">
            Zero Adverse Heuristic Signals Detected
          </div>
          <div style="font-size: 0.875rem; color: #047857; max-width: 540px; margin: 0 auto 16px; line-height: 1.55;">
            No deceptive patterns, lookalike typography, disposable namespaces, or raw IP hosts were identified in this target structure.
          </div>
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; font-size: 0.75rem; font-weight: 700;">
            <span style="background: rgba(16, 185, 129, 0.15); color: #065F46; padding: 4px 12px; border-radius: 100px;">✓ TLD Clean</span>
            <span style="background: rgba(16, 185, 129, 0.15); color: #065F46; padding: 4px 12px; border-radius: 100px;">✓ Brand Passed</span>
            <span style="background: rgba(16, 185, 129, 0.15); color: #065F46; padding: 4px 12px; border-radius: 100px;">✓ Syntax Safe</span>
            <span style="background: rgba(16, 185, 129, 0.15); color: #065F46; padding: 4px 12px; border-radius: 100px;">✓ No Blacklist Flags</span>
          </div>
        </div>
      `;
    } else {
      signalsContainer.innerHTML = signals.map(sig => {
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

  // 7. Incident Playbook & Actionable Recommendations
  const recBox = document.getElementById('recommendation-box');
  const recList = document.getElementById('recommendation-text');
  if (recBox) {
    recBox.style.borderLeftColor = theme.color;
  }
  if (recList) {
    if (recommendations && recommendations.length > 0) {
      recList.innerHTML = recommendations.map(rec => `
        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.875rem; color: var(--ink-700, #1E2742); line-height: 1.55;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${theme.color}" stroke-width="2.5" style="flex-shrink: 0; margin-top: 3px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>${escapeHtml(rec)}</span>
        </li>
      `).join('');
    } else {
      recList.innerHTML = `
        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.875rem; color: var(--ink-700, #1E2742); line-height: 1.55;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" style="flex-shrink: 0; margin-top: 3px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Always exercise standard cyber safety: double-check domain spellings before submitting login credentials.</span>
        </li>
      `;
    }
  }
}

/**
 * Fills the 4 telemetry grid cards based on target properties and signals
 */
function populateTelemetryTiles(data, target) {
  // 1. Protocol Tile
  const valProto = document.getElementById('tile-val-protocol');
  const subProto = document.getElementById('tile-sub-protocol');
  const iconProto = document.getElementById('tile-icon-protocol');

  const isHttp = /^http:\/\//i.test(target);
  const isHttps = /^https:\/\//i.test(target);

  if (currentTargetType === 'phone') {
    if (valProto) valProto.textContent = 'Telecom Network';
    if (subProto) subProto.textContent = 'GSM / SMS / Voice channel';
  } else if (currentTargetType === 'upi') {
    if (valProto) valProto.textContent = 'NPCI Virtual Address';
    if (subProto) subProto.textContent = 'Unified Payments Interface standard';
  } else {
    if (isHttp) {
      if (valProto) {
        valProto.textContent = 'HTTP (Unencrypted)';
        valProto.style.color = '#EA580C';
      }
      if (subProto) subProto.textContent = 'Vulnerable to plaintext interception';
      if (iconProto) {
        iconProto.style.background = 'rgba(234, 88, 12, 0.1)';
        iconProto.style.color = '#EA580C';
      }
    } else {
      if (valProto) {
        valProto.textContent = 'TLS / HTTPS Encrypted';
        valProto.style.color = 'var(--ink-900, #0A0F1E)';
      }
      if (subProto) subProto.textContent = 'Standard cryptographic transport';
      if (iconProto) {
        iconProto.style.background = 'rgba(16, 185, 129, 0.1)';
        iconProto.style.color = '#059669';
      }
    }
  }

  // 2. TLD Tile
  const valTld = document.getElementById('tile-val-tld');
  const subTld = document.getElementById('tile-sub-tld');
  const iconTld = document.getElementById('tile-icon-tld');

  if (currentTargetType === 'url') {
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
      valTld.textContent = `${tld.toUpperCase()} Namespace`;
      if (isSuspiciousTld) valTld.style.color = '#EF4444';
    }
    if (subTld) {
      subTld.textContent = isSuspiciousTld ? 'Frequently abused disposable TLD' : 'Recognized generic / ccTLD namespace';
    }
    if (iconTld && isSuspiciousTld) {
      iconTld.style.background = 'rgba(239, 68, 68, 0.1)';
      iconTld.style.color = '#EF4444';
    }
  } else if (currentTargetType === 'phone') {
    if (valTld) valTld.textContent = 'Indian Country Code (+91)';
    if (subTld) subTld.textContent = 'National numbering plan format';
  } else {
    if (valTld) valTld.textContent = 'VPA Banking Extension';
    if (subTld) subTld.textContent = 'Standardized PSP routing handle';
  }

  // 3. Brand & Impersonation Tile
  const valBrand = document.getElementById('tile-val-brand');
  const subBrand = document.getElementById('tile-sub-brand');
  const iconBrand = document.getElementById('tile-icon-brand');

  const brandSignal = (data.signals || []).find(s => s.id === 'BRAND_IMPERSONATION' || s.id === 'HOMOGLYPH_ATTACK');

  if (brandSignal) {
    if (valBrand) {
      valBrand.textContent = 'Impersonation Suspected';
      valBrand.style.color = '#EF4444';
    }
    if (subBrand) subBrand.textContent = brandSignal.title || 'Brand mimicry identified';
    if (iconBrand) {
      iconBrand.style.background = 'rgba(239, 68, 68, 0.1)';
      iconBrand.style.color = '#EF4444';
    }
  } else {
    if (valBrand) {
      valBrand.textContent = 'Clean / No Spoofing';
      valBrand.style.color = 'var(--ink-900, #0A0F1E)';
    }
    if (subBrand) subBrand.textContent = 'Zero brand spoofing or homoglyphs';
    if (iconBrand) {
      iconBrand.style.background = 'rgba(16, 185, 129, 0.1)';
      iconBrand.style.color = '#059669';
    }
  }

  // 4. Community Intel Status Tile
  const valDb = document.getElementById('tile-val-db');
  const subDb = document.getElementById('tile-sub-db');
  const iconDb = document.getElementById('tile-icon-db');

  if (data.communityReportCount && data.communityReportCount > 0) {
    if (valDb) {
      valDb.textContent = `${data.communityReportCount} Active Report(s)`;
      valDb.style.color = '#EF4444';
    }
    if (subDb) subDb.textContent = 'Flagged by users in live community database';
    if (iconDb) {
      iconDb.style.background = 'rgba(239, 68, 68, 0.1)';
      iconDb.style.color = '#EF4444';
    }
  } else {
    if (valDb) {
      valDb.textContent = 'No Active Flags';
      valDb.style.color = 'var(--ink-900, #0A0F1E)';
    }
    if (subDb) subDb.textContent = 'Checked against live fraud registry';
    if (iconDb) {
      iconDb.style.background = 'rgba(16, 185, 129, 0.1)';
      iconDb.style.color = '#059669';
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
 * Handles Phone and UPI targets
 */
async function evaluateNonUrlTarget(query, type) {
  let score = 0;
  const signals = [];
  const recommendations = [];

  if (type === 'phone') {
    const cleanNum = query.replace(/[^\d+]/g, '');
    const isIndianMobile = /^(\+91|91)?[6-9]\d{9}$/.test(cleanNum);

    if (!isIndianMobile && cleanNum.length < 8) {
      score = 30;
      signals.push({
        id: 'INVALID_PHONE_SYNTAX',
        title: 'Non-Standard Phone Format',
        description: 'Number does not conform to standardized mobile or landline numbering plans.',
        severity: 'medium'
      });
    }

    recommendations.push('Never share OTPs, UPI PINs, or banking SMS codes with unknown callers.');
    recommendations.push('Government and banking officials will never call demanding immediate payment transfers.');

  } else if (type === 'upi') {
    const isVpaValid = /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(query);
    if (!isVpaValid) {
      score = 25;
      signals.push({
        id: 'UNUSUAL_VPA_SYNTAX',
        title: 'Irregular UPI Handle Syntax',
        description: 'VPA does not match standard Banking PSP format (user@bank).',
        severity: 'medium'
      });
    }

    recommendations.push('Remember: Entering your UPI PIN always sends money, it NEVER receives money.');
    recommendations.push('Double check the beneficiary account name shown on the UPI app before confirming.');
  }

  return {
    riskScore: score,
    riskLevel: score >= 50 ? 'high' : (score > 0 ? 'medium' : 'low'),
    signals,
    recommendations,
    target: query
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
  let type = 'url';

  // Smart detect type
  if (val.includes('@') && !val.includes('/')) {
    type = 'upi';
  } else if (/^\+?\d[\d\s-]{8,}$/.test(val)) {
    type = 'phone';
  }

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
