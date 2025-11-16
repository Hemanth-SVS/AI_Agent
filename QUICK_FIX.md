# Quick Fix for Port 5000 Error

## ✅ Solution: Kill Process Using Port 5000

Run these commands in PowerShell:

```powershell
# Step 1: Find what's using port 5000
netstat -ano | findstr :5000

# Step 2: Kill the process (replace <PID> with the actual Process ID)
taskkill /PID <PID> /F

# Step 3: Start your server
cd Backend
npm start
```

## 🔄 Alternative: Use Different Port

If you can't kill the process, change the port:

1. **Edit `Backend/.env`:**
   ```env
   PORT=5001
   ```

2. **Start server:**
   ```powershell
   cd Backend
   npm start
   ```

## 📝 What I Fixed

I've improved the error handling so you'll get better error messages if this happens again. The server will now tell you exactly what to do!

---

**Try starting your server again now!**

```powershell
cd Backend
npm start
```

