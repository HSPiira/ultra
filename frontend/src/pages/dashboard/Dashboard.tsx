import React from 'react';
import { useThemeStyles } from '../../hooks';
import { Skeleton } from '../../components/common';
import { TrendingUp, Users, FileText, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { colors, getCardStyles, getPageStyles } = useThemeStyles();
  
  return (
    <div className="h-full flex flex-col" style={getPageStyles()}>
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Claims Card */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <FileText className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Total Claims</p>
            <div className="flex items-baseline gap-2">
              <Skeleton height={32} width={80} rounded />
              <Skeleton height={16} width={60} className="mt-2" />
            </div>
          </div>
        </div>

        {/* Active Members Card */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Users className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Active Members</p>
            <div className="flex items-baseline gap-2">
              <Skeleton height={32} width={80} rounded />
              <Skeleton height={16} width={60} className="mt-2" />
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <TrendingUp className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Revenue</p>
            <div className="flex items-baseline gap-2">
              <Skeleton height={32} width={100} rounded />
              <Skeleton height={16} width={60} className="mt-2" />
            </div>
          </div>
        </div>

        {/* Activity Card */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Activity className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Recent Activity</p>
            <div className="flex items-baseline gap-2">
              <Skeleton height={32} width={80} rounded />
              <Skeleton height={16} width={60} className="mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-lg p-6 border" style={getCardStyles()}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Recent Claims</h3>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton height={16} width="60%" rounded />
                  <Skeleton height={12} width="40%" rounded />
                </div>
                <Skeleton height={24} width={80} rounded />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Quick Actions</h3>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton width={40} height={40} rounded />
                <div className="flex-1 space-y-1">
                  <Skeleton height={14} width="80%" rounded />
                  <Skeleton height={12} width="60%" rounded />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
