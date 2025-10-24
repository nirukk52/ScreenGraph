# Getting Started

This project consists of an Encore application. Follow the steps below to get the app running locally.

## Prerequisites

If this is your first time using Encore, you need to install the CLI that runs the local development environment. Use the appropriate command for your system:

- **macOS:** `brew install encoredev/tap/encore`
- **Linux:** `curl -L https://encore.dev/install.sh | bash`
- **Windows:** `iwr https://encore.dev/install.ps1 | iex`

You also need to have bun installed for package management. If you don't have bun installed, you can install it by running:

```bash
npm install -g bun
```

## Running the Application

### Setup

1. Install dependencies from the root directory:
   ```bash
   bun install
   ```

2. Build the frontend:
   ```bash
   cd frontend && bun run build
   ```

3. Start the Encore development server from the root:
   ```bash
   encore run
   ```

The application will be available at:
- **API:** `http://localhost:4000`
- **Frontend:** `http://localhost:4000/frontend/`
- **Development Dashboard:** `http://localhost:9400`

### Running Frontend in Development Mode

For development with hot-reload, you can run the frontend separately:

1. In Terminal 1 - Start Encore backend:
   ```bash
   encore run
   ```

2. In Terminal 2 - Start Vite dev server:
   ```bash
   cd frontend && bun run dev
   ```

The frontend dev server will be available at `http://localhost:5173` (or the next available port).

### Generate Frontend Client

To generate the frontend client, run the following command from the root directory:

```bash
encore gen client --target leap --lang typescript
```

The client will be automatically generated in `encore.gen/clients/`.

## Development Workflow

### Build Frontend

```bash
cd frontend && bun run build
```

This builds the frontend to `frontend/dist/` which is served by Encore.

### Run Tests

```bash
bun run test
```

### Project Structure

```
/ScreenGraph
├── package.json           # Single unified package.json
├── encore.app            # Encore app configuration
├── tsconfig.json         # TypeScript configuration
├── backend/              # Backend services
│   ├── run/             # Run service
│   ├── steering/        # Steering service
│   ├── agent/           # Agent domain logic
│   └── db/              # Database migrations
├── frontend/            # React frontend
│   ├── src/            # Source files
│   ├── dist/           # Built assets (served by Encore)
│   └── encore.service.ts # Frontend service definition
└── encore.gen/         # Auto-generated files
```

## Deployment

### Self-hosting

See the [self-hosting instructions](https://encore.dev/docs/self-host/docker-build) for how to use `encore build docker` to create a Docker image and configure it.

### Encore Cloud Platform

#### Step 1: Login to your Encore Cloud Account

Before deploying, ensure you have authenticated the Encore CLI with your Encore account:

```bash
encore auth login
```

#### Step 2: Deploy Your Application

Deploy by pushing your code:

```bash
git add -A .
git commit -m "Deploy to Encore Cloud"
git push encore
```

Monitor your deployment progress in the [Encore Cloud dashboard](https://app.encore.dev/steering-wheel-documentation-65b2/deploys).

## GitHub Integration (Recommended for Production)

For production applications, we recommend integrating with GitHub instead of using Encore's managed git:

### Connecting Your GitHub Account

1. Open your app in the **Encore Cloud dashboard**
2. Navigate to Encore Cloud [GitHub Integration settings](https://app.encore.cloud/steering-wheel-documentation-65b2/settings/integrations/github)
3. Click **Connect Account to GitHub**
4. Grant access to your repository

Once connected, pushing to your GitHub repository will automatically trigger deployments. Encore Cloud Pro users also get Preview Environments for each pull request.

### Deploy via GitHub

After connecting GitHub, deploy by pushing to your repository:

```bash
git add -A .
git commit -m "Deploy via GitHub"
git push origin main
```

## Troubleshooting

### Frontend not loading

Make sure you've built the frontend:
```bash
cd frontend && bun run build
```

### Dependencies issues

Try reinstalling:
```bash
rm -rf node_modules bun.lock
bun install
```

### Encore services not starting

Check if the database is running:
```bash
encore db reset
```

## Additional Resources

- [Encore Documentation](https://encore.dev/docs)
- [Deployment Guide](https://encore.dev/docs/platform/deploy/deploying)
- [GitHub Integration](https://encore.dev/docs/platform/integrations/github)
- [Encore Cloud Dashboard](https://app.encore.dev)
