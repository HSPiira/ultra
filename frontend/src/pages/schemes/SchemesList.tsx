import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { schemesApi } from '../../services/schemes';
import type { Scheme } from '../../types/schemes';
import { SchemeTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface SchemesListProps {
  onSchemeSelect?: (scheme: Scheme) => void;
  onSchemeEdit?: (scheme: Scheme) => void;
  onSchemeDelete?: (scheme: Scheme) => void;
  onSchemeStatusChange?: (scheme: Scheme) => void;
  onAddScheme?: () => void;
  viewMode?: 'list' | 'grid';
  refreshTrigger?: number;
}

export const SchemesList: React.FC<SchemesListProps> = ({
  onSchemeSelect,
  onSchemeEdit,
  onSchemeDelete,
  onSchemeStatusChange,
  onAddScheme,
  viewMode = 'list',
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [allFilteredSchemes, setAllFilteredSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadSchemes();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadSchemes();
    }
  }, [refreshTrigger]);

  const loadSchemes = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading schemes...');
      const data = await schemesApi.getSchemes();
      console.log('Schemes loaded:', data);
      setSchemes(data);
      setAllFilteredSchemes(data);
    } catch (err) {
      console.error('Error loading schemes:', err);
      setError('Failed to load schemes');
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

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredSchemes = sortData(
    allFilteredSchemes.filter(scheme =>
      scheme.scheme_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.company_detail.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.card_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scheme.description && scheme.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSchemes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedSchemes = filteredSchemes.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleRowDoubleClick = (scheme: Scheme) => {
    onSchemeSelect?.(scheme);
  };

  const handleSchemeView = (scheme: Scheme) => {
    onSchemeSelect?.(scheme);
  };

  const handleSchemeEdit = (scheme: Scheme) => {
    onSchemeEdit?.(scheme);
  };

  const handleSchemeDelete = (scheme: Scheme) => {
    onSchemeDelete?.(scheme);
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
        searchPlaceholder="Search schemes..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export schemes')}
      />

      {/* Schemes Table */}
      <SchemeTable
        schemes={paginatedSchemes}
        allFilteredSchemes={filteredSchemes}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onSchemeView={handleSchemeView}
        onSchemeEdit={handleSchemeEdit}
        onSchemeDelete={handleSchemeDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadSchemes}
      />
    </div>
  );
};
