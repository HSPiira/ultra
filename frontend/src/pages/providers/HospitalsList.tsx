import React, { useState, useEffect } from 'react';
import { providersApi } from '../../services/providers';
import type { Hospital } from '../../types/providers';
import { HospitalTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface HospitalsListProps {
  onHospitalSelect?: (hospital: Hospital) => void;
  onHospitalEdit?: (hospital: Hospital) => void;
  onHospitalDelete?: (hospital: Hospital) => void;
  refreshTrigger?: number;
}

export const HospitalsList: React.FC<HospitalsListProps> = ({
  onHospitalSelect,
  onHospitalEdit,
  onHospitalDelete,
  refreshTrigger
}) => {
  const [, setHospitals] = useState<Hospital[]>([]);
  const [allFilteredHospitals, setAllFilteredHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadHospitals();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadHospitals();
    }
  }, [refreshTrigger]);

  const loadHospitals = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading hospitals...');
      const data = await providersApi.hospitals.getHospitals();
      console.log('Hospitals loaded:', data);
      setHospitals(data.results);
      setAllFilteredHospitals(data.results);
    } catch (err) {
      console.error('Error loading hospitals:', err);
      setError('Failed to load hospitals');
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
  const filteredHospitals = sortData(
    allFilteredHospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredHospitals.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedHospitals = filteredHospitals.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleHospitalView = (hospital: Hospital) => {
    onHospitalSelect?.(hospital);
  };

  const handleHospitalEdit = (hospital: Hospital) => {
    onHospitalEdit?.(hospital);
  };

  const handleHospitalDelete = (hospital: Hospital) => {
    onHospitalDelete?.(hospital);
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
        searchPlaceholder="Search hospitals..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export hospitals')}
      />

      {/* Hospitals Table */}
      <HospitalTable
        hospitals={paginatedHospitals}
        allFilteredHospitals={filteredHospitals}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onHospitalView={handleHospitalView}
        onHospitalEdit={handleHospitalEdit}
        onHospitalDelete={handleHospitalDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadHospitals}
      />
    </div>
  );
};
