const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getReportsFilePath() {
  const candidates = [
    path.resolve(__dirname, '../../../frontend/data/reports.json'),
    path.resolve(__dirname, '../../frontend/data/reports.json'),
    path.resolve(__dirname, '../data/reports.json'),
    path.resolve(__dirname, '../../data/reports.json'),
    path.resolve('frontend/data/reports.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const defaultPath = path.resolve(__dirname, '../../../frontend/data/reports.json');
  const dir = path.dirname(defaultPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return defaultPath;
}

// Default seed reports if file is empty
const SEED_DEFAULTS = [
  {
    "id": "seed-digital-arrest-1",
    "identifier": "+91 80102 37029",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "Digital Arrest Scam. Falsely poses as CBI / Mumbai Police demanding Skype video interrogation and urgent funds transfer to RBI verification pool.",
    "reporterName": "Sanjay Deshmukh (Nagpur)",
    "reporterEmail": "sanjay.d@example.com",
    "status": "approved"
  },
  {
    "id": "seed-digital-arrest-2",
    "identifier": "+91 98229 98877",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "Digital Arrest Scam. Fake Crime Branch officer threatening urgent video arrest warrant for alleged money laundering via Jet Airways account.",
    "reporterName": "Vikram Rane (Pune)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-digital-arrest-3",
    "identifier": "+91 98765 00001",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "Enforcement Directorate (ED) Impersonation. Automated IVR claiming financial crimes case and freeze on all PAN-linked bank accounts.",
    "reporterName": "Meera Kulkarni (Mumbai)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-digital-arrest-4",
    "identifier": "+91 91234 56780",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "Narcotics Control Bureau (NCB) scam call claiming 250g MDMA was seized with victim Aadhaar photocopy.",
    "reporterName": "Rajesh Iyer (Bengaluru)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-digital-arrest-5",
    "identifier": "cbi-investigation-notice.xyz",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Phishing portal displaying fake CBI summons with official Ashok Stambh logo. Attempts to download malicious monitoring APK.",
    "reporterName": "Cyber Cell (New Delhi)",
    "reporterEmail": "alerts@cybercell.gov",
    "status": "approved"
  },
  {
    "id": "seed-digital-arrest-6",
    "identifier": "mumbai-police-cybercell.online",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Fake police portal showing forged non-bailable warrants and asking for digital settlement payments.",
    "reporterName": "Deepak Shinde (Thane)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-fedex-scam-1",
    "identifier": "+91 98765 43210",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "FedEx Parcel Contraband Scam. Automated caller claims parcel #FDX-88219 containing 5 passports and illegal narcotics was seized at customs.",
    "reporterName": "Amit Sharma (Pune)",
    "reporterEmail": "amit.sharma@example.com",
    "status": "approved"
  },
  {
    "id": "seed-fedex-scam-2",
    "identifier": "+91 98765 43211",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "DHL Express customs clearance extortion. Demands ₹48,000 bank deposit into private account to cancel police case.",
    "reporterName": "Nitin Gadve (Nashik)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-fedex-scam-3",
    "identifier": "+91 88264 12345",
    "type": "Phone",
    "risk": "High Risk",
    "evidence": "India Post SpeedPost address failure SMS caller directing victims to pay ₹25 re-delivery fee on phishing URL.",
    "reporterName": "Ananya Sen (Kolkata)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-fedex-scam-4",
    "identifier": "indiapost-update-tracking.top",
    "type": "Website",
    "risk": "Critical",
    "evidence": "India Post phishing clone. Charges ₹15 parcel delivery fee to capture credit/debit card numbers and CVV.",
    "reporterName": "Cyber Fraud Cell (Lucknow)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-fedex-scam-5",
    "identifier": "fedex-customs-clearance.link",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Cloned FedEx tracking website showing fake narcotics seizure report with payment QR code.",
    "reporterName": "Karan Patel (Ahmedabad)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-fedex-scam-6",
    "identifier": "customs.clearance.fedex@paytm",
    "type": "UPI ID",
    "risk": "Critical",
    "evidence": "Fraudulent UPI handle demanding customs fine payments for fake parcel clearance.",
    "reporterName": "Manish Joshi (Indore)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-electricity-scam-1",
    "identifier": "+91 70001 23456",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "Electricity Bill Disconnection SMS Scam. 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM. Call officer immediately.'",
    "reporterName": "Pooja Kulkarni (Nashik)",
    "reporterEmail": "pooja.k@example.com",
    "status": "approved"
  },
  {
    "id": "seed-electricity-scam-2",
    "identifier": "+91 90110 12345",
    "type": "Phone",
    "risk": "High Risk",
    "evidence": "MSEDCL urgent notice caller claiming previous month payment not updated in system, demanding remote app install.",
    "reporterName": "Ganesh Gaikwad (Solapur)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-electricity-scam-3",
    "identifier": "+91 90280 12345",
    "type": "Phone",
    "risk": "High Risk",
    "evidence": "BSES Yamuna electricity disconnection threat. Poses as power billing desk officer.",
    "reporterName": "Rohit Bansal (Delhi)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-electricity-scam-4",
    "identifier": "mahadiscom-bill-quickpay.xyz",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Fake MSEDCL electricity portal capturing NetBanking login credentials and mobile OTP.",
    "reporterName": "MSEDCL Vigilance Team",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-electricity-scam-5",
    "identifier": "bses-delhi-power-bill.top",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Insecure electricity bill payment clone prompting user to enter card details.",
    "reporterName": "Community User",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-electricity-scam-6",
    "identifier": "electricity.officer.discom@ibl",
    "type": "UPI ID",
    "risk": "Critical",
    "evidence": "Fraudulent UPI handle collecting ₹100 fake meter inspection charges to compromise UPI PIN.",
    "reporterName": "Suresh Patil (Kolhapur)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-1",
    "identifier": "fake-sbi-secure-portal.xyz",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Phishing clone of State Bank of India netbanking portal requesting username, password, and profile password.",
    "reporterName": "Rajesh (Mumbai)",
    "reporterEmail": "rajesh@example.com",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-2",
    "identifier": "hdfc-netbanking-verify.top",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Phishing clone of HDFC Bank claiming customer ID inactive and asking for IPIN.",
    "reporterName": "Kunal Mehra (Gurugram)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-3",
    "identifier": "icici-pan-update.online",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Fake ICICI portal claiming PAN card mandatory update. Delivers credential theft payload.",
    "reporterName": "Sneha Nair (Chennai)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-4",
    "identifier": "yono-sbi-kyc-update.link",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Malicious APK link sent via SMS pretending to be official SBI YONO application update.",
    "reporterName": "CERT-In Phishing Feed",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-5",
    "identifier": "pnb-onetouch-secure.xyz",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Punjab National Bank cloned login screen harvesting customer IDs and debit card pins.",
    "reporterName": "Arun Verma (Chandigarh)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-6",
    "identifier": "axis-reward-points.site",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Fake Axis Bank portal offering ₹9,500 credit card cashback reward to steal CVV.",
    "reporterName": "Vikas Malhotra (Noida)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-7",
    "identifier": "paytm-kyc-verify@gmail.com",
    "type": "Email",
    "risk": "Critical",
    "evidence": "Fake KYC notice. Uses generic gmail address instead of official Paytm domain.",
    "reporterName": "Sneha (Bengaluru)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-8",
    "identifier": "alert@sbi-card-security.co",
    "type": "Email",
    "risk": "Critical",
    "evidence": "Phishing email claiming credit card blocked due to suspicious activity. Links to fake portal.",
    "reporterName": "Rahul Jadhav (Pune)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-9",
    "identifier": "sbi.reward.points@ybl",
    "type": "UPI ID",
    "risk": "Critical",
    "evidence": "Fraudulent UPI handle collecting 'activation fee' for fake credit card rewards.",
    "reporterName": "Ajay Roy (Patna)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-10",
    "identifier": "hdfc.kyc.verification@oksbi",
    "type": "UPI ID",
    "risk": "Critical",
    "evidence": "Phishing UPI handle requesting 1-rupee verification to steal customer UPI PIN.",
    "reporterName": "Pawan Shah (Surat)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-bank-scam-11",
    "identifier": "+91 98112 23344",
    "type": "Phone",
    "risk": "High Risk",
    "evidence": "Caller poses as SBI branch manager insisting on urgent PAN linkage over WhatsApp.",
    "reporterName": "Tanvi Sawant (Goa)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-ecom-scam-1",
    "identifier": "amazon-support-india.in",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Impersonates Amazon Customer Support. Asks for OTP and credit card numbers.",
    "reporterName": "Cyber Cell (Mumbai)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-ecom-scam-2",
    "identifier": "flipkart-big-billion-offers.link",
    "type": "Website",
    "risk": "High Risk",
    "evidence": "Non-standard TLD (.link). Cloned interface of e-commerce festive sale collecting payment cards.",
    "reporterName": "Community User",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-ecom-scam-3",
    "identifier": "meesho-lucky-spin-reward.xyz",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Fake Meesho Diwali lucky spin wheel claiming user won Tata Harrier car, demanding ₹12,000 registration fee.",
    "reporterName": "Pratiksha Kale (Aurangabad)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-ecom-scam-4",
    "identifier": "+91 98711 99881",
    "type": "Phone",
    "risk": "High Risk",
    "evidence": "Fake Meesho prize caller claiming lottery win and demanding processing charges.",
    "reporterName": "Sandhya More (Satara)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-ecom-scam-5",
    "identifier": "+91 98991 12233",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "KBC 25 Lakh Lottery Fraud. Fake WhatsApp audio note claiming Kaun Banega Crorepati cash prize.",
    "reporterName": "Rameshwar Rao (Hyderabad)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-loan-scam-1",
    "identifier": "+91 80102 37030",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "Predatory Loan App Blackmail. Calls family contacts and threatens with morphed objectionable photos.",
    "reporterName": "Vikas Patil (Kolhapur)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-loan-scam-2",
    "identifier": "+91 98229 98800",
    "type": "Phone",
    "risk": "Critical",
    "evidence": "CashBean fake recovery agent threatening physical visit and public defamation for non-existent loan.",
    "reporterName": "Mohan Lal (Jaipur)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-loan-scam-3",
    "identifier": "fast-cash-instant-loan.app",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Unregistered 7-day loan app APK distributing malware and exfiltrating entire phone contact book.",
    "reporterName": "Cyber Crime Cell (Maharashtra)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-loan-scam-4",
    "identifier": "rupee-direct-instant-loan.xyz",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Rogue loan portal demanding access to gallery and SMS messages before disbursing small amount.",
    "reporterName": "Sunil Joshi (Bhopal)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-task-scam-1",
    "identifier": "+91 70210 99887",
    "type": "Phone",
    "risk": "High Risk",
    "evidence": "Telegram Task & YouTube Like Job Scam. Prompts victims into paying prepaid deposits for fake crypto tasks.",
    "reporterName": "Rahul More (Thane)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-task-scam-2",
    "identifier": "+91 70215 99887",
    "type": "Phone",
    "risk": "High Risk",
    "evidence": "Google Maps review rating scam. Offers ₹150 per review, then traps victims in VIP prepaid merchant tasks.",
    "reporterName": "Shweta Tiwari (Lucknow)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-task-scam-3",
    "identifier": "telegram-task-vip-earnings.top",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Fraudulent cryptocurrency task portal showing fake balance. Demands ₹50,000 tax deposit to unfreeze funds.",
    "reporterName": "Naveen Reddy (Hyderabad)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-task-scam-4",
    "identifier": "youtube-rating-jobs-india.site",
    "type": "Website",
    "risk": "High Risk",
    "evidence": "Fake work-from-home recruitment landing page directing users to suspicious Telegram channels.",
    "reporterName": "Community User",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-task-scam-5",
    "identifier": "telegram.task.payout@oksbi",
    "type": "UPI ID",
    "risk": "Critical",
    "evidence": "Fraudulent UPI handle used to collect prepaid crypto task deposits from job seekers.",
    "reporterName": "Pooja Hegde (Mangaluru)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-gov-scam-1",
    "identifier": "pm-kisan-samman-nidhi.site",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Phishing clone of PM Kisan Samman Nidhi portal requesting Aadhaar number and OTP to drain bank accounts.",
    "reporterName": "Kisan Morcha Helpline",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-gov-scam-2",
    "identifier": "ladki-bahin-yojana-apply.top",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Fake government scheme website claiming ₹3,000 monthly allowance to collect Aadhaar and bank passbooks.",
    "reporterName": "Maharashtra Cyber Cell",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-gov-scam-3",
    "identifier": "echallan-parivahan-pay.xyz",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Traffic E-Challan phishing SMS link downloading malicious MoParivahan trojan APK.",
    "reporterName": "Traffic Police Cyber Cell",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-gov-scam-4",
    "identifier": "parivahan-challan-payment.top",
    "type": "Website",
    "risk": "Critical",
    "evidence": "Fake vehicle fine payment website capturing debit card credentials.",
    "reporterName": "Ashish Dubey (Kanpur)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-gov-scam-5",
    "identifier": "+91 90110 99882",
    "type": "Phone",
    "risk": "High Risk",
    "evidence": "Automated call pretending to be Parivahan Sewa demanding court appearance for pending challan.",
    "reporterName": "Vinay Kadam (Pune)",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-cybercrime",
    "identifier": "1930",
    "type": "Phone",
    "risk": "Low Risk",
    "evidence": "National Cyber Crime Reporting Helpline (Indian Cyber Crime Coordination Centre - I4C, Ministry of Home Affairs).",
    "reporterName": "Indian Cyber Cell",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-sbi-phone",
    "identifier": "1800112211",
    "type": "Phone",
    "risk": "Low Risk",
    "evidence": "Official Toll-Free Customer Support Helpline of State Bank of India (SBI).",
    "reporterName": "State Bank of India",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-hdfc-phone",
    "identifier": "18002026161",
    "type": "Phone",
    "risk": "Low Risk",
    "evidence": "Official National Banking & Card Support Helpline of HDFC Bank Ltd.",
    "reporterName": "HDFC Bank",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-icici-phone",
    "identifier": "18001080",
    "type": "Phone",
    "risk": "Low Risk",
    "evidence": "Official 24x7 Customer Service Helpline of ICICI Bank Ltd.",
    "reporterName": "ICICI Bank",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-cyber-gov",
    "identifier": "cybercrime.gov.in",
    "type": "Website",
    "risk": "Low Risk",
    "evidence": "Official Government of India portal for reporting citizen cyber crime and online financial fraud.",
    "reporterName": "Ministry of Home Affairs",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-sbi-web",
    "identifier": "sbi.co.in",
    "type": "Website",
    "risk": "Low Risk",
    "evidence": "Official, verified apex corporate web portal of State Bank of India.",
    "reporterName": "State Bank of India",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-upi",
    "identifier": "johndoe@ybl",
    "type": "UPI ID",
    "risk": "Low Risk",
    "evidence": "Verified merchant account. Clean transaction history and zero complaints.",
    "reporterName": "Verification Bot",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-google",
    "identifier": "google.com",
    "type": "Website",
    "risk": "Low Risk",
    "evidence": "Official & Authentic Global Web Search Engine. ICANN verified apex domain.",
    "reporterName": "InFraud Security Engine",
    "reporterEmail": "",
    "status": "approved"
  },
  {
    "id": "seed-safe-x",
    "identifier": "x.com",
    "type": "Website",
    "risk": "Low Risk",
    "evidence": "Official & Authentic Social Web Platform. TLS 1.3 verified apex domain.",
    "reporterName": "InFraud Security Engine",
    "reporterEmail": "",
    "status": "approved"
  }
];

function loadReports() {
  const dataFile = getReportsFilePath();
  const now = Date.now();
  let reports = [];
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf8');
      if (content.trim()) {
        reports = JSON.parse(content);
      }
    }
  } catch (err) {
    console.error('[Reports] Error reading reports.json:', err);
  }

  if (!reports || reports.length === 0) {
    reports = SEED_DEFAULTS.map((seed, idx) => {
      const offsetMs = (idx * 15 + 5) * 60 * 1000;
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
  const dataFile = getReportsFilePath();
  try {
    fs.writeFileSync(dataFile, JSON.stringify(reports, null, 2), 'utf8');
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
