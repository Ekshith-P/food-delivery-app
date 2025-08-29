require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'food_delivery',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Redis client setup
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

// Import routes
const orderRoutes = require('./routes/orderRoutes');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Food Delivery Backend is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/orders', orderRoutes);

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    database: pool.totalCount > 0 ? 'connected' : 'disconnected',
    redis: redisClient.isReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Handle order tracking
  socket.on('trackOrder', async (orderId) => {
    try {
      const result = await pool.query(
        'SELECT * FROM orders WHERE order_id = $1',
        [orderId]
      );
      
      if (result.rows.length > 0) {
        socket.emit('orderUpdate', result.rows[0]);
      } else {
        socket.emit('orderNotFound', { orderId });
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      socket.emit('error', { message: 'Failed to track order' });
    }
  });

  // Handle location updates
  socket.on('updateLocation', (data) => {
    // Broadcast location update to all connected clients
    io.emit('locationUpdate', {
      orderId: data.orderId,
      location: data.location,
      timestamp: new Date().toISOString()
    });
  });

  // Handle new orders
  socket.on('newOrder', async (orderData) => {
    try {
      // Save order to database
      const result = await pool.query(
        'INSERT INTO orders (user_id, restaurant_id, status, items, delivery_address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [orderData.userId, orderData.restaurantId, 'pending', orderData.items, orderData.deliveryAddress]
      );
      
      const newOrder = result.rows[0];
      
      // Notify restaurant via Redis Pub/Sub
      await redisClient.publish('new_orders', JSON.stringify(newOrder));
      
      // Broadcast to all connected clients
      io.emit('orderCreated', newOrder);
      
      socket.emit('orderConfirmed', newOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      socket.emit('error', { message: 'Failed to create order' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Food Delivery Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server is ready for real-time connections`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
  console.log(`📊 API status: http://localhost:${PORT}/api/status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    pool.end();
    redisClient.quit();
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    pool.end();
    redisClient.quit();
  });
});
