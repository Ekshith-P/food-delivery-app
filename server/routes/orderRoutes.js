const express = require('express');
const router = express.Router();
const db = require('../db');
const googleMapsService = require('../services/googleMapsService');
const notificationService = require('../services/notificationService');

// GET /api/orders - Get all orders (with pagination and filtering)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id, restaurant_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      whereClause += ` AND o.status = $${paramCount}`;
      params.push(status);
    }
    
    if (user_id) {
      paramCount++;
      whereClause += ` AND o.user_id = $${paramCount}`;
      params.push(user_id);
    }
    
    if (restaurant_id) {
      paramCount++;
      whereClause += ` AND o.restaurant_id = $${paramCount}`;
      params.push(restaurant_id);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM orders o ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalOrders = parseInt(countResult.rows[0].count);
    
    // Get orders with pagination
    paramCount++;
    const ordersQuery = `
      SELECT 
        o.*,
        u.username as customer_name,
        u.phone as customer_phone,
        r.name as restaurant_name,
        r.address as restaurant_address,
        d.first_name as driver_first_name,
        d.last_name as driver_last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      LEFT JOIN drivers d ON o.driver_id = d.driver_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);
    const ordersResult = await db.query(ordersQuery, params);
    
    res.json({
      orders: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        o.*,
        u.username as customer_name,
        u.phone as customer_phone,
        u.address as customer_address,
        r.name as restaurant_name,
        r.address as restaurant_address,
        r.coordinates as restaurant_coordinates,
        d.first_name as driver_first_name,
        d.last_name as driver_last_name,
        d.phone as driver_phone,
        d.current_location as driver_location
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      LEFT JOIN drivers d ON o.driver_id = d.driver_id
      WHERE o.order_id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = result.rows[0];
    
    // Get order tracking history
    const trackingQuery = `
      SELECT * FROM order_tracking 
      WHERE order_id = $1 
      ORDER BY timestamp DESC
    `;
    const trackingResult = await db.query(trackingQuery, [id]);
    order.tracking_history = trackingResult.rows;
    
    res.json(order);
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      restaurant_id,
      items,
      delivery_address,
      delivery_coordinates,
      special_instructions
    } = req.body;
    
    // Validate required fields
    if (!user_id || !restaurant_id || !items || !delivery_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Calculate order totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }
    
    const tax_amount = subtotal * 0.08; // 8% tax
    const delivery_fee = 2.99; // Fixed delivery fee
    const total_amount = subtotal + tax_amount + delivery_fee;
    
    // Generate order number
    const orderNumberResult = await db.query('SELECT generate_order_number()');
    const order_number = orderNumberResult.rows[0].generate_order_number;
    
    // Create order
    const orderQuery = `
      INSERT INTO orders (
        user_id, restaurant_id, order_number, items, subtotal, 
        tax_amount, delivery_fee, total_amount, delivery_address, 
        delivery_coordinates, special_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const orderParams = [
      user_id, restaurant_id, order_number, items, subtotal,
      tax_amount, delivery_fee, total_amount, delivery_address,
      delivery_coordinates, special_instructions
    ];
    
    const orderResult = await db.query(orderQuery, orderParams);
    const newOrder = orderResult.rows[0];
    
    // Add initial tracking entry
    const trackingQuery = `
      INSERT INTO order_tracking (order_id, status, description)
      VALUES ($1, $2, $3)
    `;
    await db.query(trackingQuery, [newOrder.order_id, 'pending', 'Order placed successfully']);
    
    // Calculate ETA if coordinates are provided
    if (delivery_coordinates) {
      try {
        const restaurantQuery = 'SELECT coordinates FROM restaurants WHERE restaurant_id = $1';
        const restaurantResult = await db.query(restaurantQuery, [restaurant_id]);
        
        if (restaurantResult.rows.length > 0) {
          const restaurantCoords = restaurantResult.rows[0].coordinates;
          const etaResult = await googleMapsService.calculateETA(
            `${restaurantCoords[0]},${restaurantCoords[1]}`,
            delivery_coordinates
          );
          
          if (!etaResult.error) {
            // Update order with ETA
            const etaUpdateQuery = `
              UPDATE orders 
              SET estimated_delivery_time = NOW() + INTERVAL '1 minute' * $1
              WHERE order_id = $2
            `;
            const etaMinutes = Math.ceil(etaResult.estimatedDurationValue / 60);
            await db.query(etaUpdateQuery, [etaMinutes, newOrder.order_id]);
            
            newOrder.estimated_delivery_time = etaResult.estimatedDuration;
          }
        }
      } catch (etaError) {
        console.warn('Failed to calculate ETA:', etaError.message);
      }
    }
    
    // Notify restaurant via Redis
    await notificationService.notifyRestaurant(newOrder);
    
    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, driver_id, location, description } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Update order status
    const updateQuery = `
      UPDATE orders 
      SET status = $1, updated_at = NOW()
      ${driver_id ? ', driver_id = $3' : ''}
      WHERE order_id = $2
      RETURNING *
    `;
    
    const updateParams = driver_id ? [status, id, driver_id] : [status, id];
    const updateResult = await db.query(updateQuery, updateParams);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updatedOrder = updateResult.rows[0];
    
    // Add tracking entry
    const trackingQuery = `
      INSERT INTO order_tracking (order_id, status, location, description)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(trackingQuery, [id, status, location, description]);
    
    // Notify user about status update
    await notificationService.notifyUser(updatedOrder.user_id, {
      orderId: id,
      status: status,
      description: description,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/orders/:id/tracking - Get real-time tracking info
router.get('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order with current status
    const orderQuery = `
      SELECT 
        o.order_id, o.status, o.estimated_delivery_time,
        o.delivery_address, o.delivery_coordinates,
        r.coordinates as restaurant_coordinates,
        d.current_location as driver_location,
        d.first_name as driver_first_name,
        d.last_name as driver_last_name
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      LEFT JOIN drivers d ON o.driver_id = d.driver_id
      WHERE o.order_id = $1
    `;
    
    const orderResult = await db.query(orderQuery, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Get tracking history
    const trackingQuery = `
      SELECT * FROM order_tracking 
      WHERE order_id = $1 
      ORDER BY timestamp ASC
    `;
    const trackingResult = await db.query(trackingQuery, [id]);
    
    // Calculate current ETA if driver is assigned
    let currentETA = null;
    if (order.driver_location && order.delivery_coordinates) {
      try {
        const etaResult = await googleMapsService.calculateETA(
          `${order.driver_location[0]},${order.driver_location[1]}`,
          `${order.delivery_coordinates[0]},${order.delivery_coordinates[1]}`
        );
        
        if (!etaResult.error) {
          currentETA = etaResult.estimatedDuration;
        }
      } catch (etaError) {
        console.warn('Failed to calculate current ETA:', etaError.message);
      }
    }
    
    res.json({
      order_id: order.order_id,
      status: order.status,
      estimated_delivery_time: order.estimated_delivery_time,
      current_eta: currentETA,
      delivery_address: order.delivery_address,
      driver: order.driver_first_name ? {
        name: `${order.driver_first_name} ${order.driver_last_name}`,
        location: order.driver_location
      } : null,
      tracking_history: trackingResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    res.status(500).json({ error: 'Failed to fetch tracking info' });
  }
});

// DELETE /api/orders/:id - Cancel order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if order can be cancelled
    const orderQuery = 'SELECT status FROM orders WHERE order_id = $1';
    const orderResult = await db.query(orderQuery, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }
    
    // Update order status to cancelled
    const updateQuery = `
      UPDATE orders 
      SET status = 'cancelled', updated_at = NOW()
      WHERE order_id = $1
      RETURNING *
    `;
    
    const updateResult = await db.query(updateQuery, [id]);
    
    // Add tracking entry
    const trackingQuery = `
      INSERT INTO order_tracking (order_id, status, description)
      VALUES ($1, $2, $3)
    `;
    await db.query(trackingQuery, [id, 'cancelled', 'Order cancelled by user']);
    
    res.json({
      message: 'Order cancelled successfully',
      order: updateResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;

