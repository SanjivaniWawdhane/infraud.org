const fs = require('fs');

const navbar = `
    <nav class="navbar">
        <a href="/" class="nav-brand">
            <img src="assets/logo.jpg" alt="INFRAUD">
            INFRAUD
        </a>
        <ul class="nav-links">
            <li><a href="/check.html" class="nav-link">Verify</a></li>
            <li><a href="/reports.html" class="nav-link">Intelligence</a></li>
            <li><a href="/api.html" class="nav-link">API</a></li>
            <li><a href="/dashboard.html" class="nav-link">Dashboard</a></li>
        </ul>
        <div class="nav-actions">
            <a href="/login.html" class="btn btn-outline">Log in</a>
            <a href="/signup.html" class="btn btn-primary">Sign Up</a>
        </div>
    </nav>
`;

const footer = `
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <a href="/" class="footer-brand">
                        <img src="assets/logo.jpg" alt="INFRAUD">
                    </a>
                    <p>The intelligence layer for your digital life. Check before you trust.</p>
                </div>
                <div class="footer-col">
                    <h4>Platform</h4>
                    <ul>
                        <li><a href="/check.html">Verify Asset</a></li>
                        <li><a href="/reports.html">Threat Intel</a></li>
                        <li><a href="/api.html">API Access</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="/docs.html">Documentation</a></li>
                        <li><a href="/learn.html">Safety Academy</a></li>
                        <li><a href="/about.html">About Us</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Legal</h4>
                    <ul>
                        <li><a href="/privacy.html">Privacy Policy</a></li>
                        <li><a href="/terms.html">Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <div>&copy; 2026 INFRAUD. All rights reserved.</div>
                <div>Status: All Systems Operational</div>
            </div>
        </div>
    </footer>
`;

