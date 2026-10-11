const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');
const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

let urlAnalyzerService;
try {
  urlAnalyzerService = require('../backend/src/services/urlAnalyzer');
  console.log('[Analyzer] Successfully loaded backend urlAnalyzer service');
} catch (e) {
  console.warn('[Analyzer] Warning loading backend urlAnalyzer:', e.message);
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default seed reports if file is empty
const SEED_DEFAULTS = [
  {
    id: 'seed-1',
    identifier: 'google.com',
    type: 'Website',
    risk: 'High Risk',
    evidence: 'this is the test for the report submit',
    reporterName: 'Community User',
    reporterEmail: '',
    status: 'approved'
  },
  {
    id: 'seed-2',
    identifier: 'fake-sbi-secure-portal.xyz',
    type: 'Website',
    risk: 'Critical',
    evidence: 'Phishing clone of bank portal requesting OTP and netbanking credentials.',
    reporterName: 'Rajesh',
    reporterEmail: 'rajesh@example.com',
    status: 'approved'
  },
  {
    id: 'seed-3',
    identifier: 'amazon-support-india.in',
    type: 'Website',
    risk: 'Critical',
    evidence: 'Impersonates Amazon. Asks for OTP and card details. Multiple reports.',
    reporterName: 'Cyber Cell',
    reporterEmail: '',
    status: 'approved'
  },
  {
    id: 'seed-4',
    identifier: '+91 98765 43210',
    type: 'Phone',
    risk: 'High Risk',
    evidence: 'FedEx parcel scam call. Threatens legal action.',
    reporterName: 'Amit Sharma',
    reporterEmail: '',
    status: 'approved'
  },
  {
    id: 'seed-5',
    identifier: 'paytm-kyc-verify@gmail.com',
    type: 'Email',
    risk: 'Critical',
    evidence: 'Fake KYC notice. Uses generic gmail address instead of official domain.',
    reporterName: 'Sneha',
    reporterEmail: '',
    status: 'approved'
  },
  {
    id: 'seed-6',
    identifier: 'johndoe@ybl',
    type: 'UPI ID',
    risk: 'Low Risk',
    evidence: 'Verified merchant account. No suspicious activity found in recent transactions.',
    reporterName: 'Verification Bot',
    reporterEmail: '',
    status: 'approved'
  },
  {
    id: 'seed-7',
    identifier: 'flipkart-big-billion-offers.link',
    type: 'Website',
    risk: 'High Risk',
    evidence: 'Non-standard TLD. Cloned interface of e-commerce site.',
    reporterName: 'Community User',
    reporterEmail: '',
    status: 'approved'
  }
];

function loadReports() {
  const now = Date.now();
  let reports = [];
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      if (content.trim()) {
        reports = JSON.parse(content);
      }
    }
  } catch (err) {
    console.error('Error reading reports.json:', err);
  }

  if (!reports || reports.length === 0) {
    // Populate seed defaults with fresh timestamps relative to now
    reports = SEED_DEFAULTS.map((seed, idx) => {
      const offsetMs = (idx * 15 + 2) * 60 * 1000;
      return {
        ...seed,
        timestamp: now - offsetMs,
        approvedAt: now - offsetMs
      };
    });
    saveReports(reports);
    return reports;
  }

  // Ensure all seed reports have active timestamps if they expired
  let modified = false;
  reports = reports.map(r => {
    if (r.id && r.id.startsWith('seed-')) {
      const age = now - (r.approvedAt || r.timestamp || 0);
      if (age > RETENTION_MS || !r.approvedAt) {
        r.approvedAt = now - (2 * 60 * 1000);
        r.timestamp = now - (2 * 60 * 1000);
        modified = true;
      }
    }
    return r;
  });

  // Prune non-seed approved/rejected reports older than 24h
  const pruned = reports.filter(r => {
    if (r.status === 'pending') return true; // Keep pending forever until reviewed
    if (r.id && r.id.startsWith('seed-')) return true; // Keep seed reports
    const liveTime = r.approvedAt || r.timestamp || 0;
    return (now - liveTime) < RETENTION_MS;
  });

  if (modified || pruned.length !== reports.length) {
    saveReports(pruned);
    return pruned;
  }

  return reports;
}

