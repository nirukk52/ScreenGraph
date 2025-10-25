# Encore + SvelteKit Integration Guide

## Overview

This project uses Encore.ts for the backend and SvelteKit for the frontend, following Encore's recommended monorepo structure.

## Repository Structure

```
/ScreenGraph/
├── package.json             # Backend dependencies
├── tsconfig.json           # Unified TypeScript config
├── backend/                # Encore backend services
│   ├── encore.app          # Backend config
│   └── package.json        # Backend dependencies
└── frontend/               # SvelteKit frontend
    ├── package.json        # Frontend dependencies
    └── src/lib/encore-client.ts  # Generated Encore client
```

## What This Setup Gives You

### 1. **Type Safety Across Frontend/Backend**
- Single `tsconfig.json` with path mapping
- Shared types between frontend and backend
- Full IntelliSense and autocomplete

### 2. **Generated Encore Client**
```typescript
// Instead of manual fetch calls:
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
});

// You get fully typed function calls:
import { users } from '~encore/clients';
const user = await users.create({ name: 'John' }); // Fully typed!
```

### 3. **Path Mapping Configuration**
```json
// From tsconfig.json:
"paths": {
  "~encore/*": ["./backend/encore.gen/*"],  // Encore client imports
  "~/*": ["./*"]                           // Root-level imports
}
```

### 4. **CORS Configuration**
```json
// From encore.app:
"global_cors": {
  "allow_origins_without_credentials": ["*"],
  "allow_origins_with_credentials": [
    "http://localhost:5173",      // SvelteKit dev server
    "http://localhost:3000",      // Alternative dev port
    "https://screengraph.vercel.app",
    "https://*.vercel.app"
  ]
}
```

## Setup Instructions

### 1. Generate Encore Client
```bash
cd frontend
npm run gen
```
This creates `src/lib/encore-client.ts` with fully typed API functions.

### 2. Use in SvelteKit Components
```typescript
// In your SvelteKit component:
import { users } from '~encore/clients';

// Fully typed API calls with automatic validation
const user = await users.create({ name: 'John' });
```

### 3. Development Workflow
```bash
# Terminal 1: Run Encore backend
encore run

# Terminal 2: Run SvelteKit frontend
cd frontend
npm run dev
```

## Benefits Over Manual API Calls

### **Type Safety**
- Request/response types are automatically generated
- Compile-time error checking
- IDE autocomplete for all API endpoints

### **Automatic Validation**
- Request data validated against API schema
- Typed error responses for validation failures
- No manual JSON parsing needed

### **Error Handling**
```typescript
try {
  const result = await users.create({ name: 'John' });
  // result is fully typed with success data
} catch (error) {
  // error is typed as Encore API errors
  if (error.code === 'invalid_argument') {
    // Handle validation errors
  }
}
```

### **Environment Awareness**
- Automatically uses correct API base URL
- Handles local dev vs production environments
- No hardcoded URLs in frontend code

### **Real-time Updates**
- Run `encore gen client` when backend changes
- Frontend types update automatically
- Catches breaking changes at compile time

## Deployment

### Backend (Encore Cloud)
1. Set "Root Directory" to `backend` in Encore Cloud dashboard
2. Link to GitHub repository
3. Deploy automatically on push

### Frontend (Vercel/Netlify)
1. Point deployment to `frontend/` directory
2. Configure build settings for SvelteKit
3. Set environment variables for API URLs

## Key Files

- `encore.app` - Encore configuration with CORS settings
- `tsconfig.json` - Unified TypeScript configuration
- `frontend/package.json` - Contains `gen` script for client generation
- `frontend/src/lib/encore-client.ts` - Generated Encore client (run `npm run gen` to create)

## Next Steps

1. Run `npm run gen` in the frontend directory to generate the client
2. Import and use the generated client in your SvelteKit components
3. Enjoy fully typed, validated API calls with automatic error handling!
