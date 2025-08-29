import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ isConnected }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <span className="logo-icon">🍕</span>
            <span className="logo-text">FoodTracker</span>
          </Link>
        </div>

        <nav className="nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            🏠 Home
          </Link>
          
          <Link 
            to="/restaurants" 
            className={`nav-link ${isActive('/restaurants') ? 'active' : ''}`}
          >
            🍽️ Restaurants
          </Link>
          
          <Link 
            to="/map" 
            className={`nav-link ${isActive('/map') ? 'active' : ''}`}
          >
            🗺️ Map
          </Link>
          
          <Link 
            to="/track" 
            className={`nav-link ${isActive('/track') ? 'active' : ''}`}
          >
            📍 Track Order
          </Link>
        </nav>

        <div className="header-right">
          <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="indicator-dot"></span>
            <span className="indicator-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="user-menu">
            <button className="user-button">
              <span className="user-icon">👤</span>
              <span className="user-text">Account</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

