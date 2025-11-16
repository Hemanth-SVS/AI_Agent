# Setup Guide - How to Apply All Changes

## ✅ Good News: Changes Are Already Applied!

All the code changes have been **automatically saved** to your project files. You don't need to manually copy/paste anything - the files are already updated!

---

## 📋 Step-by-Step Setup

### Step 1: Verify Files Are There

Check that new files exist:

```bash
# Navigate to your project
cd C:\Users\heman\Downloads\VOTER

# Check Backend utils (should see new files)
dir Backend\utils

# Check AI Backend utils (should see new files)
dir AI_Backend\utils

# Check Frontend components
dir AI_Frontend\src\components\ErrorBoundary.jsx
```

You should see:
- `envValidator.js`
- `logger.js`
- `sanitize.js`
- `healthCheck.js`
- `ErrorBoundary.jsx`

---

### Step 2: Set Up Environment Variables

#### For Backend (Port 5000)

Create/Update `Backend/.env`:

```env
# Required
MONGO_URI=mongodb://localhost:27017/voter-portal
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=30d

# Optional
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
VOTER_PORTAL_URL=http://localhost:5000
DEMO_MODE=true
OTP_EXPIRY_MINUTES=5
```

#### For AI Backend (Port 4000)

Create/Update `AI_Backend/.env`:

```env
# Required
GEMINI_API_KEY=your-gemini-api-key-here
MONGO_URI=mongodb://localhost:27017/voter-agent-db

# Optional
GEMINI_MODEL=gemini-2.0-flash
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
VOTER_PORTAL_URL=http://localhost:5000
```

---

### Step 3: Install Dependencies (if needed)

```bash
# Backend
cd Backend
npm install

# AI Backend
cd ../AI_Backend
npm install

# AI Frontend
cd ../AI_Frontend
npm install
```

---

### Step 4: Test the Changes

#### Test 1: Environment Validation

```bash
# Start Backend
cd Backend
npm start
```

**Expected Output:**
```
✅ Environment variables validated
[INFO] 2024-01-XX - Server running on http://localhost:5000
```

If you see errors about missing env variables, create the `.env` file (Step 2).

#### Test 2: Health Check

```bash
# Backend is running, open browser or use curl:
# http://localhost:5000/api/health

# Or use PowerShell:
Invoke-WebRequest -Uri http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "uptime": 123.45,
  "database": "connected",
  "memory": {...}
}
```

#### Test 3: Input Sanitization

Try registering with invalid data:
- Invalid email: `test@invalid` → Should be rejected
- Invalid mobile: `123` → Should be rejected
- Invalid Aadhaar: `12345` → Should be rejected

All should show proper error messages.

---

### Step 5: Start All Services

#### Terminal 1 - Main Backend
```bash
cd Backend
npm start
# Should show: ✅ Environment variables validated
```

#### Terminal 2 - AI Backend
```bash
cd AI_Backend
npm start
# Should show: ✅ Environment variables validated
```

#### Terminal 3 - AI Frontend
```bash
cd AI_Frontend
npm start
# Opens http://localhost:3000
```

#### Main Frontend
- Already served by Backend at: `http://localhost:5000`

---

## 🔍 Verify Changes Are Working

### Check 1: Logging
When you make API calls, you should see structured logs:
```
[INFO] 2024-01-XX - User logged in: user@example.com
[ERROR] 2024-01-XX - Login error
```

### Check 2: Error Handling
- Try accessing `/api/register/submit` without token
- Should get user-friendly error (not stack trace in production)

### Check 3: Health Checks
- `http://localhost:5000/api/health` → Should return health status
- `http://localhost:4000/health` → Should return health status

### Check 4: Input Sanitization
- Try submitting form with `<script>alert('xss')</script>` in name field
- Should be sanitized/escaped

---

## 🐛 Troubleshooting

### Issue: "Cannot find module './utils/envValidator'"

**Solution:**
```bash
# Make sure you're in the right directory
cd Backend
# Check file exists
dir utils\envValidator.js
```

### Issue: "Missing required environment variables"

**Solution:**
1. Create `.env` file in `Backend/` or `AI_Backend/`
2. Add required variables (see Step 2)
3. Restart the server

### Issue: "MongoDB connection failed"

**Solution:**
1. Make sure MongoDB is running
2. Check `MONGO_URI` in `.env` file
3. Try: `mongodb://localhost:27017/voter-portal`

### Issue: "GEMINI_API_KEY not found"

**Solution:**
1. Get API key from Google AI Studio
2. Add to `AI_Backend/.env`:
   ```
   GEMINI_API_KEY=your-actual-key-here
   ```

---

## 📝 Quick Reference

### New Features Added:
- ✅ Environment variable validation
- ✅ Structured logging
- ✅ Input sanitization
- ✅ Health check endpoints
- ✅ Error boundaries
- ✅ Production configurations

### Files Modified:
- All controllers now have sanitization
- All servers have environment validation
- Error handling improved everywhere
- Frontend has error boundaries

### Files Created:
- 12 new utility/middleware files
- Documentation files

---

## 🚀 Next Steps

1. ✅ Verify files exist (Step 1)
2. ✅ Set up .env files (Step 2)
3. ✅ Test the changes (Step 4)
4. ✅ Start all services (Step 5)
5. ✅ Test functionality end-to-end

**Everything is ready to use!** 🎉

---

## 💡 Need Help?

If something doesn't work:
1. Check error messages in console
2. Verify `.env` files are correct
3. Check MongoDB is running
4. Verify all dependencies installed (`npm install`)
5. Check the `CHANGES_SUMMARY.md` for details

All changes are already in your files - just set up the environment variables and start the servers!

