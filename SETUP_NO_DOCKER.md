# 🚀 Food Delivery App Setup Guide (No Docker)

This guide is for users who don't have Docker installed and want to set up the application using local services.

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **PostgreSQL** 15+ (local installation)
- **Redis** 7+ (local installation)
- **Git** for version control

## 🔧 **Local Service Installation**

### **PostgreSQL Installation**

#### **macOS (using Homebrew)**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb food_delivery

# Run the schema
psql -d food_delivery -f server/schema.sql
```

#### **Windows**
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Create database `food_delivery`
4. Run schema: `psql -d food_delivery -f server/schema.sql`

#### **Linux (Ubuntu/Debian)**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb food_delivery

# Run schema
sudo -u postgres psql -d food_delivery -f server/schema.sql
```

### **Redis Installation**

#### **macOS (using Homebrew)**
```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Test connection
redis-cli ping
```

#### **Windows**
1. Download Redis for Windows from [github.com/microsoftarchive/redis](https://github.com/microsoftarchive/redis)
2. Install and start the service
3. Test with `redis-cli ping`

#### **Linux (Ubuntu/Debian)**
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
```

## 🚀 **Application Setup**

### **Step 1: Backend Setup**
```bash
cd server

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env with your local configuration
nano .env
```

#### **Backend Environment Variables (.env)**
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration (Local PostgreSQL)
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=food_delivery
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# Redis Configuration (Local Redis)
REDIS_URL=redis://localhost:6379

# Google Maps API (Required for ETA calculations)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Client URL for CORS
CLIENT_URL=http://localhost:3000
```

### **Step 2: Frontend Setup**
```bash
cd client

# Install dependencies
npm install

# Create environment file
cp env.local.example .env.local

# Edit .env.local with your configuration
nano .env.local
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

### **Step 3: Start the Application**

#### **Option A: Manual Start**
```bash
# Terminal 1: Start Backend
cd server
npm run dev

# Terminal 2: Start Frontend
cd client
npm run dev
```

#### **Option B: Modified Startup Script**
```bash
# Make startup script executable
chmod +x start.sh

# Edit start.sh to skip Docker checks
# Then run:
./start.sh
```

## 🧪 **Testing the Setup**

### **1. Test Database Connection**
```bash
# Test PostgreSQL
psql -h localhost -U postgres -d food_delivery -c "SELECT version();"

# Test Redis
redis-cli ping
```

### **2. Test Backend**
```bash
# Start backend
cd server && npm run dev

# In another terminal, test API
curl http://localhost:4000/
curl http://localhost:4000/api/status
```

### **3. Test Frontend**
```bash
# Start frontend
cd client && npm run dev

# Open http://localhost:3000 in browser
```

## 🔑 **Required API Keys**

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

## 🐛 **Troubleshooting (Local Setup)**

### **PostgreSQL Issues**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# Restart PostgreSQL
brew services restart postgresql@15    # macOS
sudo systemctl restart postgresql     # Linux

# Check connection
psql -h localhost -U postgres -l
```

### **Redis Issues**
```bash
# Check if Redis is running
brew services list | grep redis       # macOS
sudo systemctl status redis-server    # Linux

# Restart Redis
brew services restart redis            # macOS
sudo systemctl restart redis-server   # Linux

# Test connection
redis-cli ping
```

### **Port Conflicts**
```bash
# Check what's using the ports
lsof -i :4000
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Kill processes if needed
kill -9 <PID>
```

### **Permission Issues**
```bash
# PostgreSQL permission issues
sudo -u postgres psql
ALTER USER postgres PASSWORD 'your_password';
\q

# Redis permission issues
sudo chown -R redis:redis /var/lib/redis
```

## 📱 **Development Workflow**

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
psql -d food_delivery -f server/schema.sql
```

## 🚀 **Production Considerations**

### **Local Production Setup**
- Use strong passwords for databases
- Set up proper firewall rules
- Configure SSL certificates
- Set up monitoring and logging

### **Cloud Deployment**
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Use managed Redis (AWS ElastiCache, Google Cloud Memorystore)
- Set up proper environment variables
- Configure CORS for production domains

## 📚 **Additional Resources**

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Node.js Installation](https://nodejs.org/en/download/)
- [Homebrew (macOS)](https://brew.sh/)

## 🤝 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all services are running
3. Check environment variables
4. Review console logs for errors
5. Ensure ports are not in use

---

**Happy coding with local services! 🎉**

