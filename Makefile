.PHONY: help build up down restart logs clean migrate shell-backend shell-frontend install-frontend install-backend dev prod

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up

dev-build: ## Build and start development environment
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "Setup complete! Attaching to logs (Ctrl+C to detach)..."
	@docker-compose -f docker-compose.dev.yml logs -f

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## Show development logs
	docker-compose -f docker-compose.dev.yml logs -f

# Production commands
prod: ## Start production environment
	docker-compose up

prod-build: ## Build and start production environment
	docker-compose up --build

prod-down: ## Stop production environment
	docker-compose down

prod-logs: ## Show production logs
	docker-compose logs -f

# Testing commands
test: ## Run all tests (backend and frontend)
	@echo "Running backend tests..."
	@docker-compose -f docker-compose.dev.yml exec backend ./run_tests.sh
	@echo "\nRunning frontend tests..."
	@docker-compose -f docker-compose.dev.yml exec frontend npm test

test-backend: ## Run backend tests only
	docker-compose -f docker-compose.dev.yml exec backend ./run_tests.sh

test-frontend: ## Run frontend tests only
	docker-compose -f docker-compose.dev.yml exec frontend npm test

test-frontend-watch: ## Run frontend tests in watch mode
	docker-compose -f docker-compose.dev.yml exec frontend npm run test:watch

test-frontend-ui: ## Run frontend tests with UI
	docker-compose -f docker-compose.dev.yml exec frontend npm run test:ui

test-frontend-coverage: ## Run frontend tests with coverage report
	docker-compose -f docker-compose.dev.yml exec frontend npm run test:coverage

test-file: ## Run specific backend test file (use FILE=tests/test_name.py)
	docker-compose -f docker-compose.dev.yml exec backend pytest $(FILE) -v

# Database commands
migrate: ## Run database migrations
	docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head

migrate-create: ## Create a new migration (use NAME=migration_name)
	docker-compose -f docker-compose.dev.yml exec backend alembic revision --autogenerate -m "$(NAME)"

migrate-down: ## Rollback last migration
	docker-compose -f docker-compose.dev.yml exec backend alembic downgrade -1

db-shell: ## Open PostgreSQL shell
	docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d sonja_games_dev

# Shell access
shell-backend: ## Open shell in backend container
	docker-compose -f docker-compose.dev.yml exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose -f docker-compose.dev.yml exec frontend sh

# Installation commands
install-frontend: ## Install frontend dependencies locally
	cd frontend && npm install

install-backend: ## Install backend dependencies locally
	cd backend && pip install -r requirements.txt

install-frontend-deps: ## Install frontend dependencies in Docker container
	docker-compose -f docker-compose.dev.yml exec frontend npm install

# Cleanup commands
clean: ## Remove all containers, volumes, and images
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose down -v

clean-all: clean ## Remove all containers, volumes, images, and node_modules
	rm -rf frontend/node_modules
	rm -rf backend/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Build commands
build: ## Build all services for development
	docker-compose -f docker-compose.dev.yml build

build-prod: ## Build all services for production
	docker-compose build

# Restart commands
restart: ## Restart development environment
	docker-compose -f docker-compose.dev.yml restart

restart-backend: ## Restart backend service
	docker-compose -f docker-compose.dev.yml restart backend

restart-frontend: ## Restart frontend service
	docker-compose -f docker-compose.dev.yml restart frontend
