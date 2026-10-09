import os

BASE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="container nav-container">
            <a href="/" class="nav-brand">
                <img src="assets/logo.jpg" alt="INFRAUD">
                INFRAUD
            </a>
            <ul class="nav-links">
                <li><a href="/" class="nav-link {nav_home}">Home</a></li>
                <li><a href="/check.html" class="nav-link {nav_check}">Check</a></li>
                <li><a href="/reports.html" class="nav-link {nav_reports}">Reports</a></li>
                <li><a href="/learn.html" class="nav-link {nav_learn}">Learn</a></li>
                <li><a href="/tools.html" class="nav-link {nav_tools}">Tools</a></li>
                <li><a href="/about.html" class="nav-link {nav_about}">About</a></li>
            </ul>
            <div class="nav-actions">
                <a href="/search.html" class="nav-link">Search</a>
                <a href="/login.html" class="nav-link">Login</a>
                <a href="/signup.html" class="nav-link">Sign Up</a>
                <a href="/check.html" class="btn btn-primary">Check Now</a>
            </div>
            <button class="mobile-menu-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
        </div>
    </nav>

    <main>
{content}
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div>
                    <a href="/" class="nav-brand mb-4">
                        <img src="assets/logo.jpg" alt="INFRAUD">
                        INFRAUD
                    </a>
                    <p class="text-sm">Check Before You Trust.</p>
                </div>
                <div>
                    <h4 class="footer-heading">Product</h4>
                    <a href="/check.html" class="footer-link">Check</a>
                    <a href="/reports.html" class="footer-link">Reports</a>
                    <a href="/tools.html" class="footer-link">Tools</a>
                    <a href="/dashboard.html" class="footer-link">Dashboard</a>
                </div>
                <div>
                    <h4 class="footer-heading">Resources</h4>
                    <a href="/learn.html" class="footer-link">Learn</a>
                    <a href="/learn.html" class="footer-link">Safety Guides</a>
                    <a href="#" class="footer-link">Blog</a>
                    <a href="#" class="footer-link">FAQ</a>
                </div>
                <div>
                    <h4 class="footer-heading">Community</h4>
                    <a href="https://github.com/infraud" class="footer-link">GitHub</a>
                    <a href="#" class="footer-link">Contribute</a>
                    <a href="/reports.html" class="footer-link">Report a Scam</a>
                </div>
                <div>
                    <h4 class="footer-heading">Company</h4>
                    <a href="/about.html" class="footer-link">About</a>
                    <a href="#" class="footer-link">Contact</a>
                    <a href="#" class="footer-link">Privacy</a>
                    <a href="#" class="footer-link">Terms</a>
                </div>
            </div>
            <div class="footer-bottom">
                <div>INFRAUD.ORG</div>
                <div>Check Before You Trust.</div>
            </div>
        </div>
    </footer>
    <script src="js/main.js"></script>
</body>
</html>"""

AUTH_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .auth-container {{ min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--s-6); }}
        .auth-card {{ width: 100%; max-width: 400px; padding: var(--s-8); }}
        .auth-logo {{ display: flex; justify-content: center; margin-bottom: var(--s-8); }}
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="card auth-card">
            <a href="/" class="auth-logo nav-brand">
                <img src="assets/logo.jpg" alt="INFRAUD">
                INFRAUD
            </a>
{content}
        </div>
    </div>
</body>
</html>"""

