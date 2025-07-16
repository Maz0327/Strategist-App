#!/bin/bash

# Test runner script for the Strategic Content Analysis Platform
# This script provides a convenient way to run tests with proper configuration

echo "🧪 Running Strategic Content Analysis Platform Test Suite"
echo "========================================================"

# Set test environment
export NODE_ENV=test

# Check if vitest is available
if ! command -v npx vitest &> /dev/null; then
    echo "❌ Vitest not found. Please install dependencies first:"
    echo "   npm install"
    exit 1
fi

# Run tests based on arguments
case "${1:-all}" in
    "unit")
        echo "🔍 Running unit tests..."
        npx vitest run --reporter=verbose --config=vitest.config.ts
        ;;
    "watch")
        echo "👀 Running tests in watch mode..."
        npx vitest --config=vitest.config.ts
        ;;
    "coverage")
        echo "📊 Running tests with coverage..."
        npx vitest run --coverage --config=vitest.config.ts
        ;;
    "server")
        echo "🔧 Running server tests..."
        npx vitest run server/test/ --config=vitest.config.ts
        ;;
    "client")
        echo "🖥️ Running client tests..."
        npx vitest run client/src/ --config=vitest.config.ts
        ;;
    "all"|*)
        echo "🎯 Running all tests..."
        npx vitest run --reporter=verbose --config=vitest.config.ts
        ;;
esac

echo ""
echo "✅ Test run completed!"
echo ""
echo "Available test commands:"
echo "  ./scripts/test.sh unit      - Run unit tests"
echo "  ./scripts/test.sh watch     - Run tests in watch mode"
echo "  ./scripts/test.sh coverage  - Run tests with coverage"
echo "  ./scripts/test.sh server    - Run server tests only"
echo "  ./scripts/test.sh client    - Run client tests only"
echo "  ./scripts/test.sh all       - Run all tests (default)"