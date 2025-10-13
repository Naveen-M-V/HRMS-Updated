/**
 * Memory Guard Utility
 * Prevents memory leaks and crashes by managing localStorage size and cleanup
 */

const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit
const CACHE_KEYS = ['profiles_cache_optimized', 'certificatesCache', 'user_session'];

export const storageGuard = {
  /**
   * Safely set item in localStorage with size check
   */
  setItem: (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      // Check size before storing
      if (stringValue.length > MAX_STORAGE_SIZE) {
        console.warn(`Storage: ${key} exceeds size limit (${stringValue.length} bytes). Skipping.`);
        return false;
      }
      
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Clearing old caches...');
        storageGuard.clearCaches();
        
        // Try again after clearing
        try {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, stringValue);
          return true;
        } catch (retryError) {
          console.error('Storage still full after cleanup');
          return false;
        }
      }
      console.error('Storage error:', error);
      return false;
    }
  },

  /**
   * Clear all cache items
   */
  clearCaches: () => {
    CACHE_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_time`);
      } catch (error) {
        console.error(`Error clearing ${key}:`, error);
      }
    });
    console.log('All caches cleared');
  },

  /**
   * Get current storage usage
   */
  getUsage: () => {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return {
      bytes: totalSize,
      kb: (totalSize / 1024).toFixed(2),
      mb: (totalSize / (1024 * 1024)).toFixed(2)
    };
  },

  /**
   * Check if storage is getting full
   */
  isNearLimit: () => {
    const usage = storageGuard.getUsage();
    return usage.bytes > MAX_STORAGE_SIZE * 0.8; // 80% full
  },

  /**
   * Clean up old cache entries
   */
  cleanupOldCaches: () => {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    
    CACHE_KEYS.forEach(key => {
      const timeKey = `${key}_time`;
      const cacheTime = localStorage.getItem(timeKey);
      
      if (cacheTime) {
        const age = now - parseInt(cacheTime, 10);
        if (age > ONE_HOUR) {
          console.log(`Removing old cache: ${key} (${age}ms old)`);
          localStorage.removeItem(key);
          localStorage.removeItem(timeKey);
        }
      }
    });
  }
};

/**
 * Initialize memory guard - run on app startup
 */
export const initMemoryGuard = () => {
  console.log('Memory Guard: Initializing...');
  
  // Log current usage
  const usage = storageGuard.getUsage();
  console.log(`Storage usage: ${usage.mb} MB`);
  
  // Clean up old caches
  storageGuard.cleanupOldCaches();
  
  // Set up periodic cleanup (every 10 minutes)
  const cleanupInterval = setInterval(() => {
    if (storageGuard.isNearLimit()) {
      console.warn('Storage near limit, cleaning up...');
      storageGuard.cleanupOldCaches();
    }
  }, 10 * 60 * 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(cleanupInterval);
  };
};

export default storageGuard;
