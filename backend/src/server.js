const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. Core Middlewares
// ==========================================

// Enable CORS for local frontend access
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON requests with body size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. Health & Status Endpoints
// ==========================================

/**
 * GET /api/health
 * Verifies that the API service is operational and responsive.
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'infraud-api',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// ==========================================
// 3. API Routes
// ==========================================
const analyzeRoutes = require('./routes/analyzeRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

app.use('/api/analyze', analyzeRoutes);
app.use('/api/reports', reportsRoutes);

// ==========================================
// 4. Frontend & Static File Serving
// ==========================================
const path = require('path');
const fs = require('fs');

// Resolve frontend directory path
const candidateDirs = [
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../frontend'),
  path.resolve(__dirname, '../frontend'),
  path.resolve(__dirname, '../../')
];

let frontendDir = null;
for (const dir of candidateDirs) {
  if (fs.existsSync(path.join(dir, 'index.html'))) {
    frontendDir = dir;
    break;
  }
}

if (frontendDir) {
  console.log(`[Frontend] Serving web assets from: ${frontendDir}`);

  // Serve static assets (CSS, JS, images, etc.)
  app.use(express.static(frontendDir));

  // Clean URLs & HTML page routing (e.g. /about, /check, /result)
  app.get('*', (req, res, next) => {
    // If request starts with /api, pass to API 404 handler
    if (req.path.startsWith('/api')) return next();

    // Remove trailing slash
    if (req.path.length > 1 && req.path.endsWith('/')) {
      return res.redirect(301, req.path.slice(0, -1));
    }

    // Root path -> index.html
    if (req.path === '/' || req.path === '') {
      return res.sendFile(path.join(frontendDir, 'index.html'));
    }

    // Check for clean URL without extension (e.g. /about -> /about.html)
    const cleanFile = path.join(frontendDir, req.path.replace(/^\//, '') + '.html');
    if (fs.existsSync(cleanFile) && fs.statSync(cleanFile).isFile()) {
      return res.sendFile(cleanFile);
    }

    // Check for direct file match (e.g. /about.html)
    const directFile = path.join(frontendDir, req.path.replace(/^\//, ''));
    if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
      return res.sendFile(directFile);
    }

    // Fallback: Return index.html for client-side routing, or 404 page
    res.status(404).sendFile(path.join(frontendDir, 'index.html'));
  });
} else {
  // If no frontend directory found, serve an informative API landing page at /
  app.get('/', (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        service: 'infraud-api',
        status: 'online',
        uptime: Math.floor(process.uptime()),
        endpoints: {
          health: '/api/health',
          analyzeUrl: 'POST /api/analyze/url',
          analyzePhone: 'POST /api/analyze/phone',
          analyzeUpi: 'POST /api/analyze/upi',
          analyzeMessage: 'POST /api/analyze/message',
          reports: 'GET /api/reports'
        }
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>INFRAUD.org API Service</title>
        <style>
          body { background: #080d1a; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; max-width: 580px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; }
          .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
          h1 { margin: 0 0 10px; font-size: 1.8rem; color: #fff; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin: 0 0 24px; }
          .endpoints { background: #0b1120; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
          .ep { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #1e293b; font-family: monospace; font-size: 0.88rem; }
          .ep:last-child { border-bottom: none; }
          .ep a { color: #38bdf8; text-decoration: none; }
          .ep a:hover { text-decoration: underline; }
          .method { font-weight: 700; color: #a78bfa; margin-right: 8px; }
          .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem; text-align: center; }
          .btn:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge"><span class="dot"></span> INFRAUD API Service Operational</div>
          <h1>🛡️ INFRAUD.org Backend API</h1>
          <p>The backend threat intelligence and report verification API is running and ready to handle requests.</p>
          <div class="endpoints">
            <div class="ep"><span class="method">GET</span> <a href="/api/health">/api/health</a></div>
            <div class="ep"><span class="method">POST</span> <span>/api/analyze/url</span></div>
            <div class="ep"><span class="method">POST</span> <span>/api/analyze/phone</span></div>
            <div class="ep"><span class="method">POST</span> <span>/api/analyze/upi</span></div>
            <div class="ep"><span class="method">POST</span> <span>/api/analyze/message</span></div>
            <div class="ep"><span class="method">GET</span> <a href="/api/reports">/api/reports</a></div>
            <div class="ep"><span class="method">GET</span> <a href="/api/reports/all">/api/reports/all</a></div>
          </div>
          <a href="/api/health" class="btn">View System Health &rarr;</a>
        </div>
      </body>
      </html>
    `);
  });
}

// 404 Handler for undefined /api routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
  });
});

// Catch-all for non-API routes when no static handler caught it
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource '${req.originalUrl}' was not found on this server.`
  });
});

// ==========================================
// 5. Safe Global Error Handler
// ==========================================
// Prevents internal stack traces or system secrets from leaking to clients
app.use((err, req, res, next) => {
  // Gracefully handle malformed JSON syntax from client requests
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON',
      message: 'Invalid JSON payload. Please ensure request body is valid JSON, e.g. {"url": "https://example.com"}.'
    });
  }

  console.error('[API Error]:', err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : 'Request Error',
    message: statusCode === 500 
      ? 'An unexpected error occurred. Please try again later.' 
      : err.message
  });
});

// ==========================================
// 6. Server Initialization
// ==========================================
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🛡️  INFRAUD Backend Service Running`);
  console.log(`📡 Local API:    http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

module.exports = { app, server };
