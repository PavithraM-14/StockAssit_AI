# Task 15: Holdings Controller - COMPLETE ✅

## Overview
The `holdings.controller.js` has been rewritten with standard CRUD operations, proper validation, authentication scoping, and error handling using try/catch + next(error) pattern.

## File Location
`backend/functions/controllers/holdings.controller.js`

---

## ✅ All Requirements Met

### 1. ✅ getHoldings - GET /holdings

**Authentication:** Uses `req.user.uid` from Firebase middleware

**Logic:**
- Fetches all holdings for authenticated user
- Sorts by creation date (newest first)
- Calculates portfolio summary (total invested)

**Response:**
```javascript
{
  success: true,
  data: [
    {
      _id: '...',
      userId: 'firebase-uid',
      ticker: 'AAPL',
      quantity: 100,
      avgBuyPrice: 150.00,
      purchaseDate: '2024-01-15T00:00:00.000Z',
      notes: 'Long term hold',
      createdAt: '...',
      updatedAt: '...',
    },
    // ... more holdings
  ],
  summary: {
    totalHoldings: 3,
    totalInvested: '25000.00',
  }
}
```

---

### 2. ✅ addHolding - POST /holdings

**Authentication:** Uses `req.user.uid`

**Request Body:**
```javascript
{
  ticker: 'AAPL',          // Required, non-empty string
  quantity: 100,            // Required, > 0
  avgBuyPrice: 150.00,      // Required, > 0
  purchaseDate: '2024-01-15', // Optional, defaults to now
  notes: 'Long term hold'   // Optional
}
```

**Validation:**
- ✅ `ticker`: Required, non-empty string, 1-5 uppercase letters
- ✅ `quantity`: Required, number, > 0
- ✅ `avgBuyPrice`: Required, number, > 0
- ✅ `purchaseDate`: Optional, valid date format, not in future
- ✅ All validation errors throw `AppError` with 400 status

**Response (201):**
```javascript
{
  success: true,
  data: {
    _id: '...',
    userId: 'firebase-uid',
    ticker: 'AAPL',
    quantity: 100,
    avgBuyPrice: 150.00,
    purchaseDate: '2024-01-15T00:00:00.000Z',
    notes: 'Long term hold',
    createdAt: '...',
    updatedAt: '...',
  },
  message: 'Successfully added 100 shares of AAPL'
}
```

---

### 3. ✅ updateHolding - PUT /holdings/:id

**Authentication:** Uses `req.user.uid`

**Authorization:** Verifies user owns the holding (403 if not)

**Request Body (all fields optional):**
```javascript
{
  quantity: 150,           // Optional, > 0 if provided
  avgBuyPrice: 145.00,     // Optional, > 0 if provided
  purchaseDate: '2024-01-20', // Optional, valid date, not future
  notes: 'Updated notes'   // Optional
}
```

**Validation:**
- ✅ `quantity`: If provided, must be > 0
- ✅ `avgBuyPrice`: If provided, must be > 0
- ✅ `purchaseDate`: If provided, valid date, not future
- ✅ Ownership verified before update (403 error if not owner)
- ✅ All validation errors throw `AppError` with 400 status

**Response (200):**
```javascript
{
  success: true,
  data: {
    // ... updated holding
  },
  message: 'Holding updated successfully'
}
```

---

### 4. ✅ deleteHolding - DELETE /holdings/:id

**Authentication:** Uses `req.user.uid`

**Authorization:** Verifies user owns the holding (403 if not)

**Logic:**
- Finds holding by ID
- Verifies ownership
- Deletes from database

**Response (200):**
```javascript
{
  success: true,
  message: 'Successfully deleted AAPL holding'
}
```

**Error (404):**
```javascript
{
  success: false,
  error: 'NOT_FOUND',
  message: 'Holding not found',
  statusCode: 404
}
```

**Error (403):**
```javascript
{
  success: false,
  error: 'FORBIDDEN',
  message: 'You can only delete your own holdings',
  statusCode: 403
}
```

---

## Validation Details

### Input Validation

