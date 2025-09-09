// Production caching utilities
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static memoryCache = new Map<string, CacheItem<any>>();
  private static maxMemorySize = 100; // Maximum items in memory cache

  // Set cache item
  static set<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.memoryCache.set(key, item);

    // Clean up if cache is too large
    if (this.memoryCache.size > this.maxMemorySize) {
      this.cleanup();
    }
  }

  // Get cache item
  static get<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data;
  }

  // Delete cache item
  static delete(key: string): boolean {
    return this.memoryCache.delete(key);
  }

  // Clear all cache
  static clear(): void {
    this.memoryCache.clear();
  }

  // Clean up expired items
  private static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  // Get cache statistics
  static getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.memoryCache.size,
      maxSize: this.maxMemorySize,
      hitRate: 0 // Would need to track hits/misses
    };
  }
}

// Database query caching
export class QueryCache {
  private static cachePrefix = 'query_';

  // Cache database query result
  static async cacheQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> {
    const cacheKey = this.cachePrefix + queryKey;
    
    // Try to get from cache
    const cached = CacheManager.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query and cache result
    try {
      const result = await queryFn();
      CacheManager.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Invalidate cache by pattern
  static invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of CacheManager['memoryCache'].keys()) {
      if (regex.test(key)) {
        CacheManager.delete(key);
      }
    }
  }

  // Invalidate all query cache
  static invalidateAll(): void {
    this.invalidatePattern('^' + this.cachePrefix);
  }
}

// API response caching
export class APICache {
  private static cachePrefix = 'api_';

  // Cache API response
  static async cacheResponse<T>(
    endpoint: string,
    requestFn: () => Promise<T>,
    ttl: number = 600000 // 10 minutes
  ): Promise<T> {
    const cacheKey = this.cachePrefix + endpoint;
    
    // Try to get from cache
    const cached = CacheManager.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Make request and cache result
    try {
      const result = await requestFn();
      CacheManager.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Invalidate API cache
  static invalidateEndpoint(endpoint: string): void {
    const cacheKey = this.cachePrefix + endpoint;
    CacheManager.delete(cacheKey);
  }
}

// Session storage cache
export class SessionCache {
  // Set session cache
  static set<T>(key: string, data: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Session storage not available:', error);
    }
  }

  // Get session cache
  static get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      return parsed.data;
    } catch (error) {
      console.warn('Failed to get from session storage:', error);
      return null;
    }
  }

  // Delete session cache
  static delete(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to delete from session storage:', error);
    }
  }

  // Clear all session cache
  static clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
  }
}

// Local storage cache with TTL
export class LocalCache {
  // Set local cache with TTL
  static set<T>(key: string, data: T, ttl: number = 86400000): void { // 24 hours default
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl
      }));
    } catch (error) {
      console.warn('Local storage not available:', error);
    }
  }

  // Get local cache
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check if expired
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to get from local storage:', error);
      return null;
    }
  }

  // Delete local cache
  static delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to delete from local storage:', error);
    }
  }

  // Clean up expired items
  static cleanup(): void {
    try {
      const keysToDelete: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const item = localStorage.getItem(key);
          if (!item) continue;

          const parsed = JSON.parse(item);
          if (parsed.timestamp && parsed.ttl) {
            if (Date.now() - parsed.timestamp > parsed.ttl) {
              keysToDelete.push(key);
            }
          }
        } catch {
          // Skip invalid items
        }
      }

      keysToDelete.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to cleanup local storage:', error);
    }
  }
}

// Initialize cache cleanup
if (typeof window !== 'undefined') {
  // Clean up expired local storage items on page load
  LocalCache.cleanup();
  
  // Clean up every hour
  setInterval(() => {
    LocalCache.cleanup();
    CacheManager['cleanup']();
  }, 3600000);
}
