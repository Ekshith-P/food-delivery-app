# Food Delivery Logistics App

A real-time food delivery tracking application built with modern web technologies, featuring live order tracking, ETA calculations, and real-time notifications.

## Architecture Overview

This project follows a **monorepo structure** with separate backend and frontend applications:

- **Backend**: Node.js + Express server with PostgreSQL database and Redis for real-time messaging
- **Frontend**: React application with Mapbox integration for interactive maps
- **Real-time Communication**: WebSocket connections for live updates
- **Maps & Routing**: Google Maps API for ETA calculations and route optimization

## Features

- **Real-time Order Tracking**: Live updates on delivery status and location
- **Interactive Maps**: Mapbox integration for visual order tracking
- **ETA Calculations**: Google Maps API integration for accurate delivery time estimates
- **Real-time Notifications**: Redis Pub/Sub system for instant updates
- **Responsive Design**: Modern UI built with React and CSS-in-JS
- **WebSocket Communication**: Real-time bidirectional communication

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS for geospatial data
- **Cache & Messaging**: Redis for Pub/Sub notifications
- **Real-time**: Socket.io for WebSocket connections
- **Maps API**: Google Maps Distance Matrix API
- **Connection Pooling**: pgBouncer (production optimization)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Maps**: Mapbox GL JS
- **Real-time**: Socket.io client
- **Routing**: React Router DOM
- **Styling**: CSS Modules / Tailwind CSS

## Project Structure

```
food-delivery-app/
├── server/                 # Backend Node.js application
│   ├── index.js           # Main server file
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic services
│   ├── db.js              # Database connection
│   └── package.json       # Backend dependencies
├── client/                 # Frontend React application
│   ├── src/               # Source code
│   ├── components/        # React components
│   ├── App.jsx            # Main app component
│   └── package.json       # Frontend dependencies
├── .gitignore             # Git ignore rules
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- Google Maps API key
- Mapbox access token

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   PORT=4000
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_DATABASE=food_delivery
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   REDIS_URL=redis://localhost:6379
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```env
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   VITE_API_URL=http://localhost:4000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE food_delivery;
   ```

2. Run the schema file:
   ```bash
   psql -d food_delivery -f server/schema.sql
   ```

## Development

- **Backend**: Runs on `http://localhost:4000`
- **Frontend**: Runs on `http://localhost:3000`
- **Database**: PostgreSQL on port 5432
- **Redis**: Redis server on port 6379

## API Endpoints

- `GET /` - Health check
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/:id/tracking` - Get real-time tracking info

## Key Features Implementation

### Real-time Tracking
- WebSocket connections for live updates
- Redis Pub/Sub for restaurant notifications
- Mapbox markers for visual tracking

### ETA Calculations
- Google Maps Distance Matrix API integration
- Real-time traffic consideration
- Route optimization algorithms

### Order Management
- PostgreSQL for persistent storage
- Redis caching for performance
- Real-time status updates

## Deployment

### Production Considerations
- Use pgBouncer for database connection pooling
- Implement Redis clustering for high availability
- Set up proper environment variables
- Configure CORS for production domains
- Implement rate limiting and security measures

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Maps API for routing and ETA calculations
- Mapbox for interactive mapping solutions
- Redis for real-time messaging capabilities
- PostgreSQL for robust data storage
