/**
 * Online Directory & Cyber Threat Intelligence Service
 * 
 * Queries public directories and community registries in real-time
 * to detect whether a phone number has active spam complaints,
 * high search volume, or matches verified institutional helplines.
 * 
 * Sources:
 * - Tellows India Community Directory (tellows.in)
 * - INFRAUD Central Community Threat Database (reports.json)
 * - Verified Indian Institutional & Banking Registries
 * - In-memory LRU cache to prevent rate-limiting and ensure sub-second response times
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// In-memory cache: phone digits -> intelligence report
const cache = new Map();
const MAX_CACHE_SIZE = 1000;

function setCache(key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { ...value, cachedAt: Date.now() });
}

/**
 * Queries Tellows India community database for a 10-digit number.
 * Returns community spam score (1-9), search request volume, caller name, comments, and keywords.
 */
function queryTellowsIndia(tenDigits) {
  return new Promise((resolve) => {
    const url = `https://www.tellows.in/num/${tenDigits}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-IN,en;q=0.9'
      },
      timeout: 2200
    }, (res) => {
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Tellows Score (1: trustworthy to 9: dangerous)
          const scoreMatch = data.match(/score:\s*(\d+)/i) || 
                             data.match(/alt=["']tellows score (\d+)["']/i) || 
                             data.match(/\/score(\d+)\.png/i);
          const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 5;

          // Searches count
          const searchesMatch = data.match(/searches:\s*<b>(\d+)<\/b>/i) || 
                                data.match(/(\d+)\s*search requests/i) ||
                                data.match(/searches[^0-9]*(\d+)/i);
          const searches = searchesMatch ? parseInt(searchesMatch[1], 10) : 0;

          // Caller name or company if given in tellows
          const callerMatch = data.match(/caller\s*type:\s*<b>([^<]+)<\/b>/i) ||
                              data.match(/caller\s*name:\s*<b>([^<]+)<\/b>/i) ||
                              data.match(/company:\s*<b>([^<]+)<\/b>/i);
          const callerInfo = callerMatch ? callerMatch[1].trim() : null;

          // Ratings count
          const ratingsMatch = data.match(/(\d+)\s*ratings?/i);
          const ratingsCount = ratingsMatch ? parseInt(ratingsMatch[1], 10) : 0;

          // Comments count
          const commentsMatch = data.match(/(\d+)\s*comments?/i);
          const commentsCount = commentsMatch ? parseInt(commentsMatch[1], 10) : 0;

          // Spam / Scam categorization from Tellows tags
          const lower = data.toLowerCase();
          const detectedSpamKeywords = [];
          if (lower.includes('debt collection')) detectedSpamKeywords.push('Debt Collection');
          if (lower.includes('cost trap')) detectedSpamKeywords.push('Cost Trap');
          if (lower.includes('harassment')) detectedSpamKeywords.push('Harassment');
          if (lower.includes('telemarketing')) detectedSpamKeywords.push('Telemarketing');
          if (lower.includes('sweepstake') || lower.includes('lottery scam')) detectedSpamKeywords.push('Lottery Scam');

          resolve({
            source: 'Tellows India Registry',
            score,
            searches,
            callerInfo,
            ratingsCount,
            commentsCount,
            detectedSpamKeywords
          });
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Checks central community reports database for existing complaints on this number.
 */
function queryLocalThreatRegistry(digits) {
  try {
    const candidates = [
      path.resolve(__dirname, '../../../frontend/data/reports.json'),
      path.resolve(__dirname, '../../data/reports.json'),
      path.resolve(__dirname, '../data/reports.json'),
      path.resolve('frontend/data/reports.json')
    ];
    let filePath = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) { filePath = c; break; }
    }
    if (!filePath) return null;

    const reports = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const d10 = digits.slice(-10);

    const matches = reports.filter(r => {
      if (!r.identifier) return false;
      if (r.type && !r.type.toLowerCase().includes('phone')) return false;
      if (r.status && r.status !== 'approved') return false;
      const rDigits = String(r.identifier).replace(/\D/g, '');
      return (d10 && rDigits.slice(-10) === d10) || (digits.length >= 8 && rDigits.length >= 8 && (digits.endsWith(rDigits) || rDigits.endsWith(digits)));
    });

    return matches.length > 0 ? matches[0] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Verified Indian Institutional & Banking Helplines
 */
const KNOWN_INSTITUTIONS = [
  { name: 'State Bank of India (SBI)', numbers: ['1800112211', '18004253800', '18002100', '18001234'] },
  { name: 'HDFC Bank', numbers: ['18002026161', '18001600'] },
  { name: 'ICICI Bank', numbers: ['18001080', '18001024242'] },
  { name: 'Axis Bank', numbers: ['18604195555', '18605005555'] },
  { name: 'Punjab National Bank (PNB)', numbers: ['18001802222', '18001032222'] },
  { name: 'Bank of Baroda', numbers: ['18005700', '18002584455'] },
  { name: 'Flipkart Customer Support', numbers: ['18002029898', '18002089898'] },
  { name: 'Amazon India Support', numbers: ['180030009009'] },
  { name: 'Apple Support India', numbers: ['0008001009009'] },
  { name: 'Bharti Airtel Customer Care', numbers: ['121', '198'] },
  { name: 'Reliance Jio Support', numbers: ['199', '18608933333'] },
  { name: 'National Cyber Crime Reporting Helpline', numbers: ['1930'] },
  { name: 'National Emergency Response System (ERS)', numbers: ['112'] }
];

/**
 * Main Online Intelligence Lookup Engine
 * @param {string} nationalNumber - Phone digits without country code (e.g. '9876543210' or '1800112211')
 * @returns {Promise<Object>}
 */
async function fetchOnlinePhoneIntelligence(nationalNumber) {
  const digits = String(nationalNumber || '').replace(/\D/g, '');
  if (digits.length < 8) {
    return {
      checked: false,
      reason: 'Number too short for online directory lookup'
    };
  }

  const key = digits.slice(-10);

  // Check cache (TTL 1 hour)
  if (cache.has(key)) {
    const hit = cache.get(key);
    if (Date.now() - hit.cachedAt < 3600000) {
      return hit;
    }
  }

  try {
    // 1. Check local threat reports database first (instant)
    const communityMatch = queryLocalThreatRegistry(digits);

    // 2. Check verified institutional entities
    let verifiedEntity = null;
    for (const inst of KNOWN_INSTITUTIONS) {
      if (inst.numbers.some(n => digits.endsWith(n) || n.endsWith(digits))) {
        verifiedEntity = inst.name;
        break;
      }
    }

    // 3. Query Tellows India with a hard timeout of 2.2s
    let tellows = null;
    try {
      tellows = await queryTellowsIndia(key);
    } catch (e) {
      tellows = null;
    }

    let searches = 0;
    let tellowsScore = 5;
    let callerInfo = null;
    let ratingsCount = 0;
    let commentsCount = 0;
    let detectedSpamKeywords = [];

    if (tellows) {
      searches = tellows.searches || 0;
      tellowsScore = tellows.score || 5;
      callerInfo = tellows.callerInfo;
      ratingsCount = tellows.ratingsCount || 0;
      commentsCount = tellows.commentsCount || 0;
      detectedSpamKeywords = tellows.detectedSpamKeywords || [];
    }

    let hasOnlineThreatReports = false;
    let threatReason = null;

    // Community threat reports take highest priority
    if (communityMatch) {
      hasOnlineThreatReports = true;
      threatReason = `Community Cyber Crime Report: "${communityMatch.evidence || 'Reported scam caller'}" (Reported by: ${communityMatch.reporterName || 'Community User'})`;
    } else if (tellowsScore >= 7) {
      hasOnlineThreatReports = true;
      threatReason = `High spam score (${tellowsScore}/9) reported in Tellows India community database`;
    } else if (detectedSpamKeywords.length > 0 && searches > 50) {
      hasOnlineThreatReports = true;
      threatReason = `Flagged for suspicious patterns in directory: ${detectedSpamKeywords.join(', ')}`;
    }

    // High search count heuristic on private mobile numbers (e.g. > 150 searches indicates mass robodialer)
    const isHighSearchVolume = searches >= 150;

    let tellowsVerdict = 'Neutral / Unclassified';
    if (verifiedEntity) {
      tellowsVerdict = 'Verified Official Helpline';
    } else if (hasOnlineThreatReports) {
      tellowsVerdict = 'High-Risk Spam / Fraud Alert';
    } else if (tellowsScore <= 3) {
      tellowsVerdict = 'Trustworthy / Verified Safe';
    } else if (searches > 100) {
      tellowsVerdict = 'High-Inquiry Caller';
    }

    const payload = {
      checked: true,
      source: 'Tellows India Registry & Verified Community Directory',
      searches,
      tellowsScore,
      tellowsVerdict,
      callerInfo,
      ratingsCount,
      commentsCount,
      detectedSpamKeywords,
      isHighSearchVolume,
      hasOnlineThreatReports,
      threatReason,
      verifiedEntity,
      communityMatch: communityMatch ? {
        id: communityMatch.id,
        risk: communityMatch.risk,
        evidence: communityMatch.evidence,
        reporter: communityMatch.reporterName
      } : null
    };

    setCache(key, payload);
    return payload;
  } catch (err) {
    return {
      checked: false,
      reason: err.message
    };
  }
}

module.exports = {
  fetchOnlinePhoneIntelligence
};
