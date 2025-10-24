export interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableHeaderProps<T> {
  columns: TableColumn<T>[];
  sortField?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  className?: string;
}

export function TableHeader<T>({ 
  columns, 
  sortField, 
  sortDirection, 
  onSort,
  className = "px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
}: TableHeaderProps<T>) {
  const getSortIcon = (columnKey: keyof T) => {
    const isActive = sortField === columnKey;
    const isDesc = sortDirection === 'desc';
    
    return (
      <svg className={`w-3 h-3 transition-colors ${isActive ? 'text-gray-300' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d={`M14.707 ${isActive && isDesc ? '7.293' : '12.707'}a1 1 0 01-1.414 0L10 ${isActive && isDesc ? '10.586' : '9.414'}l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z`} clipRule="evenodd" />
      </svg>
    );
  };

  const getAlignmentClass = (align?: 'left' | 'right' | 'center') => {
    switch (align) {
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-left';
    }
  };

  const getFlexAlignment = (align?: 'left' | 'right' | 'center') => {
    switch (align) {
      case 'right':
        return 'justify-end';
      case 'center':
        return 'justify-center';
      default:
        return '';
    }
  };

  return (
    <thead>
      <tr>
        {columns.map((column) => (
          <th
            key={String(column.key)}
            className={`
              ${className}
              ${getAlignmentClass(column.align)}
              ${column.sortable ? 'cursor-pointer hover:text-gray-300 transition-colors' : ''}
              ${column.width || ''}
              ${column.className || ''}
            `}
            onClick={() => column.sortable && onSort?.(column.key)}
          >
            <div className={`flex items-center gap-1 ${getFlexAlignment(column.align)}`}>
              {column.label}
              {column.sortable && getSortIcon(column.key)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}