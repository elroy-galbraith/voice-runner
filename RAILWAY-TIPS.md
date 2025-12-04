# Railway Deployment Tips

## Port Configuration

**Railway automatically provides the `PORT` environment variable** - your app must listen on this port.

### ✅ Correct Setup (Already Done)

Your [backend/Dockerfile](backend/Dockerfile) is configured to use Railway's `$PORT`:

```dockerfile
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

This means:
- On Railway: Uses Railway's assigned port (e.g., 3000, 5000, etc.)
- Locally: Defaults to 8000

### ❌ Common Mistake

Don't hardcode the port:
```dockerfile
CMD uvicorn main:app --host 0.0.0.0 --port 8000  # Wrong!
```

### 🔍 How to Check

After deploying to Railway:

1. Go to your service in Railway dashboard
2. Click "Variables" tab
3. You'll see `PORT` is automatically set (e.g., `PORT=3000`)
4. Railway routes `https://your-app.up.railway.app` → `localhost:3000` inside container

## Generate Domain

**You need to manually generate a public domain:**

1. Railway Dashboard → Your Service
2. **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Railway gives you: `https://your-app-production.up.railway.app`

Without this, your backend won't be publicly accessible!

## Volume Configuration

Your app needs persistent storage for audio files:

1. Railway Dashboard → Your Service
2. Click **"Variables"** → **"Volumes"** tab
3. Add Volume:
   - **Mount Path**: `/app/data`
   - **Size**: 1GB (free tier includes 1GB)
4. **Important**: Redeploy after adding volume

### Data Persistence

- ✅ Data in `/app/data` persists across deploys
- ❌ Data anywhere else is lost on redeploy
- Your [Dockerfile](backend/Dockerfile:15) creates these directories in the volume:
  - `/app/data/audio` - Audio recordings
  - `/app/data/sessions` - Session metadata
  - `/app/data/metadata` - Recording metadata

## Environment Variables Required

Minimum required variables:

```bash
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/app/data
```

Don't set `PORT` - Railway does it automatically.

## Checking Deployment Status

### View Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and view logs
railway login
railway link  # Select your project
railway logs --follow
```

### Check Health
```bash
curl https://your-app.up.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "storage": "local",
  "timestamp": "2025-12-04T10:30:00Z"
}
```

## Testing Upload

After deployment, test the upload endpoint:

```bash
curl -X POST https://your-app.up.railway.app/api/upload \
  -F 'session={"id":"test-123","playerId":"test-player","finalScore":100}' \
  -F 'audio_0=@test.webm' \
  -F 'audio_0_meta={"sessionId":"test-123","phraseId":"p1","phraseText":"Test","phraseTier":1,"phraseCategory":"NEU","phraseRegister":"ACR","gameLevel":1,"gameSpeed":150,"obstacleDistanceAtSpeechStart":500,"timeToSpeechOnsetMs":1000,"speechDurationMs":800,"outcome":"success","scoreAwarded":100,"comboMultiplier":1.0,"timestampUtc":"2025-12-04T10:00:00Z"}'
```

## Common Issues

### "Application failed to respond"
- Check logs: `railway logs`
- Verify `PORT` variable exists (Railway sets it automatically)
- Ensure app listens on `0.0.0.0`, not `127.0.0.1`

### "No domain available"
- Generate domain: Settings → Networking → Generate Domain

### "Data not persisting"
- Verify volume is mounted at `/app/data`
- Check `LOCAL_STORAGE_PATH=/app/data` in environment variables
- Redeploy after adding volume

### "CORS errors from frontend"
- Update [backend/main.py:34](backend/main.py#L34) with your Vercel domain
- Add to `allow_origins`: `"https://your-app.vercel.app"`

## Cost Monitoring

Railway's free tier includes:
- $5/month credit
- 1GB volume storage
- 512MB RAM per service

Your Voice Runner backend typically uses:
- ~50MB RAM idle
- ~100-200MB RAM under load
- ~1-5MB storage per game session

**Estimated capacity on free tier:**
- ~1000-2000 game sessions/month
- ~5000-10000 phrase recordings/month

Check usage:
1. Railway Dashboard → Project
2. View "Usage" tab
3. Monitor credit consumption

## Production Checklist

Before sharing your app:

- ☐ Domain generated and tested
- ☐ Volume mounted at `/app/data`
- ☐ Environment variables set (`STORAGE_TYPE`, `LOCAL_STORAGE_PATH`)
- ☐ CORS configured with frontend domain
- ☐ Health endpoint returns 200: `/api/health`
- ☐ Test upload works (see Testing Upload above)
- ☐ Logs show no errors: `railway logs`
- ☐ Monitor credit usage after sharing

## Upgrading to Paid (Optional)

If you exceed free tier:

1. Railway Pro: $5/month minimum
   - 500 GB-hrs compute (100hrs at 512MB RAM)
   - Additional credits as needed
   - Better uptime guarantees

2. Alternative: Use Cloudflare R2 for storage
   - Set `STORAGE_TYPE=r2`
   - Add R2 credentials (see [DEPLOYMENT.md](DEPLOYMENT.md))
   - Keeps Railway costs low (~$1-2/month)
   - R2: $0.015/GB storage (~$0.15 for 10GB)

## Quick Reference

| Task | Command/Location |
|------|------------------|
| Generate domain | Settings → Networking → Generate Domain |
| View logs | `railway logs --follow` |
| Check health | `curl https://your-app.up.railway.app/api/health` |
| Add volume | Variables → Volumes → Add Volume |
| Monitor usage | Dashboard → Usage tab |
| Download data | See [DATA-ACCESS-GUIDE.md](DATA-ACCESS-GUIDE.md) |

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Your deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)
