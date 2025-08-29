import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MapComponent from './MapComponent';
import './OrderTracking.css';

const OrderTracking = ({ currentOrder, onTrackOrder, socket }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(currentOrder);
  const [trackingInfo, setTrackingInfo] = setOrder;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const orderId = id || (currentOrder ? currentOrder.order_id : null);

  useEffect(() => {
    if (orderId) {
      fetchTrackingInfo(orderId);
    }
  }, [orderId]);

  const fetchTrackingInfo = async (orderId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/orders/${orderId}/tracking`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracking information');
      }
      
      const data = await response.json();
      setTrackingInfo(data);
      
      // Emit tracking request via WebSocket
      if (socket && socket.connected) {
        socket.emit('trackOrder', orderId);
      }
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'preparing':
        return '👨‍🍳';
      case 'ready':
        return '🚚';
      case 'picked_up':
        return '🛵';
      case 'delivered':
        return '🎉';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'confirmed':
        return '#17a2b8';
      case 'preparing':
        return '#fd7e14';
      case 'ready':
        return '#28a745';
      case 'picked_up':
        return '#007bff';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  if (!orderId) {
    return (
      <div className="tracking-container">
        <div className="tracking-header">
          <h2>Track Your Order</h2>
          <p>Enter an order number to track your delivery</p>
        </div>
        
        <div className="tracking-form">
          <input 
            type="text" 
            placeholder="Enter Order Number (e.g., ORD123456)"
            className="order-input"
          />
          <button className="track-button">
            Track Order
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tracking-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracking-container">
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={() => fetchTrackingInfo(orderId)} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trackingInfo) {
    return (
      <div className="tracking-container">
        <div className="no-order">
          <h3>📋 No Order Found</h3>
          <p>We couldn't find an order with that number.</p>
          <p>Please check your order number and try again.</p>
        </div>
      </div>
    );
  }

  // Prepare map markers
  const mapMarkers = [];
  
  if (trackingInfo.delivery_coordinates) {
    mapMarkers.push({
      coordinates: trackingInfo.delivery_coordinates,
      type: 'customer',
      title: 'Delivery Address',
      description: trackingInfo.delivery_address,
      color: '#28a745'
    });
  }

  if (trackingInfo.driver && trackingInfo.driver.location) {
    mapMarkers.push({
      coordinates: trackingInfo.driver.location,
      type: 'driver',
      title: trackingInfo.driver.name,
      description: 'Your delivery driver',
      color: '#007bff'
    });
  }

  return (
    <div className="tracking-container">
      <div className="tracking-header">
        <h2>Order Tracking</h2>
        <p>Order #{trackingInfo.order_id}</p>
      </div>

      <div className="tracking-content">
        <div className="tracking-info">
          <div className="status-card">
            <div className="status-header">
              <span className="status-icon" style={{ color: getStatusColor(trackingInfo.status) }}>
                {getStatusIcon(trackingInfo.status)}
              </span>
              <h3>Status: {trackingInfo.status.replace('_', ' ').toUpperCase()}</h3>
            </div>
            
            {trackingInfo.estimated_delivery_time && (
              <div className="eta-info">
                <strong>Estimated Delivery:</strong> {trackingInfo.estimated_delivery_time}
              </div>
            )}
            
            {trackingInfo.current_eta && (
              <div className="eta-info">
                <strong>Current ETA:</strong> {trackingInfo.current_eta}
              </div>
            )}
          </div>

          {trackingInfo.driver && (
            <div className="driver-info">
              <h4>🚚 Your Driver</h4>
              <p><strong>Name:</strong> {trackingInfo.driver.name}</p>
              {trackingInfo.driver.phone && (
                <p><strong>Phone:</strong> {trackingInfo.driver.phone}</p>
              )}
            </div>
          )}

          <div className="tracking-history">
            <h4>📋 Tracking History</h4>
            <div className="history-timeline">
              {trackingInfo.tracking_history?.map((entry, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-status">{entry.status}</div>
                    <div className="timeline-description">{entry.description}</div>
                    <div className="timeline-time">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tracking-map">
          <MapComponent 
            center={trackingInfo.delivery_coordinates || [-74.006, 40.7128]}
            zoom={13}
            markers={mapMarkers}
            showDeliveryRoute={true}
            deliveryRoute={trackingInfo.driver && trackingInfo.delivery_coordinates ? 
              [trackingInfo.driver.location, trackingInfo.delivery_coordinates] : null}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;

