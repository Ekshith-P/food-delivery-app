const axios = require('axios');

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
    
    if (!this.apiKey) {
      console.warn('⚠️  Google Maps API key not found. ETA calculations will be disabled.');
    }
  }

  /**
   * Calculate ETA between two points using Google Maps Distance Matrix API
   * @param {string} origin - Origin coordinates (lat,lng)
   * @param {string} destination - Destination coordinates (lat,lng)
   * @param {string} mode - Travel mode (driving, walking, bicycling, transit)
   * @returns {Object} ETA information
   */
  async calculateETA(origin, destination, mode = 'driving') {
    if (!this.apiKey) {
      return {
        error: 'Google Maps API key not configured',
        estimatedDuration: null,
        estimatedDistance: null
      };
    }

    try {
      const url = `${this.baseUrl}/distancematrix/json`;
      const params = {
        origins: origin,
        destinations: destination,
        mode: mode,
        key: this.apiKey,
        units: 'metric',
        traffic_model: 'best_guess',
        departure_time: 'now'
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK') {
        const element = response.data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          return {
            estimatedDuration: element.duration.text,
            estimatedDurationValue: element.duration.value, // seconds
            estimatedDistance: element.distance.text,
            estimatedDistanceValue: element.distance.value, // meters
            mode: mode,
            origin: origin,
            destination: destination,
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            error: `Route calculation failed: ${element.status}`,
            estimatedDuration: null,
            estimatedDistance: null
          };
        }
      } else {
        return {
          error: `API request failed: ${response.data.status}`,
          estimatedDuration: null,
          estimatedDistance: null
        };
      }
    } catch (error) {
      console.error('Error calculating ETA:', error.message);
      return {
        error: 'Failed to calculate ETA',
        estimatedDuration: null,
        estimatedDistance: null
      };
    }
  }

  /**
   * Get optimized route between multiple points
   * @param {Array} waypoints - Array of coordinate strings
   * @param {string} mode - Travel mode
   * @returns {Object} Route information
   */
  async getOptimizedRoute(waypoints, mode = 'driving') {
    if (!this.apiKey) {
      return {
        error: 'Google Maps API key not configured',
        route: null
      };
    }

    try {
      const url = `${this.baseUrl}/directions/json`;
      const params = {
        origin: waypoints[0],
        destination: waypoints[waypoints.length - 1],
        waypoints: waypoints.slice(1, -1).join('|'),
        mode: mode,
        key: this.apiKey,
        optimize: true, // Optimize waypoint order
        alternatives: false
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK') {
        const route = response.data.routes[0];
        return {
          route: {
            summary: route.summary,
            totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
            totalDuration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0),
            waypointOrder: route.waypoint_order,
            legs: route.legs.map(leg => ({
              startAddress: leg.start_address,
              endAddress: leg.end_address,
              distance: leg.distance,
              duration: leg.duration,
              steps: leg.steps
            }))
          },
          error: null
        };
      } else {
        return {
          error: `Route optimization failed: ${response.data.status}`,
          route: null
        };
      }
    } catch (error) {
      console.error('Error optimizing route:', error.message);
      return {
        error: 'Failed to optimize route',
        route: null
      };
    }
  }

  /**
   * Get geocoded address from coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object} Address information
   */
  async reverseGeocode(lat, lng) {
    if (!this.apiKey) {
      return {
        error: 'Google Maps API key not configured',
        address: null
      };
    }

    try {
      const url = `${this.baseUrl}/geocode/json`;
      const params = {
        latlng: `${lat},${lng}`,
        key: this.apiKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          address: result.formatted_address,
          components: result.address_components,
          location: result.geometry.location,
          error: null
        };
      } else {
        return {
          error: 'No address found for coordinates',
          address: null
        };
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error.message);
      return {
        error: 'Failed to reverse geocode',
        address: null
      };
    }
  }

  /**
   * Get coordinates from address
   * @param {string} address - Address string
   * @returns {Object} Coordinate information
   */
  async geocode(address) {
    if (!this.apiKey) {
      return {
        error: 'Google Maps API key not configured',
        coordinates: null
      };
    }

    try {
      const url = `${this.baseUrl}/geocode/json`;
      const params = {
        address: address,
        key: this.apiKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          formattedAddress: result.formatted_address,
          components: result.address_components,
          error: null
        };
      } else {
        return {
          error: 'No coordinates found for address',
          coordinates: null
        };
      }
    } catch (error) {
      console.error('Error geocoding:', error.message);
      return {
        error: 'Failed to geocode address',
        coordinates: null
      };
    }
  }
}

module.exports = new GoogleMapsService();

