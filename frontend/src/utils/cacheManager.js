const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB
const CACHE_KEYS = [
  'profiles_cache_optimized',
  'profiles_cache_time',
  'certificatesEtag',
  'certificatesCache'
];

export const checkCacheSize = () => {
  try {
    let totalSize = 0;
    
    for (const key of CACHE_KEYS) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length * 2; // UTF-16 encoding
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error checking cache size:', error);
    return 0;
  }
};

export const clearOldCache = () => {
  try {
    const cacheTime = localStorage.getItem('profiles_cache_time');
    if (cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      // Clear cache older than 1 hour
      if (age > 60 * 60 * 1000) {
        localStorage.removeItem('profiles_cache_optimized');
        localStorage.removeItem('profiles_cache_time');
        console.log('Cleared old cache');
      }
    }
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
};

export const manageCacheSize = () => {
  try {
    const size = checkCacheSize();
    
    if (size > MAX_CACHE_SIZE) {
      console.warn('Cache size exceeded limit, clearing...');
      CACHE_KEYS.forEach(key => localStorage.removeItem(key));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error managing cache:', error);
    return false;
  }
};

export const initializeCacheManager = () => {
  clearOldCache();
  manageCacheSize();
  
  // Run cache check every 5 minutes
  setInterval(() => {
    clearOldCache();
    manageCacheSize();
  }, 5 * 60 * 1000);
};