pages = {
    "index.html": {
        "title": "INFRAUD | Check Before You Trust",
        "nav": "nav_home",
        "content": """
        <!-- HERO -->
        <section class="section">
            <div class="container text-center flex-col items-center">
                <h1 class="mb-6">Check Before You Trust.</h1>
                <p class="mb-12" style="max-width: 700px; margin-left: auto; margin-right: auto;">Check suspicious websites, messages, links, phone numbers and other digital signals before you click, pay or share sensitive information.</p>
                <div class="flex gap-4 justify-center mb-16">
                    <a href="/check.html" class="btn btn-primary btn-lg">Check Something</a>
                    <a href="#how" class="btn btn-secondary btn-lg">How It Works</a>
                </div>
                
                <!-- UNIVERSAL CHECKER HERO -->
                <div class="card" style="max-width: 800px; margin: 0 auto; text-align: left;">
                    <h3 class="mb-6">What do you want to check?</h3>
                    <div class="flex gap-4 mb-6" style="border-bottom: 1px solid var(--c-border); padding-bottom: var(--s-4);">
                        <span class="font-medium" style="color: var(--c-blue); border-bottom: 2px solid var(--c-blue); padding-bottom: 18px; margin-bottom: -17px;">Website</span>
                        <span class="font-medium text-sec">Phone</span>
                        <span class="font-medium text-sec">UPI</span>
                        <span class="font-medium text-sec">Email</span>
                        <span class="font-medium text-sec">Message</span>
                        <span class="font-medium text-sec">Link</span>
                    </div>
                    <div class="flex gap-4 mb-2">
                        <input type="text" class="input input-lg" placeholder="Paste something suspicious here...">
                        <button class="btn btn-primary btn-lg" style="flex-shrink: 0;">Check Now</button>
                    </div>
                    <p class="text-xs">Never share passwords, OTPs or banking credentials.</p>
                </div>
            </div>
        </section>

        <!-- TRUST SECTION -->
        <section class="section section-alt">
            <div class="container flex justify-between items-center text-sm font-medium" style="color: var(--c-text-sec);">
                <div class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Open Source</div>
                <div class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Explainable Results</div>
                <div class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> Community Evidence</div>
                <div class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Privacy Conscious</div>
                <div class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Safe Next Actions</div>
            </div>
        </section>

        <!-- WHY INFRAUD -->
        <section class="section">
            <div class="container flex items-center gap-12" style="display: grid; grid-template-columns: 1fr 1fr;">
                <div>
                    <h2 class="mb-6">Suspicious doesn't always look suspicious.</h2>
                    <p class="mb-6">Fake websites, malicious messages, and fraudulent payment requests are designed to look perfectly legitimate. Visual cues are no longer enough.</p>
                    <p>INFRAUD analyzes the hidden signals—domain age, infrastructure heuristics, linguistic patterns, and global community evidence—to reveal the true risk before you act.</p>
                </div>
                <div class="card bg-gray-50 p-6 flex flex-col justify-center items-center text-center border-dashed">
                    <div class="badge risk-critical mb-4 text-sm" style="font-size:12px; padding: 4px 12px;">CRITICAL RISK DETECTED</div>
                    <div style="font-family: monospace; font-size: 14px; background: #fff; padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 16px;">secure-amazon-refund.in</div>
                    <p class="text-sm">Registered 2 hours ago. Hosted on known bad infrastructure.</p>
                </div>
            </div>
        </section>

        <!-- WHAT CAN BE CHECKED -->
        <section class="section section-alt">
            <div class="container">
                <h2 class="mb-12 text-center">Comprehensive Threat Coverage.</h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-6);">
                    <div class="card" style="grid-column: span 3; display: flex; gap: var(--s-8); align-items: center;">
                        <div style="width: 64px; height: 64px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--c-blue)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </div>
                        <div>
                            <h3 class="mb-2">Website / URL Analysis</h3>
                            <p class="text-sm">Deep inspection of SSL certificates, WHOIS data, hosting providers, and structural code patterns to catch sophisticated credential harvesters.</p>
                        </div>
                    </div>
                    <div class="card">
                        <h4 class="mb-2">Phone & UPI</h4>
                        <p class="text-sm">Cross-reference numbers and payment handles against a global database of reported scams.</p>
                    </div>
                    <div class="card">
                        <h4 class="mb-2">Emails & Messages</h4>
                        <p class="text-sm">Linguistic analysis for urgency markers, psychological manipulation, and hidden routing data.</p>
                    </div>
                    <div class="card">
                        <h4 class="mb-2">Files & Screenshots</h4>
                        <p class="text-sm">Extract and evaluate text from images to verify authenticity of payment receipts and communications.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- HOW INFRAUD WORKS -->
        <section id="how" class="section">
            <div class="container">
                <h2 class="mb-12 text-center">How INFRAUD Works.</h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--s-6); position: relative;">
                    <div style="position: absolute; top: 24px; left: 10%; right: 10%; height: 2px; background: var(--c-border); z-index: 0;"></div>
                    <div class="text-center" style="z-index: 1;">
                        <div style="width: 48px; height: 48px; background: var(--c-white); border: 2px solid var(--c-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--s-4); font-weight: 700;">01</div>
                        <h4 class="mb-2">Enter</h4>
                        <p class="text-sm">Provide the suspicious signal.</p>
                    </div>
                    <div class="text-center" style="z-index: 1;">
                        <div style="width: 48px; height: 48px; background: var(--c-white); border: 2px solid var(--c-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--s-4); font-weight: 700;">02</div>
                        <h4 class="mb-2">Analyze</h4>
                        <p class="text-sm">We extract hidden metadata.</p>
                    </div>
                    <div class="text-center" style="z-index: 1;">
                        <div style="width: 48px; height: 48px; background: var(--c-white); border: 2px solid var(--c-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--s-4); font-weight: 700;">03</div>
                        <h4 class="mb-2">Understand</h4>
                        <p class="text-sm">Review the explainable risk score.</p>
                    </div>
                    <div class="text-center" style="z-index: 1;">
                        <div style="width: 48px; height: 48px; background: var(--c-white); border: 2px solid var(--c-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--s-4); font-weight: 700; color: var(--c-blue);">04</div>
                        <h4 class="mb-2">Act Safely</h4>
                        <p class="text-sm">Make an informed decision.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- RISK ANALYSIS PREVIEW -->
        <section class="section section-alt">
            <div class="container">
                <h2 class="mb-12 text-center">Explainable Risk Analysis.</h2>
                <div class="card" style="max-width: 900px; margin: 0 auto; padding: 0; overflow: hidden; display: flex;">
                    <div style="padding: var(--s-8); background: #FEF2F2; width: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-right: 1px solid var(--c-border);">
                        <div style="font-size: 5rem; font-weight: 800; color: var(--r-critical); line-height: 1;">86<span style="font-size: 2rem; color: #FCA5A5;">/100</span></div>
                        <div style="font-weight: 700; color: var(--r-critical); margin-top: var(--s-2);">HIGH RISK</div>
                    </div>
                    <div style="padding: var(--s-8); flex: 1;">
                        <h4 class="mb-4">Detected Signals</h4>
                        <div class="mb-6 flex-col gap-3">
                            <div class="flex justify-between items-center py-2" style="border-bottom: 1px solid var(--c-border);">
                                <span class="font-medium">Suspicious domain pattern</span>
                                <span class="badge risk-critical">High</span>
                            </div>
                            <div class="flex justify-between items-center py-2" style="border-bottom: 1px solid var(--c-border);">
                                <span class="font-medium">Urgency-based language</span>
                                <span class="badge risk-suspicious">Medium</span>
                            </div>
                            <div class="flex justify-between items-center py-2" style="border-bottom: 1px solid var(--c-border);">
                                <span class="font-medium">Payment request</span>
                                <span class="badge risk-critical">High</span>
                            </div>
                            <div class="flex justify-between items-center py-2">
                                <span class="font-medium">Community evidence</span>
                                <span class="badge risk-suspicious">Medium</span>
                            </div>
                        </div>
                        <div style="background: var(--c-bg); padding: var(--s-4); border-radius: var(--rad-md); border-left: 4px solid var(--r-critical);">
                            <div class="font-semibold text-sm mb-1 text-red-700">Recommended Action:</div>
                            <div class="text-sm">Do not click, pay or share sensitive information until independently verified.</div>
                        </div>
                        <div class="mt-4 text-xs font-mono" style="color: var(--c-blue); cursor: pointer;">How was this score calculated?</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- COMMUNITY REPORTS -->
        <section class="section">
            <div class="container">
                <div class="flex justify-between items-end mb-8">
                    <div>
                        <h2>Community Intelligence.</h2>
                        <p>Real-time reports from the INFRAUD network.</p>
                    </div>
                    <a href="/reports.html" class="btn btn-secondary">View Database</a>
                </div>
                <div class="card" style="padding: 0; overflow: hidden;">
                    <table style="width: 100%; text-align: left; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--c-bg); border-bottom: 1px solid var(--c-border);">
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Identifier</th>
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Type</th>
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Risk</th>
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Evidence</th>
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--c-border);">
                                <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem;">amazon-support.in</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem;">Website</td>
                                <td style="padding: var(--s-4);"><span class="badge risk-high">High</span></td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">Community Evidence</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">2m ago</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--c-border);">
                                <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem;">+91 98765 43210</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem;">Phone</td>
                                <td style="padding: var(--s-4);"><span class="badge risk-suspicious">Suspicious</span></td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">Further Verification Recommended</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">15m ago</td>
                            </tr>
                            <tr>
                                <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem;">paytm-kyc-verify@gmail</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem;">Email</td>
                                <td style="padding: var(--s-4);"><span class="badge risk-critical">Critical</span></td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">Reported</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">1h ago</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="text-xs mt-4 text-center">A single report does not automatically confirm a scam.</p>
            </div>
        </section>

        <!-- SAFETY EDUCATION & OPEN SOURCE -->
        <section class="section section-alt">
            <div class="container grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-8);">
                <div>
                    <h3 class="mb-4">Learn Before You Lose.</h3>
                    <p class="mb-6">Explore our editorial safety guides.</p>
                    <ul class="flex-col gap-4" style="display: flex;">
                        <li><a href="#" class="font-medium" style="color: var(--c-blue);">Phishing & Spoofing Tactics &rarr;</a></li>
                        <li><a href="#" class="font-medium" style="color: var(--c-blue);">UPI Request Scams Explained &rarr;</a></li>
                        <li><a href="#" class="font-medium" style="color: var(--c-blue);">The Anatomy of Fake KYC &rarr;</a></li>
                        <li><a href="#" class="font-medium" style="color: var(--c-blue);">Investment & Job Scams &rarr;</a></li>
                    </ul>
                </div>
                <div class="card bg-gray-50">
                    <h3 class="mb-4">Built in the Open.</h3>
                    <p class="text-sm mb-6">INFRAUD is designed to be transparent and community-driven. Our heuristics and threat models are verifiable by everyone.</p>
                    <div class="flex gap-4">
                        <a href="https://github.com/infraud" class="btn btn-secondary">View on GitHub</a>
                        <a href="#" class="btn btn-ghost">Contribute</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- FINAL CTA -->
        <section class="section" style="padding: var(--s-16) 0 var(--s-24);">
            <div class="container text-center flex-col items-center">
                <h2 style="font-size: 3rem; line-height: 1.1; margin-bottom: var(--s-8);">Before You Click.<br>Before You Pay.<br>Check First.</h2>
                <a href="/check.html" class="btn btn-primary btn-lg">Check Something</a>
            </div>
        </section>
        """
    },
    "check.html": {
        "title": "Universal Checker | INFRAUD",
        "nav": "nav_check",
        "content": """
        <section class="section">
            <div class="container flex-col items-center">
                <div class="card" style="max-width: 800px; width: 100%; margin: 0 auto;">
                    <h2 class="mb-6">What would you like to check?</h2>
                    <div class="flex gap-4 mb-6" style="border-bottom: 1px solid var(--c-border); padding-bottom: var(--s-4);">
                        <span class="font-medium" style="color: var(--c-blue); border-bottom: 2px solid var(--c-blue); padding-bottom: 18px; margin-bottom: -17px; cursor: pointer;">Website</span>
                        <span class="font-medium text-sec cursor-pointer hover:text-navy">Phone</span>
                        <span class="font-medium text-sec cursor-pointer hover:text-navy">UPI</span>
                        <span class="font-medium text-sec cursor-pointer hover:text-navy">Email</span>
                        <span class="font-medium text-sec cursor-pointer hover:text-navy">Message</span>
                        <span class="font-medium text-sec cursor-pointer hover:text-navy">Link</span>
                    </div>
                    <div class="flex gap-4 mb-4">
                        <input type="text" class="input input-lg" placeholder="Paste something suspicious here...">
                        <button class="btn btn-primary btn-lg" style="flex-shrink: 0;" onclick="window.location.href='/result.html'">Check Now</button>
                    </div>
                    <div class="flex justify-between items-center text-xs text-sec">
                        <p>Never share passwords, OTPs or banking credentials.</p>
                        <a href="#" style="text-decoration: underline;">Privacy Reminder</a>
                    </div>
                    
                    <div class="mt-8 pt-6" style="border-top: 1px solid var(--c-border);">
                        <h4 class="text-sm font-medium mb-4">Recent Checks</h4>
                        <div class="flex gap-2 font-mono text-xs text-sec">
                            <span style="background: var(--c-bg); padding: 4px 8px; border-radius: var(--rad-sm);">amazon-support.in</span>
                            <span style="background: var(--c-bg); padding: 4px 8px; border-radius: var(--rad-sm);">+91 98765 43210</span>
                            <span style="background: var(--c-bg); padding: 4px 8px; border-radius: var(--rad-sm);">paytm-kyc@gmail.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """
    },
    "result.html": {
        "title": "Analysis Result | INFRAUD",
        "nav": "nav_check",
        "content": """
        <section class="section" style="padding-top: var(--s-8);">
            <div class="container">
                <div class="flex justify-between items-end mb-6">
                    <div>
                        <div class="text-xs font-mono text-sec mb-2">Scan ID: INFR-8892-A • Oct 7, 2026 14:30 IST</div>
                        <h2>Analysis Result</h2>
                    </div>
                    <div class="flex gap-4">
                        <a href="/check.html" class="btn btn-secondary">Scan Again</a>
                        <button class="btn btn-ghost">Save Result</button>
                        <a href="/reports.html" class="btn btn-ghost" style="color: var(--r-critical);">Report</a>
                    </div>
                </div>

                <div class="card" style="padding: 0; overflow: hidden; display: flex;">
                    <div style="padding: var(--s-8); background: #FEF2F2; width: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-right: 1px solid var(--c-border);">
                        <div style="font-size: 6rem; font-weight: 800; color: var(--r-critical); line-height: 1;">86<span style="font-size: 2rem; color: #FCA5A5;">/100</span></div>
                        <div style="font-weight: 700; color: var(--r-critical); margin-top: var(--s-2); font-size: 1.5rem;">HIGH RISK</div>
                        <p class="text-sm mt-4" style="color: #991B1B;">This target exhibits multiple critical threat signatures.</p>
                    </div>
                    <div style="padding: var(--s-8); flex: 1;">
                        <h3 class="mb-6">Detected Signals</h3>
                        
                        <div class="mb-8 flex-col gap-4">
                            <div class="flex justify-between items-start pb-4" style="border-bottom: 1px solid var(--c-border);">
                                <div>
                                    <div class="font-medium mb-1">Suspicious domain registration</div>
                                    <div class="text-sm text-sec">Domain was registered extremely recently (2 hours ago) using a privacy proxy.</div>
                                </div>
                                <span class="badge risk-critical">High</span>
                            </div>
                            <div class="flex justify-between items-start pb-4" style="border-bottom: 1px solid var(--c-border);">
                                <div>
                                    <div class="font-medium mb-1">Urgency-based language</div>
                                    <div class="text-sm text-sec">NLP model detected manipulation tactics urging immediate action.</div>
                                </div>
                                <span class="badge risk-suspicious">Medium</span>
                            </div>
                            <div class="flex justify-between items-start pb-4" style="border-bottom: 1px solid var(--c-border);">
                                <div>
                                    <div class="font-medium mb-1">Technical infrastructure</div>
                                    <div class="text-sm text-sec">Hosted on an ASN frequently associated with phishing campaigns.</div>
                                </div>
                                <span class="badge risk-critical">High</span>
                            </div>
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="font-medium mb-1">Community evidence</div>
                                    <div class="text-sm text-sec">14 independent reports filed within the last hour.</div>
                                </div>
                                <span class="badge risk-suspicious">Medium</span>
                            </div>
                        </div>

                        <div style="background: var(--c-bg); padding: var(--s-6); border-radius: var(--rad-md); border-left: 4px solid var(--r-critical);">
                            <div class="font-semibold mb-2 text-red-700">Recommended Action:</div>
                            <div class="text-lg font-medium text-navy">Do not click, pay or share sensitive information until independently verified.</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        """
    },
    "reports.html": {
        "title": "Community Reports | INFRAUD",
        "nav": "nav_reports",
        "content": """
        <section class="section" style="padding-top: var(--s-8);">
            <div class="container">
                <div class="flex justify-between items-end mb-8">
                    <div>
                        <h2 class="mb-2">Community Intelligence</h2>
                        <p>Search the live database of reported digital threats.</p>
                    </div>
                    <button class="btn btn-primary">Submit Report</button>
                </div>

                <!-- Filters -->
                <div class="card mb-6" style="padding: var(--s-4);">
                    <div class="flex gap-4">
                        <input type="text" class="input flex-1" placeholder="Search identifiers, URLs, phone numbers...">
                        <select class="input" style="width: 150px;">
                            <option>All Types</option>
                            <option>Website</option>
                            <option>Phone</option>
                        </select>
                        <select class="input" style="width: 150px;">
                            <option>All Risk Levels</option>
                            <option>Critical</option>
                            <option>Suspicious</option>
                        </select>
                    </div>
                </div>

                <!-- Table -->
                <div class="card" style="padding: 0; overflow: hidden;">
                    <table style="width: 100%; text-align: left; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--c-bg); border-bottom: 1px solid var(--c-border);">
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Identifier</th>
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Type</th>
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Risk</th>
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Evidence</th>
                                <th style="padding: var(--s-4); font-size: 0.75rem; text-transform: uppercase; color: var(--c-text-sec);">Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--c-border); cursor: pointer;" class="hover-bg">
                                <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem; color: var(--c-blue);">amazon-support.in</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem;">Website</td>
                                <td style="padding: var(--s-4);"><span class="badge risk-high">High</span></td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">Community Evidence</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">2m ago</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--c-border); cursor: pointer;" class="hover-bg">
                                <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem; color: var(--c-blue);">+91 98765 43210</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem;">Phone</td>
                                <td style="padding: var(--s-4);"><span class="badge risk-suspicious">Suspicious</span></td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">Further Verification Recommended</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">15m ago</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--c-border); cursor: pointer;" class="hover-bg">
                                <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem; color: var(--c-blue);">paytm-kyc-verify@gmail</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem;">Email</td>
                                <td style="padding: var(--s-4);"><span class="badge risk-critical">Critical</span></td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">Reported</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">1h ago</td>
                            </tr>
                            <tr style="cursor: pointer;" class="hover-bg">
                                <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem; color: var(--c-blue);">johndoe@ybl</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem;">UPI</td>
                                <td style="padding: var(--s-4);"><span class="badge risk-low">Low</span></td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">No Threat Signals</td>
                                <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">3h ago</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
        <style>.hover-bg:hover { background: var(--c-bg); }</style>
        """
    },
    "tools.html": {
        "title": "Security Tools | INFRAUD",
        "nav": "nav_tools",
        "content": """
        <section class="section">
            <div class="container text-center">
                <h2 class="mb-12">Security Tools</h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-6); text-align: left;">
                    <a href="/check.html" class="card" style="display: block;">
                        <h3 class="mb-2">URL Checker</h3>
                        <p class="text-sm">Deep inspection of domains and links.</p>
                    </a>
                    <a href="/check.html" class="card" style="display: block;">
                        <h3 class="mb-2">Message Analyzer</h3>
                        <p class="text-sm">Extract threats from SMS and emails.</p>
                    </a>
                    <a href="/check.html" class="card" style="display: block;">
                        <h3 class="mb-2">Phone Checker</h3>
                        <p class="text-sm">Verify numbers against global spam DBs.</p>
                    </a>
                    <a href="/check.html" class="card" style="display: block;">
                        <h3 class="mb-2">UPI Checker</h3>
                        <p class="text-sm">Validate payment handles before transfer.</p>
                    </a>
                    <a href="/check.html" class="card" style="display: block;">
                        <h3 class="mb-2">Email Checker</h3>
                        <p class="text-sm">Analyze sender headers and metadata.</p>
                    </a>
                    <a href="/check.html" class="card" style="display: block;">
                        <h3 class="mb-2">Screenshot Analyzer</h3>
                        <p class="text-sm">Extract text from images using OCR.</p>
                    </a>
                </div>
            </div>
        </section>
        """
    },
    "learn.html": {
        "title": "Safety Education | INFRAUD",
        "nav": "nav_learn",
        "content": """
        <section class="section">
            <div class="container">
                <h2 class="mb-12 text-center">Learn Before You Lose.</h2>
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--s-8);">
                    <div>
                        <div class="card mb-6" style="padding: var(--s-8);">
                            <div class="text-sm font-semibold mb-2" style="color: var(--c-blue);">FEATURED</div>
                            <h2 class="mb-4">The Anatomy of a Modern Phishing Campaign</h2>
                            <p class="mb-6">Scammers no longer use broken English and obvious fake domains. Discover how homograph attacks and proxy infrastructure trick even technical users.</p>
                            <button class="btn btn-secondary">Read Article</button>
                        </div>
                        <div class="card mb-6" style="padding: var(--s-8);">
                            <h3 class="mb-4">UPI Request Scams Explained</h3>
                            <p class="mb-6">Understanding the difference between paying and receiving, and how urgency is weaponized on digital payment networks.</p>
                            <button class="btn btn-secondary">Read Article</button>
                        </div>
                    </div>
                    <div class="flex-col gap-4">
                        <h4 class="mb-4">All Topics</h4>
                        <ul class="flex-col gap-4" style="display: flex;">
                            <li><a href="#" class="font-medium hover:text-blue">Fake KYC Vectors</a></li>
                            <li><a href="#" class="font-medium hover:text-blue">Telegram Job Scams</a></li>
                            <li><a href="#" class="font-medium hover:text-blue">Investment Fraud Rings</a></li>
                            <li><a href="#" class="font-medium hover:text-blue">Fake Tech Support</a></li>
                            <li><a href="#" class="font-medium hover:text-blue">Shopping & E-Commerce</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        """
    },
    "dashboard.html": {
        "title": "Dashboard | INFRAUD",
        "nav": "",
        "content": """
        <section class="section" style="padding-top: var(--s-8);">
            <div class="container flex gap-8">
                <div style="width: 240px; flex-shrink: 0;">
                    <ul class="flex-col gap-2" style="display: flex;">
                        <li><a href="#" class="btn btn-ghost w-full justify-start font-medium" style="background: var(--c-border);">Overview</a></li>
                        <li><a href="#" class="btn btn-ghost w-full justify-start">Recent Checks</a></li>
                        <li><a href="#" class="btn btn-ghost w-full justify-start">Saved Results</a></li>
                        <li><a href="#" class="btn btn-ghost w-full justify-start">My Reports</a></li>
                        <li><a href="#" class="btn btn-ghost w-full justify-start">Settings</a></li>
                    </ul>
                </div>
                <div style="flex: 1;">
                    <h2 class="mb-8">Welcome back.</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-6); mb-8;">
                        <div class="card">
                            <div class="text-sm text-sec mb-2">Total Checks Performed</div>
                            <div style="font-size: 2rem; font-weight: 700;">142</div>
                        </div>
                        <div class="card">
                            <div class="text-sm text-sec mb-2">Threats Prevented</div>
                            <div style="font-size: 2rem; font-weight: 700; color: var(--r-low);">12</div>
                        </div>
                    </div>
                    <h4 class="mt-8 mb-4">Recent Activity</h4>
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <table style="width: 100%; text-align: left; border-collapse: collapse;">
                            <tbody>
                                <tr style="border-bottom: 1px solid var(--c-border);">
                                    <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem;">amazon-support.in</td>
                                    <td style="padding: var(--s-4);"><span class="badge risk-high">High Risk</span></td>
                                    <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">Oct 7</td>
                                    <td style="padding: var(--s-4); text-align: right;"><a href="/result.html" class="text-sm font-medium" style="color: var(--c-blue);">View</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem;">+91 98765 43210</td>
                                    <td style="padding: var(--s-4);"><span class="badge risk-suspicious">Suspicious</span></td>
                                    <td style="padding: var(--s-4); font-size: 0.875rem; color: var(--c-text-sec);">Oct 6</td>
                                    <td style="padding: var(--s-4); text-align: right;"><a href="/result.html" class="text-sm font-medium" style="color: var(--c-blue);">View</a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
        """
    },
    "search.html": {
        "title": "Search | INFRAUD",
        "nav": "",
        "content": """
        <section class="section" style="padding-top: var(--s-16);">
            <div class="container flex-col items-center">
                <h2 class="mb-8 text-center">Global Search</h2>
                <div class="card" style="max-width: 600px; width: 100%; margin: 0 auto; padding: var(--s-4);">
                    <input type="text" class="input input-lg" placeholder="Search websites, numbers, reports, resources..." style="border: none; box-shadow: none; font-size: 1.125rem;" autofocus>
                </div>
                <div style="max-width: 600px; width: 100%; margin: var(--s-6) auto 0;">
                    <div class="text-sm font-medium text-sec mb-4">Recent Searches</div>
                    <div class="card" style="padding: 0;">
                        <div style="padding: var(--s-4); border-bottom: 1px solid var(--c-border); font-family: monospace; font-size: 0.875rem; color: var(--c-blue); cursor: pointer;" class="hover-bg">amazon-support.in</div>
                        <div style="padding: var(--s-4); font-family: monospace; font-size: 0.875rem; color: var(--c-blue); cursor: pointer;" class="hover-bg">+91 98765 43210</div>
                    </div>
                </div>
            </div>
        </section>
        """
    },
    "about.html": {
        "title": "About Us | INFRAUD",
        "nav": "nav_about",
        "content": """
        <section class="section">
            <div class="container text-center" style="max-width: 800px;">
                <h1 class="mb-6">Built to protect.</h1>
                <p class="mb-12">INFRAUD is an open-source intelligence platform designed to democratize digital safety. We aggregate threat signals, analyze malicious infrastructure, and provide everyday internet users with explainable risk scores before they make a mistake.</p>
                <div style="text-align: left;" class="card">
                    <h3 class="mb-4">Our Mission</h3>
                    <p class="mb-6">The digital landscape has become increasingly hostile. Scammers are sophisticated, utilizing psychological manipulation and perfect visual replicas of trusted brands. Our mission is to provide a technical counter-measure that requires zero technical expertise to use.</p>
                    <a href="https://github.com/infraud" class="btn btn-secondary">View our Open Source Manifesto</a>
                </div>
            </div>
        </section>
        """
    }
}

