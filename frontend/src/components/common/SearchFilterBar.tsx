import React from 'react';
import { Search, Download } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  rowsPerPage: number;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPageOptions?: number[];
  onExport?: () => void;
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
  showExport = true,
  className = ""
}) => {
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

        {showExport && (
          <Tooltip content="Export data to CSV">
            <button 
              className="p-2 rounded-lg transition-colors" 
              style={{ color: '#9ca3af' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = '#3b3b3b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={onExport}
            >
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
