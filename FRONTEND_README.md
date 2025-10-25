# ScreenGraph Frontend

React frontend for ScreenGraph agent visualization and control interface.

## 🏗️ Architecture

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component primitives
- **Hash Router**: Client-side routing

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Backend API running (see BACKEND_README.md)

### Install & Run

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
bun install

# Run dev server
bun run dev

# Open http://localhost:5173
```

## 📁 Project Structure

```
frontend/
├── components/     # React components
│   ├── ui/        # UI primitives (Radix)
│   ├── run/       # Run-related components
│   └── steering/  # Documentation components
├── pages/         # Page components
├── lib/           # Utilities
├── dist/          # Build output
└── package.json   # Dependencies
```

## 🔧 Development

### Build

```bash
# Production build
bun run build

# Preview production build
bun run preview
```

### Environment Variables

Set API base URL (defaults to `http://localhost:4000`):

```bash
# .env.local
VITE_API_BASE=https://your-backend-url.com
```

## 🌐 Deployment

### Deploy to Vercel

1. Connect GitHub repository to Vercel
2. Configure build settings:
   - **Framework**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `bun install && bun run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   - `VITE_API_BASE`: Your backend API URL

### Manual Deploy

```bash
# Build
cd frontend && bun run build

# Deploy via Vercel CLI
vercel --prod
```

## 🎨 Pages

- `/` - Start Run page
- `/#/run/:id` - Run Timeline
- `/#/steering` - Steering Wheel (documentation editor)

## 📡 API Integration

Frontend connects to backend API endpoints:

- REST API: Configured via `VITE_API_BASE`
- WebSocket: Streaming via `/run.Stream` endpoint

## 🐛 Troubleshooting

### Build Errors

```bash
# Clean install
rm -rf node_modules bun.lock
bun install
```

### CORS Issues

Ensure backend CORS config includes your frontend URL (see BACKEND_README.md).

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)

