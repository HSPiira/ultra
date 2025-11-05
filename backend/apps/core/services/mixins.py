"""
Service mixins for reusable functionality.

Provides mixin classes that can be inherited by service classes
to add common functionality like CSV export.
"""
import csv
from io import StringIO
from typing import List, Callable, Optional


class CSVExportMixin:
    """
    Mixin for CSV export functionality.
    
    Provides a standardized way to export querysets to CSV format.
    Subclasses should implement get_csv_headers() and get_csv_row() methods.
    """
    
    @staticmethod
    def export_to_csv(
        queryset,
        headers: List[str],
        row_extractor: Callable,
        filename: Optional[str] = None
    ) -> str:
        """
        Export queryset to CSV format.
        
        Args:
            queryset: Django QuerySet to export
            headers: List of column headers
            row_extractor: Function that takes an instance and returns a list of values
            filename: Optional filename for the CSV (not used in return value, for reference)
            
        Returns:
            str: CSV content as string
        """
        output = StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(headers)
        
        # Write data rows
        for instance in queryset:
            row = row_extractor(instance)
            writer.writerow(row)
        
        return output.getvalue()
