"""
Rate limiting implementation for DOC AI.
Uses in-memory storage for simplicity; upgrade to Redis for production.
"""

import time
from functools import wraps
from collections import defaultdict
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        """Initialize rate limiter with empty state."""
        self.requests = defaultdict(list)  # {client_id: [timestamp, ...]}
        self.cleanup_threshold = 1000  # Cleanup after N requests
        self.request_count = 0
    
    def get_client_id(self):
        """
        Get unique client identifier.
        
        Returns:
            Client ID (IP address or user ID)
        """
        # Try to get user ID from JWT
        from flask_jwt_extended import get_jwt, get_jwt_identity
        try:
            identity = get_jwt_identity()
            if identity:
                return f"user_{identity}"
        except:
            pass
        
        # Fallback to IP address
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        return request.remote_addr or 'unknown'
    
    def is_allowed(self, client_id: str, max_requests: int, 
                  window_seconds: int) -> tuple:
        """
        Check if client is within rate limit.
        
        Args:
            client_id: Unique client identifier
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            Tuple of (allowed: bool, remaining: int, reset_in: int)
        """
        now = time.time()
        cutoff_time = now - window_seconds
        
        # Clean old requests for this client
        self.requests[client_id] = [
            ts for ts in self.requests[client_id] 
            if ts > cutoff_time
        ]
        
        # Check limit
        request_count = len(self.requests[client_id])
        allowed = request_count < max_requests
        
        if allowed:
            self.requests[client_id].append(now)
        
        remaining = max(0, max_requests - request_count - (0 if allowed else 1))
        
        # Calculate when oldest request expires
        if self.requests[client_id]:
            reset_in = int(self.requests[client_id][0] + window_seconds - now) + 1
        else:
            reset_in = 0
        
        # Periodic cleanup
        self.request_count += 1
        if self.request_count % self.cleanup_threshold == 0:
            self._cleanup_old_clients()
        
        return allowed, remaining, reset_in
    
    def _cleanup_old_clients(self):
        """Remove inactive clients to prevent memory leak."""
        now = time.time()
        cutoff_time = now - 3600  # Remove clients with no requests in 1 hour
        
        expired_clients = [
            client_id for client_id, timestamps in self.requests.items()
            if all(ts < cutoff_time for ts in timestamps)
        ]
        
        for client_id in expired_clients:
            del self.requests[client_id]
        
        if expired_clients:
            logger.debug(f"Cleaned up {len(expired_clients)} inactive clients")


# Global rate limiter instance
_limiter = RateLimiter()


def rate_limit(max_requests: int = 100, window_seconds: int = 60,
               error_message: str = None):
    """
    Decorator to rate limit route handlers.
    
    Args:
        max_requests: Maximum requests allowed per window
        window_seconds: Time window in seconds
        error_message: Custom error message
        
    Usage:
        @app.route('/api/expensive')
        @rate_limit(max_requests=10, window_seconds=60)
        def expensive_operation():
            ...
    """
    default_message = (
        f"Rate limit exceeded. Maximum {max_requests} requests "
        f"per {window_seconds} seconds."
    )
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_id = _limiter.get_client_id()
            allowed, remaining, reset_in = _limiter.is_allowed(
                client_id, max_requests, window_seconds
            )
            
            if not allowed:
                logger.warning(
                    f"Rate limit exceeded for {client_id} on {request.path}"
                )
                response = {
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": error_message or default_message,
                        "details": {
                            "retry_after": reset_in,
                            "limit": max_requests,
                            "window": window_seconds
                        }
                    }
                }
                return jsonify(response), 429
            
            # Add rate limit info to response headers
            from flask import make_response
            
            @wraps(f)
            def add_rate_limit_headers(*a, **kw):
                response = make_response(f(*a, **kw))
                response.headers['X-RateLimit-Limit'] = str(max_requests)
                response.headers['X-RateLimit-Remaining'] = str(remaining)
                response.headers['X-RateLimit-Reset'] = str(int(time.time()) + reset_in)
                return response
            
            return add_rate_limit_headers(*args, **kwargs)
        
        return decorated_function
    return decorator


# Pre-configured rate limit policies
POLICIES = {
    'strict': {'max_requests': 10, 'window_seconds': 60},      # 10/min
    'normal': {'max_requests': 100, 'window_seconds': 60},     # 100/min
    'permissive': {'max_requests': 1000, 'window_seconds': 60}, # 1000/min
    'auth': {'max_requests': 5, 'window_seconds': 60},         # 5/min for auth
    'ml': {'max_requests': 20, 'window_seconds': 300},         # 20 per 5 mins for ML
}


def get_limiter():
    """Get global rate limiter instance."""
    return _limiter
