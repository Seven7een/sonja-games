# Sonja Games - Minigame Platform

A full-stack minigame platform with React frontend, FastAPI backend, and PostgreSQL database. Features Clerk authentication and Docker deployment.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Python FastAPI + SQLAlchemy + Alembic
- **Database:** PostgreSQL 15+
- **Auth:** Clerk
- **Deployment:** Docker + Railway

## Quick Start for Developers

### First Time Setup

1. **Clone and enter the project:**
   ```bash
   cd sonja-games
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example env file
   cp backend/.env.example backend/.env
   
   # Edit backend/.env and add your Clerk keys:
   # - CLERK_SECRET_KEY
   # - CLERK_PUBLISHABLE_KEY
   ```

3. **Start the development environment:**
   ```bash
   make dev-build
   ```
   
   This will:
   - Build all Docker containers
   - Start PostgreSQL database
   - Start FastAPI backend (with hot reload)
   - Start React frontend (with hot reload)
   - Install frontend dependencies automatically

4. **Run database migrations** (in a new terminal):
   ```bash
   make migrate
   ```
   
   **Note:** You only need to run this once initially, and then again when new migrations are added.

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Daily Development Workflow

```bash
# Start everything (if containers already built)
make dev

# Stop everything - just press Ctrl+C in the terminal
# Or if you started it in the background:
make dev-down
```

**Do you need to run migrations every time?** 
No! Only run `make migrate` when:
- Setting up for the first time
- After pulling new code that includes new migration files
- After creating a new migration yourself

**What about frontend dependencies?**
They're installed automatically during `make dev-build`. If you update package.json, run `make install-frontend-deps` to update them.

### Common Commands

```bash
# Development
make dev              # Start dev environment (Ctrl+C to stop)
make dev-build        # Rebuild and start dev environment
make dev-down         # Stop dev environment (if running in background)
make dev-logs         # View logs (if running in background)

# Testing
make test             # Run all tests (backend + frontend)
make test-backend     # Run backend tests only
make test-frontend    # Run frontend tests only
make test-frontend-watch      # Run frontend tests in watch mode
make test-frontend-coverage   # Run frontend tests with coverage

# Database
make migrate          # Apply new migrations
make migrate-create NAME="description"  # Create new migration
make migrate-down     # Rollback last migration
make db-shell         # Open PostgreSQL shell

# Container Access
make shell-backend    # Open shell in backend container
make shell-frontend   # Open shell in frontend container

# Cleanup
make clean            # Remove containers and volumes
make clean-all        # Remove everything including node_modules
```

### Working with Database Migrations

When you add/modify database models:

1. **Update your SQLAlchemy model** (e.g., `backend/app/core/models/user.py`)

2. **Generate migration:**
   ```bash
   make migrate-create NAME="add_user_avatar"
   ```

3. **Review the generated file** in `backend/alembic/versions/`

4. **Apply the migration:**
   ```bash
   make migrate
   ```

5. **Commit both the model and migration file** to Git

### Project Structure

```
sonja-games/
├── backend/
│   ├── app/
│   │   ├── core/              # Shared auth & user management
│   │   │   ├── models/        # Database models
│   │   │   ├── schemas/       # Pydantic schemas
│   │   │   ├── middleware/    # Auth middleware
│   │   │   ├── services/      # Business logic
│   │   │   └── routers/       # API endpoints
│   │   ├── games/             # Game-specific modules
│   │   │   └── wordle/        # Wordle game (coming soon)
│   │   ├── main.py            # FastAPI app
│   │   ├── config.py          # Configuration
│   │   └── database.py        # Database setup
│   ├── alembic/               # Database migrations
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── core/              # Shared components & auth
│   │   ├── games/             # Game-specific components
│   │   └── pages/             # Top-level pages
│   └── package.json           # Node dependencies
├── docker-compose.dev.yml     # Development Docker config
├── Makefile                   # Convenient commands
└── README.md                  # This file
```

### Troubleshooting

**Containers won't start:**
```bash
make clean
make dev-build
```

**Database connection errors:**
```bash
# Check if database is running
docker ps

# Restart just the database
docker-compose -f docker-compose.dev.yml restart db
```

**Port already in use:**
```bash
# Find what's using the port
lsof -i :5173  # or :8000, :5432
# Kill the process or change ports in docker-compose.dev.yml
```

**Migration errors:**
```bash
# Check current migration status
docker-compose -f docker-compose.dev.yml exec backend alembic current

# View migration history
docker-compose -f docker-compose.dev.yml exec backend alembic history
```

**Frontend tests not working (vitest not found):**
```bash
# Install dependencies in the container
make install-frontend-deps

# Or manually
docker-compose -f docker-compose.dev.yml exec frontend npm install
```

