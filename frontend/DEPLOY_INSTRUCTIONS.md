# Deploy to Vercel - Quick Guide

## ✅ Prerequisites

- ✅ React app built successfully (`dist/` folder ready)
- ✅ Backend deployed to Encore Cloud
- ✅ Environment variables configured

## 🚀 Deploy Now

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser for authentication.

### Step 3: Deploy

```bash
cd frontend
vercel
```

**Follow the prompts:**
- Set up and deploy? **Yes**
- Which scope? **[Your account]**
- Link to existing project? **No**
- Project name? **screengraph-frontend**
- Directory? **./** (current directory)
- Override settings? **No**

### Step 4: Production Deploy

```bash
vercel --prod
```

---

## ⚙️ Environment Variables

After deployment, set in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Name:** `PUBLIC_API_BASE`
   - **Value:** `https://steering-wheel-documentation-65b2.encr.app`
   - **Environment:** Production, Preview, Development
3. Save and redeploy

---

## 🔍 Alternative: GitHub Integration

### Option A: GitHub Integration (Recommended)

1. Push to GitHub:
```bash
git add -A
git commit -m "feat: prepare for Vercel deployment"
git push origin main
```

2. Connect to Vercel:
   - Go to https://vercel.com/dashboard
   - Click "Add New Project"
   - Import from GitHub
   - Select your repository

3. Configure Project:
   - **Root Directory:** `frontend`
   - **Build Command:** `bun run build`
   - **Output Directory:** `dist`
   - **Install Command:** `bun install`

4. Set Environment Variables:
   - `PUBLIC_API_BASE` = `https://steering-wheel-documentation-65b2.encr.app`

5. Deploy!

Every push to `main` will auto-deploy.

---

## ✅ Verification

After deployment, test:

- [ ] Visit your Vercel URL
- [ ] Start a new run
- [ ] View run timeline
- [ ] Check WebSocket streaming
- [ ] Verify steering wheel loads

---

## 📝 Current Status

**Backend:** ✅ Deployed to Encore Cloud  
**Frontend:** ⏳ Ready to deploy to Vercel  
**Build:** ✅ Successfully built (`dist/` folder ready)

---

## 🎯 Your Deployment URLs

Once deployed:
- **Frontend:** `https://screengraph-frontend.vercel.app` (or your custom domain)
- **Backend:** `https://steering-wheel-documentation-65b2.encr.app`

---

**Run `vercel login` and `vercel` to deploy now!**
