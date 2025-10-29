import React from 'react';
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
  const columns: TableColumn<Member>[] = [
    {
      key: 'name',
      label: 'Name',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, member) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" title={String(value)}>
            {String(value)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMemberView?.(member);
            }}
            className="p-1 rounded transition-colors text-gray-400 hover:text-white hover:bg-gray-700"
            title="View member details"
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
          <span className="text-xs block truncate font-mono" title={cardNum || 'N/A'}>
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
        return (
          <span className="text-sm block truncate" title={companyName || 'N/A'}>
            {companyName || 'N/A'}
          </span>
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
        return (
          <span className="text-sm block truncate" title={schemeName || 'N/A'}>
            {schemeName || 'N/A'}
          </span>
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
          <span className={`text-sm font-medium ${relationshipColor}`} title={relationshipText}>
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
        <span className="text-sm" title={String(value)}>
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
        <span className="text-sm" title={String(value || 'N/A')}>
          {formatPhoneNumber(String(value || '')) || 'N/A'}
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
        <span className="text-sm block truncate" title={String(value || 'N/A')}>
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
