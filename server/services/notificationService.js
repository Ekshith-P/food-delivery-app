const redis = require('redis');

class NotificationService {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.initialize();
  }

  async initialize() {
    try {
      // Create publisher client
      this.publisher = redis.createClient({
        url: this.redisUrl
      });

      // Create subscriber client
      this.subscriber = redis.createClient({
        url: this.redisUrl
      });

      // Connect both clients
      await this.publisher.connect();
      await this.subscriber.connect();

      this.isConnected = true;
      console.log('✅ Notification service connected to Redis');

      // Set up error handling
      this.publisher.on('error', (err) => {
        console.error('Redis Publisher Error:', err);
        this.isConnected = false;
      });

      this.subscriber.on('error', (err) => {
        console.error('Redis Subscriber Error:', err);
        this.isConnected = false;
      });

      // Set up reconnection logic
      this.publisher.on('end', () => {
        console.log('Redis Publisher connection ended, attempting to reconnect...');
        this.isConnected = false;
        setTimeout(() => this.initialize(), 5000);
      });

      this.subscriber.on('end', () => {
        console.log('Redis Subscriber connection ended, attempting to reconnect...');
        this.isConnected = false;
        setTimeout(() => this.initialize(), 5000);
      });

    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      this.isConnected = false;
    }
  }

  /**
   * Publish a message to a specific channel
   * @param {string} channel - Channel name
   * @param {Object} message - Message to publish
   * @returns {boolean} Success status
   */
  async publish(channel, message) {
    if (!this.isConnected || !this.publisher) {
      console.warn('Notification service not connected');
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      await this.publisher.publish(channel, messageStr);
      console.log(`📢 Published to ${channel}:`, message);
      return true;
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name
   * @param {Function} callback - Callback function to handle messages
   */
  async subscribe(channel, callback) {
    if (!this.isConnected || !this.subscriber) {
      console.warn('Notification service not connected');
      return false;
    }

    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          // If message is not JSON, pass it as is
          callback(message);
        }
      });
      
      console.log(`👂 Subscribed to channel: ${channel}`);
      return true;
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channel - Channel name
   */
  async unsubscribe(channel) {
    if (!this.isConnected || !this.subscriber) {
      return false;
    }

    try {
      await this.subscriber.unsubscribe(channel);
      console.log(`🔇 Unsubscribed from channel: ${channel}`);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
      return false;
    }
  }

  /**
   * Notify restaurant about new order
   * @param {Object} order - Order object
   * @returns {boolean} Success status
   */
  async notifyRestaurant(order) {
    const channel = `restaurant:${order.restaurant_id}`;
    const message = {
      type: 'new_order',
      orderId: order.order_id,
      order: order,
      timestamp: new Date().toISOString()
    };

    return await this.publish(channel, message);
  }

  /**
   * Notify user about order status update
   * @param {number} userId - User ID
   * @param {Object} update - Status update
   * @returns {boolean} Success status
   */
  async notifyUser(userId, update) {
    const channel = `user:${userId}`;
    const message = {
      type: 'order_update',
      userId: userId,
      update: update,
      timestamp: new Date().toISOString()
    };

    return await this.publish(channel, message);
  }

  /**
   * Notify delivery driver about new assignment
   * @param {number} driverId - Driver ID
   * @param {Object} assignment - Assignment details
   * @returns {boolean} Success status
   */
  async notifyDriver(driverId, assignment) {
    const channel = `driver:${driverId}`;
    const message = {
      type: 'new_assignment',
      driverId: driverId,
      assignment: assignment,
      timestamp: new Date().toISOString()
    };

    return await this.publish(channel, message);
  }

  /**
   * Broadcast system-wide notification
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {boolean} Success status
   */
  async broadcastSystemNotification(type, data) {
    const channel = 'system:notifications';
    const message = {
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    };

    return await this.publish(channel, message);
  }

  /**
   * Get service status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      redisUrl: this.redisUrl,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Close connections gracefully
   */
  async close() {
    try {
      if (this.publisher) {
        await this.publisher.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      this.isConnected = false;
      console.log('✅ Notification service connections closed');
    } catch (error) {
      console.error('Error closing notification service:', error);
    }
  }
}

module.exports = new NotificationService();

