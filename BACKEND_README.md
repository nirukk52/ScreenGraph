# ScreenGraph Backend

Backend API built with Encore.ts, providing agent orchestration, documentation management, and run management.

## 🏗️ Architecture

- **Encore.ts**: Backend framework with automatic API generation
- **PostgreSQL**: Database for state persistence
- **PubSub**: Event-driven communication between services

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Encore CLI](https://encore.dev/docs/install)
- PostgreSQL (managed by Encore locally)

### Install & Run

```bash
# Install dependencies
bun install

# Run locally (includes database)
encore run

# Your API will be available at:
# - API Gateway: http://localhost:4000
# - API Explorer: http://localhost:4000/#/api
```

## 📁 Project Structure

```
backend/
├── agent/          # AI agent orchestration
├── run/            # Run management endpoints
├── steering/       # Documentation management
└── db/             # Database migrations

encore.app          # Encore configuration
```

## 🔧 Development

### Running Tests

```bash
encore test
```

### Database Management

```bash
# Open psql shell
encore db shell screengraph

# View connection string
encore db conn-uri screengraph
```

### API Client Generation

```bash
# Generate TypeScript client
encore gen client typescript

# Generated client in encore.gen/clients/
```

## 🌐 Deployment

### Deploy to Encore Cloud

```bash
# Push to Encore Cloud
git push encore main

# Get deployment URL
encore app list
```

### Environment Configuration

- Production: Auto-configured by Encore Cloud
- Secrets: Manage via `encore secret set`
- CORS: Configured in `encore.app`

## 📡 API Endpoints

See [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints

- `POST /run.Start` - Start a new agent run
- `GET /run.Stream` - Stream run events (WebSocket)
- `POST /run.Cancel` - Cancel active run
- `GET /run.Show` - Get run details
- `GET /steering.GetDoc` - Get documentation
- `POST /steering.UpdateDoc` - Update documentation

## 🔐 CORS Configuration

Backend is configured to accept requests from:
- `http://localhost:5173` (local frontend)
- `https://screengraph.vercel.app` (production frontend)
- `https://*.vercel.app` (Vercel preview deployments)

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Reset database
encore db reset

# Re-run migrations
encore run
```

## 📚 Resources

- [Encore.ts Documentation](https://encore.dev/docs)
- [API Documentation](./backend/API_DOCUMENTATION.md)
- [Testing Guide](./backend/agent/README.md)

