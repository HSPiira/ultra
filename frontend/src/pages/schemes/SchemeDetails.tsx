import React from 'react';
import { X, Shield, Building2, Calendar, DollarSign, Users, Edit } from 'lucide-react';
import type { Scheme } from '../../types/schemes';

interface SchemeDetailsProps {
  scheme: Scheme | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (scheme: Scheme) => void;
}

export const SchemeDetails: React.FC<SchemeDetailsProps> = ({
  scheme,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen || !scheme) return null;

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
      month: 'long',
      day: 'numeric'
    });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: '#4a4a4a' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Shield className="w-6 h-6" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: '#ffffff' }}>
                {scheme.scheme_name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scheme.status)}`}>
                  {scheme.status}
                </span>
                <span className="text-sm" style={{ color: '#9ca3af' }}>
                  {scheme.card_code}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(scheme)}
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
              title="Edit Scheme"
            >
              <Edit className="w-5 h-5" />
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
          <div className="p-6 space-y-8">
          {/* Company Information */}
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: '#ffffff' }}>Company Information</h3>
            <div className="bg-gray-800 rounded-lg p-4" style={{ backgroundColor: '#2a2a2a' }}>
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-5 h-5" style={{ color: '#9ca3af' }} />
                <h4 className="font-medium" style={{ color: '#ffffff' }}>
                  {scheme.company_detail.company_name}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Contact Person:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>
                    {scheme.company_detail.contact_person}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>
                    {scheme.company_detail.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheme Details */}
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: '#ffffff' }}>Scheme Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4" style={{ backgroundColor: '#2a2a2a' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>Coverage Amount</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                    {formatCurrency(scheme.limit_amount)}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4" style={{ backgroundColor: '#2a2a2a' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>Family Applicable</span>
                  </div>
                  <div className="text-lg" style={{ color: scheme.family_applicable ? '#10b981' : '#ef4444' }}>
                    {scheme.family_applicable ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4" style={{ backgroundColor: '#2a2a2a' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>Validity Period</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-400">Start:</span>
                      <span className="ml-2" style={{ color: '#d1d5db' }}>
                        {formatDate(scheme.start_date)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">End:</span>
                      <span className="ml-2" style={{ color: '#d1d5db' }}>
                        {formatDate(scheme.end_date)}
                      </span>
                    </div>
                    {scheme.termination_date && (
                      <div className="text-sm">
                        <span className="text-gray-400">Termination:</span>
                        <span className="ml-2" style={{ color: '#d1d5db' }}>
                          {formatDate(scheme.termination_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {scheme.description && (
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#ffffff' }}>Description</h3>
              <div className="bg-gray-800 rounded-lg p-4" style={{ backgroundColor: '#2a2a2a' }}>
                <p className="text-sm" style={{ color: '#d1d5db' }}>
                  {scheme.description}
                </p>
              </div>
            </div>
          )}

          {/* Remarks */}
          {scheme.remark && (
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#ffffff' }}>Remarks</h3>
              <div className="bg-gray-800 rounded-lg p-4" style={{ backgroundColor: '#2a2a2a' }}>
                <p className="text-sm" style={{ color: '#d1d5db' }}>
                  {scheme.remark}
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: '#ffffff' }}>Metadata</h3>
            <div className="bg-gray-800 rounded-lg p-4" style={{ backgroundColor: '#2a2a2a' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Created:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>
                    {formatDate(scheme.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>
                    {formatDate(scheme.updated_at)}
                  </span>
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
