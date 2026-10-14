const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');
const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    console.error('[Reports] Error reading reports.json:', err);
  }

  if (!reports || reports.length === 0) {
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

  const pruned = reports.filter(r => {
    if (r.status === 'pending') return true;
    if (r.id && r.id.startsWith('seed-')) return true;
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
    console.error('[Reports] Error writing reports.json:', err);
  }
}

// GET /api/reports (Public Feed: only approved within 24h)
router.get('/', (req, res) => {
  const all = loadReports();
  const now = Date.now();
  const approved = all.filter(r => {
    if (r.status !== 'approved') return false;
    const liveTime = r.approvedAt || r.timestamp || 0;
    return (now - liveTime) < RETENTION_MS;
  });
  const pendingCount = all.filter(r => r.status === 'pending').length;
  return res.json({ success: true, reports: approved, pendingCount, total: approved.length });
});

// GET /api/reports/all (Admin Feed: all statuses)
router.get('/all', (req, res) => {
  const all = loadReports();
  const pending = all.filter(r => r.status === 'pending').length;
  const approved = all.filter(r => r.status === 'approved').length;
  const rejected = all.filter(r => r.status === 'rejected').length;
  return res.json({
    success: true,
    reports: all,
    metrics: { pending, approved, rejected, total: all.length }
  });
});

// POST /api/reports (Submit new report)
router.post('/', (req, res) => {
  try {
    const data = req.body || {};
    if (!data.identifier || !data.identifier.trim()) {
      return res.status(400).json({ success: false, error: 'Identifier is required' });
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
      status: 'pending'
    };

    all.unshift(newReport);
    saveReports(all);
    console.log(`[API] New threat report submitted: ${newReport.identifier} (Status: pending)`);
    return res.status(201).json({ success: true, report: newReport });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports/approve (Admin action)
router.post('/approve', (req, res) => {
  try {
    const data = req.body || {};
    const all = loadReports();
    const report = all.find(r => r.id === data.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    report.status = 'approved';
    report.approvedAt = Date.now();
    saveReports(all);
    console.log(`[API] Report approved: ${report.identifier} (id: ${report.id})`);
    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports/reject (Admin action)
router.post('/reject', (req, res) => {
  try {
    const data = req.body || {};
    const all = loadReports();
    const report = all.find(r => r.id === data.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    report.status = 'rejected';
    saveReports(all);
    console.log(`[API] Report rejected: ${report.identifier} (id: ${report.id})`);
    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports/delete (Admin action)
router.post('/delete', (req, res) => {
  try {
    const data = req.body || {};
    let all = loadReports();
    const initialLen = all.length;
    all = all.filter(r => r.id !== data.id);
    saveReports(all);
    console.log(`[API] Report deleted: id: ${data.id}`);
    return res.json({ success: true, deleted: all.length < initialLen });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
