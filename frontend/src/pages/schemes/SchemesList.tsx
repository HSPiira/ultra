import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  Building2,
  Calendar,
  DollarSign,
  Users,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { schemesApi } from '../../services/schemes';
import type { Scheme } from '../../types/schemes';
import { SchemeStatusChangeDialog, type SchemeStatusChangeType } from '../../components/common/SchemeStatusChangeDialog';

interface SchemesListProps {
  onSchemeSelect?: (scheme: Scheme) => void;
  onSchemeEdit?: (scheme: Scheme) => void;
  onSchemeDelete?: (scheme: Scheme) => void;
  onSchemeStatusChange?: (scheme: Scheme) => void;
  onAddScheme?: () => void;
  viewMode?: 'list' | 'grid';
  refreshTrigger?: number;
}

export const SchemesList: React.FC<SchemesListProps> = ({
  onSchemeSelect,
  onSchemeEdit,
  onSchemeDelete,
  onSchemeStatusChange,
  onAddScheme,
  viewMode = 'list',
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    scheme: Scheme | null;
    actionType: SchemeStatusChangeType | null;
    loading: boolean;
  }>({
    isOpen: false,
    scheme: null,
    actionType: null,
    loading: false
  });

  useEffect(() => {
    loadSchemes();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadSchemes();
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

  const loadSchemes = async () => {
    try {
      setLoading(true);
      console.log('Loading schemes...');
      const data = await schemesApi.getSchemes();
      console.log('Schemes loaded:', data);
      setSchemes(data);
    } catch (err) {
      console.error('Error loading schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (scheme: Scheme) => {
    setStatusDialog({
      isOpen: true,
      scheme,
      actionType: 'delete',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleActivate = (scheme: Scheme) => {
    setStatusDialog({
      isOpen: true,
      scheme,
      actionType: 'activate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDeactivate = (scheme: Scheme) => {
    setStatusDialog({
      isOpen: true,
      scheme,
      actionType: 'deactivate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleSuspend = (scheme: Scheme) => {
    setStatusDialog({
      isOpen: true,
      scheme,
      actionType: 'suspend',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDialogConfirm = async (reason?: string) => {
    if (!statusDialog.scheme || !statusDialog.actionType) return;

    setStatusDialog(prev => ({ ...prev, loading: true }));

    try {
      switch (statusDialog.actionType) {
        case 'activate':
          await schemesApi.activateScheme(statusDialog.scheme.id);
          break;
        case 'deactivate':
          await schemesApi.deactivateScheme(statusDialog.scheme.id);
          break;
        case 'suspend':
          if (reason) {
            await schemesApi.suspendScheme(statusDialog.scheme.id, reason);
          }
          break;
        case 'delete':
          await schemesApi.deleteScheme(statusDialog.scheme.id);
          onSchemeDelete?.(statusDialog.scheme);
          break;
      }
      
      onSchemeStatusChange?.(statusDialog.scheme);
      handleDialogClose();
    } catch (err) {
      console.error(`Failed to ${statusDialog.actionType} scheme:`, err);
    } finally {
      setStatusDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDialogClose = () => {
    setStatusDialog({
      isOpen: false,
      scheme: null,
      actionType: null,
      loading: false
    });
  };

  const handleRowDoubleClick = (scheme: Scheme) => {
    navigate(`/schemes/${scheme.id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysTillExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (endDate: string) => {
    const days = getDaysTillExpiry(endDate);
    if (days < 0) return { status: 'expired', color: 'text-red-400', bgColor: 'bg-red-900' };
    if (days <= 30) return { status: 'expiring', color: 'text-amber-400', bgColor: 'bg-amber-900' };
    if (days <= 90) return { status: 'warning', color: 'text-yellow-400', bgColor: 'bg-yellow-900' };
    return { status: 'active', color: 'text-green-400', bgColor: 'bg-green-900' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Schemes Display */}
      {viewMode === 'list' ? (
        /* List View */
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b" style={{ borderColor: '#374151' }}>
              <th className="w-1/5 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheme
              </th>
              <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Card Code
              </th>
              <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coverage Amount
              </th>
              <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="w-20 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry
              </th>
              <th className="w-20 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="w-20 px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {schemes.map((scheme) => (
              <tr 
                key={scheme.id} 
                className="border-b hover:bg-gray-800 transition-colors cursor-pointer" 
                style={{ borderColor: '#374151' }}
                onDoubleClick={() => handleRowDoubleClick(scheme)}
              >
                <td className="px-3 py-2">
                  <div className="font-medium text-white truncate" title={scheme.scheme_name}>
                    {scheme.scheme_name}
                  </div>
                  {scheme.description && (
                    <div className="text-sm text-gray-400 truncate" title={scheme.description}>
                      {scheme.description}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm text-gray-400 truncate block" title={scheme.company_detail.company_name}>
                    {scheme.company_detail.company_name}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm text-gray-400 truncate block" title={scheme.card_code}>
                    {scheme.card_code}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm text-gray-400 truncate block" title={formatCurrency(scheme.limit_amount)}>
                    {formatCurrency(scheme.limit_amount)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm text-gray-400 truncate block" title={formatDate(scheme.start_date)}>
                    {formatDate(scheme.start_date)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm text-gray-400 truncate block" title={formatDate(scheme.end_date)}>
                    {formatDate(scheme.end_date)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {(() => {
                    const days = getDaysTillExpiry(scheme.end_date);
                    const expiryStatus = getExpiryStatus(scheme.end_date);
                    return (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${expiryStatus.color}`}>
                          {days < 0 ? 'Expired' : days.toString()}
                        </span>
                        {days <= 30 && days >= 0 && (
                          <div className={`w-2 h-2 rounded-full ${expiryStatus.bgColor}`}></div>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      scheme.status === 'ACTIVE' 
                        ? 'bg-green-900 text-green-300' 
                        : scheme.status === 'INACTIVE'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-amber-900 text-amber-300'
                    }`}>
                      {scheme.status}
                    </span>
                    {(() => {
                      const days = getDaysTillExpiry(scheme.end_date);
                      if (days <= 30 && days >= 0) {
                        return (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                            <span className="text-xs text-amber-400">Expiring Soon</span>
                          </div>
                        );
                      }
                      if (days < 0) {
                        return (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <span className="text-xs text-red-400">Expired</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onSchemeSelect?.(scheme)}
                      className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                    >
                      <Eye className="w-4 h-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50" style={{ minWidth: 'max-content' }}>
                        View Details
                      </div>
                    </button>
                    <button
                      onClick={() => onSchemeEdit?.(scheme)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors rounded relative group"
                    >
                      <Edit className="w-4 h-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50" style={{ minWidth: 'max-content' }}>
                        Edit Scheme
                      </div>
                    </button>
                    
                    {/* Status Management Dropdown */}
                    <div className="relative dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === scheme.id ? null : scheme.id);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                      >
                        <MoreVertical className="w-4 h-4" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50" style={{ minWidth: 'max-content' }}>
                          Status Options
                        </div>
                      </button>
                      
                      {openDropdown === scheme.id && (
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
                            {scheme.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleActivate(scheme)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                Activate
                              </button>
                            )}
                            {scheme.status !== 'INACTIVE' && (
                              <button
                                onClick={() => handleDeactivate(scheme)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <XCircle className="w-4 h-4 mr-2 text-yellow-400" />
                                Deactivate
                              </button>
                            )}
                            {(scheme.status as string) !== 'SUSPENDED' && (
                              <button
                                onClick={() => handleSuspend(scheme)}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#d1d5db' }}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
                                Suspend
                              </button>
                            )}
                            <hr style={{ borderColor: '#404040' }} />
                            <button
                              onClick={() => handleDelete(scheme)}
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="rounded-lg border p-6 hover:bg-gray-800 transition-colors" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{scheme.scheme_name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                      {scheme.card_code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    scheme.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : scheme.status === 'INACTIVE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {scheme.status}
                  </span>
                  {(() => {
                    const days = getDaysTillExpiry(scheme.end_date);
                    if (days <= 30 && days >= 0) {
                      return (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                          <span className="text-xs text-amber-400">Expiring Soon</span>
                        </div>
                      );
                    }
                    if (days < 0) {
                      return (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span className="text-xs text-red-400">Expired</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{scheme.company_detail.company_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(scheme.limit_amount)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Start: {formatDate(scheme.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>End: {formatDate(scheme.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {(() => {
                      const days = getDaysTillExpiry(scheme.end_date);
                      const expiryStatus = getExpiryStatus(scheme.end_date);
                      return (
                        <>
                          <div className={`w-2 h-2 rounded-full ${expiryStatus.bgColor}`}></div>
                          <span className={expiryStatus.color}>
                            {days < 0 ? 'Expired' : days.toString()}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                {scheme.family_applicable && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Family Applicable</span>
                  </div>
                )}
                {scheme.description && (
                  <div className="text-sm text-gray-400">
                    <span className="truncate block">{scheme.description}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#4a4a4a' }}>
                <button
                  onClick={() => onSchemeSelect?.(scheme)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSchemeEdit?.(scheme)}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit Scheme"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(scheme)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete Scheme"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {schemes.length === 0 && !loading && (
        <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No schemes found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            Get started by adding your first scheme
          </p>
          <button 
            onClick={onAddScheme}
            className="px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
          >
            Add Scheme
          </button>
        </div>
      )}

      {/* Status Change Dialog */}
      <SchemeStatusChangeDialog
        isOpen={statusDialog.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        scheme={statusDialog.scheme}
        actionType={statusDialog.actionType || 'activate'}
        loading={statusDialog.loading}
      />
    </div>
  );
};
