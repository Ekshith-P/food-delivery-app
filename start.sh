#!/bin/bash

# Food Delivery App Startup Script
# This script helps you start both the backend and frontend servers

echo "🚀 Starting Food Delivery App..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend Server..."
    cd server
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo "⚠️  No .env file found. Creating from example..."
        if [ -f env.example ]; then
            cp env.example .env
            echo "✅ Created .env file from example. Please update with your actual values."
        else
            echo "❌ No env.example file found. Please create a .env file manually."
            return 1
        fi
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    echo "🚀 Starting backend server on port 4000..."
    npm run dev &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Server..."
    cd client
    
    # Check if .env.local file exists
    if [ ! -f .env.local ]; then
        echo "⚠️  No .env.local file found. Creating from example..."
        if [ -f env.local.example ]; then
            cp env.local.example .env.local
            echo "✅ Created .env.local file from example. Please update with your actual values."
        else
            echo "❌ No env.local.example file found. Please create a .env.local file manually."
            return 1
        fi
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    echo "🚀 Starting frontend server on port 3000..."
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID"
}

# Function to check if ports are available
check_ports() {
    echo "🔍 Checking if required ports are available..."
    
    if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port 4000 is already in use. Please stop the service using that port."
        exit 1
    fi
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port 3000 is already in use. Please stop the service using that port."
        exit 1
    fi
    
    echo "✅ Ports 4000 and 3000 are available"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "🛑 Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "🛑 Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    check_ports
    
    # Start backend
    start_backend
    if [ $? -ne 0 ]; then
        echo "❌ Failed to start backend"
        exit 1
    fi
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    start_frontend
    if [ $? -ne 0 ]; then
        echo "❌ Failed to start frontend"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    echo ""
    echo "🎉 Food Delivery App is starting up!"
    echo "=================================="
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend:  http://localhost:4000"
    echo "📊 API Status: http://localhost:4000/api/status"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    echo ""
    
    # Wait for user to stop
    wait
}

# Run main function
main
