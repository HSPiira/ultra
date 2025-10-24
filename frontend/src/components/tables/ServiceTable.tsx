import { Eye, Edit, Trash2 } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { Service } from '../../types/medical-catalog';

interface ServiceTableProps {
  services: Service[];
  allFilteredServices: Service[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onServiceView?: (service: Service) => void;
  onServiceEdit?: (service: Service) => void;
  onServiceDelete?: (service: Service) => void;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
  
  // For other statuses, try to use the status name as a CSS color
  const validColors = [
    'blue', 'purple', 'pink', 'indigo', 'cyan', 'teal', 'lime', 'yellow', 'orange', 'gray'
  ];
  
  if (validColors.includes(normalizedStatus)) {
    return `text-${normalizedStatus}-500`;
  }
  
  return 'text-white';
};

export function ServiceTable({
  services,
  allFilteredServices,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onServiceView,
  onServiceEdit,
  onServiceDelete,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: ServiceTableProps) {
  const columns: TableColumn<Service>[] = [
    {
      key: 'name',
      label: 'Service',
      width: 'w-1/4',
      sortable: true,
      align: 'left',
      render: (value) => (
        <div className="font-bold text-sm" title={String(value)}>
          {String(value)}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      width: 'w-1/3',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm block truncate" title={String(value)}>
          {String(value)}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm" title={String(value)}>
          {String(value)}
        </span>
      ),
    },
    {
      key: 'base_amount',
      label: 'Price',
      width: 'w-24',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm" title={formatCurrency(Number(value))}>
          {formatCurrency(Number(value))}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-20',
      sortable: true,
      align: 'left',
      render: (_, service) => {
        const statusText = service.status.charAt(0).toUpperCase() + service.status.slice(1).toLowerCase();
        const statusColor = service.status === 'ACTIVE' 
          ? 'text-green-500' 
          : service.status === 'INACTIVE'
          ? 'text-red-500'
          : 'text-amber-500';
        
        return (
          <span className={`text-sm font-medium ${statusColor}`}>
            {statusText}
          </span>
        );
      },
    },
  ];

  const actions: ActionButton<Service>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onServiceView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Service',
      onClick: onServiceEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Service',
      onClick: onServiceDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (service: Service, isStatusField: boolean = false) => {
    return getTextColor(service.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={services}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onServiceView}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No services found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredServices.length}
          filteredCount={allFilteredServices.length}
        />
      )}
    </div>
  );
}