function saveReports(reports) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing reports.json:', err);
  }
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2e6) { // 2MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // ── API ROUTES ──

  // GET /api/reports (Public Feed: only approved within 24h)
  if (pathname === '/api/reports' && method === 'GET') {
    const all = loadReports();
    const now = Date.now();
    const approved = all.filter(r => {
      if (r.status !== 'approved') return false;
      const liveTime = r.approvedAt || r.timestamp || 0;
      return (now - liveTime) < RETENTION_MS;
    });
    const pendingCount = all.filter(r => r.status === 'pending').length;
    return sendJson(res, 200, { success: true, reports: approved, pendingCount, total: approved.length });
  }

  // GET /api/reports/all (Admin Feed: all statuses)
  if (pathname === '/api/reports/all' && method === 'GET') {
    const all = loadReports();
    const pending = all.filter(r => r.status === 'pending').length;
    const approved = all.filter(r => r.status === 'approved').length;
    const rejected = all.filter(r => r.status === 'rejected').length;
    return sendJson(res, 200, {
      success: true,
      reports: all,
      metrics: { pending, approved, rejected, total: all.length }
    });
  }

  // POST /api/analyze/url (Direct Heuristic Analyzer)
  if (pathname === '/api/analyze/url' && method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const urlToScan = data.url || data.query || '';
      if (!urlAnalyzerService) {
        try { urlAnalyzerService = require('../backend/src/services/urlAnalyzer'); } catch(e){}
      }
      if (urlAnalyzerService && typeof urlAnalyzerService.analyzeUrl === 'function') {
        const result = urlAnalyzerService.analyzeUrl(urlToScan);
        return sendJson(res, 200, result);
      }
      return sendJson(res, 500, { success: false, error: 'Analyzer service not initialized' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // POST /api/analyze/url (Direct heuristic URL scanner)
  if (pathname === '/api/analyze/url' && method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const targetUrl = data.url || data.query || '';
      if (!urlAnalyzerService) {
        return sendJson(res, 500, { success: false, message: 'URL Analyzer service not loaded' });
      }
      const validation = urlAnalyzerService.validateUrlInput(targetUrl);
      if (!validation.valid) {
        return sendJson(res, validation.statusCode || 400, { success: false, message: validation.error });
      }
      const result = urlAnalyzerService.analyzeUrl(targetUrl);
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 500, { success: false, message: err.message });
    }
  }

  // POST /api/reports (Submit new report)
  if (pathname === '/api/reports' && method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      if (!data.identifier || !data.identifier.trim()) {
        return sendJson(res, 400, { success: false, error: 'Identifier is required' });
      }

      const all = loadReports();
      const newReport = {
        id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        identifier: data.identifier.trim(),
        type: data.type || 'Website',
        risk: data.risk || 'High Risk',
        evidence: data.evidence || 'User reported threat.',
        reporterName: data.reporterName || 'Anonymous',
        reporterEmail: data.reporterEmail || '',
        timestamp: Date.now(),
        status: 'pending' // Admin must approve before going live!
      };

      all.unshift(newReport);
      saveReports(all);
      console.log(`[API] New threat report submitted: ${newReport.identifier} (Status: pending)`);
      return sendJson(res, 201, { success: true, report: newReport });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // POST /api/reports/approve (Admin action)
  if (pathname === '/api/reports/approve' && method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const all = loadReports();
      const report = all.find(r => r.id === data.id);
      if (!report) {
        return sendJson(res, 404, { success: false, error: 'Report not found' });
      }

      report.status = 'approved';
      report.approvedAt = Date.now();
      saveReports(all);
      console.log(`[API] Report approved: ${report.identifier} (id: ${report.id})`);
      return sendJson(res, 200, { success: true, report });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // POST /api/reports/reject (Admin action)
  if (pathname === '/api/reports/reject' && method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const all = loadReports();
      const report = all.find(r => r.id === data.id);
      if (!report) {
        return sendJson(res, 404, { success: false, error: 'Report not found' });
      }

      report.status = 'rejected';
      saveReports(all);
      console.log(`[API] Report rejected: ${report.identifier} (id: ${report.id})`);
      return sendJson(res, 200, { success: true, report });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // POST /api/reports/delete (Admin action)
  if (pathname === '/api/reports/delete' && method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      let all = loadReports();
      const initialLen = all.length;
      all = all.filter(r => r.id !== data.id);
      saveReports(all);
      console.log(`[API] Report deleted: id: ${data.id}`);
      return sendJson(res, 200, { success: true, deleted: all.length < initialLen });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ── STATIC FILE SERVING ──
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  INFRAUD SERVER RUNNING AT: http://localhost:${PORT}`);
  console.log(`  Threat Reports API: http://localhost:${PORT}/api/reports`);
  console.log(`  Central Storage: ${DATA_FILE}`);
  console.log(`======================================================\n`);
});
