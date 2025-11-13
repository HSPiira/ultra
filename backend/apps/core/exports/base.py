"""
Base classes for export functionality following SOLID principles.

Uses Strategy pattern to enable different export formats while maintaining
clean separation of concerns.
"""

from abc import ABC, abstractmethod
from typing import Any, List, Protocol
from django.db.models import QuerySet


class ExportStrategy(ABC):
    """
    Abstract base class for export strategies (Strategy Pattern).

    Follows:
    - Single Responsibility: Each concrete strategy handles one format
    - Open/Closed: New formats added by creating new strategies, not modifying existing
    - Interface Segregation: Minimal interface with only required methods
    """

    @abstractmethod
    def export(self, headers: List[str], rows: List[List[Any]]) -> bytes:
        """
        Export data to specific format.

        Args:
            headers: List of column headers
            rows: List of data rows (each row is a list of values)

        Returns:
            bytes: Exported content as bytes
        """
        pass

    @abstractmethod
    def get_content_type(self) -> str:
        """Get MIME content type for this format."""
        pass

    @abstractmethod
    def get_file_extension(self) -> str:
        """Get file extension for this format."""
        pass


class ModelExporter(Protocol):
    """
    Protocol defining interface for model exporters (Liskov Substitution).

    Any class implementing these methods can be used as an exporter,
    enabling polymorphic behavior without inheritance requirements.
    """

    def get_headers(self) -> List[str]:
        """Return list of column headers for export."""
        ...

    def get_row_data(self, obj: Any) -> List[Any]:
        """
        Extract data from model instance for a single row.

        Args:
            obj: Model instance

        Returns:
            List of values corresponding to headers
        """
        ...

    def get_queryset(self, filters: dict = None) -> QuerySet:
        """
        Get queryset for export with optional filters.

        Args:
            filters: Optional dictionary of filter criteria

        Returns:
            QuerySet to export
        """
        ...


class ExportContext:
    """
    Context class that uses composition to delegate to export strategies.

    Follows Dependency Inversion: Depends on ExportStrategy abstraction,
    not concrete implementations.
    """

    def __init__(self, strategy: ExportStrategy):
        """
        Initialize context with an export strategy.

        Args:
            strategy: ExportStrategy instance to use for exporting
        """
        self._strategy = strategy

    def set_strategy(self, strategy: ExportStrategy) -> None:
        """
        Change export strategy at runtime.

        Args:
            strategy: New ExportStrategy to use
        """
        self._strategy = strategy

    def export_data(
        self,
        exporter: ModelExporter,
        filters: dict = None
    ) -> tuple[bytes, str, str]:
        """
        Export data using the current strategy.

        Args:
            exporter: ModelExporter instance providing data
            filters: Optional filters for queryset

        Returns:
            Tuple of (content_bytes, content_type, file_extension)
        """
        # Get data from exporter
        headers = exporter.get_headers()
        queryset = exporter.get_queryset(filters)

        # Convert queryset to rows
        rows = [exporter.get_row_data(obj) for obj in queryset]

        # Use strategy to export
        content = self._strategy.export(headers, rows)
        content_type = self._strategy.get_content_type()
        extension = self._strategy.get_file_extension()

        return content, content_type, extension
