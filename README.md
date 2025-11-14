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

## License

[Your License Here]
