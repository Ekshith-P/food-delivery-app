require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Food Delivery Backend (Demo Mode) is running!',
    status: 'healthy',
    mode: 'demo',
    timestamp: new Date().toISOString()
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    mode: 'demo',
    database: 'demo_mode',
    redis: 'demo_mode',
    timestamp: new Date().toISOString()
  });
});

// Demo orders endpoint
app.get('/api/orders', (req, res) => {
  const demoOrders = [
    {
      order_id: 1,
      order_number: "ORD-001",
      status: "preparing",
      customer_name: "John Doe",
      restaurant_name: "Pizza Palace",
      total_amount: 25.99,
      estimated_delivery_time: new Date(Date.now() + 30 * 60000).toISOString()
    },
    {
      order_id: 2,
      order_number: "ORD-002", 
      status: "delivered",
      customer_name: "Jane Smith",
      restaurant_name: "Burger House",
      total_amount: 18.50,
      estimated_delivery_time: new Date(Date.now() - 15 * 60000).toISOString()
    }
  ];
  
  res.json({
    orders: demoOrders,
    pagination: {
      page: 1,
      limit: 10,
      total: demoOrders.length,
      pages: 1
    }
  });
});

// Demo order by ID
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const demoOrder = {
    order_id: parseInt(id),
    order_number: `ORD-${id.padStart(3, '0')}`,
    status: "preparing",
    customer_name: "Demo Customer",
    restaurant_name: "Demo Restaurant",
    total_amount: 22.99,
    delivery_address: "123 Demo Street, Demo City",
    estimated_delivery_time: new Date(Date.now() + 25 * 60000).toISOString(),
    items: [
      { name: "Demo Item 1", quantity: 2, price: 9.99 },
      { name: "Demo Item 2", quantity: 1, price: 3.01 }
    ]
  };
  
  res.json(demoOrder);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Handle order tracking
  socket.on('trackOrder', async (orderId) => {
    try {
      // Simulate order data
      const demoOrder = {
        order_id: orderId,
        order_number: `ORD-${orderId.toString().padStart(3, '0')}`,
        status: "preparing",
        customer_name: "Demo Customer",
        restaurant_name: "Demo Restaurant",
        total_amount: 22.99,
        delivery_address: "123 Demo Street, Demo City",
        estimated_delivery_time: new Date(Date.now() + 25 * 60000).toISOString()
      };
      
      socket.emit('orderUpdate', demoOrder);
    } catch (error) {
      console.error('Error tracking order:', error);
      socket.emit('error', { message: 'Failed to track order' });
    }
  });

  // Handle location updates
  socket.on('updateLocation', (data) => {
    console.log('Location update received:', data);
    // Broadcast to all connected clients
    io.emit('locationUpdate', data);
  });

  // Handle new orders
  socket.on('newOrder', (orderData) => {
    console.log('New order received:', orderData);
    // Broadcast to all connected clients
    io.emit('orderCreated', orderData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Food Delivery Backend (Demo Mode) running on port ${PORT}`);
  console.log(`📱 Frontend should be running on http://localhost:5173`);
  console.log(`🔌 WebSocket server is ready for real-time communication`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

