const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.initialize();
  }

  initialize() {
    try {
      this.pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_DATABASE || 'food_delivery',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
      });

      // Handle pool errors
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        this.isConnected = false;
      });

      // Test connection
      this.testConnection();
      
    } catch (error) {
      console.error('Failed to initialize database pool:', error);
      this.isConnected = false;
    }
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Execute a query with parameters
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Object} Query result
   */
  async query(text, params) {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      console.log('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   * @returns {Object} Database client
   */
  async getClient() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return await this.pool.connect();
  }

  /**
   * Execute a transaction with multiple queries
   * @param {Function} callback - Function containing transaction logic
   * @returns {Object} Transaction result
   */
  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get database status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      totalCount: this.pool ? this.pool.totalCount : 0,
      idleCount: this.pool ? this.pool.idleCount : 0,
      waitingCount: this.pool ? this.pool.waitingCount : 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Close all connections in the pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('✅ Database connections closed');
    }
  }
}

module.exports = new Database();

