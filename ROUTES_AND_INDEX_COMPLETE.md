# Routes & Main Index - COMPLETE ✅

## Overview
All route files and the main Express app (`index.js`) have been updated to match our implemented controllers with proper authentication, endpoint structure, and error handling.

---

## Files Updated

### Route Files (7 total)
1. ✅ `signals.routes.js`
2. ✅ `stocks.routes.js`
3. ✅ `ai.routes.js`
4. ✅ `watchlist.routes.js`
5. ✅ `alerts.routes.js`
6. ✅ `holdings.routes.js`
7. `users.routes.js` (not modified - user management)

### Main App
8. ✅ `index.js` - Express app setup with middleware and scheduled functions

---

## Complete API Endpoint Reference

### 1. Signals Routes - `/api/signals`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/signals/:ticker` | No | Get or generate signal for ticker |
| GET | `/api/signals/:ticker/history` | No | Get signal history with performance stats |
| GET | `/api/signals/watchlist` | ✅ Yes | Get signals for user's watchlist |

**Examples:**
```http
GET /api/signals/AAPL
GET /api/signals/AAPL/history?limit=50
GET /api/signals/watchlist
Authorization: Bearer <firebase-token>
```

---

### 2. Stocks Routes - `/api/stocks`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stocks/search?q=apple` | No | Search stocks by name/ticker |
| POST | `/api/stocks/batch/quotes` | No | Get quotes for multiple tickers |
| GET | `/api/stocks/:ticker` | No | Get complete stock details |
| GET | `/api/stocks/:ticker/quote` | No | Get current quote |
| GET | `/api/stocks/:ticker/fundamentals` | No | Get fundamentals |
| GET | `/api/stocks/:ticker/history?range=1M` | No | Get historical prices |
| GET | `/api/stocks/:ticker/news` | No | Get company news |

**Examples:**
```http
GET /api/stocks/search?q=apple
POST /api/stocks/batch/quotes
Body: { "tickers": ["AAPL", "GOOGL", "MSFT"] }
GET /api/stocks/AAPL
GET /api/stocks/AAPL/quote
GET /api/stocks/AAPL/fundamentals
GET /api/stocks/AAPL/history?range=1Y
GET /api/stocks/AAPL/news
```

---

### 3. AI Routes - `/api/ai`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | No | Ask AI about a stock |
| GET | `/api/ai/summary/:ticker` | No | Get AI stock summary |
| GET | `/api/ai/health` | No | Check AI service health |

**Examples:**
```http
POST /api/ai/chat
Body: {
  "ticker": "AAPL",
  "question": "What does the P/E ratio tell me?"
}

GET /api/ai/summary/AAPL
GET /api/ai/health
```

---

### 4. Watchlist Routes - `/api/watchlist`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/watchlist` | ✅ Yes | Get user's watchlist |
| POST | `/api/watchlist` | ✅ Yes | Add ticker to watchlist |
| DELETE | `/api/watchlist/:ticker` | ✅ Yes | Remove ticker from watchlist |
| PUT | `/api/watchlist` | ✅ Yes | Replace entire watchlist |
| DELETE | `/api/watchlist` | ✅ Yes | Clear watchlist |

**Examples:**
```http
GET /api/watchlist
Authorization: Bearer <firebase-token>

POST /api/watchlist
Authorization: Bearer <firebase-token>
Body: { "ticker": "AAPL" }

DELETE /api/watchlist/AAPL
Authorization: Bearer <firebase-token>

PUT /api/watchlist
Authorization: Bearer <firebase-token>
Body: { "tickers": ["AAPL", "GOOGL", "MSFT"] }
```

---

### 5. Alerts Routes - `/api/alerts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/alerts?isActive=true` | ✅ Yes | Get user's alerts |
| POST | `/api/alerts` | ✅ Yes | Create new alert |
| PATCH | `/api/alerts/:alertId` | ✅ Yes | Update alert |
| PATCH | `/api/alerts/:alertId/toggle` | ✅ Yes | Toggle alert on/off |
| DELETE | `/api/alerts/:alertId` | ✅ Yes | Delete alert |
| POST | `/api/alerts/check` | No* | Check all alerts (cron job) |

*Note: `/api/alerts/check` should be protected with internal API key in production

**Examples:**
```http
GET /api/alerts
Authorization: Bearer <firebase-token>

POST /api/alerts
Authorization: Bearer <firebase-token>
Body: {
  "ticker": "AAPL",
  "condition": "above",
  "targetPrice": 180.00,
  "message": "AAPL hit my target!"
}

PATCH /api/alerts/507f1f77bcf86cd799439011/toggle
Authorization: Bearer <firebase-token>

DELETE /api/alerts/507f1f77bcf86cd799439011
Authorization: Bearer <firebase-token>
```

---

### 6. Holdings Routes - `/api/holdings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/holdings` | ✅ Yes | Get user's holdings |
| POST | `/api/holdings` | ✅ Yes | Add new holding |
| PUT | `/api/holdings/:id` | ✅ Yes | Update holding |
| DELETE | `/api/holdings/:id` | ✅ Yes | Delete holding |

