import { useNavigate } from 'react-router-dom';
import { ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn, ActionButton } from './SortableTable';
import type { Scheme } from '../../types/schemes';

interface SchemeTableProps {
  schemes: Scheme[];
  allFilteredSchemes: Scheme[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onSchemeView?: (scheme: Scheme) => void;
  onSchemeEdit?: (scheme: Scheme) => void;
  onSchemeDelete?: (scheme: Scheme) => void;
  onSchemeSelect?: (scheme: Scheme) => void;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getDaysTillExpiry = (endDate: string) => {
  const today = new Date();
  const expiry = new Date(endDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getExpiryStatus = (endDate: string) => {
  const days = getDaysTillExpiry(endDate);
  if (days < 0) return { status: 'expired', color: 'text-red-400', bgColor: 'bg-red-900' };
  if (days <= 30) return { status: 'expiring', color: 'text-amber-400', bgColor: 'bg-amber-900' };
  if (days <= 90) return { status: 'warning', color: 'text-yellow-400', bgColor: 'bg-yellow-900' };
  return { status: 'active', color: 'text-green-400', bgColor: 'bg-green-900' };
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

export function SchemeTable({
  schemes,
  allFilteredSchemes,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onSchemeView,
  onSchemeEdit,
  onSchemeDelete,
  onSchemeSelect,
  onPageChange,
  loading = false,
  error,
  onRetry,
}: SchemeTableProps) {
  const navigate = useNavigate();
  
  const columns: TableColumn<Scheme>[] = [
    {
      key: 'scheme_name',
      label: 'Scheme',
      width: 'w-1/5',
      sortable: true,
      align: 'left',
      render: (value, scheme) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {String(value)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSchemeView?.(scheme);
              }}
              className="p-1 rounded border border-gray-600 transition-colors text-white hover:text-gray-200 hover:bg-gray-700 hover:border-gray-500 flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          {scheme.description && (
            <div className="text-sm text-gray-400 truncate mt-1">
              {scheme.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'company_detail',
      label: 'Company',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, scheme) => {
        const companyName = value?.company_name || '';
        const companyId = value?.id || scheme.company;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm block truncate">
              {companyName || ''}
            </span>
            {companyId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/companies/${companyId}`);
                }}
                className="p-1 rounded border border-gray-600 transition-colors text-white hover:text-gray-200 hover:bg-gray-700 hover:border-gray-500 flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'card_code',
      label: 'Card Code',
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
      key: 'limit_amount',
      label: 'Coverage Amount',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm">
          {formatCurrency(Number(value))}
        </span>
      ),
    },
    {
      key: 'start_date',
      label: 'Start Date',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm">
          {formatDate(String(value))}
        </span>
      ),
    },
    {
      key: 'end_date',
      label: 'End Date',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm">
          {formatDate(String(value))}
        </span>
      ),
    },
    {
      key: 'end_date',
      label: 'Expiry',
      width: 'w-20',
      sortable: true,
      align: 'right',
      render: (value) => {
        const days = getDaysTillExpiry(String(value));
        const expiryStatus = getExpiryStatus(String(value));
        
        // Show "Expired" as text, otherwise show the number of days
        const displayText = days < 0 ? 'Expired' : `${days}`;
        
        return (
          <span className={`text-sm font-medium ${expiryStatus.color}`}>
            {displayText}
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
      render: (_, scheme) => {
        const statusText = scheme.status.charAt(0).toUpperCase() + scheme.status.slice(1).toLowerCase();
        const statusColor = scheme.status === 'ACTIVE' 
          ? 'text-green-500' 
          : scheme.status === 'INACTIVE'
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

  const actions: ActionButton<Scheme>[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onSchemeView || (() => {}),
      hoverColor: 'text-white',
    },
    {
      icon: Edit,
      label: 'Edit Scheme',
      onClick: onSchemeEdit || (() => {}),
      hoverColor: 'text-blue-400',
    },
    {
      icon: Trash2,
      label: 'Delete Scheme',
      onClick: onSchemeDelete || (() => {}),
      hoverColor: 'text-red-400',
    },
  ];

  const getItemTextColor = (scheme: Scheme, isStatusField: boolean = false) => {
    return getTextColor(scheme.status, isStatusField);
  };

  return (
    <div>
      <SortableTable
        data={schemes}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onSchemeSelect}
        getTextColor={getItemTextColor}
        statusField="status"
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No schemes found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredSchemes.length}
          filteredCount={allFilteredSchemes.length}
        />
      )}
    </div>
  );
}
