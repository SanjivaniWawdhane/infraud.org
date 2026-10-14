const express = require('express');
const router = express.Router();
const { analyzeUrl } = require('../services/urlAnalyzer');

/**
 * POST /api/analyze/url
 * Analyzes a URL using transparent structural heuristics.
 * 
 * Expected Request Body:
 * { "url": "https://example.com" }
 */
router.post('/url', (req, res, next) => {
  try {
    const { url } = req.body || {};

    if (url === undefined || url === null) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing "url" property in request body. Expected: { "url": "https://example.com" }'
      });
    }

    if (typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid, non-empty URL string is required in the request body.'
      });
    }

    const result = analyzeUrl(url);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        error: 'Validation Error',
        message: result.error
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
