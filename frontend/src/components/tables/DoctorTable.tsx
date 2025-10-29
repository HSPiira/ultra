import { ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { Doctor } from '../../types/providers';

interface DoctorTableProps {
  doctors: Doctor[];
  allFilteredDoctors: Doctor[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onDoctorView?: (doctor: Doctor) => void;
  onDoctorEdit?: (doctor: Doctor) => void;
  onDoctorDelete?: (doctor: Doctor) => void;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const getTextColor = (status: string, isStatusField: boolean = false): string => {
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus === 'active') {
    return isStatusField ? 'text-green-500' : 'text-white';
  }
  
  if (normalizedStatus === 'red') {
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

export function DoctorTable({
  doctors,
  allFilteredDoctors,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onDoctorView,
  onDoctorEdit,
  onDoctorDelete,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: DoctorTableProps) {
  const columns: TableColumn<Doctor>[] = [
    {
      key: 'name',
      label: 'Doctor',
      width: 'w-1/5',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">
            {String(value)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDoctorView?.(doctor);
            }}
            className="p-1 rounded border border-gray-600 transition-colors text-white hover:text-gray-200 hover:bg-gray-700 hover:border-gray-500 flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialization',
      width: 'w-32',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span className="text-sm">
          {String(value)}
        </span>
      ),
    },
    {
      key: 'license_number',
      label: 'License',
      width: 'w-28',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span className="text-sm font-mono">
          {String(value)}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      width: 'flex-1 min-w-0',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span className="text-sm block truncate">
          {String(value)}
        </span>
      ),
    },
    {
      key: 'phone_number',
      label: 'Phone',
      width: 'w-32',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span className="text-sm">
          {formatPhoneNumber(String(value))}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-20',
      sortable: true,
      align: 'left',
      render: (_, doctor) => {
        const statusText = doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1).toLowerCase();
        const statusColor = doctor.status === 'ACTIVE' 
          ? 'text-green-500' 
          : doctor.status === 'INACTIVE'
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

  const actions: ActionButton<Doctor>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onDoctorView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Doctor',
      onClick: onDoctorEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Doctor',
      onClick: onDoctorDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (doctor: Doctor, isStatusField: boolean = false) => {
    return getTextColor(doctor.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={doctors}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onDoctorView}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No doctors found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredDoctors.length}
          filteredCount={allFilteredDoctors.length}
        />
      )}
    </div>
  );
}
