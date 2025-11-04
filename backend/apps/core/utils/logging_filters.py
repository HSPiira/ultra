"""
Logging filters for core app.
"""
import logging


class RequestIDFilter(logging.Filter):
    """
    Logging filter to add request_id to log records.
    
    Extracts request_id from the request object if available
    and adds it to the log record's extra context.
    """

    def filter(self, record):
        """
        Add request_id to log record if available.
        
        Args:
            record: LogRecord instance
            
        Returns:
            bool: Always True (don't filter out records)
        """
        # Try to get request_id from various sources
        request_id = getattr(record, 'request_id', None)
        
        # If not in record, try to get from context (thread-local storage)
        if not request_id:
            try:
                from apps.core.middleware.request_id import _thread_local
                request_id = getattr(_thread_local, 'request_id', None)
            except (AttributeError, ImportError):
                request_id = None
        
        # Set request_id in record for formatter
        record.request_id = request_id or 'N/A'
        
        return True
