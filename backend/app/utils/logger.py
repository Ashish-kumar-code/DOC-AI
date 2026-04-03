"""
Structured logging setup for DOC AI.
Configures file and console logging with rotation and filtering.
"""

import logging
import logging.handlers
import os
import sys
from pathlib import Path
from datetime import datetime


def setup_logging(app_name: str = "doc_ai", 
                 log_dir: str = "logs",
                 log_level: str = "INFO",
                 console_output: bool = True) -> logging.Logger:
    """
    Configure structured logging for the application.
    
    Args:
        app_name: Application name for log identification
        log_dir: Directory for log files
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        console_output: Whether to log to console
        
    Returns:
        Configured logger instance
    """
    
    # Create log directory
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    
    # Get logger
    logger = logging.getLogger(app_name)
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Log format
    log_format = (
        '[%(asctime)s] [%(name)s] [%(levelname)s] '
        '[%(filename)s:%(lineno)d in %(funcName)s()] '
        '%(message)s'
    )
    formatter = logging.Formatter(log_format)
    
    # File handler with rotation
    log_file = os.path.join(log_dir, f"{app_name}.log")
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=10,
        encoding='utf-8'
    )
    file_handler.setLevel(getattr(logging, log_level.upper()))
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Error log file (only errors and critical)
    error_log_file = os.path.join(log_dir, f"{app_name}_errors.log")
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    # Console handler
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, log_level.upper()))
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    # Suppress overly verbose libraries
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('flask').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get logger for a specific module.
    
    Args:
        name: Module name (usually __name__)
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class RequestIdFilter(logging.Filter):
    """Add request ID to log records for request tracing."""
    
    def filter(self, record):
        """Add request ID to log record."""
        from flask import request
        try:
            from flask import g
            record.request_id = g.request_id
        except (RuntimeError, AttributeError):
            record.request_id = 'N/A'
        return True


def setup_request_logging(app):
    """
    Configure request-level logging in Flask app.
    
    Args:
        app: Flask application instance
    """
    
    @app.before_request
    def before_request():
        """Log incoming request."""
        from flask import g
        import uuid
        
        # Generate request ID for tracing
        g.request_id = str(uuid.uuid4())[:8]
        
        logger = logging.getLogger('doc_ai')
        logger.info(
            f"Incoming request: {request.method} {request.path}",
            extra={'request_id': g.request_id}
        )
    
    @app.after_request
    def after_request(response):
        """Log outgoing response."""
        from flask import g
        
        logger = logging.getLogger('doc_ai')
        
        # Log status code
        level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(
            level,
            f"Response: {request.method} {request.path} -> {response.status_code}",
            extra={'request_id': g.request_id}
        )
        
        return response


class PerformanceLogger:
    """Log performance metrics."""
    
    @staticmethod
    def log_operation(operation_name: str, duration_ms: float, 
                     status: str = "success", **kwargs):
        """
        Log operation performance.
        
        Args:
            operation_name: Name of operation
            duration_ms: Duration in milliseconds
            status: Operation status (success, error, slow)
            **kwargs: Additional metrics
        """
        logger = logging.getLogger('doc_ai.performance')
        
        message = (
            f"Operation: {operation_name} | "
            f"Duration: {duration_ms:.2f}ms | "
            f"Status: {status}"
        )
        
        if kwargs:
            message += " | " + " | ".join(
                f"{k}={v}" for k, v in kwargs.items()
            )
        
        if duration_ms > 1000:  # Over 1 second
            logger.warning(message)
        else:
            logger.info(message)
    
    @staticmethod
    def log_db_query(query: str, duration_ms: float):
        """Log database query performance."""
        logger = logging.getLogger('doc_ai.database')
        
        if duration_ms > 500:
            logger.warning(
                f"Slow database query ({duration_ms:.2f}ms): {query[:100]}..."
            )
        else:
            logger.debug(f"Database query ({duration_ms:.2f}ms)")


class ErrorLogger:
    """Log errors with context."""
    
    @staticmethod
    def log_error(error: Exception, context: str = None, user_id: int = None):
        """
        Log error with full context.
        
        Args:
            error: Exception object
            context: Additional context
            user_id: User ID if applicable
        """
        logger = logging.getLogger('doc_ai.errors')
        
        extra = {}
        if user_id:
            extra['user_id'] = user_id
        if context:
            extra['context'] = context
        
        logger.exception(f"Error occurred: {str(error)}", extra=extra)
    
    @staticmethod
    def log_auth_failure(reason: str, user_email: str = None):
        """Log authentication failures."""
        logger = logging.getLogger('doc_ai.security')
        
        message = f"Authentication failed: {reason}"
        if user_email:
            message += f" (Email: {user_email})"
        
        logger.warning(message)
    
    @staticmethod
    def log_validation_error(field: str, value: str, reason: str):
        """Log validation errors."""
        logger = logging.getLogger('doc_ai.validation')
        logger.warning(f"Validation error - Field: {field}, Reason: {reason}")


# Convenience function for timing operations
class Timer:
    """Context manager for timing operations."""
    
    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        self.start_time = None
    
    def __enter__(self):
        from time import time
        self.start_time = time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        from time import time
        duration_ms = (time() - self.start_time) * 1000
        status = "error" if exc_type else "success"
        PerformanceLogger.log_operation(self.operation_name, duration_ms, status)
        return False


# Batch logging helper
class BatchLogger:
    """Queue logs and write in batch for better performance."""
    
    def __init__(self, batch_size: int = 100):
        self.batch_size = batch_size
        self.queue = []
    
    def add(self, message: str, level: str = 'INFO'):
        """Add message to batch."""
        self.queue.append((message, level))
        if len(self.queue) >= self.batch_size:
            self.flush()
    
    def flush(self):
        """Write all queued messages."""
        if not self.queue:
            return
        
        logger = logging.getLogger('doc_ai')
        for message, level in self.queue:
            logger.log(getattr(logging, level), message)
        
        self.queue.clear()
