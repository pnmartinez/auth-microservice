#!/bin/bash

# Setup script for the authentication microservice

set -e

echo "🚀 Setting up Authentication Microservice..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Generate JWT keys if they don't exist
if [ ! -f "private.pem" ]; then
    echo "📝 Generating JWT keys..."
    ./scripts/generate-jwt-keys.sh
fi

# Start PostgreSQL for development
echo "🐘 Starting PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install admin panel dependencies
echo "📦 Installing admin panel dependencies..."
cd admin-panel
npm install
cd ..

# Run migrations
echo "🗄️  Running database migrations..."
cd backend
npm run migrate
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env files (see docs/DEPLOYMENT.md)"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Start the admin panel: cd admin-panel && npm run dev"

