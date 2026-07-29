/**
 * Users Routes
 * Profile and risk preference management endpoints
 */

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// All routes require authentication
router.use(verifyFirebaseToken);

// Get user profile
// GET /api/users/:userId
router.get('/:userId', usersController.getProfile);

// Create or update user profile
// PUT /api/users/:userId
router.put('/:userId', usersController.upsertProfile);

// Update risk profile
// PATCH /api/users/:userId/risk-profile
router.patch('/:userId/risk-profile', usersController.updateRiskProfile);

// Update notification preferences
// PATCH /api/users/:userId/notifications
router.patch('/:userId/notifications', usersController.updateNotifications);

module.exports = router;
