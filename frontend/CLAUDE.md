

A typical SvelteKit project looks like this, follow the same template while writing code:

my-project/
├ src/
│ ├ lib/                      # Shared utilities, stores, components
│ │ ├ server/                 # Server-only helpers (DB, API clients)
│ │ └ components/             # Reusable UI components
│ ├ params/                   # Custom route param matchers
│ ├ routes/                   # Pages, layouts, and API endpoints
│ ├ app.html                  # Root HTML template
│ ├ hooks.client.ts           # Client lifecycle hooks
│ ├ hooks.server.ts           # Server lifecycle hooks
│ ├ service-worker.ts         # Progressive web features
│ └ tracing.server.ts         # Observability/telemetry setup
├ static/                     # Public assets
├ tests/                      # Unit & integration tests
├ package.json
├ svelte.config.js
├ tsconfig.json
└ vite.config.js