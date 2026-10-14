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
// 4. 404 Handler for Unknown Routes
// ==========================================
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
  });
});

// Catch-all for non-API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.'
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
