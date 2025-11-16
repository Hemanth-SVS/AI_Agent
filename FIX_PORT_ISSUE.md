# Fix Port Already in Use Error

## 🔍 Problem
Port 5000 (or 4000) is already being used by another process.

## ✅ Solution Options

### Option 1: Kill the Process Using Port 5000 (Recommended)

**Step 1: Find the process**
```powershell
netstat -ano | findstr :5000
```

**Step 2: Kill the process**
```powershell
taskkill /PID 2232 /F
```

**Step 3: Start your server again**
```powershell
cd Backend
npm start
```

---

### Option 2: Use a Different Port

**Step 1: Update `.env` file**
```env
PORT=5001
```

**Step 2: Update frontend URL if needed**
```env
FRONTEND_URL=http://localhost:3000
VOTER_PORTAL_URL=http://localhost:5001
```

**Step 3: Start server**
```powershell
cd Backend
npm start
```

---

### Option 3: Find and Kill All Node Processes

If you're not sure which process is using the port:

```powershell
# Find all Node processes
tasklist | findstr node

# Kill all Node processes (be careful!)
taskkill /IM node.exe /F
```

---

## 🛠️ Quick Fix Commands

**For Port 5000:**
```powershell
# Find process
netstat -ano | findstr :5000

# Kill it (replace 2232 with actual PID)
taskkill /PID 2232 /F

# Start server
cd Backend
npm start
```

**For Port 4000 (AI Backend):**
```powershell
# Find process
netstat -ano | findstr :4000

# Kill it
taskkill /PID <PID> /F

# Start server
cd AI_Backend
npm start
```

---

## ✅ After Fixing

You should see:
```
✅ Environment variables validated
[INFO] Server running on http://localhost:5000
```

If you still see errors, check:
1. MongoDB is running
2. `.env` file has correct values
3. No other services using the ports

