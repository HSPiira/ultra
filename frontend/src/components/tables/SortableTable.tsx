
import React from 'react';

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  width: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, item: T) => React.ReactNode;
}

export interface ActionButton<T> {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: (item: T) => void;
  className?: string;
  hoverColor?: string;
}

interface SortableTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: ActionButton<T>[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onRowClick?: (item: T) => void;
  getTextColor?: (item: T, isStatusField?: boolean) => string;
  statusField?: keyof T;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyMessage?: string;
}

const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => (
  <svg className={`w-3 h-3 transition-colors ${active ? 'text-gray-300' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d={`M14.707 ${active && direction === 'desc' ? '7.293' : '12.707'}a1 1 0 01-1.414 0L10 ${active && direction === 'desc' ? '10.586' : '9.414'}l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z`} clipRule="evenodd" />
  </svg>
);

export function SortableTable<T>({
  data,
  columns,
  actions = [],
  sortField,
  sortDirection,
  onSort,
  onRowClick,
  getTextColor,
  statusField,
  loading = false,
  error,
  onRetry,
  emptyMessage = 'No records found.',
}: SortableTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-400 font-medium">Error</h3>
            <p className="text-red-300 text-sm mt-1">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="overflow-x-auto max-h-[60vh]">
        <table className="table-fixed w-full text-left">
          <thead className="bg-[#1a1a1a] rounded-t-lg">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-2 py-2 text-xs font-semibold text-gray-400 tracking-wider ${column.width} ${
                    column.sortable ? 'cursor-pointer hover:text-gray-300 transition-colors' : ''
                  } ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}`}
                  onClick={() => column.sortable && onSort?.(String(column.key))}
                >
                  <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                    {column.label}
                    {column.sortable && (
                      <SortIcon active={sortField === String(column.key)} direction={sortDirection || 'asc'} />
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-400 tracking-wider w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
        </table>

        {/* Table rows with gaps */}
        <div className="space-y-1 p-1">
          {data.map((item, index) => (
            <div
              key={index}
              className="bg-[#1f1f1f] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              onDoubleClick={() => onRowClick?.(item)}
            >
              <table className="table-fixed w-full text-left">
                <tbody>
                  <tr>
                    {columns.map((column) => {
                      const value = item[column.key];
                      const textColor = getTextColor ? getTextColor(item, column.key === statusField) : 'text-white';
                      
                      return (
                        <td
                          key={String(column.key)}
                          className={`px-2 py-2 align-middle truncate ${column.width} ${textColor} ${
                            column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {column.render ? column.render(value, item) : String(value)}
                        </td>
                      );
                    })}
                    
                    {actions.length > 0 && (
                      <td className="px-2 py-2 w-20 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actions.map((action, actionIndex) => {
                            const IconComponent = action.icon;
                            return (
                              <button
                                key={actionIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(item);
                                }}
                                className={`p-1 text-gray-400 hover:${action.hoverColor || 'text-white'} hover:bg-gray-700 rounded transition-colors relative group/btn ${action.className || ''}`}
                              >
                                <IconComponent className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