function layout(title, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | INFRAUD</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .page-header { padding: 160px 0 64px; text-align: center; position: relative; z-index: 5; }
        .page-title { font-size: 3rem; margin-bottom: 16px; }
        .page-subtitle { color: var(--text-muted); font-size: 1.125rem; max-width: 600px; margin: 0 auto; }
        
        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 120px 24px; position: relative; z-index: 5; }
        .auth-card { background: #FFF; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 48px; width: 100%; max-width: 440px; box-shadow: var(--shadow-lg); z-index: 10; }
        .auth-card h2 { text-align: center; margin-bottom: 32px; font-size: 1.75rem; }
        .form-group { margin-bottom: 24px; }
        .form-label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 8px; color: var(--text-main); }
        .form-input { width: 100%; height: 48px; padding: 0 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; transition: all 0.2s; outline: none; }
        .form-input:focus { border-color: var(--brand-secondary); box-shadow: 0 0 0 4px rgba(59,152,255,0.1); }
        .auth-btn { width: 100%; height: 48px; font-size: 1rem; margin-top: 8px; }
        .auth-links { text-align: center; margin-top: 24px; font-size: 0.875rem; color: var(--text-muted); }
        .auth-links a { color: var(--brand-primary); font-weight: 600; }
        
        .data-table { width: 100%; border-collapse: collapse; margin-top: 32px; background: #FFF; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
        .data-table th, .data-table td { padding: 16px 24px; text-align: left; border-bottom: 1px solid var(--border-light); }
        .data-table th { background: var(--bg-element); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: var(--bg-body); }
        .font-mono { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; }
        
        .dashboard-grid { display: grid; grid-template-columns: 250px 1fr; gap: 32px; padding: 120px 0 64px; }
        .sidebar-nav { display: flex; flex-direction: column; gap: 8px; }
        .sidebar-link { padding: 12px 16px; border-radius: var(--radius-md); font-weight: 500; color: var(--text-muted); transition: all 0.2s; }
        .sidebar-link:hover, .sidebar-link.active { background: var(--bg-element); color: var(--text-main); }
        
        .result-card { background: #FFF; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 48px; box-shadow: var(--shadow-md); margin-top: 32px; }
        .result-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid var(--border-light); }
        .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>
    ${navbar}
    <main>
        ${content}
    </main>
    ${footer}
    <script src="js/main.js"></script>
</body>
</html>`;
}

const pages = {
    'login.html': layout('Log In', `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Welcome Back</h2>
                <form>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-input" placeholder="you@example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" placeholder="••••••••">
                    </div>
                    <a href="/dashboard.html" class="btn btn-primary auth-btn">Log In</a>
                </form>
                <div class="auth-links">
                    Don't have an account? <a href="/signup.html">Sign up</a>
                </div>
            </div>
        </div>
    `),

    'signup.html': layout('Sign Up', `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Create Account</h2>
                <form>
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-input" placeholder="Jane Doe">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-input" placeholder="you@example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" placeholder="Create a secure password">
                    </div>
                    <a href="/dashboard.html" class="btn btn-primary auth-btn">Sign Up</a>
                </form>
                <div class="auth-links">
                    Already have an account? <a href="/login.html">Log in</a>
                </div>
            </div>
        </div>
    `),

    'check.html': layout('Verify', `
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">Verify Digital Asset</h1>
                <p class="page-subtitle">Paste a URL, Phone Number, UPI ID, or Message below to run a deep scan against our intelligence network.</p>
            </div>
            
            <div class="spotlight-wrapper" style="opacity: 1; animation: none; z-index: 10;">
                <div class="spotlight-search">
                    <div class="spotlight-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input type="text" class="spotlight-input" placeholder="Enter target to scan..." value="amazon-support-refund.in">
                    <a href="/result.html" class="btn btn-primary spotlight-btn" style="display:flex; align-items:center;">Run Scan</a>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 48px; color: var(--text-muted); font-size: 0.875rem;">
                By scanning, you agree to our Terms of Service. Analysis usually takes 1-3 seconds.
            </div>
        </div>
    `),

    'result.html': layout('Analysis Result', `
        <div class="container" style="padding-top: 120px; padding-bottom: 120px; position:relative; z-index: 5;">
            <a href="/check.html" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--text-muted); margin-bottom: 24px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                New Scan
            </a>
            
            <div class="result-card">
                <div class="result-header">
                    <div>
                        <div style="font-size: 0.875rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Target</div>
                        <h1 style="font-size: 2rem; font-family: 'JetBrains Mono', monospace; word-break: break-all;">amazon-support-refund.in</h1>
                        <div style="display: flex; gap: 12px; margin-top: 16px;">
                            <span class="badge" style="background: var(--bg-element); color: var(--text-main);">Type: Website</span>
                            <span class="badge" style="background: var(--bg-element); color: var(--text-main);">Scanned 2 mins ago</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="score-ring" style="width: 100px; height: 100px; font-size: 2.5rem; border-width: 6px; margin: 0;"><span style="transform:rotate(45deg); display:inline-block;">86</span></div>
                        <div style="font-weight: 700; color: var(--risk-high); margin-top: 12px; font-size: 1.125rem;">CRITICAL RISK</div>
                    </div>
                </div>
                
                <div class="result-grid">
                    <div>
                        <h3 style="margin-bottom: 24px; font-size: 1.25rem;">Detected Signals</h3>
                        <div class="ui-signal" style="border-bottom: 1px solid var(--border-light);">
                            <div>
                                <div class="ui-signal-title">Domain Registration</div>
                                <div class="ui-signal-desc">Registered very recently (2 hours ago).</div>
                            </div>
                            <span class="badge badge-red">High Risk</span>
                        </div>
                        <div class="ui-signal" style="border-bottom: 1px solid var(--border-light);">
                            <div>
                                <div class="ui-signal-title">Phishing Heuristics</div>
                                <div class="ui-signal-desc">Brand impersonation: "amazon".</div>
                            </div>
                            <span class="badge badge-red">Critical</span>
                        </div>
                        <div class="ui-signal" style="border-bottom: 1px solid var(--border-light);">
                            <div>
                                <div class="ui-signal-title">SSL Certificate</div>
                                <div class="ui-signal-desc">Free Let's Encrypt certificate used.</div>
                            </div>
                            <span class="badge badge-yellow">Suspicious</span>
                        </div>
                    </div>
                    
                    <div>
                        <div style="background: #FEE2E2; border-radius: var(--radius-md); padding: 24px;">
                            <h4 style="color: var(--risk-high); margin-bottom: 8px;">Recommendation</h4>
                            <p style="color: #991B1B; font-size: 0.95rem; font-weight: 500;">Do not visit this website or provide any personal information. This is a highly probable phishing attempt designed to steal credentials or funds.</p>
                        </div>
                        
                        <div style="margin-top: 32px;">
                            <h4 style="margin-bottom: 16px; font-size: 1rem;">Community Intelligence</h4>
                            <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 16px;">This target has been flagged by our community intelligence network.</p>
                            <a href="/reports.html" class="btn btn-outline" style="width: 100%;">View Related Reports</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `),

    'reports.html': layout('Intelligence', `
        <div class="container" style="position:relative; z-index: 5;">
            <div class="page-header">
                <h1 class="page-title">Threat Intelligence</h1>
                <p class="page-subtitle">Real-time database of community-reported and AI-detected threats.</p>
            </div>
            
            <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                <input type="text" class="form-input" placeholder="Search by domain, number, or keyword..." style="max-width: 400px; background: #FFF;">
                <button class="btn btn-outline">Filter</button>
            </div>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Identifier</th>
                        <th>Type</th>
                        <th>Risk Score</th>
                        <th>Status</th>
                        <th>Last Seen</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="font-mono">amazon-support-refund.in</td>
                        <td>Website</td>
                        <td><span style="color: var(--risk-high); font-weight: 700;">86</span></td>
                        <td><span class="badge badge-red">Confirmed Threat</span></td>
                        <td>2 mins ago</td>
                    </tr>
                    <tr>
                        <td class="font-mono">+91 98765 43210</td>
                        <td>Phone</td>
                        <td><span style="color: var(--risk-med); font-weight: 700;">65</span></td>
                        <td><span class="badge badge-yellow">Suspicious</span></td>
                        <td>15 mins ago</td>
                    </tr>
                    <tr>
                        <td class="font-mono">support@paytm-kyc-verify.com</td>
                        <td>Email</td>
                        <td><span style="color: var(--risk-high); font-weight: 700;">92</span></td>
                        <td><span class="badge badge-red">Critical Threat</span></td>
                        <td>1 hour ago</td>
                    </tr>
                    <tr>
                        <td class="font-mono">hdfc-reward-points.com</td>
                        <td>Website</td>
                        <td><span style="color: var(--risk-high); font-weight: 700;">88</span></td>
                        <td><span class="badge badge-red">Confirmed Threat</span></td>
                        <td>3 hours ago</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div style="height: 100px;"></div>
    `),

    'dashboard.html': layout('Dashboard', `
        <div class="container dashboard-grid" style="position:relative; z-index: 5;">
            <aside>
                <div class="sidebar-nav">
                    <a href="#" class="sidebar-link active">Overview</a>
                    <a href="#" class="sidebar-link">Scan History</a>
                    <a href="#" class="sidebar-link">API Keys</a>
                    <a href="#" class="sidebar-link">Billing</a>
                    <a href="#" class="sidebar-link">Settings</a>
                </div>
            </aside>
            
            <div class="dashboard-content">
                <h2 style="margin-bottom: 8px;">Welcome back, User</h2>
                <p style="color: var(--text-muted); margin-bottom: 32px;">Here is your recent activity and API usage.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 48px;">
                    <div style="background: #FFF; padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
                        <div style="font-size: 0.875rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Scans</div>
                        <div style="font-size: 2rem; font-weight: 800; margin-top: 8px;">1,284</div>
                    </div>
                    <div style="background: #FFF; padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
                        <div style="font-size: 0.875rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Threats Blocked</div>
                        <div style="font-size: 2rem; font-weight: 800; margin-top: 8px; color: var(--brand-primary);">42</div>
                    </div>
                    <div style="background: #FFF; padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
                        <div style="font-size: 0.875rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">API Requests</div>
                        <div style="font-size: 2rem; font-weight: 800; margin-top: 8px;">89k / 100k</div>
                    </div>
                </div>
                
                <h3>Recent Scans</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Target</th>
                            <th>Risk</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="font-mono">amazon-support-refund.in</td>
                            <td><span class="badge badge-red">Critical</span></td>
                            <td>Today, 14:32</td>
                            <td><a href="/result.html" style="color: var(--brand-primary); font-weight: 600; font-size: 0.875rem;">View</a></td>
                        </tr>
                        <tr>
                            <td class="font-mono">github.com</td>
                            <td><span class="badge badge-green">Safe</span></td>
                            <td>Yesterday</td>
                            <td><a href="#" style="color: var(--brand-primary); font-weight: 600; font-size: 0.875rem;">View</a></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `),

    'about.html': layout('About Us', `
        <div class="container" style="max-width: 800px; padding: 160px 24px 120px; position:relative; z-index: 5;">
            <h1 style="font-size: 3rem; margin-bottom: 24px; text-align: center;">Our Mission</h1>
            <p style="font-size: 1.25rem; color: var(--text-muted); text-align: center; margin-bottom: 64px;">To provide transparent, explainable, and accessible digital safety infrastructure for everyone.</p>
            
            <div style="background: #FFF; padding: 48px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); margin-bottom: 48px;">
                <h3 style="margin-bottom: 16px;">The Problem</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">Scams are becoming increasingly sophisticated. Threat actors use advanced psychological manipulation and technically complex spoofing to deceive users. Traditional antivirus and blocklists are too slow to catch zero-day phishing campaigns.</p>
                
                <h3 style="margin-bottom: 16px;">Our Approach</h3>
                <p style="color: var(--text-secondary);">INFRAUD utilizes a combination of deterministic metadata analysis, heuristic modeling, and real-time community intelligence. By processing hundreds of signals instantly, we provide users with a clear, explainable risk score before they make critical decisions.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="/check.html" class="btn btn-primary btn-lg">Experience INFRAUD</a>
            </div>
        </div>
    `),

    'learn.html': layout('Safety Academy', `
        <div class="container" style="position:relative; z-index: 5;">
            <div class="page-header">
                <h1 class="page-title">Safety Academy</h1>
                <p class="page-subtitle">Learn the anatomy of modern digital threats and how to protect yourself.</p>
            </div>
            
            <div class="grid-3" style="padding-bottom: 120px;">
                <div class="card">
                    <div style="background: var(--bg-element); height: 160px; border-radius: var(--radius-sm); margin-bottom: 24px; display:flex; align-items:center; justify-content:center;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <h3>Phishing Anatomy</h3>
                    <p style="margin-bottom: 16px; color: var(--text-muted);">Understand how attackers craft emails that look identical to legitimate institutions.</p>
                    <a href="#" style="color: var(--brand-primary); font-weight: 600;">Read Article →</a>
                </div>
                <div class="card">
                    <div style="background: var(--bg-element); height: 160px; border-radius: var(--radius-sm); margin-bottom: 24px; display:flex; align-items:center; justify-content:center;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                    </div>
                    <h3>Smishing Tactics</h3>
                    <p style="margin-bottom: 16px; color: var(--text-muted);">SMS phishing uses extreme urgency. Learn to identify the psychological triggers.</p>
                    <a href="#" style="color: var(--brand-primary); font-weight: 600;">Read Article →</a>
                </div>
                <div class="card">
                    <div style="background: var(--bg-element); height: 160px; border-radius: var(--radius-sm); margin-bottom: 24px; display:flex; align-items:center; justify-content:center;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <h3>UPI & Payment Fraud</h3>
                    <p style="margin-bottom: 16px; color: var(--text-muted);">How payment request scams work and why you should never enter your PIN to receive money.</p>
                    <a href="#" style="color: var(--brand-primary); font-weight: 600;">Read Article →</a>
                </div>
            </div>
        </div>
    `),

    'report.html': layout('Report Threat', `
        <div class="auth-container">
            <div class="auth-card" style="max-width: 600px;">
                <h2>Report a Threat</h2>
                <p style="text-align: center; color: var(--text-muted); margin-bottom: 32px;">Help the community by submitting a suspicious asset.</p>
                <form>
                    <div class="form-group">
                        <label class="form-label">Asset Type</label>
                        <select class="form-input">
                            <option>Website / URL</option>
                            <option>Phone Number</option>
                            <option>Email Address</option>
                            <option>UPI Handle</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Suspicious Target</label>
                        <input type="text" class="form-input" placeholder="e.g. +91 98765 43210">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description / Context (Optional)</label>
                        <textarea class="form-input" style="height: 100px; padding: 12px 16px; resize: none;" placeholder="How did you encounter this threat?"></textarea>
                    </div>
                    <a href="/reports.html" class="btn btn-primary auth-btn">Submit to Intelligence Database</a>
                </form>
            </div>
        </div>
    `)
};

for (const [filename, content] of Object.entries(pages)) {
    fs.writeFileSync(filename, content);
    console.log(`Generated ${filename}`);
}
