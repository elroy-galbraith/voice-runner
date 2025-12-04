# 🚀 Quick Deploy Guide

## TL;DR - Get Your App Online in 10 Minutes

### Option 1: Railway + Vercel (Recommended)

#### Step 1: Backend → Railway (3 min)
```bash
1. Go to railway.app → Sign in with GitHub
2. New Project → Deploy from GitHub → Select voice-runner
3. Add Variables:
   - STORAGE_TYPE = local
   - LOCAL_STORAGE_PATH = /app/data
   (Railway auto-sets PORT - don't add it manually)
4. Add Volume: /app/data (1GB)
5. Settings → Networking → Generate Domain
6. Copy your Railway URL: voice-runner-production.up.railway.app
```

#### Step 2: Frontend → Vercel (2 min)
```bash
1. Go to vercel.com → Sign in with GitHub
2. New Project → Import voice-runner
3. Root: ./ → Build: (empty) → Output: ./
4. Deploy!
5. Copy your Vercel URL: https://voice-runner.vercel.app/
```

#### Step 3: Connect Them (5 min)
```bash
# Update frontend to use Railway backend
export RAILWAY_BACKEND_URL=voice-runner-production.up.railway.app
./deploy.sh

# Update backend to allow Vercel frontend
# Edit backend/main.py line 34:
"https://your-app.vercel.app",

# Push changes
git add .
git commit -m "chore: configure production URLs"
git push
```

**Done! 🎉** Your app is live at `https://xxx.vercel.app`

---

## Option 2: All-in-One with Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy backend
cd backend
fly launch --name voice-runner-api
fly volumes create data --size 1
fly deploy

# Deploy frontend
cd ..
fly launch --name voice-runner-app
fly deploy

# Get URL
fly status
```

---

## Testing Your Deployment

1. Visit your Vercel/Fly URL
2. Play the game (speak some phrases)
3. Check Railway/Fly logs:
   ```bash
   railway logs  # Railway
   fly logs      # Fly.io
   ```
4. Should see: `"Uploaded session abc-123 with N recordings"`

---

## Common Issues

### "CORS error" when uploading
→ Add your Vercel domain to `backend/main.py` CORS settings

### "Service Worker not loading"
→ Check HTTPS is enabled (Vercel/Fly do this automatically)

### "Backend not responding"
→ Check Railway/Fly logs for errors
→ Test backend health: `curl https://your-backend.com/api/health`

---

## Costs

**Free Tier (perfect for testing/demos):**
- Railway: $5/month credit (≈1000+ plays)
- Vercel: 100GB bandwidth (≈10,000+ plays)
- **Total: $0/month**

**Production Ready:**
- Railway Pro: $5/month
- Cloudflare R2: ~$1/month for 10GB storage
- **Total: ~$6/month**

---

## Share Your App

Once deployed, share:
```
🎮 Try Voice Runner!
https://your-app.vercel.app

Help collect Caribbean voice data for AI research!
```

---

## Need Help?

See full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
