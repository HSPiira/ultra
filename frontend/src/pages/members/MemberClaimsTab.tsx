import React, { useState, useEffect } from 'react';
import { FileText, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import type { Member } from '../../types/members';
import { useThemeStyles } from '../../hooks';
import { useNavigate } from 'react-router-dom';

interface MemberClaimsTabProps {
  member: Member;
}

interface Claim {
  id: string;
  claim_number: string;
  claim_date: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  provider?: string;
  description?: string;
}

export const MemberClaimsTab: React.FC<MemberClaimsTabProps> = ({ member }) => {
  const { colors } = useThemeStyles();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load claims from API when endpoint is available
    // For now, show empty state
    setLoading(false);
  }, [member.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return colors.status.success;
      case 'PENDING':
        return colors.status.warning;
      case 'REJECTED':
        return colors.status.error;
      case 'PAID':
        return colors.status.active;
      default:
        return colors.text.tertiary;
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.action.primary }}></div>
          <p style={{ color: colors.text.secondary }}>Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
          Claims ({claims.length})
        </h2>
      </div>

      {claims.length === 0 ? (
        <div className="rounded-lg border p-12" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary }}>
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: colors.text.tertiary }} />
            <p className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
              No Claims
            </p>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              This member has no claims recorded.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-lg border p-6"
              style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold" style={{ color: colors.text.primary }}>
                      {claim.claim_number}
                    </h3>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: getStatusColor(claim.status) + '20',
                        color: getStatusColor(claim.status)
                      }}
                    >
                      {claim.status}
                    </span>
                  </div>
                  
                  {claim.description && (
                    <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
                      {claim.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: colors.text.tertiary }} />
                      <span className="text-sm" style={{ color: colors.text.secondary }}>
                        {formatDate(claim.claim_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" style={{ color: colors.text.tertiary }} />
                      <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                        {formatCurrency(claim.amount)}
                      </span>
                    </div>
                    {claim.provider && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: colors.text.secondary }}>
                          Provider: {claim.provider}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/claims/${claim.id}`)}
                  className="ml-4 p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: colors.background.tertiary, color: colors.text.primary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.tertiary;
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

