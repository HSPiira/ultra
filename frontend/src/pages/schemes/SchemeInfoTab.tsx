import React from 'react';
import { 
  Shield, 
  Building2, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import type { Scheme } from '../../types/schemes';

interface SchemeInfoTabProps {
  scheme: Scheme;
}

export const SchemeInfoTab: React.FC<SchemeInfoTabProps> = ({ scheme }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-900';
      case 'INACTIVE':
        return 'text-red-400 bg-red-900';
      case 'SUSPENDED':
        return 'text-amber-400 bg-amber-900';
      default:
        return 'text-gray-400 bg-gray-900';
    }
  };

  const getDaysTillExpiry = (endDate?: string | null) => {
    if (!endDate) return Infinity;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (endDate?: string | null) => {
    const days = getDaysTillExpiry(endDate);
    if (!Number.isFinite(days)) {
      return { status: 'unknown', color: 'text-gray-400', bgColor: 'bg-gray-700' };
    }
    if (days < 0) return { status: 'expired', color: 'text-red-400', bgColor: 'bg-red-900' };
    if (days <= 30) return { status: 'expiring', color: 'text-amber-400', bgColor: 'bg-amber-900' };
    if (days <= 90) return { status: 'warning', color: 'text-yellow-400', bgColor: 'bg-yellow-900' };
    return { status: 'active', color: 'text-green-400', bgColor: 'bg-green-900' };
  };

  const currentPeriod = scheme.current_period;
  const coverageAmount = currentPeriod ? Number(currentPeriod.limit_amount) : null;
  const expiryStatus = getExpiryStatus(currentPeriod?.end_date || null);
  const daysLeft = getDaysTillExpiry(currentPeriod?.end_date || null);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
            <Shield className="w-4 h-4" style={{ color: '#d1d5db' }} />
          </div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Scheme Name
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <p className="text-sm" style={{ color: '#ffffff' }}>{scheme.scheme_name}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Card Code
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <p className="text-sm font-mono" style={{ color: '#ffffff' }}>{scheme.card_code}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Company
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <p className="text-sm" style={{ color: '#ffffff' }}>{scheme.company_detail.company_name}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Status
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scheme.status)}`}>
                {scheme.status}
              </span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Description
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <p className="text-sm" style={{ color: '#ffffff' }}>
                {scheme.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
            <DollarSign className="w-4 h-4" style={{ color: '#d1d5db' }} />
          </div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Financial Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Coverage Amount
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                {coverageAmount ? formatCurrency(coverageAmount) : '—'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Family Applicable
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: scheme.family_applicable ? '#10b981' : '#6b7280' }} />
                <span className="text-sm" style={{ color: '#ffffff' }}>
                  {scheme.family_applicable ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dates & Timeline */}
      <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
            <Calendar className="w-4 h-4" style={{ color: '#d1d5db' }} />
          </div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Dates & Timeline</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Start Date
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <p className="text-sm" style={{ color: '#ffffff' }}>
                {currentPeriod ? formatDate(currentPeriod.start_date) : '—'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              End Date
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <p className="text-sm" style={{ color: '#ffffff' }}>
                {currentPeriod ? formatDate(currentPeriod.end_date) : '—'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Days Remaining
            </label>
            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${expiryStatus.bgColor}`}></div>
                <span className={`text-sm font-medium ${expiryStatus.color}`}>
                  {!Number.isFinite(daysLeft)
                    ? '—'
                    : daysLeft < 0
                    ? 'Expired'
                    : `${daysLeft} days`}
                </span>
              </div>
            </div>
          </div>

          {currentPeriod?.termination_date && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Termination Date
              </label>
              <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                <p className="text-sm" style={{ color: '#ffffff' }}>
                  {formatDate(currentPeriod.termination_date)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      {(scheme.remark || scheme.description) && (
        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <FileText className="w-4 h-4" style={{ color: '#d1d5db' }} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Additional Information</h2>
          </div>

          {scheme.remark && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Remarks
              </label>
              <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
                <p className="text-sm" style={{ color: '#ffffff' }}>{scheme.remark}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expiry Warning */}
      {Number.isFinite(daysLeft) && daysLeft <= 30 && daysLeft >= 0 && (
        <div className="bg-amber-900 border border-amber-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-medium text-amber-200">Scheme Expiring Soon</h3>
              <p className="text-xs text-amber-300 mt-1">
                This scheme expires in {daysLeft} days. Consider renewing or updating the end date.
              </p>
            </div>
          </div>
        </div>
      )}

      {Number.isFinite(daysLeft) && daysLeft < 0 && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-sm font-medium text-red-200">Scheme Expired</h3>
              <p className="text-xs text-red-300 mt-1">
                This scheme expired {Math.abs(daysLeft)} days ago. Please review and update if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
