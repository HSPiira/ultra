import { Eye, Edit, Trash2 } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { Company } from '../../types/companies';

interface CompanyTableProps {
  companies: Company[];
  allFilteredCompanies: Company[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onCompanyView?: (company: Company) => void;
  onCompanyEdit?: (company: Company) => void;
  onCompanyDelete?: (company: Company) => void;
  onCompanyStatusChange?: (company: Company) => void;
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

export function CompanyTable({
  companies,
  allFilteredCompanies,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onCompanyView,
  onCompanyEdit,
  onCompanyDelete,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: CompanyTableProps) {
  const columns: TableColumn<Company>[] = [
    {
      key: 'company_name',
      label: 'Company',
      width: 'w-1/5',
      sortable: true,
      align: 'left',
      render: (value) => (
        <div className="font-bold text-sm" title={String(value)}>
          {String(value)}
        </div>
      ),
    },
    {
      key: 'industry_detail',
      label: 'Industry',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm" title={value?.industry_name || ''}>
          {value?.industry_name || ''}
        </span>
      ),
    },
    {
      key: 'contact_person',
      label: 'Contact',
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
      render: (_, company) => {
        const statusText = company.status.charAt(0).toUpperCase() + company.status.slice(1).toLowerCase();
        const statusColor = company.status === 'ACTIVE' 
          ? 'text-green-500' 
          : company.status === 'INACTIVE'
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

  const actions: ActionButton<Company>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onCompanyView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Company',
      onClick: onCompanyEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Company',
      onClick: onCompanyDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (company: Company, isStatusField: boolean = false) => {
    return getTextColor(company.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={companies}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onCompanyView}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No companies found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredCompanies.length}
          filteredCount={allFilteredCompanies.length}
        />
      )}
    </div>
  );
}
