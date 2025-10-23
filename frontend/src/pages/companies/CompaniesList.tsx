import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  User,
  MoreVertical,
  CheckCircle         ,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { companiesApi } from '../../services/companies';
import type { Company } from '../../types/companies';
import { StatusChangeDialog, type StatusChangeType } from '../../components/common/StatusChangeDialog';

interface CompaniesListProps {
  onCompanySelect?: (company: Company) => void;
  onCompanyEdit?: (company: Company) => void;
  onCompanyDelete?: (company: Company) => void;
  onCompanyStatusChange?: (company: Company) => void;
  onAddCompany?: () => void;
  viewMode?: 'list' | 'grid';
  refreshTrigger?: number; // Add refresh trigger prop
}

export const CompaniesList: React.FC<CompaniesListProps> = ({
  onCompanySelect,
  onCompanyEdit,
  onCompanyDelete,
  onCompanyStatusChange,
  onAddCompany,
  viewMode = 'list',
  refreshTrigger
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    company: Company | null;
    actionType: StatusChangeType | null;
    loading: boolean;
  }>({
    isOpen: false,
    company: null,
    actionType: null,
    loading: false
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed:', refreshTrigger);
      loadCompanies();
    }
  }, [refreshTrigger]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const target = event.target as Element;
        // Check if click is outside the dropdown
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

  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log('Loading companies...');
      const data = await companiesApi.getCompanies();
      console.log('Companies loaded:', data);
      setCompanies(data);
    } catch (err) {
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (company: Company) => {
    setStatusDialog({
      isOpen: true,
      company,
      actionType: 'delete',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleActivate = (company: Company) => {
    setStatusDialog({
      isOpen: true,
      company,
      actionType: 'activate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDeactivate = (company: Company) => {
    setStatusDialog({
      isOpen: true,
      company,
      actionType: 'deactivate',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleSuspend = (company: Company) => {
    setStatusDialog({
      isOpen: true,
      company,
      actionType: 'suspend',
      loading: false
    });
    setOpenDropdown(null);
  };

  const handleDialogConfirm = async (reason?: string) => {
    if (!statusDialog.company || !statusDialog.actionType) return;

    setStatusDialog(prev => ({ ...prev, loading: true }));

    try {
      switch (statusDialog.actionType) {
        case 'activate':
          await companiesApi.activateCompany(statusDialog.company.id);
          break;
        case 'deactivate':
          await companiesApi.deactivateCompany(statusDialog.company.id);
          break;
        case 'suspend':
          if (reason) {
            await companiesApi.suspendCompany(statusDialog.company.id, reason);
          }
          break;
        case 'delete':
          await companiesApi.deleteCompany(statusDialog.company.id);
          onCompanyDelete?.(statusDialog.company);
          break;
      }
      
      onCompanyStatusChange?.(statusDialog.company);
      handleDialogClose();
    } catch (err) {
      console.error(`Failed to ${statusDialog.actionType} company:`, err);
    } finally {
      setStatusDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDialogClose = () => {
    setStatusDialog({
      isOpen: false,
      company: null,
      actionType: null,
      loading: false
    });
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
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
      {/* Companies Display */}
      {viewMode === 'list' ? (
        /* List View - Clean table without outline */
          <table className="w-full table-fixed">
              <thead>
                <tr className="border-b" style={{ borderColor: '#374151' }}>
                  <th className="w-1/5 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                  <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                  <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                  <th className="w-1/5 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                </th>
                  <th className="w-24 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
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
              {companies.map((company) => (
                  <tr 
                    key={company.id} 
                    className="border-b hover:bg-gray-800 transition-colors" 
                    style={{ borderColor: '#374151' }}
                  >
                    <td className="px-3 py-2">
                        <div className="font-medium text-white truncate" title={company.company_name}>{company.company_name}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-400 truncate block" title={company.industry_detail.industry_name}>{company.industry_detail.industry_name}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-400 truncate block" title={company.contact_person}>{company.contact_person}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-400 truncate block" title={company.email}>{company.email}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-400 truncate block" title={company.phone_number}>{formatPhoneNumber(company.phone_number)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        company.status === 'ACTIVE' 
                          ? 'bg-green-900 text-green-300' 
                          : company.status === 'INACTIVE'
                          ? 'bg-red-900 text-red-300'
                          : 'bg-amber-900 text-amber-300'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onCompanySelect?.(company)}
                          className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                        >
                          <Eye className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50" style={{ minWidth: 'max-content' }}>
                            View Details
                      </div>
                        </button>
                        <button
                          onClick={() => onCompanyEdit?.(company)}
                          className="p-1 text-gray-400 hover:text-blue-400 transition-colors rounded relative group"
                        >
                          <Edit className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50" style={{ minWidth: 'max-content' }}>
                            Edit Company
                        </div>
                        </button>
                        
                        {/* Status Management Dropdown */}
                        <div className="relative dropdown-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === company.id ? null : company.id);
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors rounded relative group"
                          >
                            <MoreVertical className="w-4 h-4" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50" style={{ minWidth: 'max-content' }}>
                              Status Options
                            </div>
                          </button>
                          
                          {openDropdown === company.id && (
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
                                {company.status !== 'ACTIVE' && (
                                  <button
                                    onClick={() => handleActivate(company)}
                                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                    style={{ color: '#d1d5db' }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                    Activate
                                  </button>
                                )}
                                {company.status !== 'INACTIVE' && (
                                  <button
                                    onClick={() => handleDeactivate(company)}
                                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                    style={{ color: '#d1d5db' }}
                                  >
                                    <XCircle className="w-4 h-4 mr-2 text-yellow-400" />
                                    Deactivate
                                  </button>
                                )}
                                {(company.status as string) !== 'SUSPENDED' && (
                                  <button
                                    onClick={() => handleSuspend(company)}
                                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                    style={{ color: '#d1d5db' }}
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
                                    Suspend
                                  </button>
                                )}
                                <hr style={{ borderColor: '#404040' }} />
                                <button
                                  onClick={() => handleDelete(company)}
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
          {companies.map((company) => (
            <div key={company.id} className="style={{ backgroundColor: '#2a2a2a' }} rounded-lg border style={{ borderColor: '#4a4a4a' }} p-6 hover:style={{ backgroundColor: '#3b3b3b' }} transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold style={{ color: '#ffffff' }}">{company.company_name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                      {company.industry_detail.industry_name}
                    </span>
                      </div>
                    </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  company.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.status}
                    </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <User className="w-4 h-4" />
                  <span>{company.contact_person}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <Mail className="w-4 h-4" />
                  <span>{company.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <Phone className="w-4 h-4" />
                  <span>{formatPhoneNumber(company.phone_number)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{company.company_address}</span>
                </div>
                {company.website && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                    <ExternalLink className="w-4 h-4" />
                    <a 
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#4a4a4a' }}>
                      <button
                        onClick={() => onCompanySelect?.(company)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                <div className="flex items-center gap-2">
                      <button
                        onClick={() => onCompanyEdit?.(company)}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit Company"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Delete Company"
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
        {companies.length === 0 && !loading && (
        <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No companies found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            Get started by adding your first company
          </p>
              <button 
                onClick={onAddCompany}
            className="px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
              >
                Add Company
              </button>
          </div>
        )}

      {/* Status Change Dialog */}
      <StatusChangeDialog
        isOpen={statusDialog.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        company={statusDialog.company}
        actionType={statusDialog.actionType || 'activate'}
        loading={statusDialog.loading}
      />
    </div>
  );
};
