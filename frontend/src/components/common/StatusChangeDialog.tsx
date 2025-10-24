import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Trash2, Save } from 'lucide-react';
import type { Company } from '../../types/companies';

export type StatusChangeType = 'activate' | 'deactivate' | 'suspend' | 'delete';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  company: Company | null;
  actionType: StatusChangeType;
  loading?: boolean;
}

export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  company,
  actionType,
  loading = false
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !company) return null;

  const getActionDetails = () => {
    switch (actionType) {
      case 'activate':
        return {
          title: 'Activate Company',
          icon: <CheckCircle className="w-8 h-8 text-green-400" />,
          message: `Are you sure you want to activate "${company.company_name}"?`,
          description: 'This will make the company active and available for operations.',
          buttonText: 'Activate',
          buttonStyle: 'bg-green-600 hover:bg-green-700',
          requiresReason: false
        };
      case 'deactivate':
        return {
          title: 'Deactivate Company',
          icon: <XCircle className="w-8 h-8 text-red-400" />,
          message: `Are you sure you want to deactivate "${company.company_name}"?`,
          description: 'This will make the company inactive but keep it in the system.',
          buttonText: 'Deactivate',
          buttonStyle: 'bg-red-600 hover:bg-red-700',
          requiresReason: false
        };
      case 'suspend':
        return {
          title: 'Suspend Company',
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          message: `Are you sure you want to suspend "${company.company_name}"?`,
          description: 'Please provide a reason for suspending this company.',
          buttonText: 'Suspend',
          buttonStyle: 'bg-amber-600 hover:bg-amber-700',
          requiresReason: true
        };
      case 'delete':
        return {
          title: 'Delete Company Permanently',
          icon: <Trash2 className="w-8 h-8 text-red-400" />,
          message: `Are you sure you want to permanently delete "${company.company_name}"?`,
          description: 'This action cannot be undone. The company will be removed from the system.',
          buttonText: 'Delete Permanently',
          buttonStyle: 'bg-red-600 hover:bg-red-700',
          requiresReason: false
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="rounded-lg shadow-xl max-w-md w-full flex flex-col" style={{ backgroundColor: '#2a2a2a' }}>
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
            <div>
              <p className="text-base mb-4" style={{ color: '#ffffff' }}>
                {actionDetails.message}
              </p>
              
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
