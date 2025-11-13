"""PDF export strategy implementation."""

from io import BytesIO
from typing import Any, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch

from .base import ExportStrategy


class PDFExporter(ExportStrategy):
    """
    Concrete strategy for PDF export.

    Follows Single Responsibility: Only handles PDF format generation.
    Includes professional styling with headers, grid, and alternating row colors.
    """

    def __init__(
        self,
        title: str = "Export Report",
        orientation: str = "landscape"
    ):
        """
        Initialize PDF exporter.

        Args:
            title: Document title to display at top (default: "Export Report")
            orientation: Page orientation - "landscape" or "portrait" (default: "landscape")
        """
        self.title = title
        self.orientation = orientation

    def export(self, headers: List[str], rows: List[List[Any]]) -> bytes:
        """
        Export data to PDF format with professional styling.

        Args:
            headers: Column headers
            rows: Data rows

        Returns:
            PDF content as bytes
        """
        buffer = BytesIO()

        # Set page size based on orientation
        if self.orientation == "landscape":
            page_size = landscape(letter)
        else:
            page_size = letter

        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=page_size,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )

        # Container for document elements
        elements = []

        # Add title
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_para = Paragraph(self.title, title_style)
        elements.append(title_para)
        elements.append(Spacer(1, 0.2 * inch))

        # Prepare table data with Paragraphs for text wrapping
        from copy import deepcopy
        table_data = []

        # Create styles for headers and cells
        header_style = deepcopy(styles['Normal'])
        header_style.fontSize = 9
        header_style.leading = 10
        header_style.fontName = 'Helvetica-Bold'
        header_style.textColor = colors.whitesmoke
        header_style.wordWrap = 'LTR'

        cell_style = deepcopy(styles['Normal'])
        cell_style.fontSize = 8
        cell_style.leading = 9
        cell_style.wordWrap = 'LTR'
        cell_style.allowWidows = 1
        cell_style.allowOrphans = 1

        # Wrap headers in Paragraphs for consistent formatting
        header_row = []
        for header in headers:
            header_row.append(Paragraph(header, header_style))
        table_data.append(header_row)

        # Add data rows with Paragraph objects for automatic text wrapping
        for row in rows:
            wrapped_row = []
            for value in row:
                # Convert to string and handle None
                cell_value = str(value) if value is not None else ""
                # Wrap ALL text in Paragraph for consistent wrapping behavior
                # This ensures text respects column boundaries
                if cell_value:  # Only wrap non-empty values
                    wrapped_row.append(Paragraph(cell_value, cell_style))
                else:
                    wrapped_row.append("")
            table_data.append(wrapped_row)

        # Calculate intelligent column widths based on content
        width, height = page_size
        available_width = width - 60  # Account for margins

        # Calculate relative widths based on header length and content
        col_widths = self._calculate_column_widths(headers, rows, available_width)

        # Create table with intelligent column widths
        table = Table(table_data, colWidths=col_widths, repeatRows=1)

        # Apply table styling with word wrap support
        table.setStyle(
            TableStyle([
                # Header styling
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),  # Center headers vertically

                # Data rows styling
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),  # Top-align data cells for wrapped text

                # Grid and borders
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),  # Slightly thicker grid for clarity
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#1f2937')),  # Thicker line below header

                # Alternating row colors
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [
                    colors.whitesmoke,
                    colors.HexColor('#f3f4f6')
                ]),

                # Padding - balanced for readability and space efficiency
                ('TOPPADDING', (0, 0), (-1, 0), 6),     # Header top padding
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),  # Header bottom padding
                ('LEFTPADDING', (0, 0), (-1, -1), 5),   # All cells left padding
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),  # All cells right padding
                ('TOPPADDING', (0, 1), (-1, -1), 4),    # Data cells top padding
                ('BOTTOMPADDING', (0, 1), (-1, -1), 4), # Data cells bottom padding
            ])
        )

        elements.append(table)

        # Build PDF
        doc.build(elements)

        return buffer.getvalue()

    def get_content_type(self) -> str:
        """Get MIME type for PDF."""
        return 'application/pdf'

    def get_file_extension(self) -> str:
        """Get file extension for PDF."""
        return 'pdf'

    def _calculate_column_widths(
        self,
        headers: List[str],
        rows: List[List[Any]],
        available_width: float
    ) -> List[float]:
        """
        Calculate intelligent column widths based on content.

        Uses approximate character width (not pixel-perfect) to estimate
        column widths based on content, with sensible min/max constraints.

        Args:
            headers: Column headers
            rows: Data rows
            available_width: Available width for the table

        Returns:
            List of column widths in points
        """
        num_cols = len(headers)
        if num_cols == 0:
            return []

        # Font metrics: approximate character width at 8pt font
        # Average character width is roughly 0.55 * font_size for Helvetica
        char_width = 0.55 * 8  # ~4.4 points per character

        # Calculate estimated width for each column
        # Sample first 20 rows to avoid performance issues with large datasets
        sample_rows = rows[:20] if len(rows) > 20 else rows

        estimated_widths = []
        for col_idx in range(num_cols):
            # Start with header length (headers are in 9pt bold, slightly wider)
            max_chars = len(headers[col_idx]) * 1.1  # Bold is ~10% wider

            # Check sample data
            for row in sample_rows:
                if col_idx < len(row):
                    cell_value = str(row[col_idx]) if row[col_idx] is not None else ""
                    # For wrapping text, we use a heuristic:
                    # assume text wraps at reasonable width, so take sqrt of length
                    if len(cell_value) > 50:
                        # Long text: estimate wrapped width (will span multiple lines)
                        effective_chars = min(40, len(cell_value) ** 0.5 * 5)
                    else:
                        effective_chars = len(cell_value)
                    max_chars = max(max_chars, effective_chars)

            # Convert to points (add padding for cell margins)
            width = max_chars * char_width + 12  # 12pt for left+right padding
            estimated_widths.append(width)

        # Calculate total estimated width
        total_estimated = sum(estimated_widths)

        if total_estimated == 0:
            # Fallback to equal widths if all columns are empty
            return [available_width / num_cols] * num_cols

        # Apply min/max constraints before proportional distribution
        min_width = 35   # Minimum 35 points per column (tight but readable)
        max_width = available_width * 0.35  # Maximum 35% of page width per column

        # Apply constraints
        constrained_widths = []
        for width in estimated_widths:
            constrained = max(min_width, min(width, max_width))
            constrained_widths.append(constrained)

        # Calculate total after constraints
        total_constrained = sum(constrained_widths)

        # Scale to fit available width if needed
        if total_constrained > available_width:
            # Need to scale down
            scale_factor = available_width / total_constrained
            col_widths = [w * scale_factor for w in constrained_widths]
        elif total_constrained < available_width * 0.85:
            # We have extra space, distribute it proportionally
            scale_factor = available_width / total_constrained
            col_widths = [w * scale_factor for w in constrained_widths]
        else:
            # Good fit, use as-is
            col_widths = constrained_widths

        return col_widths
