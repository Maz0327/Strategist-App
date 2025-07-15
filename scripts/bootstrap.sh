#!/usr/bin/env bash
set -e

echo "🚀 Starting Strategist App bootstrap process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

echo "📦 Installing Node.js dependencies..."
npm ci

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
if [ -f "pyproject.toml" ]; then
    pip install -e .
fi

echo "🗄️ Setting up database..."
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    npm run db:push
else
    echo "⚠️  Warning: DATABASE_URL not set. Skipping database setup."
    echo "Please set DATABASE_URL in your .env file and run 'npm run db:push' manually."
fi

echo "🏗️ Building application..."
npm run build

echo "✅ Bootstrap complete! Your Strategist App is ready to run."
echo ""
echo "Next steps:"
echo "1. Make sure your .env file is configured with API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:5000 to access your app"