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
echo "📦 Running database migrations..."
alembic upgrade head
echo "✓ Migrations complete"

echo ""
echo "🌐 Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --log-level info
