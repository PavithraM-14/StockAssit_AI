/**
 * Notification Service
 * Sends push notifications via Firebase Cloud Messaging (FCM)
 */

const admin = require('../config/firebaseAdmin');

/**
 * Send a single push notification via admin.messaging().send()
 * 
 * @param {string} fcmToken - FCM device registration token
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {Object} data - Extra key-value pairs (data payload)
 * @returns {Promise<Object>} Result object with success flag
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.warn('⚠️ No FCM token provided for push notification.');
    return { success: false, reason: 'No token' };
  }

  // Convert non-string data values to strings as required by FCM
  const stringifiedData = {};
  if (data && typeof data === 'object') {
    Object.keys(data).forEach((key) => {
      stringifiedData[key] = String(data[key]);
    });
  }

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: {
      ...stringifiedData,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`✅ Push notification sent successfully (ID: ${response})`);
    return { success: true, messageId: response };
  } catch (error) {
    // Graceful error handling for invalid/expired tokens or delivery failures
    console.error(`❌ Push notification failed for token [${fcmToken.slice(0, 10)}...]:`, error.message);
    
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      console.warn('⚠️ FCM Token is invalid or expired.');
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code,
    };
  }
};

/**
 * Send a signal alert notification when a tracked ticker gets a new signal (BUY/SELL/HOLD)
 * 
 * @param {Object} user - User object containing fcmToken or fcmTokens
 * @param {Object} signal - Signal object containing ticker/symbol, signalType, confidenceScore, aiExplanation
 * @returns {Promise<Array|Object>} Results of sent notifications
 */
const sendSignalAlert = async (user, signal) => {
  if (!user) {
    console.warn('⚠️ sendSignalAlert called with no user.');
    return { success: false, reason: 'No user provided' };
  }

  const ticker = signal.ticker || signal.symbol || 'STOCK';
  const signalType = signal.signalType || 'SIGNAL';
  const confidence = signal.confidenceScore || signal.confidence || 0;
  
  const title = `🚨 New ${signalType} Signal: ${ticker}`;
  const body = `${ticker} generated a ${signalType} signal with ${confidence}% confidence score.`;

  const dataPayload = {
    type: 'SIGNAL_ALERT',
    ticker,
    signalType,
    confidence: String(confidence),
    explanation: signal.aiExplanation ? signal.aiExplanation.substring(0, 150) : '',
  };

  // Support single token (user.fcmToken) or array (user.fcmTokens)
  const tokens = [];
  if (user.fcmToken) tokens.push(user.fcmToken);
  if (Array.isArray(user.fcmTokens)) {
    user.fcmTokens.forEach((t) => {
      if (t && !tokens.includes(t)) tokens.push(t);
    });
  }

  if (tokens.length === 0) {
    console.log(`ℹ️ User ${user.firebaseUid || user.id || user.email || ''} has no FCM tokens registered.`);
    return { success: false, reason: 'User has no FCM tokens' };
  }

  const results = [];
  for (const token of tokens) {
    try {
      const result = await sendPushNotification(token, title, body, dataPayload);
      results.push(result);
    } catch (err) {
      // Continue batch loop gracefully
      console.error(`Error sending signal alert to token: ${err.message}`);
      results.push({ success: false, error: err.message });
    }
  }

  return results.length === 1 ? results[0] : results;
};

module.exports = {
  sendPushNotification,
  sendSignalAlert,
};
