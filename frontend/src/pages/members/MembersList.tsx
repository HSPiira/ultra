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

  // Helper function to get nested value using dot notation with safe handling
  const getNestedValue = (obj: any, path: string): any => {
    if (!path) return obj;
    
    // For non-dot notation paths, access directly
    if (!path.includes('.')) {
      return obj && typeof obj === 'object' && path in obj ? obj[path] : null;
    }
    
    // For dot notation paths, safely traverse
    return path.split('.').reduce((current: any, key: string) => {
      if (current === null || current === undefined) return null;
      if (typeof current !== 'object') return null;
      return key in current ? current[key] : null;
    }, obj);
  };

  // Helper function to normalize values for comparison with type safety
  const normalizeValue = (value: any): string | number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value.toLowerCase();
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    // Convert any other type to lowercase string for comparison
    return String(value).toLowerCase();
  };

  // Sort function with proper nested accessor handling
  const sortData = <T,>(data: T[], field: string, direction: 'asc' | 'desc'): T[] => {
    if (!field) return data;
    
    return [...data].sort((a, b) => {
      // Use dot notation parsing to extract nested values
      const aValue = getNestedValue(a, field);
      const bValue = getNestedValue(b, field);
      
      // Normalize values for stable comparison
      const normalizedA = normalizeValue(aValue);
      const normalizedB = normalizeValue(bValue);
      
      // Handle null/undefined values - place them at the end
      if (normalizedA === null && normalizedB === null) return 0;
      if (normalizedA === null) return direction === 'asc' ? 1 : -1;
      if (normalizedB === null) return direction === 'asc' ? -1 : 1;
      
      // Compare normalized primitive values
      if (normalizedA < normalizedB) return direction === 'asc' ? -1 : 1;
      if (normalizedA > normalizedB) return direction === 'asc' ? 1 : -1;
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
    allFilteredMembers.filter((member) => {
      const q = searchTerm.toLowerCase();
      const includes = (v: unknown) => String(v ?? '').toLowerCase().includes(q);
      return (
        includes(member.name) ||
        includes(member.card_number) ||
        includes(member.email) ||
        includes(member.phone_number) ||
        includes(member.company_detail?.company_name) ||
        includes(member.scheme_detail?.scheme_name)
      );
    }),
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
