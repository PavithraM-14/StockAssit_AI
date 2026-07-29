/**
 * Holdings Controller
 * Manages user's tracked holdings - for portfolio tracking purposes only
 * 
 * IMPORTANT: This is for TRACKING only, not for executing trades.
 * Users execute trades through their own brokers and log them here.
 */

const TrackedHolding = require('../models/TrackedHolding');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all holdings for logged-in user
 * 
 * GET /holdings
 * 
 * Returns all holdings for the authenticated user, sorted by creation date.
 */
exports.getHoldings = async (req, res, next) => {
  try {
    const userId = req.user.uid; // From Firebase auth middleware

    console.log(`📊 Fetching holdings for user ${userId}`);

    const holdings = await TrackedHolding.find({ userId })
      .sort({ createdAt: -1 }); // Newest first

    // Calculate total portfolio value (based on purchase prices)
    const totalInvested = holdings.reduce((sum, holding) => {
      return sum + (holding.quantity * holding.avgBuyPrice);
    }, 0);

    return res.status(200).json({
      success: true,
      data: holdings,
      summary: {
        totalHoldings: holdings.length,
        totalInvested: totalInvested.toFixed(2),
      },
    });

  } catch (error) {
    console.error('Error in getHoldings:', error);
    next(error);
  }
};

/**
 * Add a new holding
 * 
 * POST /holdings
 * Body: { ticker, quantity, avgBuyPrice, purchaseDate, notes }
 * 
 * Validates input and creates a new tracked holding for the user.
 */
exports.addHolding = async (req, res, next) => {
  try {
    const userId = req.user.uid; // From Firebase auth middleware
    const { ticker, quantity, avgBuyPrice, purchaseDate, notes } = req.body;

    // Input validation
    if (!ticker || typeof ticker !== 'string' || ticker.trim().length === 0) {
      throw new AppError('Ticker is required and must be a non-empty string', 400);
    }

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      throw new AppError('Quantity is required and must be greater than 0', 400);
    }

    if (!avgBuyPrice || typeof avgBuyPrice !== 'number' || avgBuyPrice <= 0) {
      throw new AppError('Average buy price is required and must be greater than 0', 400);
    }

    // Validate ticker format (1-5 uppercase letters)
    const tickerUpper = ticker.toUpperCase().trim();
    if (!/^[A-Z]{1,5}$/.test(tickerUpper)) {
      throw new AppError('Ticker must be 1-5 uppercase letters (e.g., AAPL, GOOGL)', 400);
    }

    // Validate purchase date if provided
    let validPurchaseDate = purchaseDate;
    if (purchaseDate) {
      validPurchaseDate = new Date(purchaseDate);
      if (isNaN(validPurchaseDate.getTime())) {
        throw new AppError('Invalid purchase date format', 400);
      }
      // Don't allow future dates
      if (validPurchaseDate > new Date()) {
        throw new AppError('Purchase date cannot be in the future', 400);
      }
    } else {
      validPurchaseDate = new Date(); // Default to now
    }

    console.log(`➕ Adding holding: ${tickerUpper} (${quantity} shares @ $${avgBuyPrice})`);

    // Create holding
    const holding = await TrackedHolding.create({
      userId,
      ticker: tickerUpper,
      quantity,
      avgBuyPrice,
      purchaseDate: validPurchaseDate,
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      data: holding,
      message: `Successfully added ${quantity} shares of ${tickerUpper}`,
    });

  } catch (error) {
    console.error('Error in addHolding:', error);
    next(error);
  }
};

/**
 * Update an existing holding
 * 
 * PUT /holdings/:id
 * Body: { quantity, avgBuyPrice, purchaseDate, notes } (all optional)
 * 
 * Updates a holding owned by the authenticated user.
 */
exports.updateHolding = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { quantity, avgBuyPrice, purchaseDate, notes } = req.body;

    console.log(`✏️  Updating holding ${id}`);

    // Find holding and verify ownership
    const holding = await TrackedHolding.findById(id);

    if (!holding) {
      throw new AppError('Holding not found', 404);
    }

    if (holding.userId !== userId) {
      throw new AppError('You can only update your own holdings', 403);
    }

    // Validate updates
    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || quantity <= 0) {
        throw new AppError('Quantity must be greater than 0', 400);
      }
      holding.quantity = quantity;
    }

    if (avgBuyPrice !== undefined) {
      if (typeof avgBuyPrice !== 'number' || avgBuyPrice <= 0) {
        throw new AppError('Average buy price must be greater than 0', 400);
      }
      holding.avgBuyPrice = avgBuyPrice;
    }

    if (purchaseDate !== undefined) {
      const validDate = new Date(purchaseDate);
      if (isNaN(validDate.getTime())) {
        throw new AppError('Invalid purchase date format', 400);
      }
      if (validDate > new Date()) {
        throw new AppError('Purchase date cannot be in the future', 400);
      }
      holding.purchaseDate = validDate;
    }

    if (notes !== undefined) {
      holding.notes = notes;
    }

    // Save updates
    await holding.save();

    return res.status(200).json({
      success: true,
      data: holding,
      message: 'Holding updated successfully',
    });

  } catch (error) {
    console.error('Error in updateHolding:', error);
    next(error);
  }
};

/**
 * Delete a holding
 * 
 * DELETE /holdings/:id
 * 
 * Deletes a holding owned by the authenticated user.
 */
exports.deleteHolding = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    console.log(`🗑️  Deleting holding ${id}`);

    // Find holding and verify ownership
    const holding = await TrackedHolding.findById(id);

    if (!holding) {
      throw new AppError('Holding not found', 404);
    }

    if (holding.userId !== userId) {
      throw new AppError('You can only delete your own holdings', 403);
    }

    // Delete holding
    await holding.deleteOne();

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${holding.ticker} holding`,
    });

  } catch (error) {
    console.error('Error in deleteHolding:', error);
    next(error);
  }
};
