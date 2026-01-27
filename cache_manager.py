"""
Cache Manager - Advanced caching system for reducing API calls
Implements in-memory caching with TTL and LRU eviction
"""
import time
from collections import OrderedDict
from functools import wraps
import hashlib
import json

class CacheManager:
    def __init__(self, max_size=1000):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0
        }
    
    def _generate_key(self, func_name, *args, **kwargs):
        """Generate a cache key from function name and arguments"""
        key_dict = {
            'func': func_name,
            'args': args,
            'kwargs': kwargs
        }
        key_str = json.dumps(key_dict, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key):
        """Get value from cache"""
        if key in self.cache:
            entry = self.cache[key]
            # Check if expired
            if time.time() < entry['expires_at']:
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                self.stats['hits'] += 1
                return entry['value']
            else:
                # Expired, remove
                del self.cache[key]
        
        self.stats['misses'] += 1
        return None
    
    def set(self, key, value, ttl=3600):
        """Set value in cache with TTL in seconds"""
        # If at max size, remove oldest
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
            self.stats['evictions'] += 1
        
        self.cache[key] = {
            'value': value,
            'expires_at': time.time() + ttl,
            'created_at': time.time()
        }
        self.cache.move_to_end(key)
    
    def invalidate(self, key):
        """Remove specific key from cache"""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
        self.stats = {'hits': 0, 'misses': 0, 'evictions': 0}
    
    def get_stats(self):
        """Get cache statistics"""
        total = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total * 100) if total > 0 else 0
        return {
            **self.stats,
            'size': len(self.cache),
            'hit_rate': f"{hit_rate:.2f}%"
        }

# Global cache instance
cache = CacheManager(max_size=1000)

def cached(ttl=3600):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache._generate_key(func.__name__, *args, **kwargs)
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator
