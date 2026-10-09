const fs = require('fs');
const path = require('path');

const dir = 'z:/frontend';
const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

// Extract Nav
let navMatch = indexHtml.match(/<!-- ═══════════════════════════════════════════[\r\n\s]+PREMIUM EDGE-TO-EDGE NAV V3[\s\S]*?<\/header>/);
if (!navMatch) {
  console.error("Could not extract Nav");
  process.exit(1);
}
let newNav = navMatch[0];
// Remove "active" from all nav links
newNav = newNav.replace(/ class="active"/g, '');

// Extract Footer
let footerMatch = indexHtml.match(/<!-- ═══════════════════════════════════════════[\r\n\s]+V5 ULTRA PREMIUM FOOTER \(LIGHT THEME\)[\s\S]*?<\/footer>/);
if (!footerMatch) {
  console.error("Could not extract Footer");
  process.exit(1);
}
const correctFooter = footerMatch[0];

const loginHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Log in to INFRAUD to access your dashboard and threat reports." />
  <title>Log in | INFRAUD</title>
  <link rel="stylesheet" href="css/style.css" />
  <style>
    /* ── Login Specific Theme Styling ── */
    .login-section {
      min-height: calc(100vh - 72px); /* Minus nav height */
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: var(--page, #F7F8FC);
      position: relative;
      overflow: hidden;
    }

    /* Floating Meshes matching the theme */
    .login-mesh {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.6;
      pointer-events: none;
      z-index: 1;
    }
    .login-mesh-1 {
      width: 500px; height: 500px;
      background: rgba(37, 99, 235, 0.15); /* Theme Blue */
      top: -100px; left: calc(50% - 600px);
      animation: meshFloatLogin 10s infinite alternate ease-in-out;
    }
    .login-mesh-2 {
      width: 400px; height: 400px;
      background: rgba(16, 185, 129, 0.1); /* Theme Green */
      bottom: -50px; right: calc(50% - 500px);
      animation: meshFloatLogin 12s infinite alternate-reverse ease-in-out;
    }
    @keyframes meshFloatLogin {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(30px, -20px) scale(1.05); }
    }

    .login-card {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 440px;
      background: var(--surface, #FFFFFF);
      border: 1px solid var(--ink-100, #E8EBF3);
      border-radius: 24px;
      padding: 48px 40px;
      box-shadow: 
        0 24px 80px -12px rgba(10, 15, 30, 0.08),
        0 4px 12px -2px rgba(10, 15, 30, 0.04);
      animation: authFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes authFadeUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .auth-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--ink-900, #0A0F1E);
      letter-spacing: -0.04em;
      margin-bottom: 8px;
      text-align: center;
    }
    .auth-subtitle {
      font-size: 1rem;
      color: var(--ink-500, #4B5570);
      margin-bottom: 32px;
      text-align: center;
    }

    /* Social Logins */
    .social-btns {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      height: 48px;
      background: #FFFFFF;
      border: 1px solid var(--ink-200, #D1D5DB);
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ink-700, #1E2742);
      cursor: pointer;
      transition: all 0.2s;
    }
    .social-btn:hover {
      background: var(--ink-50, #F4F5FA);
      border-color: var(--ink-300, #9DA5B4);
    }
    .social-btn svg { width: 20px; height: 20px; }

    .auth-divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: var(--ink-400, #6B7280);
      font-size: 0.8125rem;
      font-weight: 500;
      margin-bottom: 24px;
    }
    .auth-divider::before, .auth-divider::after {
      content: ''; flex: 1; border-bottom: 1px solid var(--ink-100, #E8EBF3);
    }
    .auth-divider:not(:empty)::before { margin-right: 12px; }
    .auth-divider:not(:empty)::after { margin-left: 12px; }

    /* Form Inputs */
    .form-group { margin-bottom: 20px; }
    .form-label {
      display: block; font-size: 0.875rem; font-weight: 600;
      color: var(--ink-700, #1E2742); margin-bottom: 8px;
    }
    .form-label-flex { display: flex; justify-content: space-between; align-items: center; }
    .forgot-link { font-size: 0.8125rem; color: var(--blue-600, #2563EB); text-decoration: none; font-weight: 600; }
    .forgot-link:hover { text-decoration: underline; }
    
    .form-input {
      width: 100%; height: 48px; padding: 0 16px;
      background: var(--ink-50, #F4F5FA); border: 1px solid transparent;
      border-radius: 12px; font-family: inherit; font-size: 0.9375rem;
      color: var(--ink-900, #0A0F1E); transition: all 0.2s; box-sizing: border-box;
    }
    .form-input::placeholder { color: var(--ink-400, #6B7280); }
    .form-input:hover { background: var(--ink-100, #E8EBF3); }
    .form-input:focus {
      outline: none; background: #FFFFFF; border-color: var(--blue-600, #2563EB);
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    }

    .auth-submit {
      width: 100%; height: 48px; margin-top: 8px;
      background: var(--blue-600, #2563EB); color: #FFF;
      border: none; border-radius: 12px; font-size: 1rem; font-weight: 700;
      cursor: pointer; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
      transition: all 0.2s;
    }
    .auth-submit:hover {
      background: var(--blue-700, #1D4ED8);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
    }

    .auth-footer {
      margin-top: 24px; font-size: 0.9375rem; color: var(--ink-500, #4B5570); text-align: center;
    }
    .auth-footer a { color: var(--ink-900, #0A0F1E); font-weight: 700; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }

    @media (max-width: 600px) {
      .login-card { padding: 32px 24px; border-radius: 20px; }
    }
  </style>
</head>
<body>

${newNav}

<main class="login-section">
  <!-- Ambient background -->
  <div class="login-mesh login-mesh-1"></div>
  <div class="login-mesh login-mesh-2"></div>

  <div class="login-card">
    <h1 class="auth-title">Log in</h1>
    <p class="auth-subtitle">Welcome back! Please enter your details.</p>

    <div class="social-btns">
      <button class="social-btn">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Log in with Google
      </button>
      <button class="social-btn">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
        Log in with GitHub
      </button>
    </div>

    <div class="auth-divider">or log in with email</div>

    <form action="dashboard.html" method="GET">
      <div class="form-group">
        <label class="form-label" for="email">Work Email</label>
        <input type="email" id="email" class="form-input" placeholder="you@company.com" required />
      </div>
      
      <div class="form-group">
        <div class="form-label-flex">
          <label class="form-label" for="password" style="margin: 0;">Password</label>
          <a href="#" class="forgot-link">Forgot password?</a>
        </div>
        <input type="password" id="password" class="form-input" placeholder="••••••••" style="margin-top: 8px;" required />
      </div>

      <button type="submit" class="auth-submit">Log in to INFRAUD</button>
    </form>

    <div class="auth-footer">
      Don't have an account? <a href="signup.html">Sign up</a>
    </div>
  </div>
</main>

${correctFooter}

</body>
</html>`;

fs.writeFileSync(path.join(dir, 'login.html'), loginHtml, 'utf8');
console.log('Done');
