import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Stethoscope,
  DollarSign,
  Tag,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { Service } from '../../types/medical-catalog';
import { StatusChangeDialog, type StatusChangeType } from '../../components/common/StatusChangeDialog';

interface ServicesListProps {
  onServiceSelect?: (service: Service) => void;
  onServiceEdit?: (service: Service) => void;
  onServiceDelete?: (service: Service) => void;
  onServiceStatusChange?: (service: Service) => void;
  onAddService?: () => void;
  viewMode?: 'list' | 'grid';
  refreshTrigger?: number;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  onServiceSelect,
  onServiceEdit,
  onServiceDelete,
  onServiceStatusChange,
  onAddService,
  viewMode = 'list',
  refreshTrigger
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    service: Service | null;
    actionType: StatusChangeType | null;
    loading: boolean;
  }>({
    isOpen: false,
    service: null,
    actionType: null,
    loading: false
  });

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

  const loadServices = async () => {
    try {
      setLoading(true);
      console.log('Loading services...');
      const data = await medicalCatalogApi.getServices();
      console.log('Services loaded:', data);
      setServices(data);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (service: Service) => {
    setStatusDialog({
      isOpen: true,
      service,
      actionType: 'delete',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleActivate = (service: Service) => {
    setStatusDialog({
      isOpen: true,
      service,
      actionType: 'activate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDeactivate = (service: Service) => {
    setStatusDialog({
      isOpen: true,
      service,
      actionType: 'deactivate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleSuspend = (service: Service) => {
    setStatusDialog({
      isOpen: true,
      service,
      actionType: 'suspend',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDialogConfirm = async (reason?: string) => {
    if (!statusDialog.service || !statusDialog.actionType) return;

    setStatusDialog(prev => ({ ...prev, loading: true }));

    try {
      switch (statusDialog.actionType) {
        case 'activate':
          await medicalCatalogApi.activateService(statusDialog.service.id);
          break;
        case 'deactivate':
          await medicalCatalogApi.deactivateService(statusDialog.service.id);
          break;
        case 'suspend':
          if (reason) {
            await medicalCatalogApi.suspendService(statusDialog.service.id, reason);
          }
          break;
        case 'delete':
          await medicalCatalogApi.deleteService(statusDialog.service.id);
          onServiceDelete?.(statusDialog.service);
          break;
      }
      
      onServiceStatusChange?.(statusDialog.service);
      handleDialogClose();
    } catch (err) {
      console.error(`Failed to ${statusDialog.actionType} service:`, err);
    } finally {
      setStatusDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDialogClose = () => {
    setStatusDialog({
      isOpen: false,
      service: null,
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
    <div className="w-full">
      {/* Services Display */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b" style={{ borderColor: '#374151' }}>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Service Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Base Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr 
                  key={service.id} 
                  className="border-b hover:bg-gray-800 transition-colors cursor-pointer" 
                  style={{ borderColor: '#374151' }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white truncate" title={service.name}>
                      {service.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block" title={service.category}>
                      {service.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block" title={service.service_type}>
                      {service.service_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block">
                      {formatCurrency(service.base_amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 truncate block" title={service.description}>
                      {service.description}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      service.status === 'ACTIVE' 
                        ? 'bg-green-900 text-green-300' 
                        : service.status === 'INACTIVE'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-amber-900 text-amber-300'
                    }`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onServiceSelect?.(service)}
                      className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                    >
                      <Eye className="w-4 h-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        View Details
                      </div>
                    </button>
                    <button
                      onClick={() => onServiceEdit?.(service)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors rounded relative group"
                    >
                      <Edit className="w-4 h-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Edit Service
                      </div>
                    </button>
                    
                    {/* Status Management Dropdown */}
                    <div className="relative dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === service.id ? null : service.id);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                      >
                        <MoreVertical className="w-4 h-4" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          Status Options
                        </div>
                      </button>
                      
                      {openDropdown === service.id && (
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
                            {service.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleActivate(service)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                Activate
                              </button>
                            )}
                            {service.status !== 'INACTIVE' && (
                              <button
                                onClick={() => handleDeactivate(service)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <XCircle className="w-4 h-4 mr-2 text-yellow-400" />
                                Deactivate
                              </button>
                            )}
                            {(service.status as string) !== 'SUSPENDED' && (
                              <button
                                onClick={() => handleSuspend(service)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
                                Suspend
                              </button>
                            )}
                            <hr style={{ borderColor: '#404040' }} />
                            <button
                              onClick={() => handleDelete(service)}
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
            {services.map((service) => (
              <div key={service.id} className="rounded-lg border p-4 lg:p-6 hover:bg-gray-800 transition-colors" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{service.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                      {service.category}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  service.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {service.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Tag className="w-4 h-4" />
                  <span>{service.service_type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(service.base_amount)}</span>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="truncate">{service.description}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#4a4a4a' }}>
                <button
                  onClick={() => onServiceSelect?.(service)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onServiceEdit?.(service)}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit Service"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete Service"
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

      {/* Empty State */}
      {services.length === 0 && !loading && (
        <div className="p-8 lg:p-12">
          <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
            <Stethoscope className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
            <h3 className="text-lg font-medium mb-2 text-white">No services found</h3>
            <p className="mb-4 text-gray-400">
              Get started by adding your first medical service
            </p>
            <button 
              onClick={onAddService}
              className="px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
            >
              Add Service
            </button>
          </div>
        </div>
      )}

      {/* Status Change Dialog */}
      <StatusChangeDialog
        isOpen={statusDialog.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        company={statusDialog.service as any}
        actionType={statusDialog.actionType || 'activate'}
        loading={statusDialog.loading}
      />
    </div>
  );
};
