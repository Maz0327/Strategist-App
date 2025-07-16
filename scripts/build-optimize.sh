#!/bin/bash

# Build optimization script for the Strategic Content Analysis Platform
# This script optimizes the build process to reduce build time and improve performance

echo "🚀 Optimizing Strategic Content Analysis Platform Build"
echo "======================================================="

# Set production environment
export NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/

# Check if required tools are available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --production=false
fi

# Type checking
echo "🔍 Running type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ Type check failed. Please fix TypeScript errors before building."
    exit 1
fi

# Build client (frontend)
echo "🖥️ Building client application..."
npx vite build --mode=production
if [ $? -ne 0 ]; then
    echo "❌ Client build failed."
    exit 1
fi

# Build server (backend)
echo "🔧 Building server application..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --minify \
  --sourcemap \
  --target=node20 \
  --define:process.env.NODE_ENV='"production"'

if [ $? -ne 0 ]; then
    echo "❌ Server build failed."
    exit 1
fi

# Optimize bundle size
echo "📊 Analyzing bundle size..."
if command -v du &> /dev/null; then
    echo "Client bundle size: $(du -sh client/dist 2>/dev/null || echo 'N/A')"
    echo "Server bundle size: $(du -sh dist 2>/dev/null || echo 'N/A')"
fi

# Verify build output
echo "✅ Verifying build output..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Server build output missing."
    exit 1
fi

if [ ! -d "client/dist" ]; then
    echo "❌ Client build output missing."
    exit 1
fi

echo ""
echo "🎉 Build optimization completed successfully!"
echo ""
echo "Build artifacts:"
echo "  📁 client/dist/  - Client application"
echo "  📁 dist/         - Server application"
echo ""
echo "To start the production server:"
echo "  NODE_ENV=production node dist/index.js"