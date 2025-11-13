import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Shield,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import type { Scheme } from '../../types/schemes';

interface SchemeAnalyticsTabProps {
  scheme: Scheme;
}

interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  totalClaims: number;
  totalClaimAmount: number;
  averageClaimAmount: number;
  monthlyTrends: MonthlyTrend[];
  claimTypes: ClaimTypeData[];
  memberGrowth: MemberGrowthData[];
}

interface MonthlyTrend {
  month: string;
  claims: number;
  amount: number;
}

interface ClaimTypeData {
  type: string;
  count: number;
  amount: number;
  percentage: number;
}

interface MemberGrowthData {
  month: string;
  newMembers: number;
  totalMembers: number;
}

export const SchemeAnalyticsTab: React.FC<SchemeAnalyticsTabProps> = ({ scheme }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockAnalytics: AnalyticsData = {
        totalMembers: 1250,
        activeMembers: 1180,
        suspendedMembers: 70,
        totalClaims: 3420,
        totalClaimAmount: 125000000,
        averageClaimAmount: 36549,
        monthlyTrends: [
          { month: 'Jan', claims: 280, amount: 10200000 },
          { month: 'Feb', claims: 320, amount: 11800000 },
          { month: 'Mar', claims: 290, amount: 10800000 },
          { month: 'Apr', claims: 350, amount: 13200000 },
          { month: 'May', claims: 380, amount: 14500000 },
          { month: 'Jun', claims: 420, amount: 15800000 }
        ],
        claimTypes: [
          { type: 'Medical', count: 2100, amount: 75000000, percentage: 60 },
          { type: 'Dental', count: 650, amount: 25000000, percentage: 20 },
          { type: 'Vision', count: 420, amount: 15000000, percentage: 12 },
          { type: 'Emergency', count: 250, amount: 10000000, percentage: 8 }
        ],
        memberGrowth: [
          { month: 'Jan', newMembers: 45, totalMembers: 1205 },
          { month: 'Feb', newMembers: 38, totalMembers: 1243 },
          { month: 'Mar', newMembers: 52, totalMembers: 1295 },
          { month: 'Apr', newMembers: 41, totalMembers: 1336 },
          { month: 'May', newMembers: 48, totalMembers: 1384 },
          { month: 'Jun', newMembers: 35, totalMembers: 1419 }
        ]
      };
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No Analytics Data</h3>
        <p className="text-sm" style={{ color: '#9ca3af' }}>
          Analytics data is not available for this scheme.
        </p>
      </div>
    );
  }

  const currentPeriod = scheme.current_period;
  const coverageAmount = currentPeriod ? Number(currentPeriod.limit_amount) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
            Scheme Analytics
          </h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Performance metrics and insights for {scheme.scheme_name}
          </p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
          className="px-3 py-2 rounded-lg border transition-colors"
          style={{ 
            backgroundColor: '#1f1f1f', 
            color: '#ffffff', 
            borderColor: '#4a4a4a' 
          }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Users className="w-4 h-4" style={{ color: '#3b82f6' }} />
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#d1d5db' }}>Total Members</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {formatNumber(analytics.totalMembers)}
          </div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            {analytics.activeMembers} active
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Activity className="w-4 h-4" style={{ color: '#10b981' }} />
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#d1d5db' }}>Total Claims</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {formatNumber(analytics.totalClaims)}
          </div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            This period
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <DollarSign className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#d1d5db' }}>Total Amount</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {formatCurrency(analytics.totalClaimAmount)}
          </div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            Claimed this period
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <TrendingUp className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#d1d5db' }}>Avg Claim</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {formatCurrency(analytics.averageClaimAmount)}
          </div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            Per claim
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <LineChart className="w-4 h-4" style={{ color: '#d1d5db' }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Monthly Trends</h3>
          </div>
          
          <div className="space-y-4">
            {analytics.monthlyTrends.map((trend, index) => (
              <div key={trend.month} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}>
                    {trend.month}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
                      {formatNumber(trend.claims)} claims
                    </div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>
                      {formatCurrency(trend.amount)}
                    </div>
                  </div>
                </div>
                <div className="w-24 h-2 rounded-full" style={{ backgroundColor: '#1f1f1f' }}>
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      backgroundColor: '#3b82f6',
                      width: `${(trend.claims / Math.max(...analytics.monthlyTrends.map(t => t.claims))) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Claim Types */}
        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <PieChart className="w-4 h-4" style={{ color: '#d1d5db' }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Claim Types</h3>
          </div>
          
          <div className="space-y-4">
            {analytics.claimTypes.map((type, index) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
              return (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
                        {type.type}
                      </div>
                      <div className="text-xs" style={{ color: '#9ca3af' }}>
                        {formatNumber(type.count)} claims
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
                      {formatCurrency(type.amount)}
                    </div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>
                      {type.percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Member Growth */}
      <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
            <TrendingUp className="w-4 h-4" style={{ color: '#d1d5db' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Member Growth</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.memberGrowth.map((growth) => (
            <div key={growth.month} className="p-4 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <div className="text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                {growth.month}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9ca3af' }}>New:</span>
                  <span style={{ color: '#10b981' }}>+{growth.newMembers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9ca3af' }}>Total:</span>
                  <span style={{ color: '#ffffff' }}>{formatNumber(growth.totalMembers)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Shield className="w-4 h-4" style={{ color: '#10b981' }} />
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#d1d5db' }}>Active Rate</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {((analytics.activeMembers / analytics.totalMembers) * 100).toFixed(1)}%
          </div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            Members are active
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Calendar className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#d1d5db' }}>Claims per Month</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {Math.round(analytics.totalClaims / 6)}
          </div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            Average monthly
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <DollarSign className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#d1d5db' }}>Utilization Rate</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {coverageAmount && coverageAmount > 0
              ? `${((analytics.totalClaimAmount / coverageAmount) * 100).toFixed(1)}%`
              : '—'}
          </div>
          <div className="text-sm" style={{ color: '#9ca3af' }}>
            Of coverage used
          </div>
        </div>
      </div>
    </div>
  );
};
