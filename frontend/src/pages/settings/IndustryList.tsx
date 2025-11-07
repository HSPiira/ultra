import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  Download,
} from 'lucide-react';
import { companiesApi } from '../../services/companies';
import type { Industry } from '../../types/companies';
import { IndustryTable } from '../../components/tables';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { Tooltip } from '../../components/common/Tooltip';
import { sortData } from '../../utils/sort';

// Cache constants
const CACHE_KEY = 'industries_cache';
const CACHE_TIMESTAMP_KEY = 'industries_cache_timestamp';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface IndustryListProps {
  onIndustrySelect?: (industry: Industry) => void;
  onIndustryEdit?: (industry: Industry) => void;
  onIndustryDelete?: (industry: Industry) => void;
  onAddIndustry?: () => void;
  refreshTrigger?: number;
}

export const IndustryList: React.FC<IndustryListProps> = ({
  onIndustrySelect,
  onIndustryEdit,
  onIndustryDelete,
  onAddIndustry,
  refreshTrigger
}) => {
  const { colors } = useTheme();
  const { getIconButtonProps } = useThemeStyles();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [allFilteredIndustries, setAllFilteredIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load from cache
  const loadFromCache = useCallback((): Industry[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < CACHE_DURATION) {
          return JSON.parse(cached) as Industry[];
        } else {
          // Cache expired, remove it
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
      }
    } catch (err) {
      console.error('Error reading from cache:', err);
    }
    return null;
  }, []);

  // Save to cache
  const saveToCache = useCallback((data: Industry[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  }, []);

  const loadIndustries = useCallback(async (forceRefresh: boolean = false) => {
    // Try to load from cache first (unless forced refresh)
    let hasCachedData = false;
    if (!forceRefresh) {
      const cachedData = loadFromCache();
      if (cachedData && cachedData.length > 0) {
        console.log('Loading industries from cache...');
        setIndustries(cachedData);
        setAllFilteredIndustries(cachedData);
        setLoading(false);
        hasCachedData = true;
        // Still fetch fresh data in background
      }
    }

    try {
      setError(undefined);
      console.log('Fetching industries from API...');
      const data = await companiesApi.getIndustries();
      console.log('Industries loaded from API:', data);
      
      // Update state
      setIndustries(data);
      setAllFilteredIndustries(data);
      
      // Save to cache
      saveToCache(data);
    } catch (err) {
      console.error('Error loading industries:', err);
      // If we don't have cached data, show error
      if (!hasCachedData) {
        setError('Failed to load industries');
      }
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  useEffect(() => {
    loadIndustries();
  }, [loadIndustries]);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('Industry refresh trigger changed:', refreshTrigger);
      clearCache(); // Clear cache on explicit refresh
      loadIndustries(true); // Force refresh
    }
  }, [refreshTrigger, loadIndustries, clearCache]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data (memoized)
  const filteredIndustries = useMemo(() => {
    return sortData(
      allFilteredIndustries.filter(industry =>
        industry.industry_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (industry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      ),
      sortField,
      sortDirection
    );
  }, [allFilteredIndustries, searchTerm, sortField, sortDirection]);

  // Pagination logic (memoized)
  const { totalPages, startIndex, endIndex, paginatedIndustries } = useMemo(() => {
    const totalPages = Math.ceil(filteredIndustries.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedIndustries = filteredIndustries.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, paginatedIndustries };
  }, [filteredIndustries, rowsPerPage, currentPage]);

  // Reset to first page when rows per page or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, searchTerm]);

  // Clamp currentPage to valid range when totalPages changes (e.g., after deletions or filters)
  useEffect(() => {
    if (totalPages === 0) {
      // No pages, reset to 1
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      // Current page exceeds total pages, move to last valid page
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleIndustryView = (industry: Industry) => {
    onIndustrySelect?.(industry);
  };

  const handleIndustryEdit = (industry: Industry) => {
    onIndustryEdit?.(industry);
  };

  const handleIndustryDelete = async (industry: Industry) => {
    if (window.confirm(`Are you sure you want to delete ${industry.industry_name}?`)) {
      try {
        await companiesApi.deleteIndustry(industry.id);
        clearCache(); // Clear cache after delete
        onIndustryDelete?.(industry);
        loadIndustries(true); // Force refresh
      } catch (err) {
        console.error('Failed to delete industry');
        console.error('Error deleting industry:', err);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Search and Filter Bar with Action Buttons */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search industries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border rounded-lg transition-colors"
              style={{ 
                backgroundColor: '#1a1a1a', 
                borderColor: '#4a4a4a', 
                color: '#ffffff' 
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6b7280';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#4a4a4a';
              }}
            />
          </div>

          {/* Action Buttons - Refresh and Add */}
          <div className="flex items-center gap-3">
            <Tooltip content="Refresh data">
              <button
                type="button"
                onClick={() => {
                  clearCache();
                  loadIndustries(true);
                }}
                className="p-2 rounded-lg transition-colors"
                {...getIconButtonProps()}
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </Tooltip>
            
            <Tooltip content="Add new industry">
              <button
                type="button"
                onClick={onAddIndustry}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: colors.background.quaternary, color: colors.text.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.quaternary;
                }}
                title="Add Industry"
              >
                <Plus className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#9ca3af' }}>Rows</span>
            <div className="flex items-center gap-1">
              {[10, 25, 50, 100].map((rows) => (
                <Tooltip key={rows} content={`Show ${rows} rows per page`}>
                  <button
                    type="button"
                    onClick={() => setRowsPerPage(rows)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      rowsPerPage === rows
                        ? 'text-white border-2'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    style={{
                      backgroundColor: rowsPerPage === rows ? '#2E3333' : 'transparent',
                      borderColor: rowsPerPage === rows ? '#66D9EF' : 'transparent',
                    }}
                  >
                    {rows}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <Tooltip content="Export data to CSV">
            <button
              type="button"
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#9ca3af' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = '#3b3b3b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => console.log('Export industries')}
            >
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Industries Table */}
      <IndustryTable
        industries={paginatedIndustries}
        allFilteredIndustries={filteredIndustries}
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onIndustryView={handleIndustryView}
        onIndustryEdit={handleIndustryEdit}
        onIndustryDelete={handleIndustryDelete}
        onIndustrySelect={onIndustrySelect}
        onPageChange={handlePageChange}
        loading={loading}
        error={error}
        onRetry={loadIndustries}
      />

      {/* Empty State */}
      {industries.length === 0 && !loading && !error && (
        <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No industries found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            Get started by adding your first industry
          </p>
          <button
            type="button"
            onClick={onAddIndustry}
            className="px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
          >
            Add Industry
          </button>
        </div>
      )}
    </div>
  );
};