**Ticker Validation:**
```javascript
// Must be non-empty string
if (!ticker || typeof ticker !== 'string' || ticker.trim().length === 0) {
  throw new AppError('Ticker is required and must be a non-empty string', 400);
}

// Must be 1-5 uppercase letters
if (!/^[A-Z]{1,5}$/.test(tickerUpper)) {
  throw new AppError('Ticker must be 1-5 uppercase letters (e.g., AAPL, GOOGL)', 400);
}
```

**Quantity Validation:**
```javascript
if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
  throw new AppError('Quantity is required and must be greater than 0', 400);
}
```

**Average Buy Price Validation:**
```javascript
if (!avgBuyPrice || typeof avgBuyPrice !== 'number' || avgBuyPrice <= 0) {
  throw new AppError('Average buy price is required and must be greater than 0', 400);
}
```

**Purchase Date Validation:**
```javascript
// Check if valid date
const validDate = new Date(purchaseDate);
if (isNaN(validDate.getTime())) {
  throw new AppError('Invalid purchase date format', 400);
}

// Check not in future
if (validDate > new Date()) {
  throw new AppError('Purchase date cannot be in the future', 400);
}
```

### Ownership Validation

```javascript
// Find holding
const holding = await TrackedHolding.findById(id);

if (!holding) {
  throw new AppError('Holding not found', 404);
}

// Verify ownership
if (holding.userId !== userId) {
  throw new AppError('You can only update your own holdings', 403);
}
```

---

## Error Handling

All functions use **try/catch + next(error)** pattern:

```javascript
exports.addHolding = async (req, res, next) => {
  try {
    // ... main logic
  } catch (error) {
    console.error('Error in addHolding:', error);
    next(error); // Passes to global errorHandler middleware
  }
};
```

### Error Types

**400 Bad Request:**
- Invalid input validation
- Ticker format wrong
- Quantity/price not positive
- Invalid date format

**403 Forbidden:**
- User trying to update/delete someone else's holding

**404 Not Found:**
- Holding ID doesn't exist

**500 Internal Server Error:**
- Database errors
- Unexpected errors

---

## Security Features

### 1. Authentication Required
All endpoints require Firebase authentication:
```javascript
const userId = req.user.uid; // From verifyFirebaseToken middleware
```

### 2. User Scoping
All queries scoped to authenticated user:
```javascript
const holdings = await TrackedHolding.find({ userId });
```

### 3. Ownership Verification
Update/delete operations verify ownership:
```javascript
if (holding.userId !== userId) {
  throw new AppError('You can only update your own holdings', 403);
}
```

### 4. Input Sanitization
- Ticker converted to uppercase
- Strings trimmed
- Type checking on all inputs
- Range validation (positive numbers)

---

## Example Usage

### 1. Get All Holdings
```http
GET /holdings
Authorization: Bearer <firebase-token>

Response (200):
{
  success: true,
  data: [...],
  summary: {
    totalHoldings: 5,
    totalInvested: '50000.00'
  }
}
```

### 2. Add Holding
```http
POST /holdings
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "ticker": "AAPL",
  "quantity": 100,
  "avgBuyPrice": 150.00,
  "purchaseDate": "2024-01-15",
  "notes": "Long term investment"
}

Response (201):
{
  success: true,
  data: { /* holding object */ },
  message: 'Successfully added 100 shares of AAPL'
}
```

### 3. Update Holding
```http
PUT /holdings/507f1f77bcf86cd799439011
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "quantity": 150,
  "avgBuyPrice": 145.00
}

Response (200):
{
  success: true,
  data: { /* updated holding */ },
  message: 'Holding updated successfully'
}
```

### 4. Delete Holding
```http
DELETE /holdings/507f1f77bcf86cd799439011
Authorization: Bearer <firebase-token>

Response (200):
{
  success: true,
  message: 'Successfully deleted AAPL holding'
}
```

---

## Validation Error Examples

### Invalid Ticker (Empty String)
```http
POST /holdings
Body: { "ticker": "", "quantity": 100, "avgBuyPrice": 150 }

Response (400):
{
  success: false,
  error: 'BAD_REQUEST',
  message: 'Ticker is required and must be a non-empty string',
  statusCode: 400
}
```

### Invalid Ticker Format
```http
POST /holdings
Body: { "ticker": "TOOLONG", "quantity": 100, "avgBuyPrice": 150 }

Response (400):
{
  success: false,
  error: 'BAD_REQUEST',
  message: 'Ticker must be 1-5 uppercase letters (e.g., AAPL, GOOGL)',
  statusCode: 400
}
```

