#!/bin/bash
# Voice Runner Deployment Helper Script

set -e

echo "🎮 Voice Runner Deployment Helper"
echo "=================================="
echo ""

# Check if Railway backend URL is set
if [ -z "$RAILWAY_BACKEND_URL" ]; then
    echo "⚠️  Please set your Railway backend URL first:"
    echo ""
    echo "   export RAILWAY_BACKEND_URL=https://your-app.up.railway.app"
    echo ""
    echo "After deploying to Railway, run this script again."
    exit 1
fi

echo "✅ Backend URL: $RAILWAY_BACKEND_URL"
echo ""

# Update storage.js with the backend URL
echo "📝 Updating API endpoint in js/storage.js..."
sed -i.bak "s|https://your-api.fly.dev/api|${RAILWAY_BACKEND_URL}/api|g" js/storage.js

if [ $? -eq 0 ]; then
    echo "✅ Updated js/storage.js"
    rm js/storage.js.bak
else
    echo "❌ Failed to update js/storage.js"
    exit 1
fi

# Update backend CORS to allow Vercel
echo ""
echo "📝 Reminder: Update backend/main.py CORS settings with your Vercel domain"
echo ""
echo "Add to allow_origins list:"
echo '  "https://your-app.vercel.app",'
echo '  "https://*.vercel.app",'
echo ""

# Commit changes
echo "📦 Committing changes..."
git add js/storage.js
git commit -m "chore: update API endpoint for production deployment" || echo "No changes to commit"

echo ""
echo "✅ Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push"
echo "2. Railway will auto-deploy backend"
echo "3. Vercel will auto-deploy frontend"
echo ""
echo "🎉 Your app will be live in ~1 minute!"
