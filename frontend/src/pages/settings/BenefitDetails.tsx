import React from 'react';
import { X, Heart, Activity, Calendar, Edit, DollarSign, FileText } from 'lucide-react';
import type { Benefit } from '../../types/benefits';

interface BenefitDetailsProps {
  benefit: Benefit;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (benefit: Benefit) => void;
}

export const BenefitDetails: React.FC<BenefitDetailsProps> = ({
  benefit,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xs"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    >
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: '#4a4a4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              {getPatientTypeIcon(benefit.in_or_out_patient)}
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                Benefit Details
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                View benefit information and coverage details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(benefit)}
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
                    Benefit Name
                  </label>
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <p className="text-sm" style={{ color: '#ffffff' }}>{benefit.benefit_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Status
                  </label>
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(benefit.status)}`}>
                      {benefit.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Patient Type
                  </label>
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPatientTypeColor(benefit.in_or_out_patient)}`}>
                      {getPatientTypeIcon(benefit.in_or_out_patient)}
                      {benefit.in_or_out_patient}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Limit Amount
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <DollarSign className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <p className="text-sm" style={{ color: '#ffffff' }}>
                      {benefit.limit_amount ? formatCurrency(benefit.limit_amount) : 'No limit set'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Plan
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                  <FileText className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <p className="text-sm" style={{ color: '#ffffff' }}>
                    {benefit.plan_detail?.plan_name || 'No plan assigned'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Description
                </label>
                <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                  <p className="text-sm" style={{ color: '#ffffff' }}>
                    {benefit.description || 'No description provided'}
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
                      {formatDate(benefit.created_at)}
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
                      {formatDate(benefit.updated_at)}
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
