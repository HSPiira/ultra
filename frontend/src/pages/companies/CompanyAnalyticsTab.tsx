import React from 'react';
import { TrendingUp, Users, CreditCard, Building2, Activity, DollarSign } from 'lucide-react';
import type { Company } from '../../types/companies';

interface CompanyAnalyticsTabProps {
  company: Company;
}

export const CompanyAnalyticsTab: React.FC<CompanyAnalyticsTabProps> = ({ company }) => {
  // Mock analytics data - in real app, this would come from API
  const analytics = {
    overview: {
      totalMembers: 225,
      activeSchemes: 3,
      totalPremium: 245000,
      monthlyClaims: 15
    },
    trends: {
      memberGrowth: 12.5,
      premiumGrowth: 8.3,
      claimsTrend: -5.2
    },
    schemes: [
      { name: 'Employee Health', members: 150, premium: 7500000 },
      { name: 'Family Medical', members: 75, premium: 5625000 },
      { name: 'Executive Health', members: 25, premium: 3000000 }
    ],
    recentActivity: [
      { action: 'New member joined', member: 'Alice Johnson', time: '2 hours ago' },
      { action: 'Claim submitted', member: 'Bob Wilson', amount: 45000, time: '4 hours ago' },
      { action: 'Scheme updated', member: 'HR Department', time: '1 day ago' },
      { action: 'Member activated', member: 'Carol Davis', time: '2 days ago' }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-lg border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Total Members</p>
              <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                {analytics.overview.totalMembers}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Users className="w-6 h-6" style={{ color: '#10b981' }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
            <span className="text-sm" style={{ color: '#10b981' }}>
              +{analytics.trends.memberGrowth}%
            </span>
          </div>
        </div>

        <div className="rounded-lg border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Active Schemes</p>
              <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                {analytics.overview.activeSchemes}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <CreditCard className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Total Premium</p>
              <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                {formatCurrency(analytics.overview.totalPremium)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <DollarSign className="w-6 h-6" style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
            <span className="text-sm" style={{ color: '#10b981' }}>
              +{analytics.trends.premiumGrowth}%
            </span>
          </div>
        </div>

        <div className="rounded-lg border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Monthly Claims</p>
              <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                {analytics.overview.monthlyClaims}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Activity className="w-6 h-6" style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: analytics.trends.claimsTrend < 0 ? '#ef4444' : '#10b981' }} />
            <span className="text-sm" style={{ color: analytics.trends.claimsTrend < 0 ? '#ef4444' : '#10b981' }}>
              {analytics.trends.claimsTrend > 0 ? '+' : ''}{analytics.trends.claimsTrend}%
            </span>
          </div>
        </div>
      </div>

      {/* Schemes Performance */}
      <div className="rounded-lg border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>Scheme Performance</h3>
        <div className="space-y-4">
          {analytics.schemes.map((scheme, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
                  <Building2 className="w-4 h-4" style={{ color: '#d1d5db' }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#ffffff' }}>{scheme.name}</p>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>{scheme.members} members</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold" style={{ color: '#ffffff' }}>
                  {formatCurrency(scheme.premium)}
                </p>
                <p className="text-sm" style={{ color: '#9ca3af' }}>Monthly Premium</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>Recent Activity</h3>
        <div className="space-y-3">
          {analytics.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
                <Activity className="w-4 h-4" style={{ color: '#d1d5db' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {activity.action}
                </p>
                <p className="text-sm" style={{ color: '#9ca3af' }}>
                  {activity.member} {activity.amount && `• ${formatCurrency(activity.amount)}`}
                </p>
              </div>
              <span className="text-sm" style={{ color: '#9ca3af' }}>
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
