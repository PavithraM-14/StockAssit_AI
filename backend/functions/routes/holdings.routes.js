/**
 * Holdings Routes
 * Portfolio tracking endpoints (tracking only, not execution)
 */

const express = require('express');
const router = express.Router();
const holdingsController = require('../controllers/holdings.controller');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// All holdings routes require authentication
router.use(verifyFirebaseToken);

// Get all holdings for authenticated user
// GET /api/holdings
router.get('/', holdingsController.getHoldings);

// Add a new holding
// POST /api/holdings
// Body: { ticker, quantity, avgBuyPrice, purchaseDate, notes }
router.post('/', holdingsController.addHolding);

// Update a holding
// PUT /api/holdings/:id
// Body: { quantity, avgBuyPrice, purchaseDate, notes }
router.put('/:id', holdingsController.updateHolding);

// Delete a holding
// DELETE /api/holdings/:id
router.delete('/:id', holdingsController.deleteHolding);

module.exports = router;
