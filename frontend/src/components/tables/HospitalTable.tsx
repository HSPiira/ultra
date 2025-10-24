import { Eye, Edit, Trash2 } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { Hospital } from '../../types/providers';

interface HospitalTableProps {
  hospitals: Hospital[];
  allFilteredHospitals: Hospital[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onHospitalView?: (hospital: Hospital) => void;
  onHospitalEdit?: (hospital: Hospital) => void;
  onHospitalDelete?: (hospital: Hospital) => void;
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

export function HospitalTable({
  hospitals,
  allFilteredHospitals,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onHospitalView,
  onHospitalEdit,
  onHospitalDelete,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: HospitalTableProps) {
  const columns: TableColumn<Hospital>[] = [
    {
      key: 'name',
      label: 'Hospital',
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
      key: 'address',
      label: 'Address',
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
      key: 'contact_person',
      label: 'Contact Person',
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
      key: 'email',
      label: 'Email',
      width: 'w-1/5',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm block truncate" title={String(value)}>
          {String(value)}
        </span>
      ),
    },
    {
      key: 'phone_number',
      label: 'Phone',
      width: 'w-24',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm" title={String(value)}>
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
      render: (_, hospital) => {
        const statusText = hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1).toLowerCase();
        const statusColor = hospital.status === 'ACTIVE' 
          ? 'text-green-500' 
          : hospital.status === 'INACTIVE'
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

  const actions: ActionButton<Hospital>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onHospitalView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Hospital',
      onClick: onHospitalEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Hospital',
      onClick: onHospitalDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (hospital: Hospital, isStatusField: boolean = false) => {
    return getTextColor(hospital.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={hospitals}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onHospitalView}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No hospitals found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredHospitals.length}
          filteredCount={allFilteredHospitals.length}
        />
      )}
    </div>
  );
}
