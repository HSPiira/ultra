import React, { useState, useEffect } from 'react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { Service } from '../../types/medical-catalog';
import { ServiceTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface ServicesListNewProps {
  onServiceSelect?: (service: Service) => void;
  onServiceEdit?: (service: Service) => void;
  onServiceDelete?: (service: Service) => void;
  onServiceStatusChange?: (service: Service) => void;
  onAddService?: () => void;
  refreshTrigger?: number;
}

export const ServicesListNew: React.FC<ServicesListNewProps> = ({
  onServiceSelect,
  onServiceEdit,
  onServiceDelete,
  onServiceStatusChange,
  onAddService,
  refreshTrigger
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [allFilteredServices, setAllFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadServices();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadServices();
    }
  }, [refreshTrigger]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading services...');
      const data = await medicalCatalogApi.getServices({
        page: currentPage,
        page_size: rowsPerPage
      });
      console.log('Services loaded:', data);
      setServices(data.results);
      setAllFilteredServices(data.results);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Failed to load services');
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
  const filteredServices = sortData(
    allFilteredServices.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredServices.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleServiceView = (service: Service) => {
    onServiceSelect?.(service);
  };

  const handleServiceEdit = (service: Service) => {
    onServiceEdit?.(service);
  };

  const handleServiceDelete = (service: Service) => {
    onServiceDelete?.(service);
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
        searchPlaceholder="Search services..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export services')}
      />

      {/* Services Table */}
      <ServiceTable
        services={paginatedServices}
        allFilteredServices={filteredServices}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onServiceView={handleServiceView}
        onServiceEdit={handleServiceEdit}
        onServiceDelete={handleServiceDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadServices}
      />
    </div>
  );
};
