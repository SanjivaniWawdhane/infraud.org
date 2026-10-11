# 🛡️ INFRAUD.org — Project Audit Report

**Date:** October 11, 2026  
**Project:** INFRAUD (Open-Source Digital Safety & Scam Detection Platform)  
**Stack Audited:** HTML, CSS, JavaScript (Frontend) | Node.js & Express (Backend Workspace) | Supabase (Auth / Database)  

---

## 1. Project Folder Structure & Purpose of Important Files

```
d:\InFraud.org\
├── backend\
│   └── src\
│       ├── controllers\              # Empty skeleton directory
│       ├── middlewares\              # Empty skeleton directory
│       ├── routes\                   # Empty skeleton directory
│       └── services\                 # Empty skeleton directory
├── database\                         # Empty directory (no migrations/schema files)
├── frontend\
│   ├── assets\
│   │   ├── logo.jpg                  # Official INFRAUD logo
│   │   └── signup_bg_premium.jpg     # Auth page background visual
│   ├── css\
│   │   └── style.css                 # Main design system: tokens, typography, grid, cards, badges
│   ├── js\
│   │   ├── auth.js                   # Supabase Auth client & admin authentication bypass logic
│   │   └── main.js                   # UI animations, scroll reveal, navbar effect, obsolete tab selectors
│   ├── check.html                    # Dedicated "Live Check" page with 4 tool tabs
│   ├── index.html                    # Main landing page with Hero search bar & 4 tool toggles
│   ├── result.html                   # Static mock scan analysis results screen
│   ├── report.html                   # Community reporting wizard (persists to localStorage)
│   ├── reports.html                  # Community threat feed table (reads/prunes localStorage)
│   ├── admin_dashboard.html          # Static moderation dashboard interface template
│   ├── dashboard.html                # User profile & account dashboard
│   ├── login.html / signup.html     # User login & registration interfaces
│   ├── about.html, blog.html,        # Content, educational, and documentation pages
│   │   learn.html, tools.html
│   ├── package.json                  # Frontend static file server configuration
│   └── test_supabase.js              # Script testing Supabase REST connection
├── logo.jpg                          # Root copy of official INFRAUD logo
├── getcolor.ps1                      # Color utility script
└── package.json                      # Root configuration serving frontend via http-server
```

---

## 2. Frontend Files Implementing the Analyze Interface & 4 Tabs

The Analyze interface with four tools (**URL**, **Phone**, **UPI ID**, **Message**) is implemented in two separate frontend pages:

### A. Landing Page Hero: [frontend/index.html](file:///d:/InFraud.org/frontend/index.html#L452-L465)
* **Tabs (Lines 452–457):**
  ```html
  <div class="search-toggles">
    <button class="search-toggle active" onclick="setSearchType('url', this)">URL</button>
    <button class="search-toggle" onclick="setSearchType('phone', this)">Phone</button>
    <button class="search-toggle" onclick="setSearchType('upi', this)">UPI ID</button>
    <button class="search-toggle" onclick="setSearchType('message', this)">Message</button>
  </div>
  ```
* **Input Box (Line 462):** `#hero-search-input`
* **Analyze Button (Line 463):** `<button class="btn btn-primary" onclick="performAnalysis()">Analyze</button>`
* **Tab Switching Logic (Lines 558–567):** `setSearchType(type, btn)` toggles the `.active` class and updates placeholder text based on the selected tool.

### B. Dedicated Live Check Page: [frontend/check.html](file:///d:/InFraud.org/frontend/check.html#L178-L194)
* **Tabs (Lines 178–183):**
  ```html
  <div class="checker-tabs-container">
    <button class="t-title checker-tab active" onclick="setCheckerType('url', this)">Website</button>
    <button class="t-title checker-tab" onclick="setCheckerType('phone', this)">Phone</button>
    <button class="t-title checker-tab" onclick="setCheckerType('upi', this)">UPI ID</button>
    <button class="t-title checker-tab" onclick="setCheckerType('message', this)">Message</button>
  </div>
  ```
* **Input Box (Line 191):** `#main-checker-input`
* **Analyze Button (Line 193):** `<button class="btn btn-primary" onclick="window.location.href='reports.html'">Analyze</button>`
* **Tab Switching Logic (Lines 197–206):** `setCheckerType(type, btn)` updates the active tab and changes placeholder text.

---

## 3. Backend Audit: Does a Node.js / Express Backend Exist?

