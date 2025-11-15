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
3. Configure the service:
   - **Name:** `backend`
   - **Root Directory:** `backend`
   - **Build Command:** (Handled by Dockerfile)
   - **Start Command:** (Handled by railway.toml)

4. Add environment variables:
   ```
   CLERK_SECRET_KEY=sk_live_...
   CLERK_PUBLISHABLE_KEY=pk_live_...
   ENVIRONMENT=production
   CORS_ORIGINS=https://your-frontend-url.railway.app
   ```

5. Railway will automatically:
   - Detect the `railway.toml` configuration
   - Build using the Dockerfile
   - Run database migrations on startup
   - Expose the service with a public URL

6. Copy the backend URL (e.g., `https://backend-production-xxxx.up.railway.app`)

#### 4. Deploy Frontend Service

1. Click "New" → "GitHub Repo"
2. Select your repository again
3. Configure the service:
   - **Name:** `frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** (Handled by Dockerfile)
   - **Start Command:** (Handled by railway.toml)

4. Add environment variables:
   ```
   VITE_API_URL=https://backend-production-xxxx.up.railway.app
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   ```

5. Railway will automatically:
   - Build the React app with Vite
   - Serve static files with Nginx
   - Expose the service with a public URL

#### 5. Update CORS Origins

1. Go back to your backend service settings
2. Update the `CORS_ORIGINS` variable with your frontend URL:
   ```
   CORS_ORIGINS=https://frontend-production-xxxx.up.railway.app
   ```

3. Redeploy the backend service

#### 6. Configure Custom Domain (Optional)

1. In Railway, go to your frontend service
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `CORS_ORIGINS` in backend with your custom domain

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
- Backend: `https://your-backend-url.railway.app/health`
- Frontend: `https://your-frontend-url.railway.app/`

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
