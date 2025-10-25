# Local Development Setup

## Quick Start

### Backend (Encore)
```bash
cd backend
encore run
```
**Important**: Run Encore from the `backend/` directory, not from the repo root.

### Frontend (SvelteKit)
```bash
cd frontend
bun run dev
```

## Why Run Encore from `backend/`?

Encore scans all TypeScript files in the repository by default. Running from the repo root causes it to try parsing frontend files (which use SvelteKit-specific imports like `$app/environment`), resulting in parse errors.

Running from `backend/` directory:
- ✅ Encore only scans the backend directory
- ✅ No frontend parsing errors
- ✅ Clean separation of concerns

## Architecture

Following the [Next.js + Encore example](https://github.com/encoredev/nextjs-starter):

```
/ScreenGraph
├── backend/              # Encore backend (run from here)
│   ├── encore.app       # Encore config
│   ├── package.json     # Backend dependencies
│   └── ...
├── frontend/            # SvelteKit frontend (separate)
│   ├── package.json     # Frontend dependencies
│   └── ...
└── README.md
```

## URLs

- **Backend API**: http://localhost:4000
- **Frontend Dev**: http://localhost:5173
- **Encore Dashboard**: http://localhost:9400

## Troubleshooting

### Error: "unable to resolve module $app/environment"
- **Cause**: Running `encore run` from repo root
- **Fix**: Always run from `backend/` directory

### Port Already in Use
```bash
lsof -ti:4000 | xargs kill -9
```

### Clean Build Cache
```bash
rm -rf .encore
```

