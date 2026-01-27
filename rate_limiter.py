"""
Rate Limiter - Prevents excessive API calls
Implements token bucket algorithm with per-user and global limits
"""
import time
from collections import defaultdict
from functools import wraps
from flask import request, jsonify

class RateLimiter:
    def __init__(self):
        # Token buckets: {identifier: {'tokens': count, 'last_update': timestamp}}
        self.buckets = {}
        self.global_bucket = {'tokens': 0, 'last_update': time.time(), 'initialized': None}
    
    def _refill_bucket(self, bucket, capacity, refill_rate):
        """Refill tokens based on elapsed time"""
        now = time.time()
        elapsed = now - bucket['last_update']
        
        # Add tokens based on elapsed time
        tokens_to_add = elapsed * refill_rate
        bucket['tokens'] = min(capacity, bucket['tokens'] + tokens_to_add)
        bucket['last_update'] = now
        
        return bucket['tokens']
    
    def is_allowed(self, identifier, capacity=10, refill_rate=0.1):
        """
        Check if request is allowed
        capacity: max tokens
        refill_rate: tokens per second
        """
        # Initialize bucket if doesn't exist (start with full capacity)
        if identifier not in self.buckets:
            self.buckets[identifier] = {
                'tokens': capacity,
                'last_update': time.time()
            }
        
        bucket = self.buckets[identifier]
        
        # Refill bucket
        available_tokens = self._refill_bucket(bucket, capacity, refill_rate)
        
        # Check if we have tokens
        if available_tokens >= 1.0:
            bucket['tokens'] -= 1.0
            return True
        
        return False
    
    def is_globally_allowed(self, capacity=100, refill_rate=1.0):
        """Global rate limit for all requests"""
        # Initialize if needed - check if bucket was just created
        if self.global_bucket.get('initialized') is None:
            self.global_bucket['tokens'] = capacity
            self.global_bucket['initialized'] = True
        
        available_tokens = self._refill_bucket(
            self.global_bucket, 
            capacity, 
            refill_rate
        )
        
        if available_tokens >= 1.0:
            self.global_bucket['tokens'] -= 1.0
            return True
        
        return False
    
    def get_retry_after(self, identifier, refill_rate=0.1):
        """Calculate seconds until next token available"""
        bucket = self.buckets[identifier]
        tokens_needed = 1.0 - bucket['tokens']
        if tokens_needed <= 0:
            return 0
        return int(tokens_needed / refill_rate) + 1

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(capacity=10, refill_rate=0.1, per_user=True):
    """
    Decorator for rate limiting endpoints
    capacity: max requests allowed in bucket
    refill_rate: requests per second refill rate
    per_user: if True, limit per IP, else global
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get identifier (IP address or global)
            identifier = request.remote_addr if per_user else 'global'
            
            # Check global limit first
            if not rate_limiter.is_globally_allowed(capacity=1000, refill_rate=10.0):
                return jsonify({
                    'error': 'Service temporarily overloaded. Please try again later.',
                    'retry_after': 10
                }), 503
            
            # Check per-user limit
            if not rate_limiter.is_allowed(identifier, capacity, refill_rate):
                retry_after = rate_limiter.get_retry_after(identifier, refill_rate)
                return jsonify({
                    'error': 'Rate limit exceeded. Please slow down.',
                    'retry_after': retry_after
                }), 429
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator
