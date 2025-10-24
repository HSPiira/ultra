import { Eye, Edit, Trash2 } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { Medicine } from '../../types/medical-catalog';

interface MedicineTableProps {
  medicines: Medicine[];
  allFilteredMedicines: Medicine[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onMedicineView?: (medicine: Medicine) => void;
  onMedicineEdit?: (medicine: Medicine) => void;
  onMedicineDelete?: (medicine: Medicine) => void;
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

export function MedicineTable({
  medicines,
  allFilteredMedicines,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onMedicineView,
  onMedicineEdit,
  onMedicineDelete,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: MedicineTableProps) {
  const columns: TableColumn<Medicine>[] = [
    {
      key: 'name',
      label: 'Medicine',
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
      key: 'route',
      label: 'Route',
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
      key: 'dosage_form',
      label: 'Dosage Form',
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
      key: 'duration',
      label: 'Duration',
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
      key: 'unit_price',
      label: 'Unit Price',
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
      render: (_, medicine) => {
        const statusText = medicine.status.charAt(0).toUpperCase() + medicine.status.slice(1).toLowerCase();
        const statusColor = medicine.status === 'ACTIVE' 
          ? 'text-green-500' 
          : medicine.status === 'INACTIVE'
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

  const actions: ActionButton<Medicine>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onMedicineView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Medicine',
      onClick: onMedicineEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Medicine',
      onClick: onMedicineDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (medicine: Medicine, isStatusField: boolean = false) => {
    return getTextColor(medicine.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={medicines}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onMedicineView}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No medicines found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredMedicines.length}
          filteredCount={allFilteredMedicines.length}
        />
      )}
    </div>
  );
}
