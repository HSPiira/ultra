import React, { useState, useEffect } from 'react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { HospitalItemPrice } from '../../types/medical-catalog';
import { HospitalPriceTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';

interface HospitalPricesListNewProps {
  onHospitalPriceSelect?: (hospitalPrice: HospitalItemPrice) => void;
  onHospitalPriceEdit?: (hospitalPrice: HospitalItemPrice) => void;
  onHospitalPriceDelete?: (hospitalPrice: HospitalItemPrice) => void;
  onHospitalPriceStatusChange?: (hospitalPrice: HospitalItemPrice) => void;
  onAddHospitalPrice?: () => void;
  refreshTrigger?: number;
}

export const HospitalPricesListNew: React.FC<HospitalPricesListNewProps> = ({
  onHospitalPriceSelect,
  onHospitalPriceEdit,
  onHospitalPriceDelete,
  onHospitalPriceStatusChange,
  onAddHospitalPrice,
  refreshTrigger
}) => {
  const [hospitalPrices, setHospitalPrices] = useState<HospitalItemPrice[]>([]);
  const [allFilteredHospitalPrices, setAllFilteredHospitalPrices] = useState<HospitalItemPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadHospitalPrices();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadHospitalPrices();
    }
  }, [refreshTrigger]);

  const loadHospitalPrices = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('Loading hospital prices...');
      const data = await medicalCatalogApi.getHospitalItemPrices({
        page: currentPage,
        page_size: rowsPerPage
      });
      console.log('Hospital prices loaded:', data);
      setHospitalPrices(data.results);
      setAllFilteredHospitalPrices(data.results);
    } catch (err) {
      console.error('Error loading hospital prices:', err);
      setError('Failed to load hospital prices');
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
  const filteredHospitalPrices = sortData(
    allFilteredHospitalPrices.filter(hospitalPrice =>
      hospitalPrice.hospital_detail?.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospitalPrice.content_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hospitalPrice.content_object as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredHospitalPrices.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const paginatedHospitalPrices = filteredHospitalPrices.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleHospitalPriceView = (hospitalPrice: HospitalItemPrice) => {
    onHospitalPriceSelect?.(hospitalPrice);
  };

  const handleHospitalPriceEdit = (hospitalPrice: HospitalItemPrice) => {
    onHospitalPriceEdit?.(hospitalPrice);
  };

  const handleHospitalPriceDelete = (hospitalPrice: HospitalItemPrice) => {
    onHospitalPriceDelete?.(hospitalPrice);
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
        searchPlaceholder="Search hospital prices..."
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onExport={() => console.log('Export hospital prices')}
      />

      {/* Hospital Prices Table */}
      <HospitalPriceTable
        hospitalPrices={paginatedHospitalPrices}
        allFilteredHospitalPrices={filteredHospitalPrices}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onHospitalPriceView={handleHospitalPriceView}
        onHospitalPriceEdit={handleHospitalPriceEdit}
        onHospitalPriceDelete={handleHospitalPriceDelete}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadHospitalPrices}
      />
    </div>
  );
};
