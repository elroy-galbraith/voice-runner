# Voice Runner Deployment Guide

## Quick Start

### Backend → Railway
### Frontend → Vercel

---

## 1. Deploy Backend to Railway

### Step 1: Sign up for Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Get $5 free monthly credit

### Step 2: Deploy from GitHub
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your repository
4. Select the `voice-runner` repository
5. Railway will auto-detect the Dockerfile

### Step 3: Configure Environment Variables
In Railway dashboard → Variables, add:

```bash
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/app/data
```

**Note:** Railway automatically sets the `PORT` environment variable - you don't need to configure it manually.

**Optional (for Cloudflare R2 storage):**
```bash
STORAGE_TYPE=r2
R2_BUCKET=your-bucket-name
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
```

### Step 4: Add Persistent Storage (Important!)
1. In Railway dashboard, go to your service
2. Click **"Variables"** → **"Volumes"**
3. Add a volume:
   - **Mount Path**: `/app/data`
   - **Size**: 1GB (free tier includes 1GB)
4. Redeploy the service

### Step 5: Get Your Backend URL
Railway will give you a public URL like:
```
https://voice-runner-production.up.railway.app
```

Copy this URL - you'll need it for the frontend.

---

## 2. Deploy Frontend to Vercel

### Step 1: Sign up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 2: Deploy from GitHub
1. Click **"Add New"** → **"Project"**
2. Import your `voice-runner` repository
3. Configure settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (default)
   - **Build Command**: Leave empty
   - **Output Directory**: `./`

### Step 3: Add Environment Variable
In Vercel project settings → Environment Variables, add:

```bash
VITE_API_URL=https://your-railway-app.up.railway.app
```

Replace with your actual Railway URL from Step 1.

### Step 4: Deploy
Click **"Deploy"** - Vercel will deploy in ~30 seconds.

Your app will be live at:
```
https://voice-runner.vercel.app
```

---

## 3. Update CORS Settings

After deploying, update your backend to allow the Vercel domain.

**Edit `backend/main.py` line 30-36:**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080",
        "https://voice-runner.vercel.app",  # Your Vercel domain
        "https://*.vercel.app",  # Preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then commit and push - Railway will auto-redeploy.

---

## 4. Update Frontend API URL

**Edit `js/storage.js` around line 10** to use environment variable or production URL:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://your-railway-app.up.railway.app';
```

Replace with your actual Railway URL, commit, and push - Vercel will auto-redeploy.

---

## Testing Your Deployment

1. Visit your Vercel URL
2. Open browser DevTools → Console
3. Complete the game tutorial
4. Check Railway logs to confirm uploads are working:
   ```
   Uploaded session abc-123 with 5 recordings
   ```

---

## Alternative: All-in-One Deployment with Fly.io

If you prefer a single platform for both frontend + backend:

### Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy backend
cd backend
fly launch --name voice-runner-api
fly secrets set STORAGE_TYPE=local LOCAL_STORAGE_PATH=/data
fly volumes create voice_data --size 1 --region ord
fly deploy

# Deploy frontend (serve as static site with Python)
cd ..
fly launch --name voice-runner-app
fly deploy
```

---

## Cost Breakdown

### Free Tier (Recommended for Testing)
- **Railway**: $5/month credit (enough for ~500-1000 requests/day)
- **Vercel**: 100GB bandwidth/month (plenty for testing)
- **Total**: $0/month for moderate testing

### Paid Options (For Production)
- **Railway**: $5/month minimum (pro plan)
- **Cloudflare R2**: $0.015/GB storage + $0.36/million requests
- **Vercel**: Free for hobby projects, $20/month for teams

---

## Monitoring

### Railway Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and view logs
railway login
railway logs
```

### Vercel Logs
View in Vercel dashboard → Deployments → [Your deployment] → Logs

---

## Troubleshooting

### Backend not receiving uploads
1. Check Railway logs for errors
2. Verify CORS settings include your Vercel domain
3. Test backend directly: `https://your-railway-app.up.railway.app/api/health`

### Service Worker not registering
1. Verify HTTPS is enabled (Vercel does this automatically)
2. Check browser console for Service Worker errors
3. Clear cache and reload

### Audio not recording
1. Grant microphone permissions
2. Check browser compatibility (Chrome/Edge recommended)
3. Test on HTTPS (required for getUserMedia API)

---

## Custom Domain (Optional)

### Vercel
1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `voicerunner.com`)
3. Update DNS records as instructed

### Railway
1. Go to Railway project → Settings → Domains
2. Add custom domain
3. Update DNS CNAME record

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ✅ Update CORS and API URLs
4. ✅ Test end-to-end
5. 🎉 Share your link!

For issues, check Railway and Vercel documentation or file an issue on GitHub.
