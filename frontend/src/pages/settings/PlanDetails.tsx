import React from 'react';
import { X, Shield, Calendar, Edit } from 'lucide-react';
import type { Plan } from '../../types/plans';

interface PlanDetailsProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (plan: Plan) => void;
}

export const PlanDetails: React.FC<PlanDetailsProps> = ({
  plan,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: '#4a4a4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Shield className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                Plan Details
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                View plan information and details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(plan)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
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
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Plan Name
                  </label>
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <p className="text-sm" style={{ color: '#ffffff' }}>{plan.plan_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Status
                  </label>
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Description
                </label>
                <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                  <p className="text-sm" style={{ color: '#ffffff' }}>
                    {plan.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>Timestamps</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Created At
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <p className="text-sm" style={{ color: '#ffffff' }}>
                      {formatDate(plan.created_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Last Updated
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <p className="text-sm" style={{ color: '#ffffff' }}>
                      {formatDate(plan.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
