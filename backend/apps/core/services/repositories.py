"""
Repository implementations for data access abstraction.

Provides repository pattern implementation to reduce direct model dependencies,
addressing Dependency Inversion Principle (DIP) violations.
"""
from typing import Type, TypeVar, Dict, Any
from django.db.models import Model, QuerySet
from django.core.exceptions import ObjectDoesNotExist

from apps.core.exceptions.service_errors import NotFoundError
from apps.core.services.interfaces import IRepository

T = TypeVar('T', bound=Model)


class DjangoRepository(IRepository):
    """
    Django ORM-based repository implementation.
    
    Provides a thin abstraction over Django models to enable
    dependency inversion and easier testing.
    """
    
    def __init__(self, model_class: Type[T], entity_name: str = "Entity"):
        """
        Initialize repository.
        
        Args:
            model_class: Django model class
            entity_name: Human-readable name for error messages
        """
        self.model_class = model_class
        self.entity_name = entity_name
    
    def get(self, entity_id: str, raise_if_deleted: bool = True) -> T:
        """
        Get entity by ID.
        
        Args:
            entity_id: ID of entity
            raise_if_deleted: Whether to raise error if entity is deleted
            
        Returns:
            Entity instance
            
        Raises:
            NotFoundError: If entity doesn't exist
        """
        queryset = self.model_class.objects if raise_if_deleted else self.model_class.all_objects
        
        try:
            if raise_if_deleted:
                return queryset.get(id=entity_id, is_deleted=False)
            return queryset.get(id=entity_id)
        except ObjectDoesNotExist:
            raise NotFoundError(self.entity_name, entity_id)
    
    def get_all(self, filters: Dict[str, Any] = None, raise_if_deleted: bool = True) -> QuerySet[T]:
        """
        Get all entities matching filters.
        
        Args:
            filters: Optional filter dictionary
            raise_if_deleted: Whether to filter out deleted entities
            
        Returns:
            QuerySet of entities
        """
        queryset = self.model_class.objects if raise_if_deleted else self.model_class.all_objects
        
        if filters:
            queryset = queryset.filter(**filters)
        
        return queryset
    
    def create(self, data: Dict[str, Any]) -> T:
        """
        Create new entity.
        
        Args:
            data: Dictionary containing entity data
            
        Returns:
            Created entity instance
        """
        return self.model_class.objects.create(**data)
    
    def update(self, entity: T, data: Dict[str, Any], update_fields: list = None) -> T:
        """
        Update existing entity.
        
        Args:
            entity: Entity instance to update
            data: Dictionary containing fields to update
            update_fields: Optional list of fields to update
            
        Returns:
            Updated entity instance
        """
        for field, value in data.items():
            setattr(entity, field, value)
        
        entity.save(update_fields=update_fields)
        return entity
    
    def delete(self, entity: T) -> None:
        """
        Delete entity (hard delete).
        
        Args:
            entity: Entity instance to delete
        """
        entity.delete()
    
    def soft_delete(self, entity: T, user=None) -> None:
        """
        Soft delete entity.
        
        Args:
            entity: Entity instance to soft delete
            user: Optional user performing the deletion
        """
        if hasattr(entity, 'soft_delete'):
            entity.soft_delete(user=user)
            entity.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        else:
            entity.is_deleted = True
            entity.save(update_fields=["is_deleted"])

