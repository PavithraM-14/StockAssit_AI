/**
 * Alerts Routes
 * Price alert management endpoints
 */

const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// All alert routes require authentication
router.use(verifyFirebaseToken);

// Get all alerts for authenticated user
// GET /api/alerts?isActive=true
router.get('/', alertsController.getAlerts);

// Create a new alert
// POST /api/alerts
// Body: { ticker, condition, threshold }
router.post('/', alertsController.createAlert);

// Update an alert (toggle isActive or change threshold)
// PATCH /api/alerts/:alertId
// Body: { isActive, threshold }
router.patch('/:alertId', alertsController.updateAlert);

// Delete an alert
// DELETE /api/alerts/:alertId
router.delete('/:alertId', alertsController.deleteAlert);

module.exports = router;
