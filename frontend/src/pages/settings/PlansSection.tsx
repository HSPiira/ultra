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
  RefreshCw
} from 'lucide-react';
import { plansApi } from '../../services/plans';
import type { Plan } from '../../types/plans';
import { PlanForm } from './PlanForm';
import { PlanDetails } from './PlanDetails';
import { StatusChangeDialog, type StatusChangeType } from '../../components/common/StatusChangeDialog';

export const PlansSection: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    plan: Plan | null;
    actionType: StatusChangeType | null;
    loading: boolean;
  }>({
    isOpen: false,
    plan: null,
    actionType: null,
    loading: false
  });

  useEffect(() => {
    loadPlans();
  }, [searchTerm, statusFilter]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await plansApi.getPlans({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        ordering: 'plan_name'
      });
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setShowForm(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handleView = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowDetails(true);
  };

  const handleDelete = (plan: Plan) => {
    setSelectedPlan(plan);
    setStatusDialog({
      isOpen: true,
      plan,
      actionType: 'delete',
      loading: false
    });
  };

  const handleStatusChange = (plan: Plan, action: StatusChangeType) => {
    setSelectedPlan(plan);
    setStatusDialog({
      isOpen: true,
      plan,
      actionType: action,
      loading: false
    });
  };

  const handleDialogClose = () => {
    setStatusDialog({
      isOpen: false,
      plan: null,
      actionType: null,
      loading: false
    });
  };

  const handleDialogConfirm = async (reason?: string) => {
    if (!statusDialog.plan || !statusDialog.actionType) return;

    try {
      setStatusDialog(prev => ({ ...prev, loading: true }));

      switch (statusDialog.actionType) {
        case 'activate':
          await plansApi.activatePlan(statusDialog.plan.id);
          break;
        case 'deactivate':
          await plansApi.deactivatePlan(statusDialog.plan.id);
          break;
        case 'suspend':
          await plansApi.suspendPlan(statusDialog.plan.id);
          break;
        case 'delete':
          await plansApi.deletePlan(statusDialog.plan.id);
          break;
      }

      await loadPlans();
      handleDialogClose();
    } catch (error) {
      console.error('Error updating plan status:', error);
    } finally {
      setStatusDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFormSave = async () => {
    setShowForm(false);
    setSelectedPlan(null);
    await loadPlans();
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedPlan(null);
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
            Plans Management
          </h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Manage insurance plans and their configurations
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search plans..."
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
        <button
          onClick={loadPlans}
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
          title="Add Plan"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Plans List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Plus className="w-8 h-8" style={{ color: '#9ca3af' }} />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>
              No plans found
            </h3>
            <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Get started by creating your first plan'}
            </p>
            {!searchTerm && !statusFilter && (
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
                Create Plan
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#1f1f1f' }}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
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
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
                        {plan.plan_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm max-w-xs truncate" style={{ color: '#d1d5db' }}>
                        {plan.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                        {getStatusIcon(plan.status)}
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#9ca3af' }}>
                      {new Date(plan.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === plan.id ? null : plan.id)}
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
                        
                        {openDropdown === plan.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10" style={{ backgroundColor: '#2a2a2a', border: '1px solid #4a4a4a' }}>
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleView(plan);
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
                                  handleEdit(plan);
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
                              {plan.status === 'ACTIVE' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(plan, 'deactivate');
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
                              {plan.status === 'INACTIVE' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(plan, 'activate');
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
                                  handleDelete(plan);
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
        <PlanForm
          plan={selectedPlan}
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSave={handleFormSave}
        />
      )}

      {showDetails && selectedPlan && (
        <PlanDetails
          plan={selectedPlan}
          isOpen={showDetails}
          onClose={handleDetailsClose}
          onEdit={handleEdit}
        />
      )}

      <StatusChangeDialog
        isOpen={statusDialog.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        company={statusDialog.plan as any}
        actionType={statusDialog.actionType || 'activate'}
        loading={statusDialog.loading}
      />
    </div>
  );
};
