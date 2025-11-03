# 🚀 EduVoyage - Render Deployment Guide

## 📋 Overview

This guide explains how to deploy EduVoyage Portal to Render with a single-server architecture where Express serves both the API and React frontend.

---

## 🏗️ Architecture

```
Client Request → Render → Express Server (Port 10000)
                          ├─ /api/* → Backend Routes (API)
                          └─ /* → React Static Files (Frontend)
```

**Benefits:**
- ✅ Single deployment (only server folder)
- ✅ No CORS issues (same origin)
- ✅ Faster performance (static files)
- ✅ Cost effective (one service)
- ✅ Simple configuration

---

## 📦 Pre-Deployment Setup

### 1. Install Dependencies

```powershell
# Install fs-extra for build script
cd client
npm install
```

### 2. Test Local Production Build

```powershell
# Build frontend and copy to server
cd client
npm run build:render

# Verify files copied
dir ..\server\public

# Test production mode
cd ..\server
$env:NODE_ENV="production"
npm start

# Open http://localhost:5000
# Should see React app served from Express!
```

### 3. Prepare Environment Variables

Create a list of your environment variables:

#### Required Variables:
```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eduvoyage?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
CLIENT_URL=https://your-app-name.onrender.com
```

#### Email Configuration:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@eduvoyage.com
```

#### Cloudinary (Optional - for file uploads):
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. MongoDB Atlas Setup

1. **Go to**: https://cloud.mongodb.com/
2. **Create/Select Cluster**
3. **Network Access** → Add IP: `0.0.0.0/0` (allow all)
4. **Database Access** → Create user with password
5. **Copy Connection String** → Replace `<password>` and `<dbname>`

---

## 🌐 Deployment Methods

### Method 1: Render Dashboard (Recommended)

#### Step 1: Connect GitHub

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select repository: `MSD-University-Admission-Portal`

#### Step 2: Configure Service

```yaml
Name: eduvoyage-portal
Region: Singapore (or closest to your users)
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm run render-build
Start Command: npm start
Instance Type: Free
Auto-Deploy: Yes
```

#### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add all variables from your `.env` file:
- `NODE_ENV` = `production`
- `PORT` = `10000`
- `MONGO_URI` = `your-mongodb-connection-string`
- `JWT_SECRET` = `your-secret-key`
- etc.

#### Step 4: Create Service

Click **"Create Web Service"**

Wait 5-10 minutes for:
- ✅ Dependencies installation
- ✅ Client build
- ✅ Server start
- ✅ Health check pass

#### Step 5: Get Your URL

Your app will be available at:
```
https://eduvoyage-portal.onrender.com
```

---

### Method 2: Blueprint (render.yaml)

The `render.yaml` file is already configured in the root directory.

#### Step 1: Push to GitHub

```powershell
git add .
git commit -m "chore: add Render deployment configuration"
git push origin main
```

#### Step 2: Create from Blueprint

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will auto-configure from `render.yaml`
5. Add environment variables when prompted
6. Click **"Apply"**

---

## ✅ Post-Deployment Checklist

After deployment completes:

### 1. Check Deployment Logs
```
✓ Installing dependencies...
✓ Building client...
✓ Copying build files...
✓ Starting server...
✓ MongoDB connected
✓ Server listening on port 10000
```

### 2. Test Frontend
- [ ] Visit: `https://your-app-name.onrender.com`
- [ ] Home page loads
- [ ] Navigation works
- [ ] Images load
- [ ] No console errors

### 3. Test API Endpoints
- [ ] Health Check: `https://your-app-name.onrender.com/api/health`
- [ ] Login works
- [ ] Register works
- [ ] Dashboard loads

### 4. Test Features
- [ ] Course browsing
- [ ] Application submission
- [ ] File uploads (if Cloudinary configured)
- [ ] Email notifications (if email configured)
- [ ] Admin dashboard

---

## 🔧 Troubleshooting

### Issue: Build Failed

**Symptoms:**
```
Build failed: Command failed with exit code 1
```

**Solutions:**
1. Check build logs for specific error
2. Verify `render-build` script in `server/package.json`
3. Ensure all dependencies are in `package.json` (not devDependencies)
4. Test local build: `cd server && npm run render-build`

---

### Issue: Static Files Not Loading

**Symptoms:**
- Blank page
- 404 errors for JS/CSS files
- "Cannot GET /" error

