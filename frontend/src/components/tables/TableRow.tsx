import React from 'react';

export interface TableRowProps<T> {
  item: T;
  columns: {
    key: keyof T;
    label: string;
    width?: string;
    align?: 'left' | 'right' | 'center';
    className?: string;
    render?: (value: any, item: T) => React.ReactNode;
  }[];
  onRowClick?: (item: T) => void;
  className?: string;
  cellClassName?: string;
}

export function TableRow<T>({ 
  item, 
  columns, 
  onRowClick,
  className = "px-0 py-0",
  cellClassName = "px-0 py-0"
}: TableRowProps<T>) {
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

  const getValue = (column: any) => {
    const value = item[column.key as keyof T];
    if (column.render) {
      return column.render(value, item);
    }
    return value;
  };

  return (
    <tr 
      className={`${className} ${onRowClick ? 'cursor-pointer' : ''}`}
      onClick={() => onRowClick?.(item)}
    >
      {columns.map((column) => (
        <td
          key={String(column.key)}
          className={`
            ${cellClassName}
            ${getAlignmentClass(column.align)}
            ${column.width || ''}
            ${column.className || ''}
          `}
        >
          {getValue(column)}
        </td>
      ))}
    </tr>
  );
}
