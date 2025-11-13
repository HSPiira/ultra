"""CSV export strategy implementation."""

import csv
from io import StringIO
from typing import Any, List

from .base import ExportStrategy


class CSVExporter(ExportStrategy):
    """
    Concrete strategy for CSV export.

    Follows Single Responsibility: Only handles CSV format generation.
    """

    def export(self, headers: List[str], rows: List[List[Any]]) -> bytes:
        """
        Export data to CSV format.

        Args:
            headers: Column headers
            rows: Data rows

        Returns:
            CSV content as UTF-8 encoded bytes
        """
        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(headers)

        # Write data rows
        for row in rows:
            # Convert all values to strings, handle None
            cleaned_row = [
                str(value) if value is not None else ""
                for value in row
            ]
            writer.writerow(cleaned_row)

        return output.getvalue().encode('utf-8')

    def get_content_type(self) -> str:
        """Get MIME type for CSV."""
        return 'text/csv'

    def get_file_extension(self) -> str:
        """Get file extension for CSV."""
        return 'csv'
