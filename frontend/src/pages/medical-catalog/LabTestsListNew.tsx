import React, { useState, useEffect } from 'react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { LabTest } from '../../types/medical-catalog';
import { LabTestTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface LabTestsListNewProps {
  onLabTestSelect?: (labTest: LabTest) => void;
  onLabTestEdit?: (labTest: LabTest) => void;
  onLabTestDelete?: (labTest: LabTest) => void;
  onLabTestStatusChange?: (labTest: LabTest) => void;
  onAddLabTest?: () => void;
  refreshTrigger?: number;
}

export const LabTestsListNew: React.FC<LabTestsListNewProps> = ({
  onLabTestSelect,
  onLabTestEdit,
  onLabTestDelete,
  onLabTestStatusChange,
  onAddLabTest,
  refreshTrigger
}) => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [allFilteredLabTests, setAllFilteredLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadLabTests();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadLabTests();
    }
  }, [refreshTrigger]);

  const loadLabTests = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading lab tests...');
      const data = await medicalCatalogApi.getLabTests({
        page: currentPage,
        page_size: rowsPerPage
      });
      console.log('Lab tests loaded:', data);
      setLabTests(data.results);
      setAllFilteredLabTests(data.results);
    } catch (err) {
      console.error('Error loading lab tests:', err);
      setError('Failed to load lab tests');
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
  const filteredLabTests = sortData(
    allFilteredLabTests.filter(labTest =>
      labTest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labTest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labTest.category.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredLabTests.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedLabTests = filteredLabTests.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleLabTestView = (labTest: LabTest) => {
    onLabTestSelect?.(labTest);
  };

  const handleLabTestEdit = (labTest: LabTest) => {
    onLabTestEdit?.(labTest);
  };

  const handleLabTestDelete = (labTest: LabTest) => {
    onLabTestDelete?.(labTest);
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
        searchPlaceholder="Search lab tests..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export lab tests')}
      />

      {/* Lab Tests Table */}
      <LabTestTable
        labTests={paginatedLabTests}
        allFilteredLabTests={filteredLabTests}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onLabTestView={handleLabTestView}
        onLabTestEdit={handleLabTestEdit}
        onLabTestDelete={handleLabTestDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadLabTests}
      />
    </div>
  );
};
