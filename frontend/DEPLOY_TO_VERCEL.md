# Deploy React Frontend to Vercel

## Quick Deploy (CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? screengraph-frontend
# - Directory? ./
# - Override settings? No

# Production deploy
vercel --prod
```

## GitHub Integration (Automatic)

### 1. Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import from GitHub
4. Select your repository
5. Configure:

### 2. Project Settings

**Root Directory:** `frontend`

**Build Settings:**
- Framework Preset: `Other`
- Build Command: `bun run build`
- Output Directory: `dist`
- Install Command: `bun install`

### 3. Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `PUBLIC_API_BASE` | `https://steering-wheel-documentation-65b2.encr.app` |

**Note:** For local development, use `http://localhost:4000`

### 4. Deploy

Every push to `main` branch will automatically deploy!

---

## Post-Deployment Checklist

- [ ] Frontend loads successfully
- [ ] Can start a new run
- [ ] Run timeline displays events
- [ ] WebSocket streaming works
- [ ] Steering wheel loads

---

## Troubleshooting

### Build Fails

```bash
# Verify build works locally
cd frontend
bun run build

# Check dist/ directory exists
ls dist/
```

### API Not Connecting

1. Check environment variable is set in Vercel
2. Verify backend is deployed
3. Check CORS configuration in `encore.app`

### 404 Errors

Ensure Vercel configuration has SPA fallback:
- Rewrites rule: `/* -> /index.html`

---

## Success!

Your frontend is now live at: `https://screengraph-frontend.vercel.app`

Backend: `https://steering-wheel-documentation-65b2.encr.app`  
Frontend: `https://screengraph-frontend.vercel.app`
