import { ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';
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
  onCompanySelect?: (company: Company) => void;
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

const formatEmail = (email: string, maxLength: number = 20): string => {
  if (!email) return '';
  
  // If email is short enough, return as is
  if (email.length <= maxLength) {
    return email;
  }
  
  // Extract parts: local@domain
  const [local, domain] = email.split('@');
  
  if (!domain) {
    // Not a valid email format, just truncate
    return email.length > maxLength ? email.slice(0, maxLength - 3) + '...' : email;
  }
  
  // If domain is short, show: local...domain
  if (domain.length <= 8) {
    const localPart = local.slice(0, Math.max(1, maxLength - domain.length - 3));
    return `${localPart}...${domain}`;
  }
  
  // If domain is long, show: local...com (or last part of domain)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1] || 'com';
  const localPart = local.slice(0, Math.max(1, maxLength - tld.length - 3));
  return `${localPart}...${tld}`;
};

const truncateText = (text: string, maxLength: number = 25): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
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
  onCompanySelect,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: CompanyTableProps) {
  const columns: TableColumn<Company>[] = [
    {
      key: 'company_name',
      label: 'Company',
      width: 'w-1/3', // Fixed width but still larger than other columns
      sortable: true,
      align: 'left',
      render: (value, company) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-sm block truncate" title={String(value)}>
            {truncateText(String(value), 40)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompanyView?.(company);
            }}
            className="p-1 rounded border border-gray-600 transition-colors text-white hover:text-gray-200 hover:bg-gray-700 hover:border-gray-500 flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'industry_detail',
      label: 'Industry',
      width: 'w-32',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm block truncate" title={value?.industry_name || ''}>
          {truncateText(value?.industry_name || '', 15)}
        </span>
      ),
    },
    {
      key: 'contact_person',
      label: 'Contact',
      width: 'w-32',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm block truncate" title={String(value)}>
          {truncateText(String(value), 15)}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      width: 'w-40',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm block truncate" title={String(value)}>
          {formatEmail(String(value), 20)}
        </span>
      ),
    },
    {
      key: 'phone_number',
      label: 'Phone',
      width: 'w-28',
      sortable: true,
      align: 'left',
      render: (value) => {
        const formatted = formatPhoneNumber(String(value));
        return (
          <span className="text-sm block truncate" title={String(value)}>
            {truncateText(formatted, 15)}
          </span>
        );
      },
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
        onRowClick={onCompanySelect}
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
