const express = require('express');
const router = express.Router();
const { analyzeUrl } = require('../services/urlAnalyzer');

const { analyzePhoneNumber } = require('../services/phoneAnalyzer');
const { analyzeUpi } = require('../services/upiAnalyzer');

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

/**
 * POST /api/analyze/phone
 * Analyzes a phone number using ITU-T E.164 and TRAI regulatory heuristics.
 * 
 * Expected Request Body:
 * { "phone": "+919876543210" } or { "number": "9876543210" } or { "query": "..." }
 */
router.post('/phone', (req, res, next) => {
  try {
    const body = req.body || {};
    const input = body.phone !== undefined ? body.phone : (body.number !== undefined ? body.number : body.query);
    const defaultCountry = body.country || 'IN';

    if (input === undefined || input === null) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing phone number in request body. Expected: { "phone": "+919876543210" }'
      });
    }

    if (typeof input !== 'string' || !input.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid, non-empty phone number string is required.'
      });
    }

    const result = analyzePhoneNumber(input, defaultCountry);

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

/**
 * POST /api/analyze/upi
 * Analyzes a UPI ID (Virtual Payment Address) using NPCI rules and heuristic signals.
 * 
 * Expected Request Body:
 * { "upiId": "example@okhdfcbank" } or { "upi": "..." } or { "query": "..." }
 */
router.post('/upi', (req, res, next) => {
  try {
    const body = req.body || {};
    const input = body.upiId !== undefined ? body.upiId : (body.upi !== undefined ? body.upi : (body.handle !== undefined ? body.handle : body.query));

    if (input === undefined || input === null) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing "upiId" property in request body. Expected: { "upiId": "example@okhdfcbank" }'
      });
    }

    if (typeof input !== 'string' || !input.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid, non-empty UPI ID string is required in the request body.'
      });
    }

    const result = analyzeUpi(input);

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
