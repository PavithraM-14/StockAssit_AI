/**
 * Users Controller
 * Manages user profiles and risk preferences
 */

const User = require('../models/User');

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

/**
 * Create or update user profile
 */
exports.upsertProfile = async (req, res) => {
  try {
    const { firebaseUid, email, riskProfile, investmentGoals, preferredSectors, notifications } = req.body;
    
    if (!firebaseUid || !email) {
      return res.status(400).json({
        success: false,
        message: 'firebaseUid and email are required'
      });
    }
    
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        firebaseUid,
        email,
        riskProfile,
        investmentGoals,
        preferredSectors,
        notifications,
        updatedAt: Date.now()
      },
      { upsert: true, new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error upserting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Update risk profile
 */
exports.updateRiskProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { riskProfile } = req.body;
    
    if (!['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'].includes(riskProfile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid risk profile. Must be CONSERVATIVE, MODERATE, or AGGRESSIVE'
      });
    }
    
    const user = await User.findOneAndUpdate(
      { firebaseUid: userId },
      { riskProfile, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Risk profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating risk profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update risk profile',
      error: error.message
    });
  }
};

/**
 * Update notification preferences
 */
exports.updateNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notifications } = req.body;
    
    const user = await User.findOneAndUpdate(
      { firebaseUid: userId },
      { notifications, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
      error: error.message
    });
  }
};
