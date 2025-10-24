import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesApi } from '../../services/companies';
import type { Company } from '../../types/companies';
import { CompanyTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface CompaniesListProps {
  onCompanySelect?: (company: Company) => void;
  onCompanyEdit?: (company: Company) => void;
  onCompanyDelete?: (company: Company) => void;
  onCompanyStatusChange?: (company: Company) => void;
  onAddCompany?: () => void;
  viewMode?: 'list' | 'grid';
  refreshTrigger?: number;
}

export const CompaniesList: React.FC<CompaniesListProps> = ({
  onCompanySelect,
  onCompanyEdit,
  onCompanyDelete,
  onCompanyStatusChange,
  onAddCompany,
  viewMode = 'list',
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allFilteredCompanies, setAllFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadCompanies();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadCompanies();
    }
  }, [refreshTrigger]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading companies...');
      const data = await companiesApi.getCompanies();
      console.log('Companies loaded:', data);
      setCompanies(data);
      setAllFilteredCompanies(data);
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Failed to load companies');
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
  const filteredCompanies = sortData(
    allFilteredCompanies.filter(company =>
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry_detail.industry_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleRowDoubleClick = (company: Company) => {
    onCompanySelect?.(company);
  };

  const handleCompanyView = (company: Company) => {
    onCompanySelect?.(company);
  };

  const handleCompanyEdit = (company: Company) => {
    onCompanyEdit?.(company);
  };

  const handleCompanyDelete = (company: Company) => {
    onCompanyDelete?.(company);
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
        searchPlaceholder="Search companies..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export companies')}
      />

      {/* Companies Table */}
      <CompanyTable
        companies={paginatedCompanies}
        allFilteredCompanies={filteredCompanies}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onCompanyView={handleCompanyView}
        onCompanyEdit={handleCompanyEdit}
        onCompanyDelete={handleCompanyDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadCompanies}
      />
    </div>
  );
};
