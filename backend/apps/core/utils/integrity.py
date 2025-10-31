from django.db import IntegrityError


def is_unique_constraint_violation(error: IntegrityError) -> bool:
    """
    Determine if an IntegrityError is a unique constraint violation.
    
    Checks database-specific error codes and constraint names to positively
    identify unique constraint violations, avoiding false positives from
    NOT NULL, foreign key, or other constraint violations.
    
    Args:
        error: The IntegrityError to check
        
    Returns:
        True if the error is a unique constraint violation, False otherwise
    """
    # Check for PostgreSQL unique violation (pgcode 23505)
    if hasattr(error, 'orig') and hasattr(error.orig, 'pgcode'):
        if error.orig.pgcode == '23505':  # unique_violation
            return True
    
    # Check constraint name for uniqueness indicators
    if hasattr(error, 'orig'):
        error_str = str(error).lower()
        constraint_name = None
        
        # Try to extract constraint name from PostgreSQL diagnostic info
        if hasattr(error.orig, 'diag') and hasattr(error.orig.diag, 'constraint_name'):
            constraint_name = error.orig.diag.constraint_name.lower()
        
        # Check extracted constraint name for uniqueness indicators
        if constraint_name:
            if any(indicator in constraint_name for indicator in ['unique', '_pk', 'primary']):
                return True
        
        # Fallback: check error string for constraint-related uniqueness patterns
        if 'constraint' in error_str:
            if any(indicator in error_str for indicator in ['unique', '_pk', 'primary key']):
                return True
    
    # Last resort: check error message for unique violation patterns
    # Only trust this if we see specific unique violation language
    error_msg = str(error).lower()
    unique_patterns = [
        'duplicate key value violates unique constraint',
        'unique constraint',
        'duplicate entry',
        'already exists',
    ]
    if any(pattern in error_msg for pattern in unique_patterns):
        # Double-check it's not another constraint type
        if 'not null' not in error_msg and 'foreign key' not in error_msg:
            return True
    
    return False

