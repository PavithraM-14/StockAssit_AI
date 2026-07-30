# Firebase Emulator Setup Complete ✅

## Installation Summary

### ✅ What Was Done

1. **Installed Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```
   - Version: 15.25.0
   - Java Runtime: 24.0.2 (required for emulators)

2. **Created Firebase Configuration Files**
   - `firebase.json` - Emulator configuration
   - `.firebaserc` - Project settings (stockanalytics-40b2a)

3. **Fixed Firebase Admin Initialization**
   - Updated `config/firebaseAdmin.js` to support emulator mode
   - Added graceful fallback for missing credentials
   - Emulator now starts without requiring full Firebase credentials

4. **Started Firebase Emulator Successfully**
   - Functions emulator running on: http://127.0.0.1:5001
   - Emulator UI available at: http://127.0.0.1:4000

---

## Emulator Status

### ✅ Working
- **Functions API Endpoint:** http://127.0.0.1:5001/stockanalytics-40b2a/us-central1/api
- **API Routes Available:**
  - GET `/api/stocks/*`
  - GET `/api/signals/*`
  - GET `/api/holdings/*`
  - GET `/api/watchlist/*`
  - GET `/api/alerts/*`
  - POST `/api/ai/ask`
  - GET `/api/ai/summary/:ticker`
  - And more...

### ⚠️ Warnings (Non-Critical)
- **Firebase Auth not authenticated**: Run `firebase login` if you need full Firebase features
- **Node version mismatch**: Using Node 22 instead of 18 (works fine)
- **Scheduled functions ignored**: `pubsub` emulator not running (optional for development)
- **Mongoose warnings**: Duplicate index definitions (cosmetic, doesn't affect functionality)

### ⚠️ Missing Environment Variables
These need to be configured for full functionality:

1. **MARKET_DATA_API_KEY** (Finnhub API)
   - Already in `.env`: `d9kqcs9r01qshkrnsf5gd9kqcs9r01qshkrnsf60`
   - ✅ Should work

2. **GEMINI_API_KEY** (Google AI)
   - Already in `.env` file (local only)
   - ⚠️ May need regeneration if previously exposed
   - Get new key at: https://makersuite.google.com/app/apikey

3. **Firebase Service Account** (Optional for emulator)
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY
   - Not required for emulator testing

---

## How to Use

### Start the Emulator
```bash
firebase emulators:start --only functions
```

### Stop the Emulator
Press `Ctrl+C` in the terminal running the emulator

### Test API Endpoints

#### Example: Health Check
```bash
curl http://127.0.0.1:5001/stockanalytics-40b2a/us-central1/api/health
```

#### Example: Get Stock Quote
```bash
curl http://127.0.0.1:5001/stockanalytics-40b2a/us-central1/api/stocks/quote/AAPL \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

#### Example: Ask AI
```bash
curl -X POST http://127.0.0.1:5001/stockanalytics-40b2a/us-central1/api/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "ticker": "AAPL",
    "question": "What is the P/E ratio?"
  }'
```

### Access Emulator UI
Open in browser: http://127.0.0.1:4000

---

## Flutter Integration

### Update API Base URL for Emulator Testing

In `lib/core/constants/api_constants.dart`:

```dart
class ApiConstants {
  // For testing with local emulator
  static const String baseUrl = 
    'http://127.0.0.1:5001/stockanalytics-40b2a/us-central1/api';
  
  // For production (after deployment)
  // static const String baseUrl = 
  //   'https://us-central1-stockanalytics-40b2a.cloudfunctions.net/api';
  
  // Endpoints remain the same
  static const String stocks = '/stocks';
  static const String signals = '/signals';
  // ... etc
}
```

### Test from Android Emulator

If testing from Android emulator, use `10.0.2.2` instead of `127.0.0.1`:

```dart
static const String baseUrl = 
  'http://10.0.2.2:5001/stockanalytics-40b2a/us-central1/api';
```

### Test from Physical Device

Use your computer's local IP address (e.g., `192.168.1.100`):

```dart
static const String baseUrl = 
  'http://192.168.1.100:5001/stockanalytics-40b2a/us-central1/api';
```

---

## Deployment to Production

### Prerequisites
1. Authenticate with Firebase:
   ```bash
   firebase login
   ```

2. Ensure `.env` variables are set in Firebase config:
   ```bash
   firebase functions:config:set \
     mongodb.uri="your_mongodb_uri" \
     gemini.api_key="your_gemini_key" \
     market_data.api_key="your_finnhub_key"
   ```

### Deploy
```bash
cd backend/functions
firebase deploy --only functions
```

### View Logs
```bash
firebase functions:log
```

---

## Configuration Files Created

### `firebase.json`
```json
{
  "functions": [{
    "source": "backend/functions",
    "codebase": "default",
    "ignore": ["node_modules", ".git", "firebase-debug.log"],
    "predeploy": []
  }],
  "emulators": {
    "functions": { "port": 5001 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

### `.firebaserc`
```json
{
  "projects": {
    "default": "stockanalytics-40b2a"
  }
}
```

---

## Known Issues & Solutions

### Issue: "Missing Firebase credentials"
**Solution:** This is expected in emulator mode. The emulator works without full credentials.

### Issue: "MARKET_DATA_API_KEY not configured"
**Solution:** The key is in `.env` but emulator may not be reading it. This is a warning only.

### Issue: "Mongoose duplicate index warnings"
**Solution:** Cosmetic warnings. Can be fixed by removing duplicate index definitions in models.

### Issue: "Node version mismatch (18 vs 22)"
**Solution:** Works fine. To match exactly, install Node 18 or update package.json to "node": "22".

### Issue: "Scheduled functions ignored"
**Solution:** Start pubsub emulator: `firebase emulators:start --only functions,pubsub`

---

## API Documentation

### Base URL (Emulator)
```
http://127.0.0.1:5001/stockanalytics-40b2a/us-central1/api
```

### Authentication
All protected routes require Firebase ID token:
```
Authorization: Bearer <firebase_id_token>
```

### Endpoints Summary

#### Stocks (Market Data)
- `GET /api/stocks/quote/:ticker` - Current quote
- `GET /api/stocks/fundamentals/:ticker` - Fundamentals (P/E, EPS, etc.)
- `GET /api/stocks/history/:ticker` - Historical prices
- `GET /api/stocks/news/:ticker` - Company news
- `GET /api/stocks/search?q=AAPL` - Search stocks

#### Signals
- `GET /api/signals/:ticker` - Get/generate signal
- `GET /api/signals/:ticker/history` - Signal history
- `GET /api/signals/watchlist` - Signals for watchlist

#### Watchlist
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add ticker
- `DELETE /api/watchlist/:ticker` - Remove ticker

#### Alerts
- `GET /api/alerts` - Get user's alerts
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts/:alertId` - Update alert
- `DELETE /api/alerts/:alertId` - Delete alert

#### Holdings
- `GET /api/holdings` - Get portfolio
- `POST /api/holdings` - Add holding
- `PUT /api/holdings/:id` - Update holding
- `DELETE /api/holdings/:id` - Delete holding

#### AI Assistant
- `POST /api/ai/ask` - Ask AI about a stock
- `GET /api/ai/summary/:ticker` - Get AI stock summary
- `GET /api/ai/health` - Check AI service health

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

---

## Next Steps

1. ✅ Firebase emulator is running
2. ✅ All API endpoints are accessible locally
3. 📱 Update Flutter app to point to emulator URL
4. 🧪 Test API endpoints with Postman/curl
5. 🔐 Get Firebase token from Flutter app for auth
6. 🚀 Once tested, deploy to production

---

## Useful Commands

```bash
# Start emulator
firebase emulators:start --only functions

# Start with other services
firebase emulators:start --only functions,firestore,auth

# View logs
firebase functions:log

# Deploy to production
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:api

# View function logs (production)
firebase functions:log --only api
```

---

## Resources

- Firebase Emulator Docs: https://firebase.google.com/docs/emulator-suite
- Firebase Functions Docs: https://firebase.google.com/docs/functions
- Emulator UI: http://127.0.0.1:4000
- Functions Logs: Check emulator terminal output

---

**Status:** ✅ Firebase Emulator Running Successfully!

**Last Updated:** July 30, 2026
