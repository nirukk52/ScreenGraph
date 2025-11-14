# Setup and Configuration

## Stack Overview
- **Framework:** SvelteKit 2 (Vite-based)
- **Runtime:** Svelte 5 with runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + Skeleton UI v4
- **Animation:** @formkit/auto-animate
- **API Client:** Encore-generated TypeScript client
- **Deployment:** Vercel via `@sveltejs/adapter-vercel`

## Required Packages
```json
{
  "dependencies": {
    "@formkit/auto-animate": "^0.8.2",
    "envalid": "^8.1.1",
    "lucide-svelte": "^0.425.0"
  },
  "devDependencies": {
    "@skeletonlabs/skeleton": "4.2.4",
    "@skeletonlabs/skeleton-svelte": "^4.2.4",
    "@sveltejs/adapter-vercel": "^4.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "svelte": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.9.3",
    "vite": "^6.0.0"
  }
}
```

## Skeleton Theme Configuration
### `src/app.css`
```css
@import 'tailwindcss';
@import '@skeletonlabs/skeleton';
@import '@skeletonlabs/skeleton-svelte';
@import '@skeletonlabs/skeleton/themes/cerberus';

@layer base {
  :root {
    font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    line-height: 1.5;
    font-weight: 400;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }
}
```

### `src/app.html`
```html
<html lang="en" data-theme="cerberus">
```

## Project Structure
```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   ├── server/            # Server-only helpers
│   │   ├── encore-client.ts   # Generated Encore API client
│   │   └── env.ts             # Environment validation
│   ├── routes/
│   │   ├── +layout.svelte     # Root layout
│   │   ├── +page.svelte       # Landing page
│   │   └── [...routes]/       # Feature pages
│   ├── app.html               # HTML template
│   └── app.css                # Global styles
├── static/                    # Public assets
├── package.json
├── svelte.config.js
└── vite.config.ts
```

## Vite Configuration (`vite.config.ts`)
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 5173,
    strictPort: true
  }
});
```

## Post-Setup Checklist
- Run `bun install` to sync dependencies.
- Verify Tailwind + Skeleton styles load in `bun run dev`.
- Configure `.env` values consumed by `src/lib/env.ts`.
- Confirm Encore client paths (`~encore/clients`) resolve after running `bun run gen`.
