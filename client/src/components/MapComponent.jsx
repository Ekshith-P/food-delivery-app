import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapComponent.css';

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

const MapComponent = ({ 
  center = [-74.006, 40.7128], // Default to NYC
  zoom = 12,
  markers = [],
  onMarkerClick,
  showDeliveryRoute = false,
  deliveryRoute = null
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env.local file');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
      attributionControl: true
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocation control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-left'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
      console.log('Map loaded successfully');
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData, index) => {
      const { coordinates, type, title, description, color = '#FF6B6B' } = markerData;
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = color;
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      
      // Add marker type icon
      const icon = document.createElement('div');
      icon.className = 'marker-icon';
      icon.innerHTML = getMarkerIcon(type);
      el.appendChild(icon);

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="marker-popup">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
        `);

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current);

      // Add click handler
      if (onMarkerClick) {
        el.addEventListener('click', () => onMarkerClick(markerData, index));
      }

      markersRef.current.push(marker);
    });
  }, [markers, mapLoaded, onMarkerClick]);

  // Update delivery route when it changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !showDeliveryRoute || !deliveryRoute) return;

    // Remove existing route
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Add new route
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: deliveryRoute
        }
      }
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#FF6B6B',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Fit map to route bounds
    const bounds = new mapboxgl.LngLatBounds();
    deliveryRoute.forEach(coord => bounds.extend(coord));
    map.current.fitBounds(bounds, { padding: 50 });
  }, [deliveryRoute, showDeliveryRoute, mapLoaded]);

  // Function to get marker icon based on type
  const getMarkerIcon = (type) => {
    switch (type) {
      case 'restaurant':
        return '🍕';
      case 'delivery':
        return '🚚';
      case 'customer':
        return '🏠';
      case 'driver':
        return '🚗';
      default:
        return '📍';
    }
  };

  // Function to add a marker programmatically
  const addMarker = (coordinates, type, title, description, color) => {
    if (!map.current || !mapLoaded) return;

    const markerData = { coordinates, type, title, description, color };
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundColor = color || '#FF6B6B';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';

    const icon = document.createElement('div');
    icon.className = 'marker-icon';
    icon.innerHTML = getMarkerIcon(type);
    el.appendChild(icon);

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="marker-popup">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      `);

    const marker = new mapboxgl.Marker(el)
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(map.current);

    markersRef.current.push(marker);
    return marker;
  };

  // Function to remove a marker
  const removeMarker = (marker) => {
    if (marker) {
      marker.remove();
      const index = markersRef.current.indexOf(marker);
      if (index > -1) {
        markersRef.current.splice(index, 1);
      }
    }
  };

  // Function to fly to location
  const flyTo = (coordinates, zoom = 15) => {
    if (map.current) {
      map.current.flyTo({
        center: coordinates,
        zoom: zoom,
        essential: true
      });
    }
  };

  // Expose functions to parent component
  useEffect(() => {
    if (map.current) {
      map.current.addMarker = addMarker;
      map.current.removeMarker = removeMarker;
      map.current.flyTo = flyTo;
    }
  }, [mapLoaded]);

  if (!mapboxgl.accessToken) {
    return (
      <div className="map-error">
        <h3>Mapbox Access Token Required</h3>
        <p>Please set VITE_MAPBOX_ACCESS_TOKEN in your .env.local file</p>
        <a 
          href="https://docs.mapbox.com/help/getting-started/access-tokens/" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          Get your access token
        </a>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      
      {/* Map Controls */}
      <div className="map-controls">
        <button 
          onClick={() => map.current?.flyTo({ center: center, zoom: zoom })}
          className="control-button"
          title="Reset View"
        >
          🏠
        </button>
        
        {showDeliveryRoute && deliveryRoute && (
          <button 
            onClick={() => {
              const bounds = new mapboxgl.LngLatBounds();
              deliveryRoute.forEach(coord => bounds.extend(coord));
              map.current?.fitBounds(bounds, { padding: 50 });
            }}
            className="control-button"
            title="Fit Route"
          >
            🛣️
          </button>
        )}
      </div>
    </div>
  );
};

export default MapComponent;

