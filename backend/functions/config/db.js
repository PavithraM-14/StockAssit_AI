/**
 * MongoDB Database Connection for Firebase Cloud Functions
 * 
 * This config is optimized for serverless environments where connection
 * reuse across function invocations is critical for performance.
 */

const mongoose = require('mongoose');

// Cache the database connection to reuse across serverless invocations
let cachedConnection = null;

/**
 * Connect to MongoDB Atlas with connection reuse for serverless
 * 
 * In Firebase Cloud Functions, each function invocation may reuse
 * the same container. We cache the connection to avoid reconnecting
 * on every request (which would cause severe performance issues).
 */
const connectDB = async () => {
  // Return cached connection if it exists and is ready
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    // Validate that MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Connect with serverless-optimized options
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Recommended for serverless environments
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      
      // Connection pool settings for serverless
      maxPoolSize: 10, // Limit connection pool size
      minPoolSize: 1,  // Maintain at least 1 connection
      
      // Automatically try to reconnect
      retryWrites: true,
      retryReads: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Cache the connection for reuse
    cachedConnection = conn;

    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected - will attempt to reconnect');
      cachedConnection = null; // Clear cache on disconnect
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.error('Stack:', error.stack);
    
    // In serverless, we don't exit the process - let the function fail gracefully
    // The container may be reused for the next invocation
    throw error;
  }
};

/**
 * Gracefully close the MongoDB connection
 * Use this for cleanup in non-serverless environments or testing
 */
const disconnectDB = async () => {
  if (cachedConnection) {
    await mongoose.connection.close();
    cachedConnection = null;
    console.log('MongoDB connection closed');
  }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
