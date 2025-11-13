import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Trash2, Save, Shield } from 'lucide-react';
import type { Scheme } from '../../types/schemes';

export type SchemeStatusChangeType = 'activate' | 'deactivate' | 'suspend' | 'delete';

interface SchemeStatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  scheme: Scheme | null;
  actionType: SchemeStatusChangeType;
  loading?: boolean;
}

export const SchemeStatusChangeDialog: React.FC<SchemeStatusChangeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  scheme,
  actionType,
  loading = false
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !scheme) return null;

  const currentPeriod = scheme.current_period;

  const getDaysTillExpiry = (endDate?: string | null) => {
    if (!endDate) return Infinity;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getActionDetails = () => {
    const daysLeft = getDaysTillExpiry(currentPeriod?.end_date);
    const isExpired = daysLeft < 0;
    const isExpiringSoon = daysLeft <= 30 && daysLeft >= 0;

    switch (actionType) {
      case 'activate':
        return {
          title: 'Activate Scheme',
          icon: <CheckCircle className="w-8 h-8 text-green-400" />,
          message: `Are you sure you want to activate "${scheme.scheme_name}"?`,
          description: 'This will make the scheme active and available for new enrollments.',
          buttonText: 'Activate',
          buttonStyle: 'bg-green-600 hover:bg-green-700',
          requiresReason: false,
          warning: isExpired
            ? 'Warning: This scheme has already expired.'
            : isExpiringSoon
            ? `Warning: This scheme expires in ${daysLeft} days.`
            : null
        };
      case 'deactivate':
        return {
          title: 'Deactivate Scheme',
          icon: <XCircle className="w-8 h-8 text-red-400" />,
          message: `Are you sure you want to deactivate "${scheme.scheme_name}"?`,
          description: 'This will make the scheme inactive and prevent new enrollments.',
          buttonText: 'Deactivate',
          buttonStyle: 'bg-red-600 hover:bg-red-700',
          requiresReason: false,
          warning: null
        };
      case 'suspend':
        return {
          title: 'Suspend Scheme',
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          message: `Are you sure you want to suspend "${scheme.scheme_name}"?`,
          description: 'Please provide a reason for suspending this scheme.',
          buttonText: 'Suspend',
          buttonStyle: 'bg-amber-600 hover:bg-amber-700',
          requiresReason: true,
          warning: isExpired
            ? 'Warning: This scheme has already expired.'
            : isExpiringSoon
            ? `Warning: This scheme expires in ${daysLeft} days.`
            : null
        };
      case 'delete':
        return {
          title: 'Delete Scheme Permanently',
          icon: <Trash2 className="w-8 h-8 text-red-400" />,
          message: `Are you sure you want to permanently delete "${scheme.scheme_name}"?`,
          description: 'This action cannot be undone. The scheme will be removed from the system.',
          buttonText: 'Delete Permanently',
          buttonStyle: 'bg-red-600 hover:bg-red-700',
          requiresReason: false,
          warning: 'Warning: This action cannot be undone and will affect all associated data.'
        };
    }
  };

  const actionDetails = getActionDetails();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionDetails.requiresReason && !reason.trim()) {
      return;
    }
    onConfirm(actionDetails.requiresReason ? reason.trim() : undefined);
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="rounded-lg shadow-xl max-w-lg w-full flex flex-col" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <div className="flex items-center gap-3">
            {actionDetails.icon}
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {actionDetails.title}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {actionDetails.description}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#404040';
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

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Scheme Details */}
            <div className="bg-gray-800 rounded-lg p-4" style={{ backgroundColor: '#1f1f1f' }}>
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5" style={{ color: '#9ca3af' }} />
                <h3 className="font-medium" style={{ color: '#ffffff' }}>Scheme Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>{scheme.scheme_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Card Code:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>{scheme.card_code}</span>
                </div>
                <div>
                  <span className="text-gray-400">Company:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>{scheme.company_detail.company_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Coverage:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>
                    {currentPeriod
                      ? formatCurrency(Number(currentPeriod.limit_amount))
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Start Date:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>
                    {currentPeriod ? formatDate(currentPeriod.start_date) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">End Date:</span>
                  <span className="ml-2" style={{ color: '#d1d5db' }}>
                    {currentPeriod ? formatDate(currentPeriod.end_date) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-base mb-4" style={{ color: '#ffffff' }}>
                {actionDetails.message}
              </p>
              
              {actionDetails.warning && (
                <div className="bg-amber-900 border border-amber-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-200">{actionDetails.warning}</span>
                  </div>
                </div>
              )}
              
              {actionDetails.requiresReason && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Reason for suspension *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: '#404040'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#606060';
                      e.target.style.boxShadow = '0 0 0 2px rgba(96, 96, 96, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#404040';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Enter reason for suspension..."
                    required
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg transition-colors border text-sm"
            style={{
              backgroundColor: 'transparent',
              color: '#d1d5db',
              borderColor: '#404040'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#404040';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#d1d5db';
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (actionDetails.requiresReason && !reason.trim())}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm ${actionDetails.buttonStyle} text-white`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {actionDetails.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