* **Finding: NO, a Node.js/Express backend does not currently exist.**
* **Verification & Evidence:**
  1. The `backend/` directory only contains empty folders: `backend/src/controllers/`, `middlewares/`, `routes/`, `services/`.
  2. There is no `server.js`, `app.js`, `index.js`, or backend `package.json`.
  3. Neither root `package.json` nor `frontend/package.json` contains `express` or any backend dependencies.
  4. Root [package.json](file:///d:/InFraud.org/package.json#L5-L9) scripts:
     ```json
     "scripts": {
       "start": "npx -y http-server frontend -p 8080 -c-1",
       "dev": "npx -y http-server frontend -p 8080 -c-1",
       "serve": "npx -y http-server frontend -p 8080 -c-1"
     }
     ```
     This only spawns `http-server`, a basic static web server serving files from the `frontend/` folder on port 8080.

---

## 4. How the "Analyze" Button Currently Operates

* **From [index.html](file:///d:/InFraud.org/frontend/index.html#L1931-L1947):**
  * When the button is clicked, `performAnalysis()` runs:
    1. Validates that `#hero-search-input` is not empty. If empty, triggers browser `alert("Please enter a URL, phone number, UPI ID, or message to analyze.")`.
    2. Changes button label to `"Analyzing..."` and sets opacity to 0.8.
    3. Triggers `setTimeout(..., 600)` to simulate processing delay.
    4. Redirects to `result.html?query=` + encoded input value.
* **From [check.html](file:///d:/InFraud.org/frontend/check.html#L193):**
  * Clicking "Analyze" executes inline `onclick="window.location.href='reports.html'"`. It neither reads the user input nor performs any scan; it simply navigates to the community threat reports list.
* **On [result.html](file:///d:/InFraud.org/frontend/result.html):**
  * Does not read `window.location.search` or parse `?query=...`. The page renders purely static, pre-written HTML content.

---

## 5. Where Dummy, Hardcoded, or Simulated Results Are Generated

1. **[frontend/result.html](file:///d:/InFraud.org/frontend/result.html#L121-L175):**
   * **Hardcoded Risk Score:** `86/100` and `HIGH RISK` badge (Lines 133–134).
   * **Hardcoded Scan Metadata:** `Scan ID: INFR-8892-A • Oct 7, 2026 14:30 IST` (Line 121).
   * **Hardcoded Signals:**
     - *Suspicious domain registration:* "Domain was registered extremely recently (2 hours ago) using a privacy proxy." (High Risk)
     - *Urgency-based language:* "NLP model detected manipulation tactics urging immediate action." (Medium Risk)
     - *Technical infrastructure:* "Hosted on an ASN frequently associated with phishing campaigns." (High Risk)
     - *Community evidence:* "14 independent reports filed within the last hour." (Medium Risk)
   * **Hardcoded Recommendation:** "Do not click, pay or share sensitive information until independently verified." (Line 173).
2. **[frontend/index.html](file:///d:/InFraud.org/frontend/index.html#L481-L520):**
   * The Hero showcase card shows static mockup data (`amazon-secure-refund.in`, Score `86`, "Registered 2 hours ago").
3. **[frontend/check.html](file:///d:/InFraud.org/frontend/check.html#L221-L230):**
   * "Recent Checks" displays static entries: `amazon-support.in` (Critical) and `+91 98765 43210` (Suspicious).
4. **[frontend/reports.html](file:///d:/InFraud.org/frontend/reports.html#L442-L493):**
   * Hardcoded `SEED_REPORTS` array with 5 entries (`amazon-support-india.in`, `+91 98765 43210`, `paytm-kyc-verify@gmail.com`, `johndoe@ybl`, `flipkart-big-billion-offers.link`) written into browser `localStorage`.

---

## 6. Real API Integrations & Database Connections Status

* **Threat Detection & Intelligence APIs:** **None.**
  * There are no integrations with VirusTotal, Google Safe Browsing, PhishTank, WHOIS lookup APIs, or DNS resolvers.
* **Database:** **None connected.**
  * `database/` is an empty directory.
  * Reporting features in `report.html` and `reports.html` store data exclusively in browser `localStorage` (`infraud_community_reports`).
* **Authentication Service:**
  * [frontend/js/auth.js](file:///d:/InFraud.org/frontend/js/auth.js) connects directly to a Supabase project via `@supabase/supabase-js` for email/password registration, login, and OAuth stubs.

---

## 7. Errors, Inconsistencies, Security Issues & Configuration Problems

| Category | Finding | File & Reference | Impact |
| :--- | :--- | :--- | :--- |
| **Security** | Hardcoded Admin Login Bypass | [frontend/js/auth.js](file:///d:/InFraud.org/frontend/js/auth.js#L95-L101) | In client-side code, checking if email/password is `admin` / `admin123` allows anyone via browser console to enter `admin_dashboard.html`. |
| **Security / Data** | Client-Only LocalStorage Storage | [frontend/report.html](file:///d:/InFraud.org/frontend/report.html#L294) | Reports stored in `localStorage` cannot be shared across devices or verified centrally. |
| **Bug / Disconnect** | Broken Tab Selectors in `main.js` | [frontend/js/main.js](file:///d:/InFraud.org/frontend/js/main.js#L17) | Listens to `.workspace-tab` and `.workspace-box .input` which do not exist in current HTML files. |
| **Bug / Disconnect** | Broken Score Animation | [frontend/js/main.js](file:///d:/InFraud.org/frontend/js/main.js#L41) | Target element `.score-number` is missing from `result.html`, preventing the counter animation from running. |
| **UX Inconsistency** | Divergent Analyze Routing | [frontend/check.html](file:///d:/InFraud.org/frontend/check.html#L193) vs [frontend/index.html](file:///d:/InFraud.org/frontend/index.html#L1941) | `index.html` routes to `result.html?query=...`, whereas `check.html` routes to `reports.html`. |
| **Environment** | PowerShell Execution Policy | Windows PowerShell | Running `npm start` directly can fail with a script execution policy error unless invoked via `npm.cmd` or cmd. |

---

## 8. Exact Files to Modify for the URL Analyzer

To implement real, explainable URL analysis while preserving 100% of the UI design:

### Backend Files to Introduce:
1. `backend/package.json` — Defines Express, CORS, and backend scripts.
2. `backend/src/server.js` — Entry point running Express on port 5000 with CORS.
3. `backend/src/routes/analyzeRoutes.js` — Endpoint handler for `POST /api/analyze/url`.
4. `backend/src/services/urlAnalyzer.js` — Pure heuristic engine evaluating:
   - Insecure protocol (HTTP vs HTTPS)
   - IP address used as hostname (e.g. `http://192.168.1.1/login`)
   - High-risk / suspicious TLDs (`.xyz`, `.top`, `.tk`, `.link`, `.icu`, etc.)
   - Phishing & credential theft keywords (`login`, `secure`, `verify`, `update`, `kyc`, `banking`, `refund`)
   - Homograph / punycode / excessive subdomains / length anomalies
   - Computes transparent 0–100 risk score and structured explainable signal array matching existing UI cards.

### Frontend Files to Update:
1. [frontend/index.html](file:///d:/InFraud.org/frontend/index.html): Ensure `performAnalysis()` passes tool type and query: `result.html?type=url&query=...`.
2. [frontend/check.html](file:///d:/InFraud.org/frontend/check.html): Direct the Analyze button to `result.html?type=url&query=...` instead of `reports.html`.
3. [frontend/result.html](file:///d:/InFraud.org/frontend/result.html): Add client script to:
   - Extract `query` from URL parameters.
   - Fetch analysis from `http://localhost:5000/api/analyze/url`.
   - Dynamically populate the target name, risk score, score color, risk label, and signal cards inside existing markup.

---

## 9. Beginner-Friendly Implementation Plan

```
[Phase 1: Backend Foundation]
  - Create backend/package.json and install express, cors.
  - Create backend/src/server.js listening on port 5000.

[Phase 2: Explainable URL Engine]
  - Create backend/src/services/urlAnalyzer.js.
  - Implement heuristic rules (protocol, IP hostname, suspicious TLDs, keyword matches, URL structure).
  - Return formatted response: { target, score, riskLevel, signals: [{ title, description, risk }] }.
  - Expose via POST /api/analyze/url in backend/src/routes/analyzeRoutes.js.

[Phase 3: Frontend Dynamic Results Binding]
  - In result.html, add script to read window.location.search (?query=...).
  - Call http://localhost:5000/api/analyze/url.
  - Replace static elements dynamically (target text, score circle, signal list) without altering CSS or layout.

[Phase 4: Analyze Buttons Alignment]
  - Unify Analyze buttons in index.html and check.html to pass query to result.html.
```

---

## 10. Recommended Single Next Task

> **Next Immediate Step:** Initialize the Node.js/Express backend by creating `backend/package.json` and a minimal `backend/src/server.js` with Express and CORS listening on port 5000.
