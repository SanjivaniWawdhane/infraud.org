/**
 * INFRAUD Digital Flipbook Reader Engine
 * Redesigned for INFRAUD Website Theme: Minimal, Modern, Professional
 * Authentic 3D Real-Page-Flip Animation Engine
 */

(function () {
  'use strict';

  // --- State ---
  let currentPage = 1; // 1 to 12
  const totalPages = 12;
  let isSpread = window.innerWidth >= 860;
  let soundEnabled = localStorage.getItem('infra_book_sound') !== 'false';
  let checklistState = [false, false, false, false, false, false];
  let quizAnswers = {}; // { q1: 'B', ... }
  let isAnimating = false;

  // --- Static Helper Components ---
  function getPrefaceHtml() {
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

  function getCertificateHtml() {
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

  // --- Page Definitions & Content (Pages 1 to 12) ---
  const pagesData = [
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

  // Helper to get HTML for any page number
  function getPageContent(pNum) {
    if (pNum === 'preface') return getPrefaceHtml();
    if (pNum === 'certificate') return getCertificateHtml();
    const p = pagesData.find(x => x.page === pNum);
    return p ? p.render() : '<div class="book-page-leaf"></div>';
  }

  // --- Audio Synthesis Engine ---
  function playPageTurnSound() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = Math.floor(ctx.sampleRate * 0.12); // 120ms crisp paper rustle
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Organic paper rustle simulation
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
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  // --- Modal DOM Injection ---
  function injectModalMarkup() {
    if (document.getElementById('infra-book-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'infra-book-modal';
    modal.className = 'book-modal-wrapper';
    modal.innerHTML = `
      <!-- Top Control Bar (Website Theme) -->
      <div class="book-top-bar">
        <div class="book-brand-meta">
          <div class="book-badge-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="book-title-group">
            <div class="book-series-tag">INFRAUD Academy • Official Handbook</div>
            <div class="book-main-title">UPI Request Scams — Practical Safety Guide</div>
          </div>
        </div>

        <div class="book-top-actions">
          <select id="book-toc-select" class="book-toc-dropdown" onchange="window.bookReader.goToPage(parseInt(this.value))">
            <option value="1">Page 1: Cover</option>
            <option value="2">Page 2: Contents & Roadmap</option>
            <option value="3">Page 3: Lesson 1 - UPI Basics</option>
            <option value="4">Page 4: Lesson 2 - Scam Patterns</option>
            <option value="5">Page 5: Lesson 2 - Pressure Tactics</option>
            <option value="6">Page 6: Lesson 3 - 5-Step Check</option>
            <option value="7">Page 7: Lesson 3 - Mandates & Habits</option>
            <option value="8">Page 8: Lesson 4 - Emergency Response</option>
            <option value="9">Page 9: Lesson 4 - Evidence & Traps</option>
            <option value="10">Page 10: Interactive Checklist</option>
            <option value="11">Page 11: Knowledge Check Quiz</option>
            <option value="12">Page 12: Glossary & Helplines</option>
          </select>

          <button id="book-mode-btn" class="book-control-btn" onclick="window.bookReader.toggleSpreadMode()" title="Toggle View Mode">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
            <span class="btn-label" id="book-mode-label">${isSpread ? '2-Page Spread' : 'Single Page'}</span>
          </button>

          <button id="book-sound-btn" class="book-control-btn ${soundEnabled ? 'active' : ''}" onclick="window.bookReader.toggleSound()" title="Page Flip Sound">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span class="btn-label" id="book-sound-label">${soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
          </button>

          <a href="/books/INFRAUD_UPI_Request_Scams_Safety_Guide.pdf" download="INFRAUD_UPI_Request_Scams_Safety_Guide.pdf" class="book-control-btn book-control-btn-primary" title="Download Official PDF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span class="btn-label">Download PDF</span>
          </a>

          <button class="book-close-btn" onclick="window.bookReader.close()" title="Close Book (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Main Stage Area -->
      <div class="book-stage-area" id="book-stage">
        <button class="book-nav-arrow book-nav-prev" id="book-arrow-prev" onclick="window.bookReader.prevPage()" title="Previous Page (←)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <div class="book-wrapper-3d" id="book-container">
          <!-- Static Base Left Page Slot -->
          <div class="book-page-slot" id="page-slot-left"></div>

          <!-- Static Base Right Page Slot -->
          <div class="book-page-slot" id="page-slot-right"></div>

          <!-- Genuine 3D Flipping Sheet Layer -->
          <div class="book-flipping-sheet" id="book-flipping-sheet">
            <div class="sheet-face sheet-front" id="sheet-face-front"></div>
            <div class="sheet-face sheet-back" id="sheet-face-back"></div>
          </div>

          <!-- Center Spine Gutter Depth -->
          <div class="book-spine-depth" id="book-spine"></div>
        </div>

        <button class="book-nav-arrow book-nav-next" id="book-arrow-next" onclick="window.bookReader.nextPage()" title="Next Page (→)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- Bottom Dock Navigation (Floating Capsule) -->
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
          <div class="book-page-counter" id="book-counter">Page 1 of 12</div>
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

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        window.bookReader.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        window.bookReader.prevPage();
      } else if (e.key === 'Escape') {
        window.bookReader.close();
      }
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    const stage = document.getElementById('book-stage');
    stage.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const deltaX = touchEndX - touchStartX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) {
          window.bookReader.nextPage();
        } else {
          window.bookReader.prevPage();
        }
      }
    }
  }

  // --- Static Rendering Engine (Direct Update) ---
  function updateStaticSlots() {
    const slotLeft = document.getElementById('page-slot-left');
    const slotRight = document.getElementById('page-slot-right');
    const spine = document.getElementById('book-spine');
    const counter = document.getElementById('book-counter');
    const slider = document.getElementById('book-slider');
    const toc = document.getElementById('book-toc-select');
    const prevArrow = document.getElementById('book-arrow-prev');
    const nextArrow = document.getElementById('book-arrow-next');
    const dockPrev = document.getElementById('dock-btn-prev');
    const dockNext = document.getElementById('dock-btn-next');

    const effectiveSpread = isSpread && window.innerWidth >= 860;
    if (spine) {
      spine.style.display = effectiveSpread && currentPage > 1 ? 'block' : 'none';
    }

    if (!effectiveSpread) {
      // Mobile Single Page
      if (slotLeft) slotLeft.innerHTML = getPageContent(currentPage);
      if (counter) counter.innerText = `Page ${currentPage} of ${totalPages}`;
      if (slider) slider.value = currentPage;
      if (toc) toc.value = currentPage;
    } else {
      // Desktop 2-Page Spread
      if (currentPage === 1) {
        if (slotLeft) slotLeft.innerHTML = getPageContent('preface');
        if (slotRight) slotRight.innerHTML = getPageContent(1);
        if (counter) counter.innerText = `Cover (Page 1)`;
        if (slider) slider.value = 1;
        if (toc) toc.value = 1;
      } else {
        const leftPageNum = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        const rightPageNum = leftPageNum + 1;

        if (slotLeft) slotLeft.innerHTML = getPageContent(leftPageNum);
        if (slotRight) slotRight.innerHTML = rightPageNum <= totalPages ? getPageContent(rightPageNum) : getPageContent('certificate');

        if (counter) {
          counter.innerText = rightPageNum <= totalPages ? `Pages ${leftPageNum}–${rightPageNum} of ${totalPages}` : `Page ${leftPageNum} of ${totalPages}`;
        }
        if (slider) slider.value = leftPageNum;
        if (toc) toc.value = leftPageNum;
      }
    }

    // Update buttons disabled states
    const isAtStart = currentPage <= 1;
    const isAtEnd = effectiveSpread ? (currentPage >= 11) : (currentPage >= 12);

    if (prevArrow) prevArrow.disabled = isAtStart;
    if (nextArrow) nextArrow.disabled = isAtEnd;
    if (dockPrev) dockPrev.disabled = isAtStart;
    if (dockNext) dockNext.disabled = isAtEnd;
  }

  // --- Real 3D Page Flip Animation Engine ---
  function execute3DPageFlip(fromPage, toPage, direction) {
    const effectiveSpread = isSpread && window.innerWidth >= 860;
    const sheet = document.getElementById('book-flipping-sheet');
    const sheetFront = document.getElementById('sheet-face-front');
    const sheetBack = document.getElementById('sheet-face-back');
    const container = document.getElementById('book-container');

    if (!effectiveSpread) {
      // Mobile 3D Turn
      if (container) {
        container.classList.remove('mobile-turning-next', 'mobile-turning-prev');
        void container.offsetWidth; // Force reflow
        container.classList.add(direction === 'forward' ? 'mobile-turning-next' : 'mobile-turning-prev');
      }
      playPageTurnSound();
      currentPage = toPage;
      updateStaticSlots();
      setTimeout(() => {
        if (container) container.classList.remove('mobile-turning-next', 'mobile-turning-prev');
        isAnimating = false;
      }, 450);
      return;
    }

    // Desktop Spread 3D Flip
    if (!sheet || !sheetFront || !sheetBack) {
      currentPage = toPage;
      updateStaticSlots();
      isAnimating = false;
      return;
    }

    playPageTurnSound();

    if (direction === 'forward') {
      // Determine what's flipping forward:
      // Front of sheet has old right page; Back of sheet has new left page.
      const oldRightPage = fromPage === 1 ? 1 : (fromPage % 2 === 0 ? fromPage + 1 : fromPage);
      const newLeftPage = toPage % 2 === 0 ? toPage : toPage - 1;
      const newRightPage = newLeftPage + 1;

      // Populate flipping sheet faces
      sheetFront.innerHTML = getPageContent(oldRightPage);
      sheetBack.innerHTML = getPageContent(newLeftPage);

      // Pre-render the underlying base right slot with incoming page
      const slotRight = document.getElementById('page-slot-right');
      if (slotRight) {
        slotRight.innerHTML = newRightPage <= totalPages ? getPageContent(newRightPage) : getPageContent('certificate');
      }

      // Trigger 3D forward rotation: 0deg to -180deg
      sheet.className = 'book-flipping-sheet flip-forward';

      setTimeout(() => {
        // Animation finished: update base left slot and state
        currentPage = toPage;
        updateStaticSlots();
        sheet.className = 'book-flipping-sheet';
        sheetFront.innerHTML = '';
        sheetBack.innerHTML = '';
        isAnimating = false;
      }, 600);

    } else {
      // Backward Turn:
      // Front of sheet has old left page; Back of sheet has new right page.
      const oldLeftPage = fromPage % 2 === 0 ? fromPage : fromPage - 1;
      const newLeftPage = toPage === 1 ? 'preface' : (toPage % 2 === 0 ? toPage : toPage - 1);
      const newRightPage = toPage === 1 ? 1 : (newLeftPage + 1);

      sheetFront.innerHTML = getPageContent(oldLeftPage);
      sheetBack.innerHTML = getPageContent(newRightPage);

      // Pre-render the underlying base left slot with incoming page
      const slotLeft = document.getElementById('page-slot-left');
      if (slotLeft) {
        slotLeft.innerHTML = getPageContent(newLeftPage);
      }

      // Trigger 3D backward rotation: 0deg to +180deg
      sheet.className = 'book-flipping-sheet flip-backward';

      setTimeout(() => {
        currentPage = toPage;
        updateStaticSlots();
        sheet.className = 'book-flipping-sheet';
        sheetFront.innerHTML = '';
        sheetBack.innerHTML = '';
        isAnimating = false;
      }, 600);
    }
  }

  // --- Public Reader Controller API ---
  window.bookReader = {
    open: function (pageToOpen) {
      injectModalMarkup();
      const modal = document.getElementById('infra-book-modal');
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      currentPage = pageToOpen || 1;
      updateStaticSlots();
    },

    close: function () {
      const modal = document.getElementById('infra-book-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    goToPage: function (pageNum, withAnimation = true) {
      if (pageNum < 1) pageNum = 1;
      if (pageNum > totalPages) pageNum = totalPages;
      if (pageNum === currentPage) return;
      if (isAnimating) return;

      const fromPage = currentPage;
      const toPage = pageNum;
      const direction = toPage > fromPage ? 'forward' : 'backward';

      if (withAnimation) {
        isAnimating = true;
        execute3DPageFlip(fromPage, toPage, direction);
      } else {
        currentPage = toPage;
        updateStaticSlots();
      }
    },

    nextPage: function () {
      if (isAnimating) return;
      const effectiveSpread = isSpread && window.innerWidth >= 860;
      if (effectiveSpread) {
        if (currentPage === 1) {
          this.goToPage(2, true);
        } else if (currentPage < 11) {
          this.goToPage(currentPage + 2, true);
        }
      } else {
        if (currentPage < totalPages) {
          this.goToPage(currentPage + 1, true);
        }
      }
    },

    prevPage: function () {
      if (isAnimating) return;
      const effectiveSpread = isSpread && window.innerWidth >= 860;
      if (effectiveSpread) {
        if (currentPage <= 3) {
          this.goToPage(1, true);
        } else {
          this.goToPage(currentPage - 2, true);
        }
      } else {
        if (currentPage > 1) {
          this.goToPage(currentPage - 1, true);
        }
      }
    },

    firstPage: function () {
      if (isAnimating) return;
      this.goToPage(1, true);
    },

    lastPage: function () {
      if (isAnimating) return;
      this.goToPage(totalPages, true);
    },

    toggleSpreadMode: function () {
      if (isAnimating) return;
      isSpread = !isSpread;
      const label = document.getElementById('book-mode-label');
      if (label) label.innerText = isSpread ? '2-Page Spread' : 'Single Page';
      updateStaticSlots();
    },

    toggleSound: function () {
      soundEnabled = !soundEnabled;
      localStorage.setItem('infra_book_sound', soundEnabled);
      const btn = document.getElementById('book-sound-btn');
      const label = document.getElementById('book-sound-label');
      if (btn) btn.classList.toggle('active', soundEnabled);
      if (label) label.innerText = soundEnabled ? 'Sound ON' : 'Sound OFF';
      if (soundEnabled) playPageTurnSound();
    },

    // --- Interactive Checklist Action ---
    toggleCheck: function (index) {
      checklistState[index] = !checklistState[index];
      playPageTurnSound();
      updateStaticSlots();
    },

    // --- Interactive Quiz Action ---
    answerQuiz: function (questionId, optionKey) {
      if (quizAnswers[questionId]) return;
      quizAnswers[questionId] = optionKey;
      playPageTurnSound();
      updateStaticSlots();
    },

    resetQuiz: function () {
      quizAnswers = {};
      playPageTurnSound();
      updateStaticSlots();
    }
  };

  // Global helper for opening reader
  window.openBookReader = function (pageNum) {
    window.bookReader.open(pageNum || 1);
  };

  // Listen for hash triggers
  window.addEventListener('load', function () {
    injectModalMarkup();
    if (window.location.hash === '#book' || window.location.hash === '#upi-guide') {
      window.openBookReader(1);
    }
  });

  window.addEventListener('resize', function () {
    const modal = document.getElementById('infra-book-modal');
    if (modal && modal.classList.contains('active')) {
      updateStaticSlots();
    }
  });

})();
