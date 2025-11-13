import React, { useEffect, useRef, useState } from 'react';
import { Search, Download, Loader2 } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface ExportOption {
  label: string;
  format: string;
}

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  rowsPerPage: number;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPageOptions?: number[];
  onExport?: (format?: string) => void;
  exportOptions?: ExportOption[];
  exportLoading?: boolean;
  showExport?: boolean;
  className?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  rowsPerPage,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
  onExport,
  exportOptions,
  exportLoading = false,
  showExport = true,
  className = ""
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement | null>(null);

  const availableExportOptions = exportOptions && exportOptions.length > 0
    ? exportOptions
    : [{ label: 'Export CSV', format: 'csv' }];

  useEffect(() => {
    if (!exportMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportButtonRef.current &&
        !exportButtonRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const handleExportClick = () => {
    if (!onExport || exportLoading) {
      return;
    }

    if (availableExportOptions.length <= 1) {
      onExport(availableExportOptions[0].format);
    } else {
      setExportMenuOpen((prev) => !prev);
    }
  };

  const handleExportOptionSelect = (format: string) => {
    setExportMenuOpen(false);
    onExport?.(format);
  };

  return (
    <div className={`mb-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 pl-10 pr-4 py-2 border rounded-lg transition-colors"
            style={{ 
              backgroundColor: '#1a1a1a', 
              borderColor: '#4a4a4a', 
              color: '#ffffff' 
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6b7280';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#4a4a4a';
            }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#9ca3af' }}>Rows</span>
          <div className="flex items-center gap-1">
            {rowsPerPageOptions.map((rows) => (
              <Tooltip key={rows} content={`Show ${rows} rows per page`}>
                <button
                  onClick={() => onRowsPerPageChange(rows)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    rowsPerPage === rows
                      ? 'text-white border-2'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  style={{
                    backgroundColor: rowsPerPage === rows ? '#2E3333' : 'transparent',
                    borderColor: rowsPerPage === rows ? '#66D9EF' : 'transparent',
                  }}
                >
                  {rows}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        {showExport && onExport && (
          <div className="relative" ref={exportButtonRef}>
            <Tooltip content="Export data">
              <button
                type="button"
                className="p-2 rounded-lg transition-colors flex items-center justify-center"
                style={{ color: '#9ca3af' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = exportLoading ? '#9ca3af' : '#ffffff';
                  e.currentTarget.style.backgroundColor = exportLoading ? 'transparent' : '#3b3b3b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={handleExportClick}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </Tooltip>

            {exportMenuOpen && !exportLoading && availableExportOptions.length > 1 && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg border shadow-lg z-10"
                style={{ backgroundColor: '#1f1f1f', borderColor: '#4a4a4a' }}
              >
                {availableExportOptions.map((option) => (
                  <button
                    key={option.format}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{ color: '#d1d5db' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => handleExportOptionSelect(option.format)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