**After pulling new code with updated dependencies:**
```bash
# Rebuild containers (this will also install frontend dependencies)
make dev-build
```

## Testing

### Running Tests

All tests run inside Docker containers to ensure consistency across environments.

**Run all tests:**
```bash
make test
```

**Backend tests (pytest):**
```bash
make test-backend
```

**Frontend tests (vitest):**
```bash
make test-frontend                # Run once
make test-frontend-watch          # Watch mode (interactive)
make test-frontend-coverage       # With coverage report
```

### Frontend Testing Stack

- **Vitest** - Fast unit test framework (Vite-native)
- **React Testing Library** - Component testing utilities
- **jsdom** - Browser environment simulation

### Writing Tests

**Frontend test files:**
- Place tests next to the code: `component.tsx` → `component.test.tsx`
- Or in `src/test/` for shared utilities
- Tests run automatically when you use `make test-frontend-watch`

**Backend test files:**
- Place in `backend/tests/`
- Follow naming: `test_*.py`
- Use pytest fixtures from `conftest.py`

### Test Coverage

Frontend coverage reports are generated in `frontend/coverage/`:
```bash
make test-frontend-coverage
# Open frontend/coverage/index.html in browser
```

## Development Tips

- **Hot reload is enabled** - changes to code automatically restart the servers
- **Database persists** - data survives container restarts (stored in Docker volume)
- **Use `make help`** - see all available commands
- **Check logs** - `make dev-logs` shows output from all services
- **Run tests before committing** - `make test` ensures everything works

## Adding a New Game

1. Create backend module in `backend/app/games/{game_name}/`
2. Create frontend module in `frontend/src/games/{game_name}/`
3. Add database models and generate migrations
4. Register routes in `backend/app/main.py`
5. Add routes in `frontend/src/App.tsx`

See the design document in `.kiro/specs/minigame-platform/design.md` for detailed architecture.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `make dev`
4. Commit code and migration files
5. Push and create a pull request

## Environment Variables

### Backend Environment Variables

Required environment variables for the backend service:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` | Yes |
| `CLERK_SECRET_KEY` | Clerk API secret key for token verification | `sk_test_...` | Yes |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` | Yes |
| `ENVIRONMENT` | Environment name | `development`, `production` | Yes |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:5173,https://app.example.com` | Yes |
| `PORT` | Port for the backend server (Railway sets this automatically) | `8000` | No (defaults to 8000) |

### Frontend Environment Variables

Required environment variables for the frontend service:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com` | Yes |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` | Yes |

**Note:** Frontend environment variables must be prefixed with `VITE_` to be accessible in the browser.

### Setting Environment Variables Locally

1. Copy the example files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Edit the `.env` files with your actual values

3. Restart the development environment:
   ```bash
   make dev-down
   make dev
   ```

## Deployment to Railway

### Prerequisites

