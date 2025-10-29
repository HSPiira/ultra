import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { SortableTable, TablePagination } from './index';
import type { TableColumn } from './SortableTable';
import type { Member } from '../../types/members';

interface MemberTableProps {
  members: Member[];
  allFilteredMembers: Member[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onMemberView?: (member: Member) => void;
  onMemberEdit?: (member: Member) => void;
  onMemberDelete?: (member: Member) => void;
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

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  allFilteredMembers,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortField,
  sortDirection,
  onSort,
  onMemberView,
  onMemberEdit: _onMemberEdit,
  onMemberDelete: _onMemberDelete,
  onPageChange,
  loading = false,
  error,
  onRetry
}) => {
  const navigate = useNavigate();
  
  const columns: TableColumn<Member>[] = [
    {
      key: 'name',
      label: 'Name',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, member) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">
            {String(value)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMemberView?.(member);
            }}
            className="p-1 rounded border border-gray-600 transition-colors text-white hover:text-gray-200 hover:bg-gray-700 hover:border-gray-500"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'card_number',
      label: 'Card#',
      width: 'w-28',
      sortable: true,
      align: 'left',
      render: (value) => {
        const cardNum = String(value || '');
        return (
          <span className="text-xs block truncate font-mono">
            {cardNum || 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'company_detail',
      label: 'Company',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, member) => {
        const companyName = value?.company_name || member.company || '';
        const companyId = value?.id || member.company;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm block truncate">
              {companyName || 'N/A'}
            </span>
            {companyId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/companies/${companyId}`);
                }}
                className="p-1 rounded border border-gray-600 transition-colors text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-500 flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'scheme_detail',
      label: 'Scheme',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, member) => {
        const schemeName = value?.scheme_name || member.scheme || '';
        const schemeId = value?.id || member.scheme;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm block truncate">
              {schemeName || 'N/A'}
            </span>
            {schemeId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/schemes/${schemeId}`);
                }}
                className="p-1 rounded border border-gray-600 transition-colors text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-500 flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'relationship',
      label: 'Type',
      width: 'w-20',
      sortable: true,
      align: 'left',
      render: (value) => {
        const relationshipText = String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
        const relationshipColor = value === 'SELF' 
          ? 'text-blue-400' 
          : value === 'SPOUSE'
          ? 'text-pink-400'
          : 'text-green-400';
        
        return (
          <span className={`text-sm font-medium ${relationshipColor}`}>
            {relationshipText}
          </span>
        );
      },
    },
    {
      key: 'gender',
      label: 'Gender',
      width: 'w-20',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm">
          {String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase()}
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
        <span className="text-sm">
          {formatPhoneNumber(String(value || '')) || 'N/A'}
        </span>
      ),
    },
    {
      key: 'email',
      label: '凹Email',
      width: 'w-1/5',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="text-sm block truncate">
          {String(value || 'N/A')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-20',
      sortable: true,
      align: 'left',
      render: (_, member) => {
        const statusText = member.status.charAt(0).toUpperCase() + member.status.slice(1).toLowerCase();
        const statusColor = member.status === 'ACTIVE' 
          ? 'text-green-500' 
          : member.status === 'INACTIVE'
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

  return (
    <div>
      <SortableTable
        data={members}
        columns={columns}
        actions={[]}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="No members found."
      />
      
      {onPageChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={allFilteredMembers.length}
          filteredCount={allFilteredMembers.length}
        />
      )}
    </div>
  );
};