**Examples:**
```http
GET /api/holdings
Authorization: Bearer <firebase-token>

POST /api/holdings
Authorization: Bearer <firebase-token>
Body: {
  "ticker": "AAPL",
  "quantity": 100,
  "avgBuyPrice": 150.00,
  "purchaseDate": "2024-01-15",
  "notes": "Long term hold"
}

PUT /api/holdings/507f1f77bcf86cd799439011
Authorization: Bearer <firebase-token>
Body: {
  "quantity": 150,
  "avgBuyPrice": 145.00
}

DELETE /api/holdings/507f1f77bcf86cd799439011
Authorization: Bearer <firebase-token>
```

---

### 7. Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | API health check |

**Example:**
```http
GET /health

Response:
{
  "success": true,
  "message": "StockSense API is running",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Main Express App Structure

### Middleware Order (Important!)
```javascript
1. CORS
2. Body parsers (JSON, URL-encoded)
3. Database connection
4. Routes
5. 404 handler (notFoundHandler)
6. Error handler (errorHandler) - MUST BE LAST
```

### Route Registration
```javascript
app.use('/api/stocks', stocksRoutes);
app.use('/api/signals', signalsRoutes);
app.use('/api/holdings', holdingsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);
```

---

## Firebase Cloud Functions

### HTTP Function
```javascript
exports.api = functions.https.onRequest(app);
```

Accessible at: `https://<region>-<project-id>.cloudfunctions.net/api/...`

### Scheduled Functions

#### 1. Update Signal Performance
```javascript
exports.updateSignalPerformance = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Updates SignalHistory with priceAfter7Days and priceAfter30Days
  });
```

**Purpose:** Track how accurate signals were after 7 and 30 days

#### 2. Check Alerts
```javascript
exports.checkAlerts = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    // Checks all active alerts and triggers notifications
  });
```

**Purpose:** Monitor price alerts and notify users when triggered

#### 3. Clean Expired Cache
```javascript
exports.cleanExpiredCache = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // MongoDB TTL handles this automatically
    // This is a backup/manual cleanup
  });
```

**Purpose:** Clean up old cached AI responses (mostly handled by MongoDB TTL)

---

## Authentication Pattern

### Protected Routes
Routes that require authentication use `verifyFirebaseToken` middleware:

```javascript
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');

// Apply to all routes in router
router.use(verifyFirebaseToken);

// Or apply to specific routes
router.get('/protected', verifyFirebaseToken, controller.method);
```

### Accessing User ID
Controllers access authenticated user via:
```javascript
const userId = req.user.uid; // Firebase UID
```

---

## Error Handling Flow

```
Request → Route → Controller
                     ↓
                  try/catch
                     ↓
              ┌──────┴──────┐
              ↓             ↓
         Success        Error
              ↓             ↓
         res.json()   next(error)
                           ↓
                   Global Error Handler
                           ↓
                   Format & Send Error Response
```

### Error Handler Features
- Distinguishes operational vs unexpected errors
- Handles Mongoose validation errors
- Handles MongoDB duplicate key errors
- Handles JWT errors
- Consistent error response format
- Logs errors for debugging

---

## Route Parameter Naming

**Consistent naming across all routes:**
- `:ticker` - Stock ticker symbol (e.g., AAPL)
- `:id` - Generic document ID (holdings, alerts)
- `:alertId` - Specific to alerts
- Query params: `?q=query`, `?limit=30`, `?range=1M`, `?isActive=true`

---

## Testing the API

### Local Development
```bash
cd backend/functions
npm install
npm run serve

# API available at:
# http://localhost:5001/<project-id>/<region>/api
```

### Deploy to Firebase
```bash
firebase deploy --only functions

# API available at:
# https://<region>-<project-id>.cloudfunctions.net/api
```

### Test Endpoints with cURL

**Health Check:**
```bash
curl http://localhost:5001/<project-id>/<region>/api/health
```

**Get Stock Quote:**
```bash
curl http://localhost:5001/<project-id>/<region>/api/stocks/AAPL/quote
```

**Get Signal (with auth):**
```bash
curl -H "Authorization: Bearer <firebase-token>" \
  http://localhost:5001/<project-id>/<region>/api/signals/AAPL
```

---

## Environment Variables Required

In `backend/functions/.env`:
```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# APIs
GEMINI_API_KEY=your-gemini-key
MARKET_DATA_API_KEY=your-finnhub-key

# Firebase (for local dev)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## Security Considerations

### 1. CORS Configuration
Currently allows all origins (`origin: true`). In production:
```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true
}));
```

### 2. Rate Limiting
Consider adding rate limiting to prevent abuse:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Cron Job Protection
The `/api/alerts/check` endpoint should be protected in production:
```javascript
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

router.post('/check', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, alertsController.checkAlerts);
```

---

## Summary Statistics

**Total Endpoints:** 27+
- Signals: 3
- Stocks: 7
- AI: 3
- Watchlist: 5
- Alerts: 6
- Holdings: 4
- Health: 1

**Authentication Required:** 15 endpoints
**Public Endpoints:** 13 endpoints

**Scheduled Functions:** 3
- Signal performance update (daily)
- Alert checking (every 5 min)
- Cache cleanup (daily)

---

## Next Steps

1. ✅ Routes configured
2. ✅ Main index.js updated
3. ⏭️ Test all endpoints locally
4. ⏭️ Deploy to Firebase Functions
5. ⏭️ Configure Firebase service account credentials
6. ⏭️ Test authentication flow
7. ⏭️ Implement rate limiting
8. ⏭️ Set up monitoring and logging

---

**Status:** 🎉 All Routes and Main Index Complete!

The backend API is now **fully wired up** and ready for testing and deployment!