### Negative Quantity
```http
POST /holdings
Body: { "ticker": "AAPL", "quantity": -10, "avgBuyPrice": 150 }

Response (400):
{
  success: false,
  error: 'BAD_REQUEST',
  message: 'Quantity is required and must be greater than 0',
  statusCode: 400
}
```

### Zero Price
```http
POST /holdings
Body: { "ticker": "AAPL", "quantity": 100, "avgBuyPrice": 0 }

Response (400):
{
  success: false,
  error: 'BAD_REQUEST',
  message: 'Average buy price is required and must be greater than 0',
  statusCode: 400
}
```

### Future Date
```http
POST /holdings
Body: {
  "ticker": "AAPL",
  "quantity": 100,
  "avgBuyPrice": 150,
  "purchaseDate": "2030-01-01"
}

Response (400):
{
  success: false,
  error: 'BAD_REQUEST',
  message: 'Purchase date cannot be in the future',
  statusCode: 400
}
```

---

## Route Setup (for reference)

```javascript
const router = require('express').Router();
const holdingsController = require('../controllers/holdings.controller');
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');

// All holdings routes require authentication
router.use(verifyFirebaseToken);

router.get('/holdings', holdingsController.getHoldings);
router.post('/holdings', holdingsController.addHolding);
router.put('/holdings/:id', holdingsController.updateHolding);
router.delete('/holdings/:id', holdingsController.deleteHolding);

module.exports = router;
```

---

## Database Schema

The TrackedHolding model uses:
```javascript
{
  userId: String (indexed, required),
  ticker: String (uppercase, 1-5 letters, required),
  quantity: Number (min: 0, required),
  avgBuyPrice: Number (min: 0, required),
  purchaseDate: Date (required, default: now),
  notes: String (max: 500 chars, optional),
  createdAt: Date (auto),
  updatedAt: Date (auto),
}
```

**Indexes:**
- `{ userId: 1, ticker: 1 }` - User's specific holding
- `{ userId: 1, createdAt: -1 }` - User's holdings by date
- `{ ticker: 1 }` - All holdings for a ticker

---

## Testing Checklist

**getHoldings:**
- [ ] GET with auth - Returns user's holdings
- [ ] GET without auth - Returns 401
- [ ] GET with empty portfolio - Returns empty array with summary

**addHolding:**
- [ ] POST with valid data - Creates holding (201)
- [ ] POST without ticker - Returns 400
- [ ] POST with empty ticker - Returns 400
- [ ] POST with invalid ticker format - Returns 400
- [ ] POST with quantity ≤ 0 - Returns 400
- [ ] POST with avgBuyPrice ≤ 0 - Returns 400
- [ ] POST with future date - Returns 400
- [ ] POST with invalid date format - Returns 400
- [ ] POST without purchaseDate - Uses current date
- [ ] POST without notes - Defaults to empty string

**updateHolding:**
- [ ] PUT owned holding - Updates successfully (200)
- [ ] PUT non-existent ID - Returns 404
- [ ] PUT other user's holding - Returns 403
- [ ] PUT with invalid quantity - Returns 400
- [ ] PUT with invalid avgBuyPrice - Returns 400
- [ ] PUT with future date - Returns 400
- [ ] PUT with partial data - Updates only provided fields

**deleteHolding:**
- [ ] DELETE owned holding - Deletes successfully (200)
- [ ] DELETE non-existent ID - Returns 404
- [ ] DELETE other user's holding - Returns 403

---

## File Statistics

- **Lines:** ~220
- **Functions:** 4 main exports
- **Validation:** Comprehensive input validation with AppError
- **Security:** User scoping + ownership verification
- **Error Handling:** try/catch + next(error) pattern

---

**Status:** ✅ Task 15 Complete

**Matches All Requirements:**
- ✅ Standard CRUD operations
- ✅ All endpoints scoped to req.user.uid
- ✅ Input validation (quantity > 0, ticker non-empty, avgBuyPrice > 0)
- ✅ Throws AppError with 400 on invalid input
- ✅ Uses try/catch + next(error) pattern
- ✅ Ownership verification for update/delete
- ✅ Proper HTTP status codes
- ✅ Comprehensive logging
