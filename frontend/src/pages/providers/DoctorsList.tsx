import React, { useState, useEffect } from 'react';
import { providersApi } from '../../services/providers';
import type { Doctor } from '../../types/providers';
import { DoctorTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface DoctorsListProps {
  onDoctorSelect?: (doctor: Doctor) => void;
  onDoctorEdit?: (doctor: Doctor) => void;
  onDoctorDelete?: (doctor: Doctor) => void;
  refreshTrigger?: number;
}

export const DoctorsList: React.FC<DoctorsListProps> = ({
  onDoctorSelect,
  onDoctorEdit,
  onDoctorDelete,
  refreshTrigger
}) => {
  const [, setDoctors] = useState<Doctor[]>([]);
  const [allFilteredDoctors, setAllFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadDoctors();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadDoctors();
    }
  }, [refreshTrigger]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading doctors...');
      const data = await providersApi.doctors.getDoctors();
      console.log('Doctors loaded:', data);
      setDoctors(data.results);
      setAllFilteredDoctors(data.results);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError('Failed to load doctors');
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
  const filteredDoctors = sortData(
    allFilteredDoctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredDoctors.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedDoctors = filteredDoctors.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDoctorView = (doctor: Doctor) => {
    onDoctorSelect?.(doctor);
  };

  const handleDoctorEdit = (doctor: Doctor) => {
    onDoctorEdit?.(doctor);
  };

  const handleDoctorDelete = (doctor: Doctor) => {
    onDoctorDelete?.(doctor);
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
        searchPlaceholder="Search doctors..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export doctors')}
      />

      {/* Doctors Table */}
      <DoctorTable
        doctors={paginatedDoctors}
        allFilteredDoctors={filteredDoctors}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onDoctorView={handleDoctorView}
        onDoctorEdit={handleDoctorEdit}
        onDoctorDelete={handleDoctorDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadDoctors}
      />
    </div>
  );
};
