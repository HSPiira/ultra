import { Eye, Edit, Trash2, ExternalLink } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { Industry } from '../../types/companies';

interface IndustryTableProps {
  industries: Industry[];
  allFilteredIndustries: Industry[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onIndustryView?: (industry: Industry) => void;
  onIndustryEdit?: (industry: Industry) => void;
  onIndustryDelete?: (industry: Industry) => void;
  onIndustrySelect?: (industry: Industry) => void;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getTextColor = (status: string, isStatusField: boolean = false): string => {
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus === 'active') {
    return isStatusField ? 'text-green-500' : 'text-white';
  }
  
  if (normalizedStatus === 'inactive') {
    return 'text-red-500';
  }
  
  if (normalizedStatus === 'suspended') {
    return 'text-amber-500';
  }
  
  return 'text-white';
};

export function IndustryTable({
  industries,
  allFilteredIndustries,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onIndustryView,
  onIndustryEdit,
  onIndustryDelete,
  onIndustrySelect,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: IndustryTableProps) {
  const columns: TableColumn<Industry>[] = [
    {
      key: 'industry_name',
      label: 'Industry Name',
      width: 'w-1/4',
      sortable: true,
      align: 'left',
      render: (value, industry) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm block truncate">
            {String(value)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndustryView?.(industry);
            }}
            className="p-1 rounded border border-gray-600 transition-colors text-white hover:text-gray-200 hover:bg-gray-700 hover:border-gray-500 flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      width: 'w-2/5',
      sortable: false,
      align: 'left',
      render: (value) => (
        <span className="text-sm text-gray-400 block truncate">
          {value || 'No description'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-20',
      sortable: true,
      align: 'left',
      render: (_, industry) => {
        const statusText = industry.status.charAt(0).toUpperCase() + industry.status.slice(1).toLowerCase();
        const statusColor = industry.status === 'ACTIVE' 
          ? 'text-green-500' 
          : industry.status === 'INACTIVE'
          ? 'text-red-500'
          : 'text-amber-500';
        
        return (
          <span className={`text-sm font-medium ${statusColor}`}>
            {statusText}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm text-gray-400">
          {formatDate(String(value))}
        </span>
      ),
    },
  ];

  const actions: ActionButton<Industry>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onIndustryView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Industry',
      onClick: onIndustryEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Industry',
      onClick: onIndustryDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (industry: Industry, isStatusField: boolean = false) => {
    return getTextColor(industry.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={industries}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onIndustrySelect}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No industries found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredIndustries.length}
          filteredCount={allFilteredIndustries.length}
        />
      )}
    </div>
  );
}

