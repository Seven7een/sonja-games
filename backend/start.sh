#!/bin/bash
set -e

echo "========================================="
echo "🚀 Starting Sonja Games Backend"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Port: $PORT"
echo "CORS Origins: $CORS_ORIGINS"
echo "Clerk Secret Key set: $([ -n "$CLERK_SECRET_KEY" ] && echo 'YES' || echo 'NO')"
echo "Database URL: ${DATABASE_URL:0:30}..."
echo "========================================="

echo ""
echo "📦 Checking database migration status..."
alembic current || echo "No migrations applied yet"
echo ""
echo "📦 Listing migration files in alembic/versions:"
ls -la alembic/versions/
echo ""
echo "📦 Available migrations:"
alembic history
echo ""

# Check if we should reset the database (one-time flag)
if [ "$RESET_DATABASE" = "true" ]; then
    echo "⚠️  RESET_DATABASE flag detected - dropping all tables..."
    alembic downgrade base || echo "Already at base"
    echo "✓ Database reset complete"
fi

echo "📦 Running database migrations..."
alembic upgrade head
echo ""
echo "📦 Current migration version:"
alembic current
echo "✓ Migrations complete"

echo ""
echo "🌐 Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --log-level info
