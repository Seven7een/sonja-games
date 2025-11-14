#!/bin/bash
# Simple test runner for Docker container
# 
# IMPORTANT: Tests MUST be run inside the Docker container!
# 
# Usage:
#   docker compose -f docker-compose.dev.yml exec backend ./run_tests.sh
#
# Or use the Makefile command:
#   make test
#
# Running pytest directly on the host will fail because:
# - Dependencies are installed in the container, not on host
# - Database connection requires Docker network
# - Environment variables are configured in docker-compose

set -e

echo "Running tests..."
pytest tests/ -v --tb=short

echo ""
echo "✓ All tests passed!"
