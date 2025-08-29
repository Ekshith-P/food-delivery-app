-- Food Delivery App Database Schema
-- This file contains all the necessary tables and indexes for the application

-- Enable PostGIS extension for geospatial data (if available)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address TEXT,
    coordinates POINT, -- (latitude, longitude)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(50),
    address TEXT NOT NULL,
    coordinates POINT NOT NULL, -- (latitude, longitude)
    phone VARCHAR(20),
    email VARCHAR(100),
    opening_hours JSONB, -- Store opening hours as JSON
    rating DECIMAL(3,2) DEFAULT 0.0,
    delivery_radius INTEGER DEFAULT 5000, -- in meters
    minimum_order DECIMAL(10,2) DEFAULT 0.0,
    delivery_fee DECIMAL(10,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
    item_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time INTEGER DEFAULT 15, -- in minutes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    driver_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50), -- car, motorcycle, bicycle, etc.
    vehicle_number VARCHAR(20),
    license_number VARCHAR(50),
    current_location POINT,
    is_available BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    restaurant_id INTEGER REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(driver_id),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, picked_up, delivered, cancelled
    items JSONB NOT NULL, -- Store order items as JSON
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.0,
    delivery_fee DECIMAL(10,2) DEFAULT 0.0,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_coordinates POINT,
    special_instructions TEXT,
    estimated_delivery_time TIMESTAMPTZ,
    actual_delivery_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order tracking table for real-time updates
CREATE TABLE IF NOT EXISTS order_tracking (
    tracking_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    location POINT,
    description TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Driver location history for tracking
CREATE TABLE IF NOT EXISTS driver_locations (
    location_id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(driver_id) ON DELETE CASCADE,
    coordinates POINT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant operating hours
CREATE TABLE IF NOT EXISTS restaurant_hours (
    hours_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    UNIQUE(restaurant_id, day_of_week)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_coordinates ON users USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_restaurants_coordinates ON restaurants USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available, is_online);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_timestamp ON order_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (username, email, phone, first_name, last_name, address, coordinates) VALUES
('john_doe', 'john@example.com', '+1234567890', 'John', 'Doe', '123 Main St, City, State', point(40.7128, -74.0060)),
('jane_smith', 'jane@example.com', '+1234567891', 'Jane', 'Smith', '456 Oak Ave, City, State', point(40.7589, -73.9851))
ON CONFLICT (username) DO NOTHING;

INSERT INTO restaurants (name, description, cuisine_type, address, coordinates, phone, rating) VALUES
('Pizza Palace', 'Best pizza in town with fresh ingredients', 'Italian', '789 Pizza St, City, State', point(40.7505, -73.9934), '+1234567892', 4.5),
('Burger House', 'Juicy burgers and crispy fries', 'American', '321 Burger Blvd, City, State', point(40.7484, -73.9857), '+1234567893', 4.2)
ON CONFLICT (restaurant_id) DO NOTHING;

INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(1, 'Margherita Pizza', 'Classic tomato sauce with mozzarella', 15.99, 'Pizza'),
(1, 'Pepperoni Pizza', 'Spicy pepperoni with cheese', 17.99, 'Pizza'),
(2, 'Classic Burger', 'Beef patty with lettuce and tomato', 12.99, 'Burgers'),
(2, 'Cheese Fries', 'Crispy fries with melted cheese', 6.99, 'Sides')
ON CONFLICT (item_id) DO NOTHING;

-- Create a function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
    new_order_number VARCHAR;
    counter INTEGER;
BEGIN
    LOOP
        -- Generate a random 6-digit number
        counter := floor(random() * 900000) + 100000;
        new_order_number := 'ORD' || counter;
        
        -- Check if it already exists
        EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number);
    END LOOP;
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate delivery distance
CREATE OR REPLACE FUNCTION calculate_delivery_distance(
    restaurant_coords POINT,
    delivery_coords POINT
)
RETURNS DECIMAL AS $$
BEGIN
    -- Simple distance calculation (in meters)
    -- In production, you might want to use PostGIS for more accurate calculations
    RETURN sqrt(
        power((restaurant_coords[0] - delivery_coords[0]) * 111000, 2) +
        power((restaurant_coords[1] - delivery_coords[1]) * 111000 * cos(radians(restaurant_coords[0])), 2)
    );
END;
$$ LANGUAGE plpgsql;

