"""
Request Throttler - Global request throttling to prevent resource spikes
Ultra-aggressive mode for March 2026 target
"""
import time
from functools import wraps
from flask import jsonify

# Global state for request throttling
last_request_time = {'timestamp': 0}

# Circuit breaker state
circuit_breaker = {
    'failures': 0,
    'last_failure': 0,
    'is_open': False,
    'opened_at': 0
}

CIRCUIT_BREAKER_THRESHOLD = 10  # Open after 10 failures
CIRCUIT_BREAKER_TIMEOUT = 300   # Stay open for 5 minutes
FAILURE_WINDOW = 60             # Count failures in 1-minute window

def throttle_request(min_delay_ms=500):
    """
    Decorator to enforce minimum delay between requests
    Ultra-aggressive: 500ms minimum delay between ANY requests
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            global last_request_time
            
            current_time = time.time()
            min_delay_seconds = min_delay_ms / 1000.0
            
            # Calculate time since last request
            time_since_last = current_time - last_request_time['timestamp']
            
            if time_since_last < min_delay_seconds:
                # Request too soon - enforce delay
                remaining = min_delay_seconds - time_since_last
                return jsonify({
                    'error': 'Request throttled. Please wait before retrying.',
                    'retry_after': round(remaining, 2),
                    'message': 'Ultra-aggressive throttling active to conserve resources'
                }), 503
            
            # Update last request time
            last_request_time['timestamp'] = current_time
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

def circuit_breaker_check():
    """
    Check if circuit breaker should be open
    Opens after 10 failures in 60 seconds, stays open for 5 minutes
    """
    global circuit_breaker
    
    current_time = time.time()
    
    # Check if circuit breaker should reset
    if circuit_breaker['is_open']:
        time_open = current_time - circuit_breaker['opened_at']
        if time_open > CIRCUIT_BREAKER_TIMEOUT:
            # Reset circuit breaker
            circuit_breaker['is_open'] = False
            circuit_breaker['failures'] = 0
            return False
        return True
    
    # Check if we should open circuit breaker
    time_since_last_failure = current_time - circuit_breaker['last_failure']
    
    # Reset counter if outside failure window
    if time_since_last_failure > FAILURE_WINDOW:
        circuit_breaker['failures'] = 0
    
    return False

def record_failure():
    """Record a failure for circuit breaker"""
    global circuit_breaker
    
    current_time = time.time()
    circuit_breaker['failures'] += 1
    circuit_breaker['last_failure'] = current_time
    
    # Check if we should open circuit breaker
    if circuit_breaker['failures'] >= CIRCUIT_BREAKER_THRESHOLD:
        circuit_breaker['is_open'] = True
        circuit_breaker['opened_at'] = current_time

def with_circuit_breaker(func):
    """
    Decorator to protect functions with circuit breaker
    Prevents cascading failures by stopping requests when error rate is high
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Check if circuit breaker is open
        if circuit_breaker_check():
            return jsonify({
                'error': 'Service temporarily unavailable',
                'message': 'Circuit breaker open due to high error rate. Please try again later.',
                'retry_after': CIRCUIT_BREAKER_TIMEOUT
            }), 503
        
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            # Record failure
            record_failure()
            raise e
    
    return wrapper

def get_throttle_stats():
    """Get throttling and circuit breaker statistics"""
    return {
        'last_request': last_request_time['timestamp'],
        'circuit_breaker': {
            'is_open': circuit_breaker['is_open'],
            'failures': circuit_breaker['failures'],
            'last_failure': circuit_breaker['last_failure']
        }
    }
