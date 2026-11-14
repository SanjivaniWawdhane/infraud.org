/**
 * INFRAUD Digital Flipbook Reader Engine
 * Powered by StPageFlip Physics Engine (60fps Buttery Smooth Page Peeling)
 * Multi-Book Support: UPI Request Scams & Fake KYC Vectors
 */

(function () {
  let currentBookId = 'upi';
  let isSpread = window.innerWidth >= 860;
  let pageFlipInstance = null;
  let soundEnabled = localStorage.getItem('infra_book_sound') !== 'false';

  // State for UPI Book
  let upiChecklistState = [false, false, false, false, false, false];
  let upiQuizAnswers = {};

  // State for KYC Book
  let kycChecklistState = [false, false, false, false, false, false, false];
  let kycQuizAnswers = {};

  function getUpiPrefaceHtml() {
    return `
      <div class="book-page-leaf book-page-left" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding: 48px; background: #F8FAFC;">
        <div style="width: 60px; height: 60px; border-radius: 16px; background: rgba(37,99,235,0.08); display:flex; align-items:center; justify-content:center; margin-bottom: 20px; color: #2563EB;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em; color: #2563EB; text-transform: uppercase; margin-bottom: 6px;">INFRAUD ACADEMY</div>
        <h3 style="font-size: 1.35rem; font-weight: 800; color: #0A0F1E; margin-bottom: 12px; letter-spacing:-0.02em;">Interactive Safety Handbook</h3>
        <p style="font-size: 0.875rem; color: #4B5570; max-width: 320px; line-height: 1.6; margin-bottom: 24px;">
          A verified curriculum to protect users from social engineering, fake collect requests, and payment fraud across India.
        </p>
        <div style="display:inline-flex; align-items:center; gap:8px; padding: 6px 14px; background: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; color: #2563EB;">
          <span>Edition 2026</span>
          <span>•</span>
          <span>12 Pages & Quiz</span>
        </div>
      </div>
    `;
  }

  

  function getUpiCertificateHtml() {
    return `
      <div class="book-page-leaf book-page-right" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding: 48px; background: #F8FAFC;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #D1FAE5; color: #059669; display:flex; align-items:center; justify-content:center; margin-bottom: 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: #0A0F1E; margin-bottom: 6px;">Curriculum Completed</h3>
        <p style="font-size: 0.875rem; color: #4B5570; max-width: 300px; line-height: 1.6; margin-bottom: 20px;">
          You have reviewed all 4 lessons and safety exercises for UPI Request Scams. Always pause and verify before entering your PIN.
        </p>
        <a href="/books/INFRAUD_UPI_Request_Scams_Safety_Guide.pdf" download class="book-control-btn book-control-btn-primary" style="padding: 10px 20px; font-size: 0.875rem;">
          Download Reference PDF
        </a>
      </div>
    `;
  }

  

  const upiPagesData = [
    // Page 1: Cover Page
    {
      page: 1,
      title: "Cover",
      render: function () {
        return `
          <div class="book-cover-page book-page-leaf">
            <div class="cover-top-emblem">
              <div class="cover-brand-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B7BFF" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                INFRAUD
              </div>
              <span class="cover-brand-pill">Safety Handbook</span>
            </div>

            <div class="cover-body-hero">
              <div class="cover-hero-tag">Official Curriculum Guide</div>
              <h1 class="cover-hero-title">UPI Request Scams</h1>
              <p class="cover-hero-desc">
                A practical beginner’s guide to understanding payment requests, spotting social engineering, and protecting your money.
              </p>

              <div class="cover-pills-row">
                <div class="cover-meta-pill">
                  <span>LEVEL</span>
                  <strong>Beginner</strong>
                </div>
                <div class="cover-meta-pill">
                  <span>CURRICULUM</span>
                  <strong>4 Lessons</strong>
                </div>
                <div class="cover-meta-pill">
                  <span>TOPIC</span>
                  <strong>UPI Safety</strong>
                </div>
              </div>

              <div class="cover-golden-rule-box">
                <div class="cover-golden-rule-title">★ THE MOST IMPORTANT RULE</div>
                <p class="cover-golden-rule-text">
                  You do <strong>not</strong> enter your UPI PIN to receive an ordinary incoming payment. Entering your UPI PIN in a payment app authorises a debit or payment. Always read the screen before approving.
                </p>
              </div>
            </div>

            <div class="cover-footer">
              <span>INFRAUD Security Education Series</span>
              <span>Edition 2026 • 12 Pages</span>
            </div>
          </div>
        `;
      }
    },

    // Page 2: Contents & Mental Model
    {
      page: 2,
      title: "Contents & Mental Model",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>INFRAUD.ORG • SAFETY ACADEMY</span>
              <span>PAGE 02</span>
            </div>

            <span class="book-chapter-tag">OVERVIEW</span>
            <h2 class="book-page-title">Table of Contents</h2>
            <p class="book-page-subtitle">Your structured learning roadmap</p>

            <table style="width:100%; border-collapse:collapse; margin-bottom: 22px; font-size: 0.8125rem;">
              <thead>
                <tr style="border-bottom: 2px solid #E8EBF3; text-align: left; color: #4B5570;">
                  <th style="padding: 8px 0; font-weight: 700;">SECTION</th>
                  <th style="padding: 8px 0; font-weight: 700;">FOCUS AREA</th>
                  <th style="padding: 8px 0; text-align: right; font-weight: 700;">PAGE</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(3)">
                  <td style="padding: 9px 0; font-weight: 700; color: #2563EB;">Lesson 1</td>
                  <td style="padding: 9px 0;">UPI Basics: Paying vs Receiving & PIN Rules</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">03</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(4)">
                  <td style="padding: 9px 0; font-weight: 700; color: #2563EB;">Lesson 2</td>
                  <td style="padding: 9px 0;">Scam Patterns: Marketplace, Refunds & Pressure</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">04–05</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(6)">
                  <td style="padding: 9px 0; font-weight: 700; color: #2563EB;">Lesson 3</td>
                  <td style="padding: 9px 0;">Safe Payment Habits: The 5-Step Check & Mandates</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">06–07</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(8)">
                  <td style="padding: 9px 0; font-weight: 700; color: #2563EB;">Lesson 4</td>
                  <td style="padding: 9px 0;">Incident Protocol: 1930 Helpline & Golden Hour Actions</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">08–09</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(10)">
                  <td style="padding: 9px 0; font-weight: 700; color: #2563EB;">Quick Reference</td>
                  <td style="padding: 9px 0;">Interactive Before-You-Pay Checklist & 7 Red Flags</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">10</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(11)">
                  <td style="padding: 9px 0; font-weight: 700; color: #2563EB;">Knowledge Check</td>
                  <td style="padding: 9px 0;">Interactive 6-Question Quiz with Instant Feedback</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">11</td>
                </tr>
                <tr style="cursor: pointer;" onclick="window.bookReader.goToPage(12)">
                  <td style="padding: 9px 0; font-weight: 700; color: #2563EB;">Glossary & Sources</td>
                  <td style="padding: 9px 0;">Official NPCI/RBI Guidance & Emergency Contacts</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">12</td>
                </tr>
              </tbody>
            </table>

            <div class="book-banner-rule">
              <div class="book-banner-rule-title">A SIMPLE MENTAL MODEL</div>
              <p class="book-banner-rule-text">
                When you pay someone, you authorise money to leave your account. When someone pays you, money arrives directly as a bank credit. 
                A request asking you to approve or enter a PIN is <strong>never</strong> proof that money is being sent to you.
              </p>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 2</span>
            </div>
          </div>
        `;
      }
    },

    // Page 3: Lesson 1 - UPI Basics
    {
      page: 3,
      title: "Lesson 1: UPI Basics",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>LESSON 1 | UPI BASICS</span>
              <span>PAGE 03</span>
            </div>

            <span class="book-chapter-tag">LESSON 1</span>
            <h2 class="book-page-title">Paying vs. Receiving Money</h2>
            <p class="book-page-subtitle">The mechanics of instant payments</p>

            <p class="book-p">
              UPI (Unified Payments Interface) lets people transfer money instantly between bank accounts. It is convenient, but payment features can be manipulated by scammers to pressure people into approving payments they did not intend to make.
            </p>

            <h3 class="book-sec-title">1.1 When you pay someone</h3>
            <p class="book-p">
              You choose the recipient, enter or confirm the amount, review details shown by your UPI app, and authorise the payment using your secret UPI PIN. Money is debited from your account immediately.
            </p>

            <div class="book-banner-warning">
              <div class="book-banner-warning-title">PAUSE BEFORE ENTERING YOUR PIN</div>
              <p class="book-banner-warning-text">
                Check the recipient name, UPI ID, amount, and purpose shown on the payment screen. If anything is unexpected, <strong>cancel immediately</strong>. Never rely solely on a screenshot sent by another person.
              </p>
            </div>

            <h3 class="book-sec-title">1.2 When someone sends you money</h3>
            <p class="book-p">
              For an ordinary incoming UPI payment, <strong>you do not need to enter your UPI PIN</strong>. Check your bank app or UPI transaction history directly for a credit. Never treat a SMS, screenshot, or phone call as proof.
            </p>

            <h3 class="book-sec-title">1.3 What is a Collect Request?</h3>
            <p class="book-p">
              A collect request asks <em>you</em> to approve a payment to the requester. Scammers fraudulently describe this as <em>"accept to receive money"</em>, <em>"claim your cashback"</em>, or <em>"approve your refund"</em>. The wording in a message does not change what the payment screen actually executes!
            </p>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 3</span>
            </div>
          </div>
        `;
      }
    },

    // Page 4: Lesson 2 - Scam Patterns
    {
      page: 4,
      title: "Lesson 2: Scam Patterns",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>LESSON 2 | SCAM PATTERNS</span>
              <span>PAGE 04</span>
            </div>

            <span class="book-chapter-tag">LESSON 2</span>
            <h2 class="book-page-title">How UPI Scams Work</h2>
            <p class="book-page-subtitle">Recognising common fraud blueprints</p>

            <p class="book-p">
              Most request scams combine a believable scenario with emotional pressure. Scammers aim to make you act before you read the payment screen carefully.
            </p>

            <div class="scam-scenario-card">
              <div class="scam-scenario-title">
                <span class="scam-tag-danger">SCENARIO 1</span> Fake Buyer / Marketplace Scam
              </div>
              <div class="scam-detail-row"><strong>How it works:</strong> A buyer for your OLX/Facebook listing sends a collect request or QR code claiming it will transfer the deposit to you.</div>
              <div class="scam-detail-row"><strong>Safer response:</strong> A buyer never needs your PIN to pay you. Check incoming credits in your bank statement.</div>
            </div>

            <div class="scam-scenario-card">
              <div class="scam-scenario-title">
                <span class="scam-tag-danger">SCENARIO 2</span> Fake Refund or Cashback
              </div>
              <div class="scam-detail-row"><strong>How it works:</strong> Caller claims an order failed and sends a request to "claim your refund".</div>
              <div class="scam-detail-row"><strong>Safer response:</strong> Real refunds are credited automatically without entering a PIN.</div>
            </div>

            <div class="scam-scenario-card">
              <div class="scam-scenario-title">
                <span class="scam-tag-danger">SCENARIO 3</span> QR-Code "Receive Money" Trick
              </div>
              <div class="scam-detail-row"><strong>How it works:</strong> Caller sends a QR code stating: "Scan this to receive ₹5,000".</div>
              <div class="scam-detail-row"><strong>Safer response:</strong> Scanning a QR initiates an <em>outgoing</em> payment. Never scan to receive money.</div>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 4</span>
            </div>
          </div>
        `;
      }
    },

    // Page 5: Lesson 2 Continued - Pressure Tactics
    {
      page: 5,
      title: "Lesson 2: Psychological Tactics",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>LESSON 2 (CONT.) | PRESSURE TACTICS</span>
              <span>PAGE 05</span>
            </div>

            <span class="book-chapter-tag">SOCIAL ENGINEERING</span>
            <h2 class="book-page-title">Psychological Weaponry</h2>
            <p class="book-page-subtitle">The emotional triggers fraudsters exploit</p>

            <div class="book-steps-list">
              <div class="book-step-item">
                <div class="book-step-num">⚡</div>
                <div class="book-step-content">
                  <h4>Artificial Urgency</h4>
                  <p>"Approve within 2 minutes or your payment will be cancelled / account frozen."</p>
                </div>
              </div>
              <div class="book-step-item">
                <div class="book-step-num">🏛️</div>
                <div class="book-step-content">
                  <h4>Impersonated Authority</h4>
                  <p>"I am calling from your bank's fraud detection division / cyber police headquarters."</p>
                </div>
              </div>
              <div class="book-step-item">
                <div class="book-step-num">🤫</div>
                <div class="book-step-content">
                  <h4>Demanded Secrecy</h4>
                  <p>"Do not tell anyone or disconnect the call; this is confidential security verification."</p>
                </div>
              </div>
              <div class="book-step-item">
                <div class="book-step-num">🌀</div>
                <div class="book-step-content">
                  <h4>Continuous Cognitive Overload</h4>
                  <p>Keeping you on an active phone call while giving rapid commands so you don't read screens.</p>
                </div>
              </div>
              <div class="book-step-item">
                <div class="book-step-num">🪙</div>
                <div class="book-step-content">
                  <h4>The Small Test Payment Trap</h4>
                  <p>Asking for ₹1 or ₹5 first to build false trust, then triggering a large debit request.</p>
                </div>
              </div>
            </div>

            <div class="book-banner-rule">
              <div class="book-banner-rule-title">A GOLDEN GROUND RULE</div>
              <p class="book-banner-rule-text">
                <strong>A genuine organization can wait while you verify independently.</strong> If someone becomes aggressive, threatens legal action, or forbids you from hanging up, disconnect immediately.
              </p>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 5</span>
            </div>
          </div>
        `;
      }
    },

    // Page 6: Lesson 3 - Safe Payment Habits
    {
      page: 6,
      title: "Lesson 3: Safe Habits",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>LESSON 3 | SAFE HABITS</span>
              <span>PAGE 06</span>
            </div>

            <span class="book-chapter-tag">LESSON 3</span>
            <h2 class="book-page-title">The 5-Step Payment Check</h2>
            <p class="book-page-subtitle">Your bulletproof defense routine</p>

            <p class="book-p">
              Use this routine every single time you encounter a payment request, especially involving unfamiliar individuals or sudden emergencies.
            </p>

            <div class="book-steps-list">
              <div class="book-step-item">
                <div class="book-step-num">1</div>
                <div class="book-step-content">
                  <h4>STOP & BREATHE</h4>
                  <p>Refuse to be rushed. Disconnect any active call or close chat windows if pressured.</p>
                </div>
              </div>
              <div class="book-step-item">
                <div class="book-step-num">2</div>
                <div class="book-step-content">
                  <h4>READ THE APP SCREEN</h4>
                  <p>Look at the exact wording: Does it say "Paying", "Collect Request", or "Setting Mandate"?</p>
                </div>
              </div>
              <div class="book-step-item">
                <div class="book-step-num">3</div>
                <div class="book-step-content">
                  <h4>CHECK THE RECIPIENT</h4>
                  <p>Verify the actual displayed VPA and name, not merely an unverified display alias.</p>
                </div>
              </div>
              <div class="book-step-item">
                <div class="book-step-num">4</div>
                <div class="book-step-content">
                  <h4>CONFIRM THE AMOUNT</h4>
                  <p>Verify every single digit. Look out for hidden recurring mandates or inflated sums.</p>
                </div>
              </div>
              <div class="book-step-item">
                <div class="book-step-num">5</div>
                <div class="book-step-content">
                  <h4>DECIDE OR CANCEL</h4>
                  <p>If you did not initiate this payment, tap <strong>DECLINE</strong>. It costs ₹0 to be safe.</p>
                </div>
              </div>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 6</span>
            </div>
          </div>
        `;
      }
    },

    // Page 7: Lesson 3 Continued - Mandates & Safe Habits
    {
      page: 7,
      title: "Lesson 3: Mandates & Habits",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>LESSON 3 (CONT.) | MANDATES</span>
              <span>PAGE 07</span>
            </div>

            <span class="book-chapter-tag">ADVANCED CAUTION</span>
            <h2 class="book-page-title">Mandates & Autopay Traps</h2>
            <p class="book-page-subtitle">Protecting against recurring recurring drains</p>

            <div class="book-banner-danger">
              <div class="book-banner-danger-title">BE CAREFUL WITH MANDATES</div>
              <p class="book-banner-danger-text">
                A UPI mandate authorises future automatic debits without requiring a PIN each time. Review frequency, amount limit, and validity period. <strong>Never approve a mandate just to receive money!</strong>
              </p>
            </div>

            <h3 class="book-sec-title">7 Essential Digital Hygiene Rules</h3>
            <ul style="padding-left: 20px; font-size: 0.84375rem; color: #1E2742; line-height: 1.6;">
              <li style="margin-bottom: 6px;"><strong>Keep apps updated:</strong> Install regular security patches for your OS and UPI apps.</li>
              <li style="margin-bottom: 6px;"><strong>Enable instant SMS:</strong> Ensure bank SMS alerts are active so any debit triggers immediate notification.</li>
              <li style="margin-bottom: 6px;"><strong>Never install screen-sharing tools:</strong> Never download AnyDesk, TeamViewer, or RustDesk on a caller's request.</li>
              <li style="margin-bottom: 6px;"><strong>Verify contacts:</strong> Accounts get hacked; even if a message comes from a friend, call them to confirm.</li>
              <li style="margin-bottom: 6px;"><strong>Avoid search engine numbers:</strong> Scammers put fake customer support numbers on Google Maps and search results.</li>
              <li style="margin-bottom: 6px;"><strong>Protect lockscreens:</strong> Use strong biometric/PIN security on your device and SIM card.</li>
              <li style="margin-bottom: 6px;"><strong>Keep evidence private:</strong> Never post transaction screenshots or QR codes on social media.</li>
            </ul>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 7</span>
            </div>
          </div>
        `;
      }
    },

    // Page 8: Lesson 4 - Incident Response
    {
      page: 8,
      title: "Lesson 4: Incident Response",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>LESSON 4 | INCIDENT RESPONSE</span>
              <span>PAGE 08</span>
            </div>

            <span class="book-chapter-tag">EMERGENCY PROTOCOL</span>
            <h2 class="book-page-title">Immediate Fraud Response</h2>
            <p class="book-page-subtitle">The Golden Hour Action Plan</p>

            <p class="book-p">
              If you approved a suspicious request or notice an unauthorised transaction, <strong>every minute counts</strong>. Acting within the first 1 to 2 hours maximizes the chance of freezing the funds.
            </p>

            <div class="helpline-emergency-banner">
              <div class="helpline-left">
                <h4>NATIONAL CYBER CRIME HELPLINE</h4>
                <p>Call immediately for financial fraud across India</p>
              </div>
              <a href="tel:1930" class="helpline-call-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Call 1930
              </a>
            </div>

            <h3 class="book-sec-title">Step-by-Step Response Protocol</h3>
            <ol style="padding-left: 20px; font-size: 0.84375rem; color: #1E2742; line-height: 1.55;">
              <li style="margin-bottom: 6px;"><strong>Contact your bank immediately:</strong> Freeze your UPI facility and report the UTR number.</li>
              <li style="margin-bottom: 6px;"><strong>Dial 1930 Helpline:</strong> Provide beneficiary UPI details to initiate inter-bank freeze.</li>
              <li style="margin-bottom: 6px;"><strong>File on Cybercrime Portal:</strong> Lodge official report at <a href="https://cybercrime.gov.in" target="_blank" style="color:#2563EB; font-weight:600;">cybercrime.gov.in</a> and retain acknowledgement ID.</li>
              <li style="margin-bottom: 6px;"><strong>Raise in-app dispute:</strong> Report transaction directly within Google Pay, PhonePe, or Paytm.</li>
              <li style="margin-bottom: 6px;"><strong>Preserve forensic evidence:</strong> Take screenshots of chats, phone numbers, and payment receipts.</li>
            </ol>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 8</span>
            </div>
          </div>
        `;
      }
    },

    // Page 9: Lesson 4 Continued - Evidence & Traps
    {
      page: 9,
      title: "Lesson 4: Evidence & Pitfalls",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>LESSON 4 (CONT.) | EVIDENCE</span>
              <span>PAGE 09</span>
            </div>

            <span class="book-chapter-tag">RECOVERY PREPARATION</span>
            <h2 class="book-page-title">Evidence & Fatal Pitfalls</h2>
            <p class="book-page-subtitle">What to document and secondary traps to avoid</p>

            <h3 class="book-sec-title">Information to Keep Ready</h3>
            <div style="background:#F4F5FA; border:1px solid #E8EBF3; border-radius:10px; padding:12px; margin-bottom:14px; font-size:0.8125rem;">
              <div style="margin-bottom:4px;">✔ <strong>Transaction ID / UTR</strong> and timestamp from bank SMS.</div>
              <div style="margin-bottom:4px;">✔ <strong>Recipient UPI ID / VPA</strong> and mobile number used by scammer.</div>
              <div style="margin-bottom:4px;">✔ <strong>Chat transcripts & call logs</strong> showing initial contact.</div>
              <div style="margin-bottom:4px;">✔ <strong>Bank complaint reference</strong> and 1930 portal ticket ID.</div>
            </div>

            <h3 class="book-sec-title" style="color: #B91C1C;">What NOT To Do After Fraud</h3>
            <div class="book-steps-list">
              <div class="book-step-item" style="border-left: 3px solid #EF4444;">
                <div class="book-step-content">
                  <h4 style="color:#B91C1C;">🚫 Beware "Money Recovery" Agents</h4>
                  <p>Never pay anyone on Telegram, Instagram, or Twitter claiming they can hack or recover your lost funds for a fee. They are secondary scammers.</p>
                </div>
              </div>
              <div class="book-step-item" style="border-left: 3px solid #EF4444;">
                <div class="book-step-content">
                  <h4 style="color:#B91C1C;">🚫 Do Not Delete Chats or History</h4>
                  <p>Never delete call logs or chat history before making secure backup copies.</p>
                </div>
              </div>
              <div class="book-step-item" style="border-left: 3px solid #EF4444;">
                <div class="book-step-content">
                  <h4 style="color:#B91C1C;">🚫 Do Not Negotiate with Scammers</h4>
                  <p>Do not waste valuable time arguing with scammers while they cash out funds via mule accounts.</p>
                </div>
              </div>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 9</span>
            </div>
          </div>
        `;
      }
    },

    // Page 10: Quick Reference & Interactive Checklist
    {
      page: 10,
      title: "Interactive Checklist",
      render: function () {
        const checkedCount = checklistState.filter(Boolean).length;
        const progressPct = Math.round((checkedCount / 6) * 100);

        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>QUICK REFERENCE | CHECKLIST</span>
              <span>PAGE 10</span>
            </div>

            <span class="book-chapter-tag">INTERACTIVE TOOL</span>
            <h2 class="book-page-title">Before-You-Pay Checklist</h2>
            <p class="book-page-subtitle">Verify every safety barrier before entering your PIN</p>

            <div class="checklist-meter-box">
              <div class="meter-info">Safety Readiness: <span id="chk-meter-label" style="color: #2563EB;">${checkedCount}/6 verified</span></div>
              <div class="meter-track">
                <div class="meter-fill" id="chk-meter-fill" style="width: ${progressPct}%;"></div>
              </div>
            </div>

            <div class="checklist-items-grid">
              ${[
                { q: "Did I personally initiate this transaction?", a: "Stop. Never approve an unexpected collect request." },
                { q: "Do I recognise and independently trust the recipient?", a: "Verify via phone call or known channels before sending." },
                { q: "Does the displayed amount match what I intended?", a: "Cancel immediately if the amount is inflated or unclear." },
                { q: "Does the screen clearly describe a debit action?", a: "Understand what the app is doing before authorising." },
                { q: "Am I free from artificial rush or secrecy pressure?", a: "If rushed or told to keep quiet, terminate the transaction." },
                { q: "Has anyone asked me for my PIN or OTP on phone?", a: "Never share PINs or OTPs with anyone, even bank staff." }
              ].map((item, idx) => `
                <div class="check-item-card ${checklistState[idx] ? 'checked' : ''}" onclick="window.bookReader.toggleCheck(${idx})">
                  <div class="check-box-visual">${checklistState[idx] ? '✓' : ''}</div>
                  <div class="check-text-content">
                    <div class="check-question">${item.q}</div>
                    <div class="check-action-guidance">${item.a}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="book-banner-danger" style="margin: 8px 0; padding: 10px 14px;">
              <div class="book-banner-danger-title">7 FATAL RED FLAGS</div>
              <p class="book-banner-danger-text" style="font-size: 0.78125rem;">
                "Enter PIN to receive" • "Scan QR to get cashback" • "Share OTP for verification" • "Install AnyDesk app" • "Account will be blocked in 10 mins".
              </p>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 10</span>
            </div>
          </div>
        `;
      }
    },

    // Page 11: Interactive Knowledge Check Quiz
    {
      page: 11,
      title: "Interactive Quiz",
      render: function () {
        const quizData = [
          {
            id: 'q1',
            text: "1. A stranger says you must enter your UPI PIN to receive ₹2,000.",
            options: [
              { key: 'A', text: "Enter the PIN quickly" },
              { key: 'B', text: "Decline and verify; PIN is never needed to receive money", correct: true },
              { key: 'C', text: "Share the PIN on a phone call" }
            ],
            explanation: "A UPI PIN is solely used to authorise debits/payments from your account. Receiving money requires no PIN."
          },
          {
            id: 'q2',
            text: "2. You receive a collect request from an unknown UPI ID. What is it asking?",
            options: [
              { key: 'A', text: "Approve a payment from your account to the requester", correct: true },
              { key: 'B', text: "Confirm that money has arrived in your account" },
              { key: 'C', text: "Update your linked mobile number" }
            ],
            explanation: "A collect request is a payment debit request initiated by the requester. Approving it transfers money out."
          },
          {
            id: 'q3',
            text: "3. A buyer sends a QR code claiming scanning it credits your account.",
            options: [
              { key: 'A', text: "Scan and enter your secret PIN" },
              { key: 'B', text: "Ask them to send payment normally and verify credit in bank app", correct: true },
              { key: 'C', text: "Share your OTP to complete transaction" }
            ],
            explanation: "Scanning a QR code opens an outgoing debit flow. Never scan QR codes to receive funds."
          },
          {
            id: 'q4',
            text: "4. You notice an unauthorised UPI debit. What is the immediate first action?",
            options: [
              { key: 'A', text: "Wait a week to see if it reverses" },
              { key: 'B', text: "Contact your bank immediately and dial 1930 / cybercrime.gov.in", correct: true },
              { key: 'C', text: "Pay a recovery specialist on Instagram" }
            ],
            explanation: "Acting in the Golden Hour via official banking and 1930 helpline channels offers the only chance of freezing stolen funds."
          },
          {
            id: 'q5',
            text: "5. A caller claims to be bank fraud prevention and asks for your UPI PIN.",
            options: [
              { key: 'A', text: "Share it if they verify your full name" },
              { key: 'B', text: "Share only the first 2 digits" },
              { key: 'C', text: "Refuse immediately and contact your bank via official card number", correct: true }
            ],
            explanation: "No legitimate bank or police officer will ever ask for your UPI PIN or OTP under any circumstance."
          },
          {
            id: 'q6',
            text: "6. A payment screen displays a different amount than you intended.",
            options: [
              { key: 'A', text: "Cancel immediately and investigate", correct: true },
              { key: 'B', text: "Approve because the other party is in a rush" },
              { key: 'C', text: "Ignore the difference and proceed" }
            ],
            explanation: "Never authorise any transaction where the amount or payee differs from your intention."
          }
        ];

        let correctCount = 0;
        quizData.forEach(q => {
          if (quizAnswers[q.id] && q.options.find(o => o.key === quizAnswers[q.id])?.correct) {
            correctCount++;
          }
        });

        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>KNOWLEDGE CHECK | QUIZ</span>
              <span>PAGE 11</span>
            </div>

            <span class="book-chapter-tag">EXAMINATION</span>
            <h2 class="book-page-title">Safety Knowledge Check</h2>
            <p class="book-page-subtitle">Test your ability to spot real-world fraud</p>

            <div class="quiz-score-banner">
              <div class="quiz-score-text">
                Your Score: <strong style="color: #2563EB;">${correctCount} / 6 Correct</strong>
                ${correctCount === 6 ? ' 🏆 Perfect Score!' : ''}
              </div>
              <button class="quiz-reset-btn" onclick="window.bookReader.resetQuiz()">Reset Quiz</button>
            </div>

            <div class="quiz-container-inner" style="display:flex; flex-direction:column; gap:8px;">
              ${quizData.map(q => {
                const userChoice = quizAnswers[q.id];
                const answered = !!userChoice;
                return `
                  <div class="quiz-question-block">
                    <div class="quiz-q-title">${q.text}</div>
                    <div class="quiz-options-list">
                      ${q.options.map(opt => {
                        let btnClass = '';
                        if (answered) {
                          if (opt.correct) btnClass = 'correct';
                          else if (opt.key === userChoice) btnClass = 'wrong';
                        }
                        return `
                          <button class="quiz-opt-btn ${btnClass}" 
                                  onclick="window.bookReader.answerQuiz('${q.id}', '${opt.key}')"
                                  ${answered ? 'disabled' : ''}>
                            <strong>${opt.key}.</strong> ${opt.text}
                          </button>
                        `;
                      }).join('')}
                    </div>
                    <div class="quiz-explanation-box ${answered ? 'visible' : ''}">
                      💡 <strong>Rationale:</strong> ${q.explanation}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 11</span>
            </div>
          </div>
        `;
      }
    },

    // Page 12: Glossary & Official Sources
    {
      page: 12,
      title: "Glossary & Sources",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left" style="border-right: none;">
            <div class="page-running-head">
              <span>GLOSSARY & SOURCES</span>
              <span>PAGE 12</span>
            </div>

            <span class="book-chapter-tag">REFERENCE</span>
            <h2 class="book-page-title">Glossary & Official Helplines</h2>
            <p class="book-page-subtitle">Verified institutional contacts</p>

            <div class="glossary-card-grid">
              <div class="glossary-item">
                <div class="glossary-term">UPI</div>
                <p class="glossary-def">Instant real-time payment protocol operated by NPCI for inter-bank transfers.</p>
              </div>
              <div class="glossary-item">
                <div class="glossary-term">UPI PIN</div>
                <p class="glossary-def">Secret 4 or 6-digit authentication credential for debits. Never share with anyone.</p>
              </div>
              <div class="glossary-item">
                <div class="glossary-term">VPA / UPI ID</div>
                <p class="glossary-def">Virtual Payment Address (e.g., name@okhdfcbank) linking to your bank account.</p>
              </div>
              <div class="glossary-item">
                <div class="glossary-term">Collect Request</div>
                <p class="glossary-def">Payer approval request that transfers money OUT from payer to recipient.</p>
              </div>
            </div>

            <h3 class="book-sec-title">Official Government & Banking Links</h3>
            <ul style="padding-left: 20px; font-size: 0.8125rem; color: #1E2742; line-height: 1.6; margin-bottom: 16px;">
              <li><strong>NPCI UPI Portal:</strong> <a href="https://www.npci.org.in/what-we-do/upi/faqs" target="_blank" style="color:#2563EB;">npci.org.in/what-we-do/upi/faqs</a></li>
              <li><strong>RBI Kehta Hai:</strong> <a href="https://rbikehtahai.rbi.org.in/safeguards-for-digital-banking.html" target="_blank" style="color:#2563EB;">rbikehtahai.rbi.org.in</a></li>
              <li><strong>National Cyber Crime Portal:</strong> <a href="https://cybercrime.gov.in" target="_blank" style="color:#2563EB;">cybercrime.gov.in</a></li>
              <li><strong>Report Suspect Identifier:</strong> <a href="https://cybercrime.gov.in/Webform/cyber_suspect.aspx" target="_blank" style="color:#2563EB;">cybercrime.gov.in/Webform/cyber_suspect.aspx</a></li>
            </ul>

            <div class="book-banner-rule" style="margin-top: 8px;">
              <div class="book-banner-rule-title">EDUCATIONAL DISCLAIMER</div>
              <p class="book-banner-rule-text" style="font-size: 0.78125rem;">
                This guide is published for public awareness. INFRAUD analysis does not constitute bank guarantee or liability assumption. Always confirm transactions through official banking channels.
              </p>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD UPI Safety Series</span>
              <span class="page-num-badge">Page 12</span>
            </div>
          </div>
        `;
      }
    }
  ];

  

  

  
  function getKycPrefaceHtml() {
    return `
      <div class="book-page-leaf book-page-left" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding: 48px; background: #F8FAFC;">
        <div style="width: 60px; height: 60px; border-radius: 16px; background: rgba(220,38,38,0.08); display:flex; align-items:center; justify-content:center; margin-bottom: 20px; color: #DC2626;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em; color: #DC2626; text-transform: uppercase; margin-bottom: 6px;">INFRAUD ACADEMY • INTERMEDIATE</div>
        <h3 style="font-size: 1.35rem; font-weight: 800; color: #0A0F1E; margin-bottom: 12px; letter-spacing:-0.02em;">Fake KYC Vectors Handbook</h3>
        <p style="font-size: 0.875rem; color: #4B5570; max-width: 320px; line-height: 1.6; margin-bottom: 24px;">
          An intermediate-level guide to spotting fake banking and telecom KYC messages, impersonation calls, malicious links, and identity-theft attempts.
        </p>
        <div style="display:inline-flex; align-items:center; gap:8px; padding: 6px 14px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; color: #DC2626;">
          <span>Edition 2026</span>
          <span>•</span>
          <span>5 Lessons &amp; Quiz</span>
        </div>
      </div>
    `;
  }

  function getKycCertificateHtml() {
    return `
      <div class="book-page-leaf book-page-right" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding: 48px; background: #F8FAFC;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #D1FAE5; color: #059669; display:flex; align-items:center; justify-content:center; margin-bottom: 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: #0A0F1E; margin-bottom: 6px;">Curriculum Completed</h3>
        <p style="font-size: 0.875rem; color: #4B5570; max-width: 300px; line-height: 1.6; margin-bottom: 20px;">
          You have reviewed all 5 lessons and safety exercises for Fake KYC Vectors. Never complete KYC from an unsolicited message or call.
        </p>
        <a href="/books/INFRAUD_Fake_KYC_Vectors_Safety_Guide.pdf" download class="book-control-btn book-control-btn-primary" style="background:#DC2626; border-color:#DC2626; padding: 10px 20px; font-size: 0.875rem;">
          Download Reference PDF
        </a>
      </div>
    `;
  }


  
  const kycQuizQuestions = [
    {
      id: 'kyc_q1',
      text: "1. You receive an SMS saying your bank account will be frozen today unless you update KYC through a link:",
      options: [
        { key: 'A', text: "Click immediately to save account" },
        { key: 'B', text: "Open bank's official app or contact the bank independently", correct: true },
        { key: 'C', text: "Reply with your account number" }
      ],
      explanation: "Independently verify the KYC requirement. Do not use an unsolicited link or phone number sent via message."
    },
    {
      id: 'kyc_q2',
      text: "2. A caller says they are from TRAI and your mobile number will be disconnected unless you share details:",
      options: [
        { key: 'A', text: "Share details over the phone" },
        { key: 'B', text: "Follow their link sent on WhatsApp" },
        { key: 'C', text: "End call and verify; TRAI never threatens disconnection", correct: true }
      ],
      explanation: "TRAI has stated it does not initiate mobile-disconnection threats to customers through messages or otherwise."
    },
    {
      id: 'kyc_q3',
      text: "3. A KYC website has a padlock and the bank logo. Is that proof it is genuine?",
      options: [
        { key: 'A', text: "Yes, padlock guarantees bank ownership" },
        { key: 'B', text: "No; verify the registered domain and use official channel", correct: true },
        { key: 'C', text: "Yes, if the page looks professional" }
      ],
      explanation: "HTTPS and logos do not prove ownership or legitimacy. Scammers acquire free SSL certificates in seconds."
    },
    {
      id: 'kyc_q4',
      text: "4. A person asks you to install an APK for KYC and grant SMS access:",
      options: [
        { key: 'A', text: "Install it if they stay on the call" },
        { key: 'B', text: "Do not install it; verify through the official provider", correct: true },
        { key: 'C', text: "Install it only after receiving an SMS" }
      ],
      explanation: "Do not install unknown apps or grant sensitive permissions like RECEIVE_SMS or Accessibility."
    },
    {
      id: 'kyc_q5',
      text: "5. You shared an OTP and then noticed an unexpected banking debit alert:",
      options: [
        { key: 'A', text: "Wait and see if money is returned" },
        { key: 'B', text: "Contact bank immediately to freeze account & call 1930", correct: true },
        { key: 'C', text: "Send another OTP to the caller" }
      ],
      explanation: "Contact the bank immediately to secure affected access, and report the financial fraud to 1930."
    },
    {
      id: 'kyc_q6',
      text: "6. You received a suspicious KYC message but did not click it. Which reporting route can be used?",
      options: [
        { key: 'A', text: "DoT Chakshu facility on Sanchar Saathi", correct: true },
        { key: 'B', text: "Send your PIN to the sender" },
        { key: 'C', text: "Install the app mentioned" }
      ],
      explanation: "Chakshu is the official Department of Telecommunications facility for reporting suspected fraudulent communications."
    },
    {
      id: 'kyc_q7',
      text: "7. Money was lost after a fake KYC call. What should you do?",
      options: [
        { key: 'A', text: "Pay a private recovery agent online" },
        { key: 'B', text: "Call 1930, report at cybercrime.gov.in, and inform bank", correct: true },
        { key: 'C', text: "Delete all messages and wait" }
      ],
      explanation: "Report promptly through 1930 and the official cybercrime portal, and immediately inform your bank."
    }
  ];

  const kycPagesData = [
    // Page 1: Cover Page
    {
      page: 1,
      title: "Cover",
      render: function () {
        return `
          <div class="book-cover-page book-page-leaf theme-kyc">
            <div class="cover-top-emblem">
              <div class="cover-brand-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                INFRAUD
              </div>
              <span class="cover-brand-pill pill-kyc">KYC Defense Guide</span>
            </div>

            <div class="cover-body-hero">
              <div class="cover-hero-tag tag-kyc">Official Curriculum Guide</div>
              <h1 class="cover-hero-title">Fake KYC Vectors</h1>
              <p class="cover-hero-desc">
                An intermediate-level guide to spotting fake banking and telecom KYC messages, impersonation calls, malicious links, and identity-theft attempts.
              </p>

              <div class="cover-pills-row">
                <div class="cover-meta-pill">
                  <span>LEVEL</span>
                  <strong>Intermediate</strong>
                </div>
                <div class="cover-meta-pill">
                  <span>CURRICULUM</span>
                  <strong>5 Lessons</strong>
                </div>
                <div class="cover-meta-pill">
                  <span>TOPIC</span>
                  <strong>KYC Safety</strong>
                </div>
              </div>

              <div class="cover-golden-rule-box rule-kyc">
                <div class="cover-golden-rule-title rule-title-kyc">★ THE MOST IMPORTANT RULE</div>
                <p class="cover-golden-rule-text">
                  Never complete KYC through an unsolicited link or a caller's instructions. Pause, independently contact the bank or telecom provider using its official app, website, branch, or published customer-care channel.
                </p>
              </div>
            </div>

            <div class="cover-footer-row">
              <span>INFRAUD Security Education Series</span>
              <span>Edition 2026 • 12 Pages</span>
            </div>
          </div>
        `;
      }
    },

    // Page 2: Contents & Decision Rule
    {
      page: 2,
      title: "Contents & Decision Rule",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>INFRAUD.ORG • SAFETY ACADEMY</span>
              <span>PAGE 02</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">OVERVIEW</span>
            <h2 class="book-page-title">Table of Contents</h2>
            <p class="book-page-subtitle">Your structured learning roadmap</p>

            <table style="width:100%; border-collapse:collapse; margin-bottom: 22px; font-size: 0.8125rem;">
              <thead>
                <tr style="border-bottom: 2px solid #E8EBF3; text-align: left; color: #4B5570;">
                  <th style="padding: 8px 0; font-weight: 700;">SECTION</th>
                  <th style="padding: 8px 0; font-weight: 700;">FOCUS AREA</th>
                  <th style="padding: 8px 0; text-align: right; font-weight: 700;">PAGE</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(3)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Lesson 1</td>
                  <td style="padding: 9px 0;">KYC Fundamentals: What is Real and What is Not</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">03</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(4)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Lesson 2</td>
                  <td style="padding: 9px 0;">Fake KYC Vectors: SMS, Calls, WhatsApp, and APKs</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">04</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(5)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Lesson 3</td>
                  <td style="padding: 9px 0;">Link, Sender, and Malicious App Inspection Skills</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">05</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(6)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Lesson 4</td>
                  <td style="padding: 9px 0;">Identity Theft, Document Misuse &amp; Safe Masking</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">06</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(7)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Lesson 5</td>
                  <td style="padding: 9px 0;">Incident Response: Chakshu Reporting &amp; 1930</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">07</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(8)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Quick Reference</td>
                  <td style="padding: 9px 0;">Interactive Fake KYC Verification Checklist</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">08</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(9)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Knowledge Check</td>
                  <td style="padding: 9px 0;">Interactive 7-Question Quiz with Instant Feedback</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">09–10</td>
                </tr>
                <tr style="border-bottom: 1px solid #F4F5FA; cursor: pointer;" onclick="window.bookReader.goToPage(11)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Case Studies</td>
                  <td style="padding: 9px 0;">Real Threat Analysis &amp; 4-Step Defense Flowchart</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">11</td>
                </tr>
                <tr style="cursor: pointer;" onclick="window.bookReader.goToPage(12)">
                  <td style="padding: 9px 0; font-weight: 700; color: #DC2626;">Glossary</td>
                  <td style="padding: 9px 0;">Official RBI, TRAI &amp; DoT Sanchar Saathi References</td>
                  <td style="padding: 9px 0; text-align: right; font-weight: 600; color: #9AA3B8;">12</td>
                </tr>
              </tbody>
            </table>

            <div class="book-banner-rule" style="border-left-color: #DC2626;">
              <div class="book-banner-rule-title" style="color: #DC2626;">A SIMPLE DECISION RULE</div>
              <p class="book-banner-rule-text">
                Do not trust the message's phone number, link, logo, sender name, or urgency claim as proof. 
                Verify the request independently through an official channel you locate yourself.
              </p>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 2</span>
            </div>
          </div>
        `;
      }
    },

    // Page 3: Lesson 1 - KYC Fundamentals
    {
      page: 3,
      title: "Lesson 1: KYC Fundamentals",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>LESSON 1 | KYC FUNDAMENTALS</span>
              <span>PAGE 03</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">LESSON 1</span>
            <h2 class="book-page-title">What is Real KYC?</h2>
            <p class="book-page-subtitle">Understanding the genuine compliance process vs. scam pretexts</p>

            <p class="book-p">
              KYC means <strong>Know Your Customer</strong>. Banks and regulated entities use it to establish and periodically update customer identity information. Depending on the institution, it involves identity/address details, official documents, or approved video/biometric verification.
            </p>

            <h3 class="book-sec-title">1.1 Why institutions request KYC</h3>
            <p class="book-p">
              KYC helps reduce money laundering, identity fraud, and mule accounts. KYC may be required when opening an account, changing operational details, or when periodic updating is due under RBI norms.
            </p>

            <div class="book-banner-warning" style="border-left-color: #DC2626;">
              <div class="book-banner-warning-title" style="color: #B91C1C;">PERIODIC KYC UPDATES: VERIFY THE ROUTE</div>
              <p class="book-banner-warning-text">
                RBI guidance states regulated entities give advance intimation before periodic KYC is due. However, <strong>RBI specifically cautions customers to exercise utmost caution with SMS or email links</strong> claiming to complete KYC updating. A genuine KYC requirement does not make an unsolicited message genuine.
              </p>
            </div>

            <h3 class="book-sec-title">1.2 Warning signs that must make you pause</h3>
            <p class="book-p">
              Legitimate KYC never threatens account blocking within minutes, never demands your secret UPI PIN, OTP, or passwords, and never requires installing remote-access tools.
            </p>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 3</span>
            </div>
          </div>
        `;
      }
    },

    // Page 4: Lesson 2 - Fake KYC Vectors
    {
      page: 4,
      title: "Lesson 2: Fake KYC Vectors",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>LESSON 2 | FAKE KYC VECTORS</span>
              <span>PAGE 04</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">LESSON 2</span>
            <h2 class="book-page-title">How Scammers Approach You</h2>
            <p class="book-page-subtitle">Recognising the four primary attack routes</p>

            <div class="book-banner-danger" style="margin-bottom: 12px; border-left-color: #DC2626;">
              <div class="book-banner-danger-title" style="color: #991B1B;">VECTOR 1: SMS &amp; MESSAGING-APP TRAP</div>
              <p class="book-banner-danger-text">
                <strong>Typical lure:</strong> <em>"Dear customer, your bank account/SIM will be blocked today. Update re-KYC immediately: bit.ly/sbi-kyc"</em><br>
                <strong>Goal:</strong> Trick you into tapping the link and submitting netbanking passwords, OTPs, or debit card credentials on a spoofed portal.
              </p>
            </div>

            <div class="book-banner-warning" style="margin-bottom: 12px; border-left-color: #EA580C;">
              <div class="book-banner-warning-title" style="color: #9A3412;">VECTOR 2: IMPERSONATION VISHING CALLS</div>
              <p class="book-banner-warning-text">
                <strong>Typical lure:</strong> Callers claim to be from TRAI, bank fraud desk, or telecom operator. They use aggressive urgency and authoritative tone.<br>
                <strong>TRAI Clarification:</strong> TRAI has officially confirmed that it <strong>never initiates calls threatening mobile disconnection</strong> to consumers.
              </p>
            </div>

            <div class="book-banner-danger" style="border-left-color: #7C3AED;">
              <div class="book-banner-danger-title" style="color: #6D28D9;">VECTOR 3: MALICIOUS APK DOWNLOADS</div>
              <p class="book-banner-danger-text">
                <strong>Typical lure:</strong> <em>"Download our quick KYC support app to avoid branch visit."</em> The APK requests SMS reading permissions to intercept banking 2FA OTPs in real-time.
              </p>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 4</span>
            </div>
          </div>
        `;
      }
    },

    // Page 5: Lesson 3 - Inspection Skills
    {
      page: 5,
      title: "Lesson 3: Inspection Skills",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>LESSON 3 | INSPECTION SKILLS</span>
              <span>PAGE 05</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">LESSON 3</span>
            <h2 class="book-page-title">Check the Link, Sender &amp; App</h2>
            <p class="book-page-subtitle">Critical inspection techniques to unmask disguised threats</p>

            <h3 class="book-sec-title">3.1 Inspect the registered domain right-to-left</h3>
            <p class="book-p">
              Scammers create lookalike subdomains to deceive fast skimmers. Always look at the <strong>root domain</strong> immediately preceding the first single slash (<code>/</code>):
            </p>
            <div style="background:#F1F5F9; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 0.78125rem; color:#0A0F1E; margin: 8px 0 14px; border: 1px solid #CBD5E1;">
              https://sbi.co.in.kyc-verify-portal.online/update<br>
              <span style="color:#DC2626; font-weight:700;">✗ Fake! Root domain is kyc-verify-portal.online, NOT sbi.co.in!</span>
            </div>

            <h3 class="book-sec-title">3.2 Do not rely solely on HTTPS or official logos</h3>
            <p class="book-p">
              Scammers obtain free SSL certificates in seconds. The padlock icon only proves the connection is encrypted, <strong>never that the receiver is honest</strong>. Pixel-perfect logos and banking color schemes are easily copied.
            </p>

            <h3 class="book-sec-title">3.3 Android APK permission red flags</h3>
            <p class="book-p">
              Legitimate banks never distribute apps via WhatsApp or direct APK links. Beware of any app requesting <code>RECEIVE_SMS</code>, <code>READ_SMS</code>, or Accessibility Services.
            </p>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 5</span>
            </div>
          </div>
        `;
      }
    },

    // Page 6: Lesson 4 - Identity Protection
    {
      page: 6,
      title: "Lesson 4: Identity Protection",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>LESSON 4 | IDENTITY PROTECTION</span>
              <span>PAGE 06</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">LESSON 4</span>
            <h2 class="book-page-title">Protect Your Identity &amp; Documents</h2>
            <p class="book-page-subtitle">Safeguarding KYC documentation from mule accounts &amp; loan fraud</p>

            <h3 class="book-sec-title">4.1 High-value identity assets</h3>
            <p class="book-p">
              Criminals harvest Aadhaar scans, PAN numbers, and utility bills to open illegal mule accounts, obtain fraudulent credit lines, or register untraceable SIM cards.
            </p>

            <h3 class="book-sec-title">4.2 The Masked Aadhaar defense</h3>
            <p class="book-p">
              UIDAI provides official <strong>Masked Aadhaar</strong> (where the first 8 digits are hidden as <code>XXXX-XXXX-1234</code>). Masked Aadhaar is legally valid for all ordinary KYC verifications.
            </p>

            <div class="book-banner-warning" style="border-left-color: #16A34A; background: #F0FDF4;">
              <div class="book-banner-warning-title" style="color: #166534;">GOLDEN HABIT: PHYSICAL CROSS-MARKING</div>
              <p class="book-banner-warning-text" style="color: #14532D; font-size: 0.8125rem;">
                Whenever you submit a physical or PDF copy of an ID, draw two parallel diagonal lines across the document and write:<br>
                <em>"Submitted to [Bank Name] exclusively for [Account No] KYC update on [Date]. Not valid for any other purpose."</em>
              </p>
            </div>

            <h3 class="book-sec-title">4.3 Lock your biometrics</h3>
            <p class="book-p">
              Use the official mAadhaar app or UIDAI portal to lock your biometric authentication when not actively at a bank branch.
            </p>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 6</span>
            </div>
          </div>
        `;
      }
    },

    // Page 7: Lesson 5 - Response & Reporting
    {
      page: 7,
      title: "Lesson 5: Incident Protocol & 1930",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>LESSON 5 | INCIDENT RESPONSE</span>
              <span>PAGE 07</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">EMERGENCY PROTOCOL</span>
            <h2 class="book-page-title">Incident Protocol &amp; 1930</h2>
            <p class="book-page-subtitle">The Golden Hour Action Plan</p>

            <p class="book-p">
              If you shared credentials or notice an unauthorised debit, <strong>every minute counts</strong>. Acting within the first 1 to 2 hours maximizes the chance of freezing the funds.
            </p>

            <div class="helpline-emergency-banner" style="background:#FEF2F2; border-color:#FECACA;">
              <div class="helpline-left">
                <h4 style="color:#991B1B;">NATIONAL CYBER CRIME HELPLINE</h4>
                <p style="color:#7F1D1D;">Call immediately for financial fraud across India</p>
              </div>
              <a href="tel:1930" class="helpline-call-btn" style="background:#DC2626;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Call 1930
              </a>
            </div>

            <h3 class="book-sec-title">Severity-Based Action Tiers</h3>
            <ol style="padding-left: 20px; font-size: 0.8125rem; color: #1E2742; line-height: 1.55;">
              <li style="margin-bottom: 6px;"><strong>Suspicious message/call, no interaction:</strong> Report to DoT <strong>Chakshu facility</strong> (<a href="https://sancharsaathi.gov.in/sfc/" target="_blank" style="color:#DC2626; font-weight:700;">sancharsaathi.gov.in/sfc</a>) and 1909.</li>
              <li style="margin-bottom: 6px;"><strong>Shared KYC documents:</strong> Call your bank fraud line immediately. Ask for a protective hold or monitoring on your account.</li>
              <li style="margin-bottom: 6px;"><strong>Shared OTP, PIN, or password:</strong> Place an immediate operational debit freeze on all accounts and cards. Change netbanking login passwords.</li>
              <li style="margin-bottom: 4px;"><strong>Financial loss occurred:</strong> Call <strong>1930</strong> immediately and register an official complaint at <strong>cybercrime.gov.in</strong> with transaction UTRs.</li>
            </ol>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 7</span>
            </div>
          </div>
        `;
      }
    },

    // Page 8: Quick Reference - Checklist
    {
      page: 8,
      title: "Quick Reference: Verification Checklist",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>QUICK REFERENCE | CHECKLIST</span>
              <span>PAGE 08</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">INTERACTIVE TOOL</span>
            <h2 class="book-page-title">Fake KYC Verification Checklist</h2>
            <p class="book-page-subtitle">Verify every safety barrier before acting on any KYC communication</p>

            <div class="checklist-items-grid">
              ${[
                { q: "Was I expecting a KYC update?", a: "If not, treat the message cautiously and verify independently." },
                { q: "Can I confirm through official app/website/branch?", a: "Use a channel you locate yourself, not the link or number in the message." },
                { q: "Is the message threatening immediate closure?", a: "Pause. Urgency and threats are common scam pressure tactics." },
                { q: "Is there a link or number asking for credentials?", a: "Banks never ask for passwords, PIN, OTP, or CVV for KYC." },
                { q: "Am I being asked to install an APK or remote tool?", a: "Never install unknown apps or grant SMS/accessibility permissions." },
                { q: "Is the caller refusing independent verification?", a: "Legitimate bank/telecom officers never object to you calling back." },
                { q: "Have I masked or purpose-marked my documents?", a: "Cross-mark ID copies specifically for this single transaction." }
              ].map((item, idx) => `
                <div class="check-item-card ${kycChecklistState[idx] ? 'checked' : ''}" id="kyc-chk-item-${idx}" onclick="window.bookReader.toggleKycCheck(${idx})">
                  <div class="check-box-visual">${kycChecklistState[idx] ? '✓' : ''}</div>
                  <div class="check-text-content">
                    <div class="check-question">${item.q}</div>
                    <div class="check-action-guidance">${item.a}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="book-banner-danger" style="margin: 8px 0; padding: 10px 14px; border-left-color: #DC2626;">
              <div class="book-banner-danger-title" style="color: #991B1B;">7 FATAL RED FLAGS</div>
              <p class="book-banner-danger-text" style="font-size: 0.78125rem;">
                "Account/SIM blocked in 30 mins" • "Click link to update KYC" • "Install APK support app" • "Tell me the OTP" • "Share screen on AnyDesk" • "Send unmasked Aadhaar to WhatsApp" • "Do not contact bank"
              </p>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 8</span>
            </div>
          </div>
        `;
      }
    },

    // Page 9: Knowledge Check Quiz Part 1
    {
      page: 9,
      title: "Knowledge Check: Scenarios 1–3",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>KNOWLEDGE CHECK | QUIZ</span>
              <span>PAGE 09</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">INTERACTIVE QUIZ</span>
            <h2 class="book-page-title">Safety Scenarios (1–3)</h2>
            <p class="book-page-subtitle">Choose the safest response. Instant feedback provided.</p>

            <div class="quiz-container">
              ${kycQuizQuestions.slice(0, 3).map(q => {
                const userChoice = kycQuizAnswers[q.id];
                const answered = !!userChoice;
                return `
                  <div class="quiz-question-block" id="kyc-quiz-block-${q.id}">
                    <div class="quiz-q-title">${q.text}</div>
                    <div class="quiz-options-list">
                      ${q.options.map(opt => {
                        let btnClass = '';
                        if (answered) {
                          if (opt.correct) btnClass = 'correct';
                          else if (opt.key === userChoice) btnClass = 'wrong';
                        }
                        return `
                          <button class="quiz-opt-btn ${btnClass}" 
                                  onclick="window.bookReader.answerKycQuiz('${q.id}', '${opt.key}')"
                                  ${answered ? 'disabled' : ''}>
                            <strong>${opt.key}.</strong> ${opt.text}
                          </button>
                        `;
                      }).join('')}
                    </div>
                    <div class="quiz-explanation-box ${answered ? 'visible' : ''}">
                      💡 <strong>Rationale:</strong> ${q.explanation}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 9</span>
            </div>
          </div>
        `;
      }
    },

    // Page 10: Knowledge Check Quiz Part 2
    {
      page: 10,
      title: "Knowledge Check: Scenarios 4–7",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>KNOWLEDGE CHECK | QUIZ</span>
              <span>PAGE 10</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">INTERACTIVE QUIZ</span>
            <h2 class="book-page-title">Safety Scenarios (4–7)</h2>
            <p class="book-page-subtitle">Test incident reporting &amp; technical inspection</p>

            <div class="quiz-container">
              ${kycQuizQuestions.slice(3).map(q => {
                const userChoice = kycQuizAnswers[q.id];
                const answered = !!userChoice;
                return `
                  <div class="quiz-question-block" id="kyc-quiz-block-${q.id}">
                    <div class="quiz-q-title">${q.text}</div>
                    <div class="quiz-options-list">
                      ${q.options.map(opt => {
                        let btnClass = '';
                        if (answered) {
                          if (opt.correct) btnClass = 'correct';
                          else if (opt.key === userChoice) btnClass = 'wrong';
                        }
                        return `
                          <button class="quiz-opt-btn ${btnClass}" 
                                  onclick="window.bookReader.answerKycQuiz('${q.id}', '${opt.key}')"
                                  ${answered ? 'disabled' : ''}>
                            <strong>${opt.key}.</strong> ${opt.text}
                          </button>
                        `;
                      }).join('')}
                    </div>
                    <div class="quiz-explanation-box ${answered ? 'visible' : ''}">
                      💡 <strong>Rationale:</strong> ${q.explanation}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 10</span>
            </div>
          </div>
        `;
      }
    },

    // Page 11: Real-World Case Studies & Attack Breakdown
    {
      page: 11,
      title: "Case Analysis & Defense Flow",
      render: function () {
        return `
          <div class="book-page-leaf book-page-right">
            <div class="page-running-head">
              <span>CASE ANALYSIS | THREAT BREAKDOWN</span>
              <span>PAGE 11</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">CASE ANALYSIS</span>
            <h2 class="book-page-title">Real Threats &amp; Defense Flow</h2>
            <p class="book-page-subtitle">Dissecting real KYC attack blueprints</p>

            <div class="book-banner-danger" style="margin-bottom: 12px; border-left-color: #DC2626;">
              <div class="book-banner-danger-title" style="color: #991B1B;">CASE 1: THE "SIM BLOCK IN 24 HOURS" SMISH</div>
              <p class="book-banner-danger-text">
                Victim received SMS from spoofed header <code>VM-JI0KYC</code> stating SIM would deactivate at midnight. Tapping the link led to a cloned carrier login stealing credentials, followed by unauthorized SIM swap.
              </p>
            </div>

            <div class="book-banner-warning" style="margin-bottom: 14px; border-left-color: #EA580C;">
              <div class="book-banner-warning-title" style="color: #9A3412;">CASE 2: VIDEO KYC SCREEN-SHARING TRAP</div>
              <p class="book-banner-warning-text">
                Caller posed as relationship manager offering "Home Video KYC". Convinced victim to install screen-sharing software to "complete camera setup", intercepting netbanking 2FA passwords.
              </p>
            </div>

            <h3 class="book-sec-title">The 4-Step KYC Defense Flowchart</h3>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 14px; font-size:0.78125rem; line-height:1.6; color:#1E293B;">
              <strong>Step 1:</strong> Receive unexpected SMS/Call threatening block.<br>
              <strong>Step 2:</strong> <strong>PAUSE.</strong> Do NOT tap link or share OTP.<br>
              <strong>Step 3:</strong> Verify via official banking app or branch.<br>
              <strong>Step 4:</strong> Report scam headers to DoT Chakshu &amp; 1930.
            </div>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 11</span>
            </div>
          </div>
        `;
      }
    },

    // Page 12: Glossary & Official Sources
    {
      page: 12,
      title: "Glossary & Sources",
      render: function () {
        return `
          <div class="book-page-leaf book-page-left">
            <div class="page-running-head">
              <span>GLOSSARY &amp; SOURCES</span>
              <span>PAGE 12</span>
            </div>

            <span class="book-chapter-tag" style="color: #DC2626; background: #FEF2F2;">REFERENCES</span>
            <h2 class="book-page-title">Key Terms &amp; Helplines</h2>
            <p class="book-page-subtitle">Regulatory guidance and verified reporting authorities</p>

            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom: 14px; font-size:0.8125rem;">
              <div><strong>Chakshu:</strong> Official DoT facility on Sanchar Saathi for citizens to report suspected telecom fraud communications (SMS/Calls/WhatsApp).</div>
              <div><strong>Smishing:</strong> Phishing attacks carried out via SMS text messages to steal credentials or distribute trojanized APKs.</div>
              <div><strong>Periodic KYC:</strong> Scheduled mandatory customer data review by RBI regulated entities, performed through verified official banking routes only.</div>
            </div>

            <h3 class="book-sec-title">Emergency Contacts &amp; Portals</h3>
            <div style="border-left: 3px solid #DC2626; background: #FEF2F2; padding: 10px 14px; margin-bottom: 10px; border-radius: 8px;">
              <div style="font-weight: 800; color: #991B1B; font-size: 0.875rem;">1930 — National Cyber Crime Helpline</div>
              <p style="margin: 2px 0 0; color: #7F1D1D; font-size: 0.78125rem;">Immediate Golden Hour reporting for cyber financial fraud.</p>
            </div>

            <div style="font-size: 0.75rem; color: #4B5570; line-height: 1.6;">
              <strong>Official Direct Links:</strong><br>
              • Sanchar Saathi Chakshu: <a href="https://sancharsaathi.gov.in/sfc/" target="_blank" style="color:#DC2626; font-weight:700;">sancharsaathi.gov.in/sfc</a><br>
              • National Cyber Crime Portal: <a href="https://cybercrime.gov.in" target="_blank" style="color:#DC2626; font-weight:700;">cybercrime.gov.in</a><br>
              • RBI KYC Regulations: <a href="https://www.rbi.org.in" target="_blank" style="color:#DC2626; font-weight:700;">rbi.org.in</a>
            </div>

            <div class="page-running-foot">
              <span>INFRAUD KYC Safety Series</span>
              <span class="page-num-badge">Page 12</span>
            </div>
          </div>
        `;
      }
    }
  ];


  // --- Books Registry ---
  const booksRegistry = {
    upi: {
      id: 'upi',
      title: 'UPI Request Scams — Practical Safety Guide',
      seriesTag: 'INFRAUD Academy • Official Handbook',
      pdfUrl: '/books/INFRAUD_UPI_Request_Scams_Safety_Guide.pdf',
      pdfName: 'INFRAUD_UPI_Request_Scams_Safety_Guide.pdf',
      pages: upiPagesData,
      getPreface: getUpiPrefaceHtml,
      getCertificate: getUpiCertificateHtml,
      toc: [
        { page: 1, label: 'Page 1: Cover' },
        { page: 2, label: 'Page 2: Contents & Roadmap' },
        { page: 3, label: 'Page 3: Lesson 1 - UPI Basics' },
        { page: 4, label: 'Page 4: Lesson 2 - Scam Patterns' },
        { page: 5, label: 'Page 5: Lesson 2 - Pressure Tactics' },
        { page: 6, label: 'Page 6: Lesson 3 - 5-Step Check' },
        { page: 7, label: 'Page 7: Lesson 3 - Mandates & Habits' },
        { page: 8, label: 'Page 8: Lesson 4 - Emergency Response' },
        { page: 9, label: 'Page 9: Lesson 4 - Evidence & Traps' },
        { page: 10, label: 'Page 10: Interactive Checklist' },
        { page: 11, label: 'Page 11: Knowledge Check Quiz' },
        { page: 12, label: 'Page 12: Glossary & Helplines' }
      ]
    },
    kyc: {
      id: 'kyc',
      title: 'Fake KYC Vectors — Practical Safety Guide',
      seriesTag: 'INFRAUD Academy • Intermediate Curriculum',
      pdfUrl: '/books/INFRAUD_Fake_KYC_Vectors_Safety_Guide.pdf',
      pdfName: 'INFRAUD_Fake_KYC_Vectors_Safety_Guide.pdf',
      pages: kycPagesData,
      getPreface: getKycPrefaceHtml,
      getCertificate: getKycCertificateHtml,
      toc: [
        { page: 1, label: 'Page 1: Cover' },
        { page: 2, label: 'Page 2: Contents & Decision Rule' },
        { page: 3, label: 'Page 3: Lesson 1 - KYC Fundamentals' },
        { page: 4, label: 'Page 4: Lesson 2 - Fake KYC Vectors' },
        { page: 5, label: 'Page 5: Lesson 3 - Inspection Skills' },
        { page: 6, label: 'Page 6: Lesson 4 - Identity Protection' },
        { page: 7, label: 'Page 7: Lesson 5 - Response & Reporting' },
        { page: 8, label: 'Page 8: Quick Reference - Checklist' },
        { page: 9, label: 'Page 9: Knowledge Check (Scenarios 1-3)' },
        { page: 10, label: 'Page 10: Knowledge Check (Scenarios 4-7)' },
        { page: 11, label: 'Page 11: Case Analysis & Defense Flow' },
        { page: 12, label: 'Page 12: Glossary & Official Sources' }
      ]
    }
  };

  // --- Audio Synthesis Engine ---
  function playPageTurnSound() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1750;
      filter.Q.value = 1.3;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {}
  }

  // --- Page Flip HTML Builder ---
  function buildBookPagesHtml(bookId = currentBookId) {
    const book = booksRegistry[bookId] || booksRegistry.upi;
    let html = '';
    // Page 0: Cover (Hard)
    html += `<div class="st-page" data-density="hard">${book.pages[0].render()}</div>`;
    // Page 1: Preface (Soft)
    html += `<div class="st-page" data-density="soft">${book.getPreface()}</div>`;
    // Pages 2 to 12 (Soft)
    for (let i = 1; i < book.pages.length; i++) {
      html += `<div class="st-page" data-density="soft">${book.pages[i].render()}</div>`;
    }
    // Page 13: Certificate Back Cover (Hard)
    html += `<div class="st-page" data-density="hard">${book.getCertificate()}</div>`;
    return html;
  }

  function mapPageToIdx(pageNum) {
    if (pageNum <= 1) return 0;
    if (pageNum >= 12) return 12;
    return pageNum;
  }

  function mapIdxToPage(idx) {
    if (idx <= 0) return 1;
    if (idx >= 12) return 12;
    return idx;
  }

  function updateModalHeaderForBook(bookId) {
    const book = booksRegistry[bookId] || booksRegistry.upi;
    const titleEl = document.getElementById('book-modal-title');
    const seriesEl = document.getElementById('book-modal-series');
    const downloadBtn = document.getElementById('book-modal-download');
    const tocSelect = document.getElementById('book-toc-select');

    if (titleEl) titleEl.innerText = book.title;
    if (seriesEl) seriesEl.innerText = book.seriesTag;
    if (downloadBtn) {
      downloadBtn.href = book.pdfUrl;
      downloadBtn.setAttribute('download', book.pdfName);
    }
    if (tocSelect) {
      tocSelect.innerHTML = book.toc.map(item => `<option value="${item.page}">${item.label}</option>`).join('');
    }

    // Toggle red accent on Next/Prev buttons if KYC
    const btnNext = document.getElementById('dock-btn-next');
    if (btnNext) {
      btnNext.classList.toggle('btn-kyc-accent', bookId === 'kyc');
    }
  }

  function syncUI(idx) {
    const total = 12;
    const pageNum = mapIdxToPage(idx);

    // Update Scrubber
    const slider = document.getElementById('book-slider');
    if (slider) slider.value = pageNum;

    // Update Counter Label
    const counter = document.getElementById('book-counter');
    if (counter) {
      if (idx === 0) {
        counter.innerText = 'Cover (Page 1)';
      } else if (idx === 13) {
        counter.innerText = 'Curriculum Completed';
      } else if (window.innerWidth >= 860 && isSpread) {
        const leftP = idx;
        const rightP = Math.min(total, idx + 1);
        counter.innerText = `Pages ${leftP}-${rightP} of ${total}`;
      } else {
        counter.innerText = `Page ${pageNum} of ${total}`;
      }
    }

    // Update TOC Select
    const toc = document.getElementById('book-toc-select');
    if (toc) {
      toc.value = pageNum.toString();
    }

    // Update Floating Arrows
    const btnPrev = document.getElementById('book-arrow-prev');
    const btnNext = document.getElementById('book-arrow-next');
    const dockPrev = document.getElementById('dock-btn-prev');
    const dockNext = document.getElementById('dock-btn-next');

    const isFirst = idx <= 0;
    const isLast = idx >= 13;

    if (btnPrev) btnPrev.disabled = isFirst;
    if (dockPrev) dockPrev.disabled = isFirst;
    if (btnNext) btnNext.disabled = isLast;
    if (dockNext) dockNext.disabled = isLast;
  }

  // --- Modal Injection (100% Identical to original UPI modal markup) ---
  function injectModalMarkup() {
    if (document.getElementById('infra-book-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'infra-book-modal';
    modal.className = 'book-modal-wrapper';
    modal.innerHTML = `
      <!-- Top Bar -->
      <div class="book-top-bar">
        <div class="book-brand-meta">
          <div class="book-badge-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="book-title-group">
            <div class="book-series-tag" id="book-modal-series">INFRAUD Academy • Official Handbook</div>
            <div class="book-main-title" id="book-modal-title">UPI Request Scams — Practical Safety Guide</div>
          </div>
        </div>

        <div class="book-top-actions">
          <select id="book-toc-select" class="book-toc-dropdown" onchange="window.bookReader.goToPage(parseInt(this.value))">
            <!-- Dynamically populated -->
          </select>

          <button id="book-sound-btn" class="book-control-btn ${soundEnabled ? 'active' : ''}" onclick="window.bookReader.toggleSound()" title="Page Flip Sound">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span class="btn-label" id="book-sound-label">${soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
          </button>

          <a id="book-modal-download" href="/books/INFRAUD_UPI_Request_Scams_Safety_Guide.pdf" download="INFRAUD_UPI_Request_Scams_Safety_Guide.pdf" class="book-control-btn book-control-btn-primary" title="Download Official PDF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span class="btn-label">Download PDF</span>
          </a>

          <button class="book-close-btn" onclick="window.bookReader.close()" title="Close Book (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Stage Area -->
      <div class="book-stage-area" id="book-stage">
        <button class="book-nav-arrow book-nav-prev" id="book-arrow-prev" onclick="window.bookReader.prevPage()" title="Previous Page (←)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <div class="book-stage-viewport">
          <div id="book-container" class="st-book-container"></div>
        </div>

        <button class="book-nav-arrow book-nav-next" id="book-arrow-next" onclick="window.bookReader.nextPage()" title="Next Page (→)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- Bottom Dock Bar -->
      <div class="book-bottom-dock">
        <button class="book-nav-btn book-nav-btn-sec" onclick="window.bookReader.firstPage()" title="First Page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          First
        </button>

        <button class="book-nav-btn" id="dock-btn-prev" onclick="window.bookReader.prevPage()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Prev
        </button>

        <div class="book-dock-pill">
          <input type="range" min="1" max="12" value="1" class="book-page-slider" id="book-slider" oninput="window.bookReader.goToPage(parseInt(this.value))">
          <div class="book-page-counter" id="book-counter">Cover (Page 1)</div>
        </div>

        <button class="book-nav-btn" id="dock-btn-next" onclick="window.bookReader.nextPage()">
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <button class="book-nav-btn book-nav-btn-sec" onclick="window.bookReader.lastPage()" title="Last Page">
          Last
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // --- 60fps StPageFlip Engine Initialization ---
  function initPageFlipEngine(startPageNum = 1) {
    const container = document.getElementById('book-container');
    if (!container) return;

    if (pageFlipInstance) {
      try { pageFlipInstance.destroy(); } catch (e) {}
      pageFlipInstance = null;
    }

    container.innerHTML = buildBookPagesHtml(currentBookId);
    updateModalHeaderForBook(currentBookId);

    const isMobile = window.innerWidth < 860;
    const baseW = isMobile ? Math.min(window.innerWidth - 32, 420) : Math.min((window.innerWidth - 140) / 2, 540);
    const baseH = isMobile ? Math.min(window.innerHeight - 180, 640) : Math.min(window.innerHeight - 170, 720);

    pageFlipInstance = new St.PageFlip(container, {
      width: Math.floor(baseW),
      height: Math.floor(baseH),
      size: 'stretch',
      minWidth: 280,
      maxWidth: 580,
      minHeight: 440,
      maxHeight: 760,
      showCover: true,
      drawShadow: true,
      maxShadowOpacity: 0.35,
      flippingTime: 650,
      usePortrait: true,
      startPage: mapPageToIdx(startPageNum),
      mobileScrollSupport: true,
      clickEventForward: true,
      useMouseEvents: true
    });

    pageFlipInstance.loadFromHTML(container.querySelectorAll('.st-page'));

    pageFlipInstance.on('flip', (e) => {
      playPageTurnSound();
      syncUI(e.data);
    });

    syncUI(mapPageToIdx(startPageNum));
  }

  // --- Public Reader Controller API ---
  window.bookReader = {
    open: function (bookIdOrPage = 'upi', pageToOpen = 1) {
      let bookId = 'upi';
      let page = 1;

      if (typeof bookIdOrPage === 'string' && (bookIdOrPage === 'upi' || bookIdOrPage === 'kyc')) {
        bookId = bookIdOrPage;
        page = pageToOpen || 1;
      } else if (typeof bookIdOrPage === 'number') {
        page = bookIdOrPage;
      }

      currentBookId = bookId;
      injectModalMarkup();
      updateModalHeaderForBook(currentBookId);

      const modal = document.getElementById('infra-book-modal');
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      if (!window.St || !window.St.PageFlip) {
        const s = document.createElement('script');
        s.src = '/js/page-flip.browser.js';
        s.onload = () => initPageFlipEngine(page);
        document.head.appendChild(s);
      } else {
        initPageFlipEngine(page);
      }
    },

    close: function () {
      const modal = document.getElementById('infra-book-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    goToPage: function (pageNum) {
      if (!pageFlipInstance) return;
      const targetIdx = mapPageToIdx(pageNum);
      pageFlipInstance.flip(targetIdx, 'bottom');
    },

    nextPage: function () {
      if (!pageFlipInstance) return;
      pageFlipInstance.flipNext('bottom');
    },

    prevPage: function () {
      if (!pageFlipInstance) return;
      pageFlipInstance.flipPrev('bottom');
    },

    firstPage: function () {
      if (!pageFlipInstance) return;
      pageFlipInstance.flip(0, 'bottom');
    },

    lastPage: function () {
      if (!pageFlipInstance) return;
      pageFlipInstance.flip(pageFlipInstance.getPageCount() - 1, 'bottom');
    },

    toggleSound: function () {
      soundEnabled = !soundEnabled;
      localStorage.setItem('infra_book_sound', soundEnabled);
      const btn = document.getElementById('book-sound-btn');
      const label = document.getElementById('book-sound-label');
      if (btn) btn.classList.toggle('active', soundEnabled);
      if (label) label.innerText = soundEnabled ? 'Sound ON' : 'Sound OFF';
    },

    // --- UPI Interactive Actions (Pure In-DOM Updates) ---
    toggleCheck: function (index) {
      upiChecklistState[index] = !upiChecklistState[index];
      playPageTurnSound();
      const items = document.querySelectorAll('.check-item-card');
      if (items && items[index]) {
        items[index].classList.toggle('checked', upiChecklistState[index]);
        const box = items[index].querySelector('.check-box-visual');
        if (box) box.innerText = upiChecklistState[index] ? '✓' : '';
      }
    },

    answerQuiz: function (questionId, optionKey) {
      if (upiQuizAnswers[questionId]) return;
      upiQuizAnswers[questionId] = optionKey;
      playPageTurnSound();

      const questions = [
        { id: 'q1', correct: 'B' },
        { id: 'q2', correct: 'A' },
        { id: 'q3', correct: 'B' },
        { id: 'q4', correct: 'B' },
        { id: 'q5', correct: 'B' },
        { id: 'q6', correct: 'B' }
      ];

      const q = questions.find(x => x.id === questionId);
      if (!q) return;

      const isCorrect = optionKey === q.correct;
      const card = document.getElementById('quiz-card-' + questionId);
      if (card) {
        const btns = card.querySelectorAll('.quiz-opt-btn');
        btns.forEach(b => {
          b.disabled = true;
          const optLetter = b.querySelector('strong') ? b.querySelector('strong').innerText.replace('.', '').trim() : '';
          if (optLetter === q.correct) b.classList.add('correct');
          else if (optLetter === optionKey && !isCorrect) b.classList.add('wrong');
        });
        const expBox = card.querySelector('.quiz-explanation-box');
        if (expBox) expBox.classList.add('visible');
      }
    },

    // --- KYC Interactive Actions (Pure In-DOM Updates) ---
    toggleKycCheck: function (index) {
      kycChecklistState[index] = !kycChecklistState[index];
      playPageTurnSound();
      const itemEl = document.getElementById('kyc-chk-item-' + index);
      if (itemEl) {
        itemEl.classList.toggle('checked', kycChecklistState[index]);
        const box = itemEl.querySelector('.check-box-visual');
        if (box) box.innerText = kycChecklistState[index] ? '✓' : '';
      }
    },

    answerKycQuiz: function (questionId, optionKey) {
      if (kycQuizAnswers[questionId]) return;
      kycQuizAnswers[questionId] = optionKey;
      playPageTurnSound();

      const q = kycQuizQuestions.find(x => x.id === questionId);
      if (!q) return;

      const correctOpt = q.options.find(o => o.correct);
      const isCorrect = optionKey === correctOpt.key;

      const block = document.getElementById('kyc-quiz-block-' + questionId);
      if (block) {
        const btns = block.querySelectorAll('.quiz-opt-btn');
        btns.forEach(b => {
          b.disabled = true;
          const optLetter = b.querySelector('strong') ? b.querySelector('strong').innerText.replace('.', '').trim() : '';
          if (optLetter === correctOpt.key) b.classList.add('correct');
          else if (optLetter === optionKey && !isCorrect) b.classList.add('wrong');
        });

        const expBox = block.querySelector('.quiz-explanation-box');
        if (expBox) expBox.classList.add('visible');
      }
    }
  };

  window.openBookReader = function (bookIdOrPage, pageNum) {
    window.bookReader.open(bookIdOrPage, pageNum);
  };

  // Keyboard navigation
  window.addEventListener('keydown', function (e) {
    const modal = document.getElementById('infra-book-modal');
    if (!modal || !modal.classList.contains('active')) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      window.bookReader.nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      window.bookReader.prevPage();
    } else if (e.key === 'Escape') {
      window.bookReader.close();
    } else if (e.key === 'Home') {
      window.bookReader.firstPage();
    } else if (e.key === 'End') {
      window.bookReader.lastPage();
    }
  });

  // Responsive resize debouncing
  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const modal = document.getElementById('infra-book-modal');
      if (modal && modal.classList.contains('active') && pageFlipInstance) {
        initPageFlipEngine(pageFlipInstance.getCurrentPageIndex());
      }
    }, 250);
  });

  // Auto-open if URL has hash
  window.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash === '#book-kyc') {
      setTimeout(() => window.openBookReader('kyc', 1), 350);
    } else if (window.location.hash === '#book' || window.location.hash === '#book-upi') {
      setTimeout(() => window.openBookReader('upi', 1), 350);
    }
  });
})();
