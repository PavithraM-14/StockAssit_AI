/**
 * Alerts Controller
 * Manages stock alerts for users
 */

const Alert = require('../models/Alert');
const { AppError } = require('../middleware/errorHandler');

// Allowed alert condition values (matching Alert model enum)
const ALLOWED_CONDITIONS = [
  'price_above',
  'price_below',
  'volume_spike',
  'signal_change',
];

/**
 * Get all alerts for authenticated user
 * 
 * GET /alerts?isActive=true
 */
exports.getAlerts = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { isActive } = req.query;

    const query = { userId };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const alerts = await Alert.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length,
    });

  } catch (error) {
    console.error('Error in getAlerts:', error);
    next(error);
  }
};

/**
 * Create a new alert
 * 
 * POST /alerts
 * Body: {
 *   ticker: 'AAPL',
 *   condition: 'price_above' | 'price_below' | 'volume_spike' | 'signal_change',
 *   threshold: 150.00 (for price) or other value depending on condition
 * }
 */
exports.createAlert = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { ticker, condition, threshold } = req.body;

    // Validation
    if (!ticker) {
      throw new AppError('ticker is required', 400);
    }

    if (!condition) {
      throw new AppError('condition is required', 400);
    }

    if (threshold === undefined || threshold === null) {
      throw new AppError('threshold is required', 400);
    }

    // Validate ticker format
    if (!/^[A-Z]{1,5}$/.test(ticker.toUpperCase())) {
      throw new AppError('Invalid ticker format (1-5 uppercase letters)', 400);
    }

    // Validate condition is one of allowed values
    const conditionLower = condition.toLowerCase();
    if (!ALLOWED_CONDITIONS.includes(conditionLower)) {
      throw new AppError(
        `condition must be one of: ${ALLOWED_CONDITIONS.join(', ')}`,
        400
      );
    }

    // Map user-friendly condition to model enum
    const conditionEnum = conditionLower.toUpperCase().replace(/_/g, '_');
    const modelCondition = conditionEnum; // e.g., 'PRICE_ABOVE', 'PRICE_BELOW'

    // Validate threshold based on condition type
    if (conditionLower.startsWith('price_')) {
      if (typeof threshold !== 'number' || threshold <= 0) {
        throw new AppError('threshold must be a positive number for price conditions', 400);
      }
    }

    // Create alert
    const alert = await Alert.create({
      userId,
      ticker: ticker.toUpperCase(),
      condition: modelCondition,
      threshold,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully',
    });

  } catch (error) {
    console.error('Error in createAlert:', error);
    next(error);
  }
};

/**
 * Update an alert (toggle isActive or change threshold)
 * 
 * PATCH /alerts/:alertId
 * Body: { isActive: false, threshold: 160.00 }
 */
exports.updateAlert = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { alertId } = req.params;
    const updates = req.body;

    // Find alert and verify ownership
    const alert = await Alert.findById(alertId);

    if (!alert) {
      throw new AppError('Alert not found', 404);
    }

    if (alert.userId !== userId) {
      throw new AppError('You can only update your own alerts', 403);
    }

    // Update allowed fields
    const allowedUpdates = ['threshold', 'isActive'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        alert[key] = updates[key];
      }
    });

    await alert.save();

    return res.status(200).json({
      success: true,
      data: alert,
      message: 'Alert updated successfully',
    });

  } catch (error) {
    console.error('Error in updateAlert:', error);
    next(error);
  }
};

/**
 * Delete an alert
 * 
 * DELETE /alerts/:alertId
 */
exports.deleteAlert = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { alertId } = req.params;

    const alert = await Alert.findById(alertId);

    if (!alert) {
      throw new AppError('Alert not found', 404);
    }

    if (alert.userId !== userId) {
      throw new AppError('You can only delete your own alerts', 403);
    }

    await alert.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Alert deleted successfully',
    });

  } catch (error) {
    console.error('Error in deleteAlert:', error);
    next(error);
  }
};
