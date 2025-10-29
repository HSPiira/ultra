import { ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { LabTest } from '../../types/medical-catalog';

interface LabTestTableProps {
  labTests: LabTest[];
  allFilteredLabTests: LabTest[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onLabTestView?: (labTest: LabTest) => void;
  onLabTestEdit?: (labTest: LabTest) => void;
  onLabTestDelete?: (labTest: LabTest) => void;
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

export function LabTestTable({
  labTests,
  allFilteredLabTests,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onLabTestView,
  onLabTestEdit,
  onLabTestDelete,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: LabTestTableProps) {
  const columns: TableColumn<LabTest>[] = [
    {
      key: 'name',
      label: 'Lab Test',
      width: 'w-1/4',
      sortable: true,
      align: 'left',
      render: (value, labTest) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">
            {String(value)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLabTestView?.(labTest);
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
      width: 'w-1/3',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm block truncate">
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
        <span className="text-sm">
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
        <span className="text-sm">
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
      render: (_, labTest) => {
        const statusText = labTest.status.charAt(0).toUpperCase() + labTest.status.slice(1).toLowerCase();
        const statusColor = labTest.status === 'ACTIVE' 
          ? 'text-green-500' 
          : labTest.status === 'INACTIVE'
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

  const actions: ActionButton<LabTest>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onLabTestView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Lab Test',
      onClick: onLabTestEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Lab Test',
      onClick: onLabTestDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (labTest: LabTest, isStatusField: boolean = false) => {
    return getTextColor(labTest.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={labTests}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onLabTestView}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No lab tests found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredLabTests.length}
          filteredCount={allFilteredLabTests.length}
        />
      )}
    </div>
  );
}