for filename, data in pages.items():
    formatted = BASE_HTML.format(
        title=data["title"],
        content=data["content"],
        nav_home='active' if data["nav"] == 'nav_home' else '',
        nav_check='active' if data["nav"] == 'nav_check' else '',
        nav_reports='active' if data["nav"] == 'nav_reports' else '',
        nav_learn='active' if data["nav"] == 'nav_learn' else '',
        nav_tools='active' if data["nav"] == 'nav_tools' else '',
        nav_about='active' if data["nav"] == 'nav_about' else ''
    )
    with open(filename, "w", encoding="utf-8") as f:
        f.write(formatted)

# Auth pages have a special layout
with open("login.html", "w", encoding="utf-8") as f:
    f.write(AUTH_HTML.format(title="Login | INFRAUD", content="""
            <h2 class="text-center mb-6">Welcome back</h2>
            <div class="flex-col gap-4 mb-6" style="display: flex;">
                <div>
                    <label class="text-sm font-medium mb-2" style="display: block;">Email</label>
                    <input type="email" class="input" placeholder="you@company.com">
                </div>
                <div>
                    <label class="text-sm font-medium mb-2" style="display: block;">Password</label>
                    <input type="password" class="input" placeholder="••••••••">
                </div>
                <button class="btn btn-primary w-full mt-2">Log in</button>
            </div>
            <div class="text-center text-sm text-sec">
                Don't have an account? <a href="/signup.html" class="font-medium" style="color: var(--c-navy);">Sign up</a>
            </div>
    """))

with open("signup.html", "w", encoding="utf-8") as f:
    f.write(AUTH_HTML.format(title="Sign Up | INFRAUD", content="""
            <h2 class="text-center mb-6">Create an account</h2>
            <div class="flex-col gap-4 mb-6" style="display: flex;">
                <div>
                    <label class="text-sm font-medium mb-2" style="display: block;">Full Name</label>
                    <input type="text" class="input" placeholder="Alex Doe">
                </div>
                <div>
                    <label class="text-sm font-medium mb-2" style="display: block;">Email</label>
                    <input type="email" class="input" placeholder="you@company.com">
                </div>
                <div>
                    <label class="text-sm font-medium mb-2" style="display: block;">Password</label>
                    <input type="password" class="input" placeholder="••••••••">
                </div>
                <button class="btn btn-primary w-full mt-2">Create Account</button>
            </div>
            <div class="text-center text-sm text-sec">
                Already have an account? <a href="/login.html" class="font-medium" style="color: var(--c-navy);">Log in</a>
            </div>
    """))

print("HTML pages generated successfully.")
