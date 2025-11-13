"""
Export mixin for easy service integration.

Provides a simple interface for services to add export functionality
following SOLID principles.
"""

from typing import List, Any, Optional
from django.db.models import QuerySet

from .base import ExportContext, ModelExporter
from .csv_exporter import CSVExporter
from .xlsx_exporter import XLSXExporter
from .pdf_exporter import PDFExporter


class ExportableMixin:
    """
    Mixin that provides export functionality to service classes.

    Follows:
    - Single Responsibility: Only adds export orchestration
    - Open/Closed: New formats can be added without modifying this class
    - Dependency Inversion: Depends on abstractions (ExportStrategy)

    Usage:
        class MyService(ExportableMixin):
            # Define these methods to enable export
            @staticmethod
            def _get_export_headers() -> List[str]:
                return ["ID", "Name", "Email"]

            @staticmethod
            def _get_export_row(obj) -> List[Any]:
                return [obj.id, obj.name, obj.email]

            @staticmethod
            def _get_export_queryset(filters: dict = None) -> QuerySet:
                return MyModel.objects.filter(...)

            # Export methods are automatically available
            # my_service_export_csv()
            # my_service_export_xlsx()
            # my_service_export_pdf()
    """

    @classmethod
    def _create_model_exporter(cls, filters: dict = None) -> ModelExporter:
        """
        Create a ModelExporter implementation from class methods.

        Args:
            filters: Optional filters to pass to queryset

        Returns:
            ModelExporter implementation
        """
        class ServiceModelExporter:
            """Adapter that wraps service methods as ModelExporter."""

            def get_headers(self) -> List[str]:
                return cls._get_export_headers()

            def get_row_data(self, obj: Any) -> List[Any]:
                return cls._get_export_row(obj)

            def get_queryset(self, filters: dict = None) -> QuerySet:
                return cls._get_export_queryset(filters)

        return ServiceModelExporter()

    @classmethod
    def export_to_format(
        cls,
        format_type: str,
        filters: Optional[dict] = None,
        **kwargs
    ) -> tuple[bytes, str, str]:
        """
        Export data in specified format.

        Args:
            format_type: Export format ('csv', 'xlsx', or 'pdf')
            filters: Optional filters for queryset
            **kwargs: Additional arguments passed to exporter (e.g., sheet_name, title)

        Returns:
            Tuple of (content_bytes, content_type, file_extension)

        Raises:
            ValueError: If format_type is not supported
        """
        # Select appropriate strategy based on format
        if format_type == 'csv':
            strategy = CSVExporter()
        elif format_type == 'xlsx':
            sheet_name = kwargs.get('sheet_name', 'Export')
            strategy = XLSXExporter(sheet_name=sheet_name)
        elif format_type == 'pdf':
            title = kwargs.get('title', 'Export Report')
            orientation = kwargs.get('orientation', 'landscape')
            strategy = PDFExporter(title=title, orientation=orientation)
        else:
            raise ValueError(
                f"Unsupported format: {format_type}. "
                f"Supported formats: csv, xlsx, pdf"
            )

        # Create export context and execute export
        context = ExportContext(strategy)
        exporter = cls._create_model_exporter(filters)

        return context.export_data(exporter, filters)

    # Abstract methods that subclasses must implement
    @staticmethod
    def _get_export_headers() -> List[str]:
        """
        Return list of column headers for export.

        Must be implemented by subclass.

        Returns:
            List of header strings
        """
        raise NotImplementedError(
            "Subclass must implement _get_export_headers()"
        )

    @staticmethod
    def _get_export_row(obj: Any) -> List[Any]:
        """
        Extract data from model instance for a single row.

        Must be implemented by subclass.

        Args:
            obj: Model instance

        Returns:
            List of values corresponding to headers
        """
        raise NotImplementedError(
            "Subclass must implement _get_export_row()"
        )

    @staticmethod
    def _get_export_queryset(filters: dict = None) -> QuerySet:
        """
        Get queryset for export with optional filters.

        Must be implemented by subclass.

        Args:
            filters: Optional dictionary of filter criteria

        Returns:
            QuerySet to export
        """
        raise NotImplementedError(
            "Subclass must implement _get_export_queryset()"
        )
