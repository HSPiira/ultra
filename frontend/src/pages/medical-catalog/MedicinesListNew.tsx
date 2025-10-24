import React, { useState, useEffect } from 'react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { Medicine } from '../../types/medical-catalog';
import { MedicineTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface MedicinesListNewProps {
  onMedicineSelect?: (medicine: Medicine) => void;
  onMedicineEdit?: (medicine: Medicine) => void;
  onMedicineDelete?: (medicine: Medicine) => void;
  onMedicineStatusChange?: (medicine: Medicine) => void;
  onAddMedicine?: () => void;
  refreshTrigger?: number;
}

export const MedicinesListNew: React.FC<MedicinesListNewProps> = ({
  onMedicineSelect,
  onMedicineEdit,
  onMedicineDelete,
  onMedicineStatusChange,
  onAddMedicine,
  refreshTrigger
}) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [allFilteredMedicines, setAllFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadMedicines();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadMedicines();
    }
  }, [refreshTrigger]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading medicines...');
      const data = await medicalCatalogApi.getMedicines({
        page: currentPage,
        page_size: rowsPerPage
      });
      console.log('Medicines loaded:', data);
      setMedicines(data.results);
      setAllFilteredMedicines(data.results);
    } catch (err) {
      console.error('Error loading medicines:', err);
      setError('Failed to load medicines');
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
  const filteredMedicines = sortData(
    allFilteredMedicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.dosage_form.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.duration.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredMedicines.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedMedicines = filteredMedicines.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleMedicineView = (medicine: Medicine) => {
    onMedicineSelect?.(medicine);
  };

  const handleMedicineEdit = (medicine: Medicine) => {
    onMedicineEdit?.(medicine);
  };

  const handleMedicineDelete = (medicine: Medicine) => {
    onMedicineDelete?.(medicine);
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
        searchPlaceholder="Search medicines..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export medicines')}
      />

      {/* Medicines Table */}
      <MedicineTable
        medicines={paginatedMedicines}
        allFilteredMedicines={filteredMedicines}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onMedicineView={handleMedicineView}
        onMedicineEdit={handleMedicineEdit}
        onMedicineDelete={handleMedicineDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadMedicines}
      />
    </div>
  );
};
