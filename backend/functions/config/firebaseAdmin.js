/**
 * Firebase Admin SDK Initialization
 * 
 * Supports two initialization modes:
 * 1. Deployed (Cloud Functions): Uses Application Default Credentials
 * 2. Local Development: Uses service account from environment variables
 */

const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK
 * 
 * In deployed Cloud Functions, Firebase automatically provides credentials.
 * For local development, we use environment variables.
 */
const initializeFirebaseAdmin = () => {
  // Prevent multiple initializations
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin already initialized');
    return admin;
  }

  try {
    // Check if running in Firebase Emulator
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    
    // Check if running in Firebase Cloud Functions (deployed environment)
    const isDeployed = !isEmulator && 
                      (process.env.FIREBASE_CONFIG || process.env.GCLOUD_PROJECT);

    if (isEmulator) {
      // Emulator mode - initialize with minimal config
      console.log('🔧 Running in Firebase Emulator mode');
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
      });
      console.log('✅ Firebase Admin initialized (emulator mode)');
      console.log('⚠️  Using emulator - auth verification will use emulator rules');
    } else if (isDeployed) {
      // Deployed environment - use Application Default Credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('✅ Firebase Admin initialized (deployed mode)');
    } else {
      // Local development - use service account from environment variables
      if (!process.env.FIREBASE_PROJECT_ID || 
          !process.env.FIREBASE_CLIENT_EMAIL || 
          !process.env.FIREBASE_PRIVATE_KEY) {
        console.warn(
          '⚠️  Missing Firebase credentials. Set FIREBASE_PROJECT_ID, ' +
          'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env'
        );
        console.log('ℹ️  Initializing with minimal config for testing...');
        
        // Initialize with project ID only for basic functionality
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'stockanalytics-40b2a',
        });
        console.log('✅ Firebase Admin initialized (minimal mode)');
        console.log('⚠️  Auth verification will fail without proper credentials');
        return admin;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Private key often comes with escaped newlines from .env
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin initialized (local dev mode)');
      console.log(`📦 Project: ${process.env.FIREBASE_PROJECT_ID}`);
    }

    return admin;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    // In emulator mode, don't throw - allow functions to load
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
      console.warn('⚠️  Continuing in emulator mode despite initialization error');
      return admin;
    }
    throw error;
  }
};

// Initialize on module load
initializeFirebaseAdmin();

/**
 * Verify Firebase ID token and return decoded token
 * 
 * @param {string} token - Firebase ID token from client Authorization header
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token with user info
 * @throws {Error} Clear error message if token is invalid or expired
 */
const verifyIdToken = async (token) => {
  if (!token) {
    const error = new Error('No authentication token provided');
    error.code = 'auth/no-token';
    throw error;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token, true); // checkRevoked = true
    return decodedToken;
  } catch (error) {
    // Map Firebase errors to clear messages
    let message = 'Invalid authentication token';
    let code = 'auth/invalid-token';

    if (error.code === 'auth/id-token-expired') {
      message = 'Authentication token has expired. Please sign in again.';
      code = 'auth/token-expired';
    } else if (error.code === 'auth/id-token-revoked') {
      message = 'Authentication token has been revoked. Please sign in again.';
      code = 'auth/token-revoked';
    } else if (error.code === 'auth/argument-error') {
      message = 'Malformed authentication token';
      code = 'auth/malformed-token';
    }

    const authError = new Error(message);
    authError.code = code;
    authError.originalError = error;
    
    throw authError;
  }
};

/**
 * Get user by UID
 * 
 * @param {string} uid - Firebase user UID
 * @returns {Promise<admin.auth.UserRecord>} User record
 */
const getUserByUid = async (uid) => {
  try {
    return await admin.auth().getUser(uid);
  } catch (error) {
    const authError = new Error(`User not found: ${uid}`);
    authError.code = 'auth/user-not-found';
    authError.originalError = error;
    throw authError;
  }
};

/**
 * Send push notification via Firebase Cloud Messaging
 * 
 * @param {string} fcmToken - Device FCM token
 * @param {Object} notification - Notification payload
 * @returns {Promise<string>} Message ID
 */
const sendPushNotification = async (fcmToken, notification) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const messageId = await admin.messaging().send(message);
    return messageId;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
};

// Export the admin instance and helper functions
module.exports = admin;
module.exports.verifyIdToken = verifyIdToken;
module.exports.getUserByUid = getUserByUid;
module.exports.sendPushNotification = sendPushNotification;
