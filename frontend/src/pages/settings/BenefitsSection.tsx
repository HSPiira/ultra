import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Heart,
  Activity,
  FileText
} from 'lucide-react';
import { benefitsApi } from '../../services/benefits';
import type { Benefit } from '../../types/benefits';
import { BenefitForm } from './BenefitForm';
import { BenefitDetails } from './BenefitDetails';
import { StatusChangeDialog, type StatusChangeType } from '../../components/common/StatusChangeDialog';

export const BenefitsSection: React.FC = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [patientTypeFilter, setPatientTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    benefit: Benefit | null;
    actionType: StatusChangeType | null;
    loading: boolean;
  }>({
    isOpen: false,
    benefit: null,
    actionType: null,
    loading: false
  });

  useEffect(() => {
    loadBenefits();
  }, [searchTerm, statusFilter, patientTypeFilter]);

  const loadBenefits = async () => {
    try {
      setLoading(true);
      const data = await benefitsApi.getBenefits({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        in_or_out_patient: patientTypeFilter || undefined,
        ordering: 'benefit_name'
      });
      setBenefits(data);
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedBenefit(null);
    setShowForm(true);
  };

  const handleEdit = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowForm(true);
  };

  const handleView = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowDetails(true);
  };

  const handleDelete = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setStatusDialog({
      isOpen: true,
      benefit,
      actionType: 'delete',
      loading: false
    });
  };

  const handleStatusChange = (benefit: Benefit, action: StatusChangeType) => {
    setSelectedBenefit(benefit);
    setStatusDialog({
      isOpen: true,
      benefit,
      actionType: action,
      loading: false
    });
  };

  const handleDialogClose = () => {
    setStatusDialog({
      isOpen: false,
      benefit: null,
      actionType: null,
      loading: false
    });
  };

  const handleDialogConfirm = async (reason?: string) => {
    if (!statusDialog.benefit || !statusDialog.actionType) return;

    try {
      setStatusDialog(prev => ({ ...prev, loading: true }));

      switch (statusDialog.actionType) {
        case 'activate':
          await benefitsApi.activateBenefit(statusDialog.benefit.id);
          break;
        case 'deactivate':
          await benefitsApi.deactivateBenefit(statusDialog.benefit.id);
          break;
        case 'suspend':
          await benefitsApi.suspendBenefit(statusDialog.benefit.id);
          break;
        case 'delete':
          await benefitsApi.deleteBenefit(statusDialog.benefit.id);
          break;
      }

      await loadBenefits();
      handleDialogClose();
    } catch (error) {
      console.error('Error updating benefit status:', error);
    } finally {
      setStatusDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFormSave = async () => {
    setShowForm(false);
    setSelectedBenefit(null);
    await loadBenefits();
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedBenefit(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-900 text-green-300';
      case 'INACTIVE':
        return 'bg-red-900 text-red-300';
      case 'SUSPENDED':
        return 'bg-amber-900 text-amber-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4" />;
      case 'INACTIVE':
        return <XCircle className="w-4 h-4" />;
      case 'SUSPENDED':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPatientTypeIcon = (type: string) => {
    switch (type) {
      case 'INPATIENT':
        return <Activity className="w-4 h-4" />;
      case 'OUTPATIENT':
        return <Heart className="w-4 h-4" />;
      case 'BOTH':
        return <div className="flex gap-1"><Heart className="w-3 h-3" /><Activity className="w-3 h-3" /></div>;
      default:
        return null;
    }
  };

  const getPatientTypeColor = (type: string) => {
    switch (type) {
      case 'INPATIENT':
        return 'bg-blue-900 text-blue-300';
      case 'OUTPATIENT':
        return 'bg-purple-900 text-purple-300';
      case 'BOTH':
        return 'bg-indigo-900 text-indigo-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
            Benefits Management
          </h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Manage insurance benefits and their coverage details
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search benefits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg transition-colors"
            style={{
              backgroundColor: '#3b3b3b',
              color: '#ffffff',
              borderColor: '#4a4a4a'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#606060';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#4a4a4a';
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg transition-colors"
          style={{
            backgroundColor: '#3b3b3b',
            color: '#ffffff',
            borderColor: '#4a4a4a'
          }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select
          value={patientTypeFilter}
          onChange={(e) => setPatientTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg transition-colors"
          style={{
            backgroundColor: '#3b3b3b',
            color: '#ffffff',
            borderColor: '#4a4a4a'
          }}
        >
          <option value="">All Types</option>
          <option value="INPATIENT">Inpatient</option>
          <option value="OUTPATIENT">Outpatient</option>
          <option value="BOTH">Both</option>
        </select>
        <button
          onClick={loadBenefits}
          className="p-2 rounded-lg transition-colors"
          style={{ color: '#9ca3af' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3b3b3b';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={handleCreate}
          className="p-2 rounded-lg transition-colors"
          style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
          title="Add Benefit"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Benefits List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
        {benefits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Plus className="w-8 h-8" style={{ color: '#9ca3af' }} />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>
              No benefits found
            </h3>
            <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
              {searchTerm || statusFilter || patientTypeFilter ? 'Try adjusting your filters' : 'Get started by creating your first benefit'}
            </p>
            {!searchTerm && !statusFilter && !patientTypeFilter && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                Create Benefit
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#1f1f1f' }}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Benefit Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Limit Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#4a4a4a' }}>
                {benefits.map((benefit) => (
                  <tr key={benefit.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
                        {benefit.benefit_name}
                      </div>
                      <div className="text-xs max-w-xs truncate" style={{ color: '#9ca3af' }}>
                        {benefit.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPatientTypeColor(benefit.in_or_out_patient)}`}>
                        {getPatientTypeIcon(benefit.in_or_out_patient)}
                        {benefit.in_or_out_patient}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" style={{ color: '#9ca3af' }} />
                        <span className="text-sm" style={{ color: '#d1d5db' }}>
                          {benefit.plan_detail?.plan_name || 'No plan'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#d1d5db' }}>
                      {benefit.limit_amount ? formatCurrency(benefit.limit_amount) : 'No limit'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(benefit.status)}`}>
                        {getStatusIcon(benefit.status)}
                        {benefit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#9ca3af' }}>
                      {new Date(benefit.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === benefit.id ? null : benefit.id)}
                          className="p-1 rounded-lg transition-colors"
                          style={{ color: '#9ca3af' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b3b3b';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#9ca3af';
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {openDropdown === benefit.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10" style={{ backgroundColor: '#2a2a2a', border: '1px solid #4a4a4a' }}>
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleView(benefit);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                                style={{ color: '#d1d5db' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  handleEdit(benefit);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                                style={{ color: '#d1d5db' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              {benefit.status === 'ACTIVE' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(benefit, 'deactivate');
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                                  style={{ color: '#d1d5db' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#3b3b3b';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Deactivate
                                </button>
                              )}
                              {benefit.status === 'INACTIVE' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(benefit, 'activate');
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                                  style={{ color: '#d1d5db' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#3b3b3b';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleDelete(benefit);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                                style={{ color: '#ef4444' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <BenefitForm
          benefit={selectedBenefit}
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSave={handleFormSave}
        />
      )}

      {showDetails && selectedBenefit && (
        <BenefitDetails
          benefit={selectedBenefit}
          isOpen={showDetails}
          onClose={handleDetailsClose}
          onEdit={handleEdit}
        />
      )}

      <StatusChangeDialog
        isOpen={statusDialog.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        company={statusDialog.benefit as any}
        actionType={statusDialog.actionType || 'activate'}
        loading={statusDialog.loading}
      />
    </div>
  );
};
