#!/bin/bash

# 🚀 Food Delivery App - Demo Mode Startup Script
# This script starts the application in demo mode without requiring external services

echo "🎯 Starting Food Delivery App in DEMO MODE..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if we're in the right directory
if [ ! -f "server/package.json" ] || [ ! -f "client/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
echo "📦 Installing dependencies..."

if [ ! -d "server/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd server && npm install && cd ..
else
    echo "✅ Backend dependencies already installed"
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd client && npm install && cd ..
else
    echo "✅ Frontend dependencies already installed"
fi

# Create demo environment files if they don't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating demo environment file..."
    cat > server/.env << EOF
PORT=4000
NODE_ENV=demo
CLIENT_URL=http://localhost:5173
EOF
    echo "✅ Created server/.env"
fi

if [ ! -f "client/.env.local" ]; then
    echo "📝 Creating demo environment file..."
    cat > client/.env.local << EOF
VITE_API_URL=http://localhost:4000
VITE_MAPBOX_ACCESS_TOKEN=demo_token
VITE_APP_NAME=FoodTracker
VITE_APP_VERSION=1.0.0
EOF
    echo "✅ Created client/.env.local"
fi

# Check if ports are available
echo "🔍 Checking port availability..."

if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 4000 is already in use. Please free up the port and try again."
    exit 1
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 5173 is already in use. Please free up the port and try again."
    exit 1
fi

echo "✅ Ports 4000 and 5173 are available"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down demo servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend server stopped"
    fi
    echo "🎯 Demo mode stopped. Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo ""
echo "🚀 Starting demo servers..."
echo "================================================"

# Start backend in demo mode
echo "🔧 Starting backend server (Demo Mode)..."
cd server
npm run demo &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! curl -s http://localhost:4000/ > /dev/null; then
    echo "❌ Backend failed to start. Check the logs above."
    cleanup
fi

echo "✅ Backend server started on http://localhost:4000"

# Start frontend
echo "🎨 Starting frontend server..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

# Check if frontend started successfully
if ! curl -s http://localhost:5173/ > /dev/null; then
    echo "❌ Frontend failed to start. Check the logs above."
    cleanup
fi

echo "✅ Frontend server started on http://localhost:5173"

echo ""
echo "🎉 DEMO MODE IS RUNNING! 🎉"
echo "================================================"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:4000"
echo "📊 API Status: http://localhost:4000/api/status"
echo "📋 Demo Orders: http://localhost:4000/api/orders"
echo ""
echo "🔌 WebSocket server is ready for real-time communication"
echo "📱 Open http://localhost:5173 in your browser to see the app!"
echo ""
echo "Press Ctrl+C to stop the demo servers"
echo "================================================"

# Wait for user to stop
wait

