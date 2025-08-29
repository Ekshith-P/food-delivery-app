# 🚀 Food Delivery App Setup Guide

This guide will walk you through setting up the complete Food Delivery Logistics App with real-time tracking capabilities.

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose** (for database services)
- **Git** for version control

## 🏗️ Project Structure

```
food-delivery-app/
├── server/                 # Backend Node.js application
├── client/                 # Frontend React application
├── docker-compose.yml      # Database services configuration
├── start.sh               # Automated startup script
└── README.md              # Project documentation
```

## 🚀 Quick Start (Recommended)

### 1. **Start Database Services**
```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. **Run the Startup Script**
```bash
# Make the script executable (if not already)
chmod +x start.sh

# Run the startup script
./start.sh
```

The startup script will:
- ✅ Check Node.js version
- ✅ Install dependencies automatically
- ✅ Create environment files from examples
- ✅ Start both backend and frontend servers
- ✅ Display access URLs

## 🔧 Manual Setup

### **Step 1: Database Setup**

#### **Option A: Using Docker (Recommended)**
```bash
# Start database services
docker-compose up -d postgres redis

# Check if services are running
docker-compose ps
```

#### **Option B: Local Installation**
- Install PostgreSQL 15+ and create database `food_delivery`
- Install Redis 7+ and start the service
- Run the schema: `psql -d food_delivery -f server/schema.sql`

### **Step 2: Backend Setup**

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env with your configuration
nano .env

# Start the server
npm run dev
```

#### **Backend Environment Variables (.env)**
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=food_delivery
DB_PASSWORD=password
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Google Maps API (Required for ETA calculations)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Client URL for CORS
CLIENT_URL=http://localhost:3000
```

### **Step 3: Frontend Setup**

```bash
cd client

# Install dependencies
npm install

# Create environment file
cp env.local.example .env.local

# Edit .env.local with your configuration
nano .env.local

# Start the development server
npm run dev
```

#### **Frontend Environment Variables (.env.local)**
```env
# API Configuration
VITE_API_URL=http://localhost:4000

# Mapbox Configuration (Required for maps)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# App Configuration
VITE_APP_NAME=FoodTracker
VITE_APP_VERSION=1.0.0
```

## 🔑 Required API Keys

### **Google Maps API**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Distance Matrix API
   - Directions API
   - Geocoding API
4. Create credentials (API Key)
5. Add the key to `server/.env`

### **Mapbox Access Token**
1. Go to [Mapbox](https://www.mapbox.com/)
2. Create an account or sign in
3. Navigate to Account → Access Tokens
4. Create a new token or use the default public token
5. Add the token to `client/.env.local`

## 🧪 Testing the Setup

### **Backend Health Check**
```bash
curl http://localhost:4000/
# Expected: {"message":"Food Delivery Backend is running!","status":"healthy"}

curl http://localhost:4000/api/status
# Expected: Server, database, and Redis status
```

### **Frontend Access**
- Open http://localhost:3000 in your browser
- You should see the FoodTracker homepage
- Navigate through different sections

### **Database Connection**
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d food_delivery

# Check tables
\dt

# Check sample data
SELECT * FROM restaurants LIMIT 3;
```

## 🐛 Troubleshooting

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :4000
lsof -i :3000

# Kill the process or change ports in .env files
```

#### **Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart service
docker-compose restart postgres
```

#### **Redis Connection Failed**
```bash
# Check if Redis is running
docker-compose ps redis

# Check logs
docker-compose logs redis

# Test connection
redis-cli ping
```

#### **Frontend Build Errors**
```bash
# Clear node_modules and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
```

#### **Backend Dependencies Issues**
```bash
# Clear node_modules and reinstall
cd server
rm -rf node_modules package-lock.json
npm install
```

### **Environment File Issues**
- Ensure `.env` and `.env.local` files exist
- Check for typos in variable names
- Verify API keys are correct
- Restart servers after changing environment variables

## 📱 Development Workflow

### **Backend Development**
```bash
cd server
npm run dev  # Uses nodemon for auto-restart
```

### **Frontend Development**
```bash
cd client
npm run dev  # Vite dev server with HMR
```

### **Database Changes**
```bash
# After modifying schema.sql
docker-compose down
docker-compose up -d postgres
```

## 🚀 Production Deployment

### **Environment Variables**
- Set `NODE_ENV=production`
- Use strong database passwords
- Configure production database URLs
- Set up proper CORS origins

### **Database**
- Use managed PostgreSQL service (AWS RDS, Google Cloud SQL)
- Use managed Redis service (AWS ElastiCache, Google Cloud Memorystore)
- Set up proper backup and monitoring

### **Security**
- Use environment variables for all secrets
- Set up proper CORS configuration
- Implement rate limiting
- Add authentication and authorization

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Socket.io Documentation](https://socket.io/docs/)

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Verify all environment variables are set correctly
4. Ensure all required services are running
5. Check the GitHub issues for similar problems

---

**Happy coding! 🎉**
