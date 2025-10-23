import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Pill,
  DollarSign,
  Clock,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { Medicine } from '../../types/medical-catalog';
import { StatusChangeDialog, type StatusChangeType } from '../../components/common/StatusChangeDialog';

interface MedicinesListProps {
  onMedicineSelect?: (medicine: Medicine) => void;
  onMedicineEdit?: (medicine: Medicine) => void;
  onMedicineDelete?: (medicine: Medicine) => void;
  onMedicineStatusChange?: (medicine: Medicine) => void;
  onAddMedicine?: () => void;
  viewMode?: 'list' | 'grid';
  refreshTrigger?: number;
}

export const MedicinesList: React.FC<MedicinesListProps> = ({
  onMedicineSelect,
  onMedicineEdit,
  onMedicineDelete,
  onMedicineStatusChange,
  onAddMedicine,
  viewMode = 'list',
  refreshTrigger
}) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    medicine: Medicine | null;
    actionType: StatusChangeType | null;
    loading: boolean;
  }>({
    isOpen: false,
    medicine: null,
    actionType: null,
    loading: false
  });

  useEffect(() => {
    loadMedicines();
  }, [currentPage, pageSize]);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadMedicines();
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

  const loadMedicines = async () => {
    try {
      setLoading(true);
      console.log('Loading medicines...');
      const data = await medicalCatalogApi.getMedicines({
        page: currentPage,
        page_size: pageSize
      });
      console.log('Medicines loaded:', data);
      setMedicines(data.results);
      setTotalCount(data.count);
    } catch (err) {
      console.error('Error loading medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (medicine: Medicine) => {
    setStatusDialog({
      isOpen: true,
      medicine,
      actionType: 'delete',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleActivate = (medicine: Medicine) => {
    setStatusDialog({
      isOpen: true,
      medicine,
      actionType: 'activate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDeactivate = (medicine: Medicine) => {
    setStatusDialog({
      isOpen: true,
      medicine,
      actionType: 'deactivate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleSuspend = (medicine: Medicine) => {
    setStatusDialog({
      isOpen: true,
      medicine,
      actionType: 'suspend',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDialogConfirm = async (reason?: string) => {
    if (!statusDialog.medicine || !statusDialog.actionType) return;

    setStatusDialog(prev => ({ ...prev, loading: true }));

    try {
      switch (statusDialog.actionType) {
        case 'activate':
          await medicalCatalogApi.activateMedicine(statusDialog.medicine.id);
          break;
        case 'deactivate':
          await medicalCatalogApi.deactivateMedicine(statusDialog.medicine.id);
          break;
        case 'suspend':
          if (reason) {
            await medicalCatalogApi.suspendMedicine(statusDialog.medicine.id, reason);
          }
          break;
        case 'delete':
          await medicalCatalogApi.deleteMedicine(statusDialog.medicine.id);
          onMedicineDelete?.(statusDialog.medicine);
          break;
      }
      
      onMedicineStatusChange?.(statusDialog.medicine);
      handleDialogClose();
    } catch (err) {
      console.error(`Failed to ${statusDialog.actionType} medicine:`, err);
    } finally {
      setStatusDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDialogClose = () => {
    setStatusDialog({
      isOpen: false,
      medicine: null,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Medicines Display */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#374151' }}>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Medicine Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Dosage Form
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Route
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                  Duration
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
              {medicines.map((medicine) => (
                <tr 
                  key={medicine.id} 
                  className="border-b hover:bg-gray-800 transition-colors cursor-pointer" 
                  style={{ borderColor: '#374151' }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white truncate" title={medicine.name}>
                      {medicine.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block" title={medicine.dosage_form}>
                      {medicine.dosage_form}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block" title={medicine.route}>
                      {medicine.route}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block">
                      {formatCurrency(medicine.unit_price)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block" title={medicine.duration}>
                      {medicine.duration}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      medicine.status === 'ACTIVE' 
                        ? 'bg-green-900 text-green-300' 
                        : medicine.status === 'INACTIVE'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-amber-900 text-amber-300'
                    }`}>
                      {medicine.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onMedicineSelect?.(medicine)}
                      className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                    >
                      <Eye className="w-4 h-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        View Details
                      </div>
                    </button>
                    <button
                      onClick={() => onMedicineEdit?.(medicine)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors rounded relative group"
                    >
                      <Edit className="w-4 h-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Edit Medicine
                      </div>
                    </button>
                    
                    {/* Status Management Dropdown */}
                    <div className="relative dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === medicine.id ? null : medicine.id);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                      >
                        <MoreVertical className="w-4 h-4" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          Status Options
                        </div>
                      </button>
                      
                      {openDropdown === medicine.id && (
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
                            {medicine.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleActivate(medicine)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                Activate
                              </button>
                            )}
                            {medicine.status !== 'INACTIVE' && (
                              <button
                                onClick={() => handleDeactivate(medicine)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <XCircle className="w-4 h-4 mr-2 text-yellow-400" />
                                Deactivate
                              </button>
                            )}
                            {(medicine.status as string) !== 'SUSPENDED' && (
                              <button
                                onClick={() => handleSuspend(medicine)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
                                Suspend
                              </button>
                            )}
                            <hr style={{ borderColor: '#404040' }} />
                            <button
                              onClick={() => handleDelete(medicine)}
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
            {medicines.map((medicine) => (
              <div key={medicine.id} className="rounded-lg border p-4 lg:p-6 hover:bg-gray-800 transition-colors" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Pill className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{medicine.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                      {medicine.dosage_form}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  medicine.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {medicine.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{medicine.route}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(medicine.unit_price)}</span>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="truncate">Duration: {medicine.duration}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#4a4a4a' }}>
                <button
                  onClick={() => onMedicineSelect?.(medicine)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onMedicineEdit?.(medicine)}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit Medicine"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(medicine)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete Medicine"
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
          {medicines.length > 0 && (
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
      {medicines.length === 0 && !loading && (
        <div className="p-8 lg:p-12">
          <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
            <Pill className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
            <h3 className="text-lg font-medium mb-2 text-white">No medicines found</h3>
            <p className="mb-4 text-gray-400">
              Get started by adding your first medicine
            </p>
            <button 
              onClick={onAddMedicine}
              className="px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
            >
              Add Medicine
            </button>
          </div>
        </div>
      )}

      {/* Status Change Dialog */}
      <StatusChangeDialog
        isOpen={statusDialog.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        company={statusDialog.medicine as any}
        actionType={statusDialog.actionType || 'activate'}
        loading={statusDialog.loading}
      />
    </div>
  );
};
