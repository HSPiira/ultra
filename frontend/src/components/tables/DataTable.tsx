import { useState, useMemo } from 'react';
import { TableHeader } from './TableHeader';
import type { TableColumn } from './TableHeader';
import { TablePagination } from './TablePagination';
import { getStatusTextColor } from './StatusColor';

export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
  sortField?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  pagination?: boolean;
  itemsPerPage?: number;
  showItemsPerPage?: boolean;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  statusField?: keyof T; // Field that contains status for coloring
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  sortField,
  sortDirection,
  onSort,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  pagination = true,
  itemsPerPage = 10,
  showItemsPerPage = false,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
  statusField
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;
    
    return data.filter((item) => {
      return columns.some((column) => {
        const value = item[column.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, searchable, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    onSearch?.(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Bar */}
      {searchable && (
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="rounded-t-lg" style={{ backgroundColor: '#1a1a1a' }}>
        <table className="w-full">
          <TableHeader
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
          />
        </table>
      </div>

      {/* Table Rows - Individual Cards */}
      <div className="space-y-0.5">
        {paginatedData.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          paginatedData.map((item, index) => {
            const status = statusField ? item[statusField] as string : '';
            
            return (
              <div 
                key={index} 
                className="rounded-lg p-2 transition-colors cursor-pointer group"
                style={{ 
                  backgroundColor: '#1f1f1f'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f1f1f';
                }}
                onDoubleClick={() => onRowClick?.(item)}
              >
                <table className="w-full">
                  <tbody>
                    <tr>
                      {columns.map((column) => {
                        const value = item[column.key];
                        const isStatusField = column.key === statusField;
                        const textColor = statusField ? getStatusTextColor(status, isStatusField) : 'text-white';
                        
                        return (
                          <td 
                            key={String(column.key)}
                            className={`px-0 py-0 ${column.width || ''} ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                          >
                            {column.render ? (
                              column.render(value, item)
                            ) : (
                              <span className={`text-sm truncate block ${textColor}`} title={String(value)}>
                                {String(value)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
      
      {/* Pagination */}
      {pagination && filteredData.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={pageSize}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPage={showItemsPerPage}
        />
      )}
    </div>
  );
}