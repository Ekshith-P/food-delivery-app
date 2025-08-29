import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './RestaurantList.css';

const RestaurantList = ({ onCreateOrder }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      // For now, we'll use mock data since the backend might not be running
      // In a real app, you'd fetch from your API
      const mockRestaurants = [
        {
          restaurant_id: 1,
          name: 'Pizza Palace',
          description: 'Best pizza in town with fresh ingredients',
          cuisine_type: 'Italian',
          rating: 4.5,
          delivery_fee: 2.99,
          minimum_order: 15.00,
          image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'
        },
        {
          restaurant_id: 2,
          name: 'Burger House',
          description: 'Juicy burgers and crispy fries',
          cuisine_type: 'American',
          rating: 4.2,
          delivery_fee: 1.99,
          minimum_order: 12.00,
          image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
        },
        {
          restaurant_id: 3,
          name: 'Sushi Express',
          description: 'Fresh sushi and Japanese cuisine',
          cuisine_type: 'Japanese',
          rating: 4.7,
          delivery_fee: 3.99,
          minimum_order: 20.00,
          image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400'
        },
        {
          restaurant_id: 4,
          name: 'Taco Fiesta',
          description: 'Authentic Mexican tacos and burritos',
          cuisine_type: 'Mexican',
          rating: 4.3,
          delivery_fee: 1.99,
          minimum_order: 10.00,
          image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400'
        }
      ];

      setRestaurants(mockRestaurants);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants');
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    if (filter === 'all') return true;
    return restaurant.cuisine_type.toLowerCase() === filter.toLowerCase();
  });

  const cuisineTypes = ['all', ...new Set(restaurants.map(r => r.cuisine_type))];

  if (loading) {
    return (
      <div className="restaurant-list-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="restaurant-list-container">
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={fetchRestaurants} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-list-container">
      <div className="restaurant-list-header">
        <h1>🍽️ Discover Amazing Restaurants</h1>
        <p>Order delicious food from the best restaurants in your area</p>
      </div>

      <div className="filter-section">
        <div className="filter-buttons">
          {cuisineTypes.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => setFilter(cuisine)}
              className={`filter-button ${filter === cuisine ? 'active' : ''}`}
            >
              {cuisine === 'all' ? '🍽️ All' : 
               cuisine === 'Italian' ? '🍕 Italian' :
               cuisine === 'American' ? '🍔 American' :
               cuisine === 'Japanese' ? '🍣 Japanese' :
               cuisine === 'Mexican' ? '🌮 Mexican' : cuisine}
            </button>
          ))}
        </div>
      </div>

      <div className="restaurant-grid">
        {filteredRestaurants.map(restaurant => (
          <div key={restaurant.restaurant_id} className="restaurant-card">
            <div className="restaurant-image">
              <img 
                src={restaurant.image_url} 
                alt={restaurant.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x250/cccccc/666666?text=Restaurant+Image';
                }}
              />
              <div className="restaurant-rating">
                ⭐ {restaurant.rating}
              </div>
            </div>
            
            <div className="restaurant-info">
              <h3>{restaurant.name}</h3>
              <p className="cuisine-type">{restaurant.cuisine_type}</p>
              <p className="description">{restaurant.description}</p>
              
              <div className="restaurant-details">
                <div className="detail-item">
                  <span className="detail-label">🚚 Delivery:</span>
                  <span className="detail-value">${restaurant.delivery_fee}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">💰 Min Order:</span>
                  <span className="detail-value">${restaurant.minimum_order}</span>
                </div>
              </div>
              
              <div className="restaurant-actions">
                <Link 
                  to={`/order/${restaurant.restaurant_id}`}
                  className="order-button"
                >
                  🍽️ Order Now
                </Link>
                <button className="view-menu-button">
                  📋 View Menu
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="no-restaurants">
          <h3>🍽️ No Restaurants Found</h3>
          <p>No restaurants match your current filter.</p>
          <button onClick={() => setFilter('all')} className="clear-filter-button">
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;
