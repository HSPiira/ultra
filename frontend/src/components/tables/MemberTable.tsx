import { SortableTable } from './SortableTable';
import type { Member } from '../../types/members';
import { Eye, Edit, Trash2 } from 'lucide-react';

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
  onMemberEdit,
  onMemberDelete,
  onPageChange,
  loading = false,
  error,
  onRetry
}) => {
  const columns = [
    {
      key: 'name' as keyof Member,
      label: 'Name',
      width: 'w-1/4',
      sortable: true,
      align: 'left' as const,
      render: (value: string, member: Member) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">{value}</span>
          <span className="text-sm text-gray-400">{member.card_number}</span>
        </div>
      ),
    },
    {
      key: 'company_detail.company_name' as any,
      label: 'Company',
      width: 'w-1/6',
      sortable: true,
      align: 'left' as const,
      render: (value: any, member: Member) => (
        <span className="text-sm" title={member.company_detail?.company_name || 'N/A'}>
          {member.company_detail?.company_name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'scheme_detail.scheme_name' as any,
      label: 'Scheme',
      width: 'w-1/6',
      sortable: true,
      align: 'left' as const,
      render: (value: any, member: Member) => (
        <span className="text-sm" title={member.scheme_detail?.scheme_name || 'N/A'}>
          {member.scheme_detail?.scheme_name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'relationship' as keyof Member,
      label: 'Relationship',
      width: 'w-20',
      sortable: true,
      align: 'left' as const,
      render: (value: string) => {
        const relationshipText = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
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
      key: 'gender' as keyof Member,
      label: 'Gender',
      width: 'w-20',
      sortable: true,
      align: 'left' as const,
      render: (value: string) => (
        <span className="text-sm text-gray-300">
          {value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key: 'phone_number' as keyof Member,
      label: 'Phone',
      width: 'w-32',
      sortable: true,
      align: 'left' as const,
      render: (value: string) => (
        <span className="text-sm text-gray-300" title={value || 'N/A'}>
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'email' as keyof Member,
      label: 'Email',
      width: 'w-1/4',
      sortable: true,
      align: 'left' as const,
      render: (value: string) => (
        <span className="text-sm text-gray-300 truncate" title={value || 'N/A'}>
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'status' as keyof Member,
      label: 'Status',
      width: 'w-20',
      sortable: true,
      align: 'left' as const,
      render: (value: string) => {
        const statusText = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        const statusColor = value === 'ACTIVE' 
          ? 'text-green-500' 
          : value === 'INACTIVE'
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

  const actions = [
    {
      icon: Eye,
      label: 'View',
      onClick: onMemberView || (() => {}),
      className: 'text-blue-400 hover:text-blue-300',
    },
    {
      icon: Edit,
      label: 'Edit',
      onClick: onMemberEdit || (() => {}),
      className: 'text-yellow-400 hover:text-yellow-300',
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: onMemberDelete || (() => {}),
      className: 'text-red-400 hover:text-red-300',
    },
  ];

  return (
    <div>
      <SortableTable
        data={members}
        columns={columns}
        actions={actions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      {onPageChange && (
        <div className="mt-4">
          {/* Pagination will be handled by the parent component */}
        </div>
      )}
    </div>
  );
};
