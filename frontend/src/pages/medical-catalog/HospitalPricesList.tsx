import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Building2,
  DollarSign,
  Tag,
  CheckCircle,
  XCircle,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { HospitalItemPrice } from '../../types/medical-catalog';
import { StatusChangeDialog, type StatusChangeType } from '../../components/common/StatusChangeDialog';

interface HospitalPricesListProps {
  onPriceSelect?: (price: HospitalItemPrice) => void;
  onPriceEdit?: (price: HospitalItemPrice) => void;
  onPriceDelete?: (price: HospitalItemPrice) => void;
  onPriceStatusChange?: (price: HospitalItemPrice) => void;
  onAddPrice?: () => void;
  viewMode?: 'list' | 'grid';
  refreshTrigger?: number;
}

export const HospitalPricesList: React.FC<HospitalPricesListProps> = ({
  onPriceSelect,
  onPriceEdit,
  onPriceDelete,
  onPriceStatusChange,
  onAddPrice,
  viewMode = 'list',
  refreshTrigger
}) => {
  const [prices, setPrices] = useState<HospitalItemPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    price: HospitalItemPrice | null;
    actionType: StatusChangeType | null;
    loading: boolean;
  }>({
    isOpen: false,
    price: null,
    actionType: null,
    loading: false
  });

  useEffect(() => {
    loadPrices();
  }, [currentPage, pageSize]);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadPrices();
    }
  }, [refreshTrigger]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-container')) {
          setOpenDropdown(null);
        }
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const loadPrices = async () => {
    try {
      setLoading(true);
      console.log('Loading hospital prices...');
      const data = await medicalCatalogApi.getHospitalItemPrices({
        page: currentPage,
        page_size: pageSize
      });
      console.log('Hospital prices loaded:', data);
      setPrices(data.results);
      setTotalCount(data.count);
    } catch (err) {
      console.error('Error loading hospital prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (price: HospitalItemPrice) => {
    setStatusDialog({
      isOpen: true,
      price,
      actionType: 'delete',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleActivate = (price: HospitalItemPrice) => {
    setStatusDialog({
      isOpen: true,
      price,
      actionType: 'activate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDeactivate = (price: HospitalItemPrice) => {
    setStatusDialog({
      isOpen: true,
      price,
      actionType: 'deactivate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleSuspend = (price: HospitalItemPrice) => {
    setStatusDialog({
      isOpen: true,
      price,
      actionType: 'suspend',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDialogConfirm = async (reason?: string) => {
    if (!statusDialog.price || !statusDialog.actionType) return;

    setStatusDialog(prev => ({ ...prev, loading: true }));

    try {
      switch (statusDialog.actionType) {
        case 'activate':
          await medicalCatalogApi.activateHospitalItemPrice(statusDialog.price.id);
          break;
        case 'deactivate':
          await medicalCatalogApi.deactivateHospitalItemPrice(statusDialog.price.id);
          break;
        case 'suspend':
          if (reason) {
            await medicalCatalogApi.suspendHospitalItemPrice(statusDialog.price.id, reason);
          }
          break;
        case 'delete':
          await medicalCatalogApi.deleteHospitalItemPrice(statusDialog.price.id);
          onPriceDelete?.(statusDialog.price);
          break;
      }
      
      onPriceStatusChange?.(statusDialog.price);
      handleDialogClose();
    } catch (err) {
      console.error(`Failed to ${statusDialog.actionType} hospital price:`, err);
    } finally {
      setStatusDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDialogClose = () => {
    setStatusDialog({
      isOpen: false,
      price: null,
      actionType: null,
      loading: false
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getItemTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'service':
        return 'Service';
      case 'medicine':
        return 'Medicine';
      case 'labtest':
        return 'Lab Test';
      default:
        return 'Item';
    }
  };

  const getItemName = (price: HospitalItemPrice) => {
    if (price.content_object && typeof price.content_object === 'object') {
      return (price.content_object as any).name || 'Unknown Item';
    }
    return 'Unknown Item';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Hospital Prices Display */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#374151' }}>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Hospital
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Item Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Available
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr 
                  key={price.id} 
                  className="border-b hover:bg-gray-800 transition-colors cursor-pointer" 
                  style={{ borderColor: '#374151' }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white truncate" title={price.hospital_detail?.hospital_name || 'Unknown Hospital'}>
                      {price.hospital_detail?.hospital_name || 'Unknown Hospital'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block" title={getItemName(price)}>
                      {getItemName(price)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block" title={getItemTypeLabel(price.content_type)}>
                      {getItemTypeLabel(price.content_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block">
                      {formatCurrency(price.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      price.available 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {price.available ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Unavailable
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      price.status === 'ACTIVE' 
                        ? 'bg-green-900 text-green-300' 
                        : price.status === 'INACTIVE'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-amber-900 text-amber-300'
                    }`}>
                      {price.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onPriceSelect?.(price)}
                      className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                    >
                      <Eye className="w-4 h-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        View Details
                      </div>
                    </button>
                    <button
                      onClick={() => onPriceEdit?.(price)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors rounded relative group"
                    >
                      <Edit className="w-4 h-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Edit Price
                      </div>
                    </button>
                    
                    {/* Status Management Dropdown */}
                    <div className="relative dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === price.id ? null : price.id);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                      >
                        <MoreVertical className="w-4 h-4" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          Status Options
                        </div>
                      </button>
                      
                      {openDropdown === price.id && (
                        <div 
                          className="absolute right-0 mt-1 w-48 rounded-md shadow-lg z-50"
                          style={{ 
                            backgroundColor: '#2a2a2a', 
                            border: '1px solid #404040',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="py-1">
                            {price.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleActivate(price)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                Activate
                              </button>
                            )}
                            {price.status !== 'INACTIVE' && (
                              <button
                                onClick={() => handleDeactivate(price)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <XCircle className="w-4 h-4 mr-2 text-yellow-400" />
                                Deactivate
                              </button>
                            )}
                            {(price.status as string) !== 'SUSPENDED' && (
                              <button
                                onClick={() => handleSuspend(price)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
                                Suspend
                              </button>
                            )}
                            <hr style={{ borderColor: '#404040' }} />
                            <button
                              onClick={() => handleDelete(price)}
                              className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                              style={{ color: '#d1d5db' }}
                            >
                              <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                              Delete Permanently
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {prices.map((price) => (
              <div key={price.id} className="rounded-lg border p-4 lg:p-6 hover:bg-gray-800 transition-colors" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{price.hospital_detail?.hospital_name || 'Unknown Hospital'}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                      {getItemTypeLabel(price.content_type)}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  price.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {price.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Tag className="w-4 h-4" />
                  <span>{getItemName(price)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(price.amount)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {price.available ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Available</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Unavailable</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#4a4a4a' }}>
                <button
                  onClick={() => onPriceSelect?.(price)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPriceEdit?.(price)}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit Price"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(price)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete Price"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Pagination Controls */}
          {prices.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-between flex-shrink-0" style={{ borderColor: '#374151' }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-sm border rounded bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <span className="text-sm text-gray-400">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded bg-gray-800 text-white border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              &lt; Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {Math.ceil(totalCount / pageSize) > 5 && (
                <>
                  <span className="text-gray-400">...</span>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(totalCount / pageSize))}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === Math.ceil(totalCount / pageSize)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {Math.ceil(totalCount / pageSize)}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / pageSize)))}
              disabled={currentPage === Math.ceil(totalCount / pageSize)}
              className="px-3 py-1 text-sm border rounded bg-gray-800 text-white border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              Next &gt;
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {prices.length === 0 && !loading && (
        <div className="p-8 lg:p-12">
          <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
            <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
            <h3 className="text-lg font-medium mb-2 text-white">No hospital prices found</h3>
            <p className="mb-4 text-gray-400">
              Get started by adding your first hospital price entry
            </p>
            <button 
              onClick={onAddPrice}
              className="px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
            >
              Add Hospital Price
            </button>
          </div>
        </div>
      )}

      {/* Status Change Dialog */}
      <StatusChangeDialog
        isOpen={statusDialog.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        company={statusDialog.price as any}
        actionType={statusDialog.actionType || 'activate'}
        loading={statusDialog.loading}
      />
    </div>
  );
};