**Solutions:**
1. Check if `server/public` folder exists and has files
2. Verify build command ran successfully in logs
3. Check static file serving in `server/index.js`
4. Ensure `NODE_ENV=production` is set

---

### Issue: API Routes Return 404

**Symptoms:**
```
GET /api/courses → 404 Not Found
```

**Solutions:**
1. Verify routes are prefixed with `/api`
2. Check route imports in `server/index.js`
3. Ensure API routes are defined before `app.get('*')`
4. Test API directly: `https://your-app.onrender.com/api/health`

---

### Issue: MongoDB Connection Failed

**Symptoms:**
```
MongooseError: Could not connect to MongoDB
```

**Solutions:**
1. Verify `MONGO_URI` in environment variables
2. Check MongoDB Atlas IP whitelist (use `0.0.0.0/0`)
3. Verify database user credentials
4. Check MongoDB Atlas cluster status
5. Test connection string locally first

---

### Issue: "Application Error" Page

**Symptoms:**
- Render shows "Application Error"
- Service won't start

**Solutions:**
1. Check Render logs for error details
2. Verify all required environment variables are set
3. Check `package.json` has correct start command
4. Ensure MongoDB is accessible
5. Test locally with production env vars

---

### Issue: Slow First Load

**Symptoms:**
- First request takes 30+ seconds
- Subsequent requests are fast

**Explanation:**
- Render free tier spins down after 15 minutes of inactivity
- First request wakes up the service

**Solutions:**
1. Upgrade to paid tier (no spin down)
2. Use external monitoring service to ping every 10 minutes
3. Inform users about initial delay
4. Add loading message

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Render automatically deploys when you push to GitHub:

```powershell
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Render will automatically:
# 1. Detect the push
# 2. Run build command
# 3. Deploy new version
# 4. Health check
# 5. Switch traffic to new version
```

### Manual Deploy

1. Go to Render Dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 Monitoring

### View Logs

```
Render Dashboard → Your Service → Logs
```

Logs show:
- Application logs
- Build logs
- Error logs
- Request logs

### Health Check

Monitor uptime at:
```
https://your-app-name.onrender.com/api/health
```

Response:
```json
{
  "status": "ok",
  "message": "EduVoyage Portal is running",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "uptime": 12345.67
}
```

---

## 🎯 Performance Tips

### 1. Enable Compression
Already configured in `server/index.js`:
```javascript
app.use(compression());
```

### 2. Set Cache Headers
Already configured for static files:
```javascript
const staticOptions = {
  maxAge: '1y',
  immutable: true
};
```

### 3. Use Environment-Specific Configs
```javascript
if (process.env.NODE_ENV === 'production') {
  // Production-specific optimizations
}
```

---

## 🔐 Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable CORS only for your domain
- [ ] Set secure cookie options
- [ ] Enable rate limiting (already configured)
- [ ] Use HTTPS (automatic on Render)
- [ ] Set proper CSP headers (already configured)
- [ ] Don't commit `.env` files
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated

---

## 💰 Cost Estimation

### Free Tier Limits:
- ✅ 750 hours/month (always on)
- ✅ 1 GB RAM
- ✅ Shared CPU
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Limited build minutes

### Paid Tier ($7/month):
- ✅ No spin down
- ✅ Faster builds
- ✅ More resources
- ✅ Better performance

---

## 📝 Useful Commands

```powershell
# Local production test
cd client
npm run build:render
cd ../server
$env:NODE_ENV="production"
npm start

# View build output
dir server/public

# Check server logs locally
cd server
npm start

# Git operations
git status
git add .
git commit -m "your message"
git push origin main
```

---

## 🆘 Support Resources

- **Render Docs**: https://render.com/docs
- **Node.js Deployment**: https://render.com/docs/deploy-node-express-app
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **GitHub Issues**: Report issues in your repository

---

## ✅ Success Indicators

Your deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Health check returns 200 OK
3. ✅ Frontend loads at root URL
4. ✅ API responds at /api/* endpoints
5. ✅ MongoDB connection established
6. ✅ Users can register/login
7. ✅ All features work as expected

---

**Congratulations! Your EduVoyage Portal is now live! 🎉**

Your URL: `https://eduvoyage-portal.onrender.com`

---

*Last Updated: November 3, 2025*
*Version: 1.0*
