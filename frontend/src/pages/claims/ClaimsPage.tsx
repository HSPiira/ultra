import React, { useState, useEffect } from 'react';
import { useThemeStyles } from '../../hooks';
import { Skeleton } from '../../components/common';
import { FileText, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ClaimsStatistics {
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  totalAmount: number;
}

const ClaimsPage: React.FC = () => {
  const { colors, getCardStyles, getPageStyles } = useThemeStyles();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClaimsStatistics | null>(null);
  
  useEffect(() => {
    // Simulate API call - replace with actual API call
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats({
          totalClaims: 0,
          pendingClaims: 0,
          approvedClaims: 0,
          totalAmount: 0
        });
      } catch (err) {
        console.error('Error loading claims statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  const statCards = [
    { icon: FileText, label: 'Total Claims', width: 80, value: stats?.totalClaims },
    { icon: AlertCircle, label: 'Pending', width: 80, value: stats?.pendingClaims },
    { icon: CheckCircle, label: 'Approved', width: 80, value: stats?.approvedClaims },
    { icon: TrendingUp, label: 'Total Amount', width: 100, value: stats?.totalAmount, isAmount: true },
  ];
  
  return (
    <div className="h-full flex flex-col" style={getPageStyles()}>
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, width, value, isAmount }) => (
          <div key={label} className="rounded-lg p-6 border" style={getCardStyles()}>
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="circular" width={40} height={40} />
              <Icon className="w-5 h-5" style={{ color: colors.text.tertiary }} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>{label}</p>
              {loading ? (
                <Skeleton height={32} width={width} rounded />
              ) : (
                <span className="text-2xl font-semibold" style={{ color: colors.text.primary }}>
                  {isAmount ? `UGX ${value?.toLocaleString() || '0'}` : value?.toLocaleString() || '0'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Claims Table */}
      <div className="rounded-lg p-6 border" style={getCardStyles()}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Recent Claims</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: colors.border.primary }}>
                <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>Claim ID</th>
                <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>Date</th>
                <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>Member</th>
                <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>Amount</th>
                <th className="text-left p-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>Status</th>
                <th className="text-right p-3 text-sm font-semibold" style={{ color: colors.text.secondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-3"><Skeleton height={16} width="80%" rounded /></td>
                    <td className="p-3"><Skeleton height={16} width="90%" rounded /></td>
                    <td className="p-3"><Skeleton height={16} width="70%" rounded /></td>
                    <td className="p-3"><Skeleton height={16} width="75%" rounded /></td>
                    <td className="p-3"><Skeleton height={20} width={60} rounded /></td>
                    <td className="p-3 text-right"><Skeleton height={24} width={80} rounded /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center" style={{ color: colors.text.tertiary }}>
                    No claims data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default ClaimsPage;
