import { Eye, Edit, Trash2 } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { HospitalItemPrice } from '../../types/medical-catalog';

interface HospitalPriceTableProps {
  hospitalPrices: HospitalItemPrice[];
  allFilteredHospitalPrices: HospitalItemPrice[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onHospitalPriceView?: (hospitalPrice: HospitalItemPrice) => void;
  onHospitalPriceEdit?: (hospitalPrice: HospitalItemPrice) => void;
  onHospitalPriceDelete?: (hospitalPrice: HospitalItemPrice) => void;
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

export function HospitalPriceTable({
  hospitalPrices,
  allFilteredHospitalPrices,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onHospitalPriceView,
  onHospitalPriceEdit,
  onHospitalPriceDelete,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: HospitalPriceTableProps) {
  const columns: TableColumn<HospitalItemPrice>[] = [
    {
      key: 'hospital',
      label: 'Hospital',
      width: 'w-1/4',
      sortable: true,
      align: 'left',
      render: (value) => (
        <div className="font-bold text-sm" title={value?.name || ''}>
          {value?.name || ''}
        </div>
      ),
    },
    {
      key: 'content_type',
      label: 'Content Type',
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
      key: 'content_object',
      label: 'Item Name',
      width: 'w-1/4',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm" title={String(value)}>
          {String(value)}
        </span>
      ),
    },
    {
      key: 'amount',
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
      render: (_, hospitalPrice) => {
        const statusText = hospitalPrice.status.charAt(0).toUpperCase() + hospitalPrice.status.slice(1).toLowerCase();
        const statusColor = hospitalPrice.status === 'ACTIVE' 
          ? 'text-green-500' 
          : hospitalPrice.status === 'INACTIVE'
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

  const actions: ActionButton<HospitalItemPrice>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onHospitalPriceView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Hospital Price',
      onClick: onHospitalPriceEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Hospital Price',
      onClick: onHospitalPriceDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (hospitalPrice: HospitalItemPrice, isStatusField: boolean = false) => {
    return getTextColor(hospitalPrice.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={hospitalPrices}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onHospitalPriceView}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No hospital prices found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredHospitalPrices.length}
          filteredCount={allFilteredHospitalPrices.length}
        />
      )}
    </div>
  );
}
