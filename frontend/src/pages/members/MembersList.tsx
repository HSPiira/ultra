import React, { useState, useEffect } from 'react';
import { membersApi } from '../../services/members';
import type { Member } from '../../types/members';
import { MemberTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface MembersListProps {
  onMemberSelect?: (member: Member) => void;
  onMemberEdit?: (member: Member) => void;
  onMemberDelete?: (member: Member) => void;
  refreshTrigger?: number;
}

export const MembersList: React.FC<MembersListProps> = ({
  onMemberSelect,
  onMemberEdit,
  onMemberDelete,
  refreshTrigger
}) => {
  const [, setMembers] = useState<Member[]>([]);
  const [allFilteredMembers, setAllFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadMembers();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadMembers();
    }
  }, [refreshTrigger]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading members...');
      const data = await membersApi.getMembers();
      console.log('Members loaded:', data);
      setMembers(data.results);
      setAllFilteredMembers(data.results);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  // Sort function
  const sortData = <T,>(data: T[], field: string, direction: 'asc' | 'desc'): T[] => {
    if (!field) return data;
    
    return [...data].sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredMembers = sortData(
    allFilteredMembers.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.company_detail?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.scheme_detail?.scheme_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleMemberView = (member: Member) => {
    onMemberSelect?.(member);
  };

  const handleMemberEdit = (member: Member) => {
    onMemberEdit?.(member);
  };

  const handleMemberDelete = (member: Member) => {
    onMemberDelete?.(member);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Search and Filter Bar */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search members..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export members')}
      />

      {/* Members Table */}
      <MemberTable
        members={paginatedMembers}
        allFilteredMembers={filteredMembers}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onMemberView={handleMemberView}
        onMemberEdit={handleMemberEdit}
        onMemberDelete={handleMemberDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadMembers}
      />
    </div>
  );
};
