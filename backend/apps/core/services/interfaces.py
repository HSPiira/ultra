"""
Service layer interfaces and protocols.

Defines formal contracts for service methods to ensure consistency
and enable dependency inversion.
"""
from abc import ABC, abstractmethod
from typing import Protocol, TypeVar, Optional, Dict, Any
from django.db.models import Model

# Type variable for entity models
T = TypeVar('T', bound=Model)


class IServiceProtocol(Protocol[T]):
    """
    Protocol defining the standard interface for service classes.
    
    This protocol ensures all services implement consistent method signatures,
    addressing Interface Segregation Principle (ISP) violations.
    """
    
    def create(self, *, data: Dict[str, Any], user=None) -> T:
        """
        Create a new entity.
        
        Args:
            data: Dictionary containing entity data
            user: Optional user performing the operation
            
        Returns:
            Created entity instance
        """
        ...
    
    def update(self, *, entity_id: str, data: Dict[str, Any], user=None) -> T:
        """
        Update an existing entity.
        
        Args:
            entity_id: ID of entity to update
            data: Dictionary containing fields to update
            user: Optional user performing the operation
            
        Returns:
            Updated entity instance
        """
        ...
    
    def deactivate(self, *, entity_id: str, user=None) -> None:
        """
        Deactivate an entity (soft delete).
        
        Args:
            entity_id: ID of entity to deactivate
            user: Optional user performing the operation
        """
        ...
    
    def activate(self, *, entity_id: str, user=None) -> T:
        """
        Activate a deactivated entity.
        
        Args:
            entity_id: ID of entity to activate
            user: Optional user performing the operation
            
        Returns:
            Activated entity instance
        """
        ...


class IValidationRule(ABC):
    """
    Interface for validation rules.
    
    Allows validation rules to be pluggable and extensible,
    addressing Open/Closed Principle (OCP) violations.
    """
    
    @abstractmethod
    def validate(self, data: Dict[str, Any], entity=None) -> None:
        """
        Validate data.
        
        Args:
            data: Dictionary containing data to validate
            entity: Optional existing entity (for update operations)
            
        Raises:
            ValidationError: If validation fails
        """
        pass


class IRepository(ABC):
    """
    Repository interface for data access.
    
    Provides abstraction over direct model access,
    addressing Dependency Inversion Principle (DIP) violations.
    """
    
    @abstractmethod
    def get(self, entity_id: str) -> Model:
        """Get entity by ID."""
        pass
    
    @abstractmethod
    def create(self, data: Dict[str, Any]) -> Model:
        """Create new entity."""
        pass
    
    @abstractmethod
    def update(self, entity: Model, data: Dict[str, Any]) -> Model:
        """Update existing entity."""
        pass
    
    @abstractmethod
    def delete(self, entity: Model) -> None:
        """Delete entity."""
        pass

