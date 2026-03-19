# 🔧 Render Deployment Troubleshooting Guide

## ✅ **Fixes Applied (Nov 3, 2025)**

### **Issue: Health Check Timeout**
```
Error: ==> Timed Out
Build successful but service failed health check
```

### **Root Causes Identified:**
1. ❌ Server not binding to `0.0.0.0` (required for Render)
2. ❌ MongoDB connection was blocking server startup
3. ❌ Health check endpoint too complex
4. ❌ No simple health endpoint for load balancers

---

## 🔧 **Solutions Implemented**

### **1. Bind Server to 0.0.0.0 (CRITICAL)**

**Before:**
```javascript
app.listen(PORT, ()=> {
  console.log('Server running on port', PORT);
});
```

**After:**
```javascript
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, ()=> {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
});
```

**Why:** Render requires binding to `0.0.0.0` to accept external connections.

---

### **2. Add Simple Health Check Endpoint**

**Added:**
```javascript
// Root health check (for load balancers)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
```

**Why:** Load balancers need a fast, simple endpoint that always responds quickly.

---

### **3. Enhanced API Health Check**

**Before:**
```javascript
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'EduVoyage Portal is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

**After:**
```javascript
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'ok', 
    message: 'EduVoyage Portal is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});
```

**Why:** Provides detailed status information for debugging.

---

### **4. Non-Blocking MongoDB Connection**

**Before:**
```javascript
mongoose.connect(MONGO, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(()=> {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error(err);
  });
```

**After:**
```javascript
// Connect to MongoDB (non-blocking)
mongoose.connect(MONGO, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(()=> {
    console.log('MongoDB connected');
    logger.info('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    logger.error('MongoDB connection error:', err);
  });
```

**Why:** Server should start and respond to health checks even if MongoDB is slow to connect.

---

### **5. Updated render.yaml**

**Changed:**
```yaml
healthCheckPath: /health  # Simpler endpoint
```

**Why:** Faster response time for load balancer checks.

---

## 🚀 **Expected Deployment Flow**

1. ✅ Render clones GitHub repo
2. ✅ Runs build command: `cd server && npm run render-build`
   - Installs server dependencies
   - Builds client (Vite)
   - Copies client build to server/public
3. ✅ Runs start command: `cd server && npm start`
4. ✅ Server binds to `0.0.0.0:10000`
5. ✅ Render checks `/health` endpoint
6. ✅ Gets `200 OK` response within 90 seconds
7. ✅ Deployment succeeds! 🎉

---

## 📊 **Monitoring Deployment**

### **Check Build Logs:**
```
==> Running build command
✓ Client built successfully
✓ Build files copied
==> Build successful 🎉
```

### **Check Deployment Logs:**
```
==> Running 'npm start'
Server running on 0.0.0.0:10000
Environment: production
Health check: http://0.0.0.0:10000/api/health
MongoDB connected
==> Your service is live 🎉
```

### **Test Health Endpoints:**

**Simple Health Check:**
```bash
curl https://msd-university-admission-portal-2.onrender.com/health
# Expected: OK
```

**Detailed Health Check:**
```bash
curl https://msd-university-admission-portal-2.onrender.com/api/health
# Expected: {"status":"ok","message":"EduVoyage Portal is running",...}
```

---

## 🔍 **Common Render Errors & Solutions**

### **Error: "Timed Out"**
**Cause:** Server not responding to health checks within 90 seconds

**Solutions:**
- ✅ Bind to `0.0.0.0` (not `localhost`)
- ✅ Add simple `/health` endpoint
- ✅ Make MongoDB connection non-blocking
- ✅ Ensure PORT is set correctly

---

### **Error: "Build Failed"**
**Cause:** Dependencies missing or build script error

**Solutions:**
- Check `npm run render-build` works locally
- Ensure `--include=dev` flag for Vite
- Verify `fs-extra` is installed

---

### **Error: "No Response from Server"**
**Cause:** Server crashed or port mismatch

**Solutions:**
- Check Render logs for errors
- Verify `PORT` environment variable
- Check MongoDB URI is correct
- Ensure all required env vars are set

---

### **Error: "Cannot GET /"**
**Cause:** Static files not served or build missing

**Solutions:**
- Verify `server/public` folder exists
- Check Express static middleware
- Ensure Vite build completed successfully

---

## ⚙️ **Render Environment Variables Checklist**

Required variables in Render dashboard:

```env
✅ PORT=10000
✅ NODE_ENV=production
✅ MONGO_URI=mongodb+srv://...
✅ JWT_SECRET=your_secret
✅ JWT_REFRESH_SECRET=your_refresh_secret
✅ ADMIN_EMAIL=admin@vignan.edu
✅ ADMIN_PASSWORD=Admin@123
✅ CLIENT_URL=https://msd-university-admission-portal-2.onrender.com
```

Optional (for full functionality):
```env
⚠️ EMAIL_HOST=smtp.gmail.com
⚠️ EMAIL_PORT=587
⚠️ EMAIL_USER=your-email@gmail.com
⚠️ EMAIL_PASS=your-app-password
⚠️ CLOUDINARY_CLOUD_NAME=your_cloud
⚠️ CLOUDINARY_API_KEY=your_key
⚠️ CLOUDINARY_API_SECRET=your_secret
```

---

## 🎯 **Verification Steps After Deployment**

1. **Check Render Dashboard:**
   - Status should be "Live" (green)
   - No error messages in logs

2. **Test Health Endpoints:**
   ```bash
   # Simple check
   curl https://msd-university-admission-portal-2.onrender.com/health
   
   # Detailed check
   curl https://msd-university-admission-portal-2.onrender.com/api/health
   ```

3. **Test Homepage:**
   ```bash
   curl -I https://msd-university-admission-portal-2.onrender.com
   # Expected: HTTP/1.1 200 OK
   ```

4. **Test API Endpoint:**
   ```bash
   curl https://msd-university-admission-portal-2.onrender.com/api/courses
   # Expected: JSON array of courses
   ```

5. **Test in Browser:**
   - Visit: https://msd-university-admission-portal-2.onrender.com
   - Should see EduVoyage homepage
   - Try logging in
   - Check browser console for errors

---

## 📝 **Latest Commit (Nov 3, 2025)**

```
Commit: 6711c9d
Message: fix: resolve Render health check timeout
- Bind server to 0.0.0.0 for production
- Add simple /health endpoint for load balancers
- Make MongoDB connection non-blocking
- Add detailed health status info
- Update health check path in render.yaml
```

---

## 🆘 **If Deployment Still Fails**

### **1. Check Render Logs:**
Go to Render Dashboard → Your Service → Logs

Look for:
- MongoDB connection errors
- Port binding errors
- Missing environment variables
- Module not found errors

### **2. Test Locally in Production Mode:**
```powershell
cd server
$env:NODE_ENV="production"
$env:PORT="10000"
npm start
```

Visit: http://localhost:10000/health

### **3. Verify MongoDB Atlas:**
- Check IP whitelist includes `0.0.0.0/0`
- Verify connection string is correct
- Test connection from Render IP

### **4. Check GitHub Repository:**
- Ensure latest code is pushed
- Verify `server/public` is in .gitignore (build files should be generated, not committed)

### **5. Contact Support:**
If all else fails, reach out to:
- Render Support: https://render.com/docs/support
- GitHub Issues: Create issue in your repo

---

## ✅ **Success Indicators**

When deployment succeeds, you'll see:

**In Render Dashboard:**
```
✅ Status: Live
✅ Last Deploy: Just now
✅ Health: Healthy
```

**In Logs:**
```
Server running on 0.0.0.0:10000
Environment: production
MongoDB connected
==> Your service is live 🎉
```

**In Browser:**
```
https://msd-university-admission-portal-2.onrender.com
→ EduVoyage homepage loads
→ All pages accessible
→ API calls work
→ No console errors
```

---

## 🎉 **Current Status**

**Deployment:** In Progress (waiting for Render to redeploy)  
**Expected Time:** 3-5 minutes  
**Commit:** 6711c9d  
**Fixes Applied:** ✅ All critical fixes implemented  

**Monitor at:** https://dashboard.render.com/

---

Last Updated: November 3, 2025  
Next Step: Wait for automatic redeploy and verify at live URL
