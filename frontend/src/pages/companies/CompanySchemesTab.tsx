import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Company } from '../../types/companies';
import type { Scheme } from '../../types/schemes';
import { SchemeTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';
import { schemesApi } from '../../services/schemes';

interface CompanySchemesTabProps {
  company: Company;
}

export const CompanySchemesTab: React.FC<CompanySchemesTabProps> = ({ company }) => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter] = useState('');
  const [sortField, setSortField] = useState<string>('scheme_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadSchemes();
  }, [company.id]);

  useEffect(() => {
    filterSchemes();
  }, [schemes, searchTerm, statusFilter]);

  const loadSchemes = async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      // Fetch schemes for this specific company
      const schemesData = await schemesApi.getSchemes({ 
        company: company.id,
        ordering: 'scheme_name'
      });
      
      setSchemes(schemesData);
    } catch (err) {
      console.error('Error loading schemes:', err);
      setError('Failed to load schemes');
    } finally {
      setLoading(false);
    }
  };

  const filterSchemes = () => {
    let filtered = [...schemes];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(scheme =>
        scheme.scheme_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (scheme.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.card_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(scheme => scheme.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Scheme];
      const bValue = b[sortField as keyof Scheme];
      
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSchemes(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSchemeView = (scheme: Scheme) => {
    navigate(`/schemes/${scheme.id}`);
  };

  const handleSchemeEdit = (scheme: Scheme) => {
    console.log('Edit scheme:', scheme);
    // Open edit modal or navigate to edit page
  };

  const handleSchemeDelete = (scheme: Scheme) => {
    console.log('Delete scheme:', scheme);
    // Show confirmation dialog and delete
  };

  const handleAddScheme = () => {
    console.log('Add new scheme');
    // Open add scheme modal or navigate to add page
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredSchemes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredSchemes.length);
  const paginatedSchemes = filteredSchemes.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Insurance Schemes</h2>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
            Manage insurance schemes for {company.company_name}
          </p>
        </div>
        <button
          onClick={handleAddScheme}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          <Plus className="w-4 h-4" />
          Add Scheme
        </button>
      </div>

      {/* Search and Filter Bar */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search schemes..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export schemes')}
        showExport={false}
      />

      {/* Schemes Table */}
      <div className="rounded-lg overflow-hidden">
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
          onSchemeSelect={handleSchemeView}
          onPageChange={handlePageChange}
          loading={loading}
          error={error}
          onRetry={loadSchemes}
        />
        </div>
    </div>
  );
};
