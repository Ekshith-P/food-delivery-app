import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderForm.css';

const OrderForm = ({ onCreateOrder }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    specialInstructions: '',
    items: [
      { name: 'Margherita Pizza', price: 15.99, quantity: 1 },
      { name: 'Pepperoni Pizza', price: 17.99, quantity: 1 }
    ]
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateItemQuantity = (index, change) => {
    const newItems = [...formData.items];
    const newQuantity = Math.max(1, newItems[index].quantity + change);
    newItems[index].quantity = newQuantity;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.08; // 8% tax
    const deliveryFee = 2.99;
    return subtotal + tax + deliveryFee;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.deliveryAddress.trim()) {
      alert('Please enter a delivery address');
      return;
    }

    setLoading(true);
    
    try {
      const orderData = {
        user_id: 1, // Mock user ID
        restaurant_id: parseInt(id),
        items: formData.items,
        delivery_address: formData.deliveryAddress,
        special_instructions: formData.specialInstructions,
        delivery_coordinates: '40.7128,-74.0060' // Mock coordinates
      };

      if (onCreateOrder) {
        await onCreateOrder(orderData);
      }

      // Navigate to tracking page
      navigate('/track');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form-container">
      <div className="order-form-header">
        <h1>🍽️ Place Your Order</h1>
        <p>Complete your order details and we'll get cooking!</p>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-section">
          <h3>📍 Delivery Details</h3>
          <div className="form-group">
            <label htmlFor="deliveryAddress">Delivery Address</label>
            <input
              type="text"
              id="deliveryAddress"
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleInputChange}
              placeholder="Enter your full delivery address"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="specialInstructions">Special Instructions</label>
            <textarea
              id="specialInstructions"
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleInputChange}
              placeholder="Any special requests or delivery instructions?"
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>🍕 Your Order</h3>
          <div className="order-items">
            {formData.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="item-price">${item.price}</p>
                </div>
                <div className="item-quantity">
                  <button
                    type="button"
                    onClick={() => updateItemQuantity(index, -1)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateItemQuantity(index, 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
                <div className="item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>💰 Order Summary</h3>
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (8%):</span>
              <span>${(calculateSubtotal() * 0.08).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee:</span>
              <span>$2.99</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/restaurants')}
            className="back-button"
          >
            ← Back to Restaurants
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? '🔄 Processing...' : '🚚 Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
