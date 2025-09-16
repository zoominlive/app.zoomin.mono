const { sequelize } = require('./database');
const { Transaction } = require('sequelize');

/**
 * Transaction helper with automatic cleanup and retry logic
 * This helps prevent connection pool exhaustion and ensures proper transaction handling
 */
class TransactionHelper {
  /**
   * Execute a function within a transaction with automatic cleanup
   * @param {Function} callback - Function to execute within transaction
   * @param {Object} options - Transaction options
   * @returns {Promise} - Result of the callback function
   */
  static async execute(callback, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      // Note: MySQL expects 'READ COMMITTED' (space). Use Sequelize constant to avoid syntax issues.
      isolationLevel = Transaction.ISOLATION_LEVELS.READ_COMMITTED
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let transaction;
      
              try {
          // Check if pool is draining
          const pool = sequelize?.connectionManager?.pool;
          if (pool && pool.draining) {
            console.warn(`Pool is draining, waiting before transaction attempt ${attempt}`);
            await this.delay(2000); // Wait longer when pool is draining
            continue;
          }
          
          // Check pool health before creating transaction
          const poolStatus = this.getPoolStatus();
          if (poolStatus.utilization > 95) {
            console.warn(`Pool utilization high (${poolStatus.utilization.toFixed(1)}%) before transaction attempt ${attempt}`);
            await this.delay(1000); // Wait for connections to be freed
          }
        
        // Create transaction with correct isolation level
        transaction = await sequelize.transaction({
          isolationLevel
        });

        // Execute the callback with transaction
        const result = await callback(transaction);
        
        // Commit transaction
        await transaction.commit();
        
        return result;
        
      } catch (error) {
        // Rollback transaction if it exists
        if (transaction) {
          try {
            await transaction.rollback();
          } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError);
          }
        }

        lastError = error;
        
        // Check if error is retryable
        if (this.isRetryableError(error) && attempt < maxRetries) {
          console.warn(`Transaction attempt ${attempt} failed, retrying in ${retryDelay}ms...`, {
            error: error.message,
            attempt,
            maxRetries,
            poolStatus: this.getPoolStatus()
          });
          
          await this.delay(retryDelay * attempt); // Exponential backoff
          continue;
        }
        
        // If not retryable or max retries reached, throw error
        break;
      }
    }
    
    throw lastError;
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} - Whether the error is retryable
   */
  static isRetryableError(error) {
    const retryableErrors = [
      'ConnectionAcquireTimeoutError',
      'SequelizeConnectionAcquireTimeoutError',
      'SequelizeConnectionError',
      'SequelizeHostNotFoundError',
      'SequelizeHostNotReachableError',
      'SequelizeInvalidConnectionError',
      'SequelizeConnectionRefusedError',
      'SequelizeConnectionTimedOutError',
      'SequelizeTimeoutError',
      'TimeoutError',
      'ER_LOCK_DEADLOCK',
      'ER_LOCK_WAIT_TIMEOUT',
      'ER_QUERY_INTERRUPTED'
    ];

    return retryableErrors.some(errorType => 
      error.name === errorType || 
      error.message.includes(errorType) ||
      (error.parent && error.parent.code && retryableErrors.includes(error.parent.code))
    );
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current connection pool status
   * @returns {Object} - Pool status information
   */
  static getPoolStatus() {
    const pool = sequelize?.connectionManager?.pool;
    const config = sequelize?.options?.pool || {};
    const max = typeof config.max === 'number' ? config.max : (typeof pool?.max === 'number' ? pool.max : 0);
    const min = typeof config.min === 'number' ? config.min : (typeof pool?.min === 'number' ? pool.min : 0);
    const borrowed = typeof pool?.borrowed === 'number' ? pool.borrowed : (typeof pool?.size === 'number' ? pool.size : 0);
    const pending = typeof pool?.pending === 'number' ? pool.pending : 0;
    const available = max > 0 ? Math.max(max - borrowed, 0) : (typeof pool?.available === 'number' ? pool.available : 0);
    const size = typeof pool?.size === 'number' ? pool.size : borrowed;
    const utilization = max > 0 ? (borrowed / max) * 100 : 0;

    return {
      size,
      available,
      pending,
      borrowed,
      max,
      min,
      utilization
    };
  }

  /**
   * Check if connection pool is healthy
   * @returns {boolean} - Whether pool is healthy
   */
  static isPoolHealthy() {
    const status = this.getPoolStatus();
    return status.utilization < 90 && status.available > 0;
  }

  /**
   * Check if pool is in a state that could block logins
   * @returns {boolean} - Whether pool could block logins
   */
  static isPoolBlockingLogins() {
    const pool = sequelize?.connectionManager?.pool;
    const status = this.getPoolStatus();
    
    // Check if pool is draining
    if (pool && pool.draining) {
      return true;
    }
    
    // Check if pool is full with pending connections
    if (status.borrowed === status.max && status.pending > 0) {
      return true;
    }
    
    // Check if utilization is critically high
    if (status.utilization > 98) {
      return true;
    }
    
    return false;
  }

  /**
   * Force cleanup of idle connections
   * This can help when the pool is getting full
   */
  static forceCleanup() {
    try {
      const pool = sequelize.connectionManager.pool;
      
      // Check if pool is already draining
      if (pool && pool.draining) {
        console.log('⚠️ Pool is already draining, skipping cleanup');
        return;
      }
      
      // Check if there are active operations
      const status = this.getPoolStatus();
      if (status.borrowed > 0) {
        console.log(`⚠️ Pool has ${status.borrowed} active connections, skipping cleanup to avoid disruption`);
        return;
      }
      
      // Only drain if pool is very full and no active connections
      if (status.utilization > 95 && status.borrowed === 0) {
        console.log('🔄 Forcing pool cleanup (pool is full and no active connections)...');
        
        // Use a more gentle cleanup approach
        if (pool && typeof pool.drain === 'function') {
          // Set a flag to prevent new connections during cleanup
          pool.draining = true;
          
          // Drain with a timeout to prevent hanging
          const drainPromise = pool.drain();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Drain timeout')), 5000)
          );
          
          Promise.race([drainPromise, timeoutPromise])
            .then(() => {
              console.log('✅ Pool cleanup completed successfully');
            })
            .catch((error) => {
              console.warn('⚠️ Pool cleanup failed or timed out:', error.message);
            })
            .finally(() => {
              // Reset draining flag
              pool.draining = false;
            });
        }
      } else {
        console.log('ℹ️ Pool cleanup skipped - utilization is acceptable or connections are active');
      }
      
    } catch (error) {
      console.error('❌ Error during pool cleanup:', error);
    }
  }

  /**
   * Get detailed pool diagnostics
   * @returns {Object} - Detailed pool information
   */
  static getPoolDiagnostics() {
    const pool = sequelize.connectionManager.pool;
    const status = this.getPoolStatus();
    
    return {
      ...status,
      isHealthy: this.isPoolHealthy(),
      poolConfig: {
        max: pool.max,
        min: pool.min,
        idle: pool.idle,
        acquire: pool.acquire,
        evict: pool.evict
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = TransactionHelper;
