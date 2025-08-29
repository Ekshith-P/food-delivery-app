import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import MapComponent from './components/MapComponent';
import OrderTracking from './components/OrderTracking';
import RestaurantList from './components/RestaurantList';
import OrderForm from './components/OrderForm';
import Header from './components/Header';
import './App.css';

// Socket connection
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Connect to WebSocket server
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Listen for order updates
    socket.on('orderUpdate', (order) => {
      console.log('Received order update:', order);
      setCurrentOrder(order);
      addNotification('Order Update', `Order ${order.order_number} status: ${order.status}`);
    });

    socket.on('orderCreated', (order) => {
      console.log('New order created:', order);
      setCurrentOrder(order);
      addNotification('Order Created', `Order ${order.order_number} has been placed successfully!`);
    });

    socket.on('locationUpdate', (data) => {
      console.log('Location update received:', data);
      addNotification('Location Update', `Driver location updated for order ${data.orderId}`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      addNotification('Error', error.message || 'An error occurred');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const addNotification = (title, message) => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only last 5 notifications
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const createOrder = async (orderData) => {
    try {
      // Emit order creation via WebSocket
      socket.emit('newOrder', orderData);
      
      // Also make HTTP request as fallback
      const response = await fetch(`${SOCKET_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();
      setCurrentOrder(result.order);
      addNotification('Success', 'Order created successfully!');
      
      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      addNotification('Error', 'Failed to create order. Please try again.');
      throw error;
    }
  };

  const trackOrder = (orderId) => {
    socket.emit('trackOrder', orderId);
  };

  return (
    <Router>
      <div className="App">
        <Header isConnected={isConnected} />
        
        {/* Notifications */}
        <div className="notifications-container">
          {notifications.map(notification => (
            <div key={notification.id} className="notification">
              <div className="notification-header">
                <strong>{notification.title}</strong>
                <button 
                  onClick={() => removeNotification(notification.id)}
                  className="notification-close"
                >
                  ×
                </button>
              </div>
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <div className="home-page">
                <h1>Welcome to Food Delivery</h1>
                <p>Track your orders in real-time and discover amazing restaurants!</p>
                <div className="quick-actions">
                  <button onClick={() => window.location.href = '/restaurants'}>
                    Browse Restaurants
                  </button>
                  <button onClick={() => window.location.href = '/track'}>
                    Track Order
                  </button>
                </div>
              </div>
            } />
            
            <Route path="/map" element={<MapComponent />} />
            
            <Route path="/restaurants" element={
              <RestaurantList onCreateOrder={createOrder} />
            } />
            
            <Route path="/order/:id" element={
              <OrderForm onCreateOrder={createOrder} />
            } />
            
            <Route path="/track" element={
              <OrderTracking 
                currentOrder={currentOrder}
                onTrackOrder={trackOrder}
                socket={socket}
              />
            } />
            
            <Route path="/track/:id" element={
              <OrderTracking 
                currentOrder={currentOrder}
                onTrackOrder={trackOrder}
                socket={socket}
              />
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Connection Status */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>
    </Router>
  );
}

export default App;