1. [Railway account](https://railway.app/)
2. Clerk account with API keys
3. Git repository with your code
4. Domain managed in Cloudflare (for custom domains)

### Quick Reference

**Services to Deploy:**
- PostgreSQL database (managed by Railway)
- Backend service (`api.sonja.games`)
- Frontend service (`sonja.games`)

**Key Configuration:**
- Backend uses `backend/railway.toml` and `backend/Dockerfile`
- Frontend uses `frontend/railway.toml` and `frontend/Dockerfile`
- Both services auto-deploy on git push

### Deployment Steps

#### 1. Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

#### 2. Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a `DATABASE_URL` variable

#### 3. Deploy Backend Service

1. Click "New" → "GitHub Repo"
2. Select your repository
3. **IMPORTANT: Configure the service settings:**
   - Click on the service after it's created
   - Go to "Settings" tab
   - Under "Service Settings":
     - **Service Name:** `backend`
     - **Root Directory:** `backend` ← Set this!
   - Under "Build":
     - **Builder:** Select "Dockerfile" (not Nixpacks/Railpack)
     - **Dockerfile Path:** `Dockerfile`
   - Click "Deploy" or wait for auto-deploy

4. Add environment variables:
   ```
   CLERK_SECRET_KEY=sk_live_...
   CLERK_PUBLISHABLE_KEY=pk_live_...
   ENVIRONMENT=production
   CORS_ORIGINS=https://sonja.games
   ```
   
   **Note:** If using a custom domain, use that instead of Railway's generated URL.

5. Railway will automatically:
   - Detect the `railway.toml` configuration
   - Build using the Dockerfile
   - Run database migrations on startup
   - Expose the service with a public URL

6. Copy the backend URL (e.g., `https://backend-production-xxxx.up.railway.app`)
   
   **Note:** You can also set up a custom subdomain like `api.sonja.games` for your backend.

#### 4. Deploy Frontend Service

1. Click "New" → "GitHub Repo"
2. Select your repository again
3. **IMPORTANT: Configure the service settings:**
   - Click on the service after it's created
   - Go to "Settings" tab
   - Under "Service Settings":
     - **Service Name:** `frontend`
     - **Root Directory:** `frontend` ← Set this!
   - Under "Build":
     - **Builder:** Select "Dockerfile" (not Nixpacks/Railpack)
     - **Dockerfile Path:** `Dockerfile`
   - Click "Deploy" or wait for auto-deploy

4. Add environment variables:
   ```
   VITE_API_URL=https://api.sonja.games
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   ```
   
   **IMPORTANT:** These must be set as **regular variables** (not secrets) so they're available during the Docker build.
   
   **Note:** Use your custom domain/subdomain for the API URL.

5. Railway will automatically:
   - Build the React app with Vite
   - Serve static files with Nginx
   - Expose the service with a public URL

#### 5. Configure Custom Domains with Cloudflare

**Step 1: Set Up Backend Domain (api.sonja.games)**

1. **In Railway (Backend Service):**
   - Go to your backend service
   - Click "Settings" → "Domains"
   - Click "Custom Domain"
   - Enter `api.sonja.games`
   - **Port:** `8000` (when prompted)
   - Railway will provide a CNAME target (e.g., `backend-production-xxxx.up.railway.app`)
   - Copy this CNAME target

2. **In Cloudflare:**
   - Go to your Cloudflare dashboard
   - Select `sonja.games` domain
   - Go to "DNS" → "Records"
   - Click "Add record"
   - Configure:
     - **Type:** `CNAME`
     - **Name:** `api`
     - **Target:** (paste the Railway CNAME target)
     - **Proxy status:** 🟠 DNS only (turn OFF the orange cloud)
     - **TTL:** Auto
   - Click "Save"

   **Important:** You MUST use "DNS only" (gray cloud) for Railway to work properly. The orange cloud (proxied) will cause SSL issues.

3. **Wait for DNS propagation** (usually 1-5 minutes)

4. **Verify in Railway:**
   - Railway will automatically detect the DNS change
   - Wait for the green checkmark next to your custom domain
   - Test: `https://api.sonja.games/health` should return `{"status": "healthy"}`

**Step 2: Set Up Frontend Domain (sonja.games)**

1. **In Railway (Frontend Service):**
   - Go to your frontend service
   - Click "Settings" → "Domains"
   - Click "Custom Domain"
   - Enter `sonja.games`
   - **Port:** `80` (when prompted)
   - Railway will provide a CNAME target
   - Copy this CNAME target

2. **In Cloudflare:**
   - Go to "DNS" → "Records"
   - You need to use a CNAME for the root domain:
     - **Option A (Recommended):** Use Cloudflare's CNAME flattening
       - **Type:** `CNAME`
       - **Name:** `@`
       - **Target:** (paste the Railway CNAME target)
       - **Proxy status:** 🟠 DNS only (gray cloud)
       - **TTL:** Auto
     - **Option B:** Use `www` subdomain and redirect
       - Create CNAME for `www` pointing to Railway
       - Set up a redirect rule from `sonja.games` to `www.sonja.games`
   - Click "Save"

   **Important:** Again, use "DNS only" (gray cloud), not proxied.

3. **Wait for DNS propagation**

4. **Verify in Railway:**
   - Wait for the green checkmark
   - Test: `https://sonja.games` should load your app

**Step 3: Update Backend CORS Settings**

1. Go to your backend service in Railway
2. Click "Variables"
3. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://sonja.games
   ```
4. The service will automatically redeploy

**Step 4: Update Frontend API URL (if not already set)**

1. Go to your frontend service in Railway
2. Click "Variables"
3. Verify `VITE_API_URL` is set to:
   ```
   VITE_API_URL=https://api.sonja.games
   ```
4. If you need to change it, the service will automatically redeploy

**Troubleshooting Railway Deployment:**

- **"Railpack could not determine how to build":** 
  - Go to service Settings → Set "Root Directory" to `backend` or `frontend`
  - Change Builder from "Nixpacks" to "Dockerfile"
  - Redeploy the service

- **Build fails / Can't find Dockerfile:**
  - Verify "Root Directory" is set correctly (`backend` or `frontend`)
  - Verify "Dockerfile Path" is just `Dockerfile` (not `backend/Dockerfile`)

- **Frontend missing VITE_* environment variables:**
  - Vite env vars are baked in at build time, not runtime
  - After adding/changing `VITE_*` variables, you MUST redeploy
  - Go to Deployments → Click ••• → Redeploy

- **Permission denied errors in backend:**
  - Check that Dockerfile properly sets ownership for non-root user
  - Ensure PATH includes the correct bin directory

**Troubleshooting Cloudflare + Railway:**

- **SSL Certificate Errors:** Make sure Cloudflare proxy is OFF (gray cloud, not orange)
- **DNS not resolving:** Wait up to 5 minutes, check Cloudflare DNS records are correct
- **Railway shows "Waiting for DNS":** Verify CNAME target matches exactly what Railway provided
- **CORS errors:** Ensure `CORS_ORIGINS` in backend matches your frontend domain exactly (including `https://`)
- **Want to use Cloudflare proxy?** You'll need to configure SSL/TLS mode to "Full (strict)" in Cloudflare, but "DNS only" is simpler and recommended for Railway

#### 6. Verify Deployment

1. Visit `https://sonja.games` - Frontend should load
2. Visit `https://api.sonja.games/health` - Should return `{"status": "healthy"}`
3. Test authentication flow
4. Verify games are working correctly

### Deployment Summary

Here's the complete flow:

```
1. Railway Project Setup
   ├── Add PostgreSQL database
   ├── Deploy backend service (from /backend)
   └── Deploy frontend service (from /frontend)

2. Cloudflare DNS Configuration
   ├── api.sonja.games → CNAME → Railway backend (DNS only)
   └── sonja.games → CNAME → Railway frontend (DNS only)

3. Environment Variables
   ├── Backend
   │   ├── DATABASE_URL (auto-set by Railway)
   │   ├── CLERK_SECRET_KEY
   │   ├── CLERK_PUBLISHABLE_KEY
   │   ├── ENVIRONMENT=production
   │   └── CORS_ORIGINS=https://sonja.games
   └── Frontend
       ├── VITE_API_URL=https://api.sonja.games
       └── VITE_CLERK_PUBLISHABLE_KEY

4. Verify
   ├── https://api.sonja.games/health → {"status": "healthy"}
   └── https://sonja.games → App loads
```

**Important Notes:**
- Railway automatically runs migrations on backend startup
- Both services auto-deploy when you push to GitHub
- SSL certificates are handled automatically by Railway
- Keep Cloudflare proxy OFF (gray cloud) for Railway domains

### Deployment Architecture

```
┌─────────────────┐
│   Railway       │
│                 │
│  ┌───────────┐  │
│  │ Frontend  │  │ ← Nginx serving React SPA
│  │ (Port 80) │  │
│  └─────┬─────┘  │
│        │        │
│        ▼        │
│  ┌───────────┐  │
│  │  Backend  │  │ ← FastAPI + Uvicorn
│  │ (Port $)  │  │
│  └─────┬─────┘  │
│        │        │
│        ▼        │
│  ┌───────────┐  │
│  │PostgreSQL │  │ ← Managed database
│  │(Port 5432)│  │
│  └───────────┘  │
│                 │
└─────────────────┘
```

### Monitoring and Logs

**View logs in Railway:**
1. Click on a service
2. Go to "Deployments" tab
3. Click on the latest deployment
4. View real-time logs

**Health checks:**
- Backend: `https://api.sonja.games/health`
- Frontend: `https://sonja.games/`

### Troubleshooting Deployment

**Backend won't start:**
- Check environment variables are set correctly
- Verify `DATABASE_URL` is available
- Check logs for migration errors
- Ensure Clerk keys are valid

**Frontend shows API errors:**
- Verify `VITE_API_URL` points to backend URL
- Check CORS settings in backend
- Ensure backend is running and healthy

**Database connection errors:**
- Verify PostgreSQL service is running
- Check `DATABASE_URL` format
- Ensure backend and database are in same project

**Migrations fail:**
- Check database permissions
- Verify Alembic configuration
- Review migration files for errors

### Rolling Back Deployments

1. Go to service in Railway
2. Click "Deployments" tab
3. Find previous successful deployment
4. Click "Redeploy"

### CI/CD

Railway automatically deploys when you push to your main branch:

1. Push code to GitHub
2. Railway detects changes
3. Builds and deploys automatically
4. Runs health checks
5. Routes traffic to new deployment

To disable auto-deploy:
1. Go to service settings
2. Uncheck "Auto Deploy"

## Production Checklist

Before going live, ensure:

- [ ] All environment variables are set with production values
- [ ] Clerk is configured with production keys
- [ ] CORS origins include your production domain
- [ ] Database backups are enabled in Railway
- [ ] Custom domain is configured (if applicable)
- [ ] SSL/HTTPS is working (Railway provides this automatically)
- [ ] Health check endpoints are responding
- [ ] Error tracking is set up (optional: Sentry, etc.)
- [ ] Monitoring is configured (Railway provides basic metrics)

## License

[Your License Here]
