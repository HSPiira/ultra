import React from 'react';
import { useThemeStyles } from '../../hooks';
import { Skeleton } from '../../components/common';
import { TrendingUp, TrendingDown, Activity, Users } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { colors, getCardStyles, getPageStyles } = useThemeStyles();
  
  return (
    <div className="h-full flex flex-col" style={getPageStyles()}>
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <TrendingUp className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Total Revenue</p>
            <div className="flex items-baseline gap-2">
              <Skeleton height={32} width={100} rounded />
              <Skeleton height={16} width={40} className="mt-2" rounded />
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Users className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Active Users</p>
            <div className="flex items-baseline gap-2">
              <Skeleton height={32} width={80} rounded />
              <Skeleton height={16} width={40} className="mt-2" rounded />
            </div>
          </div>
        </div>

        {/* Growth Rate */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Activity className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Growth Rate</p>
            <div className="flex items-baseline gap-2">
              <Skeleton height={32} width={60} rounded />
              <Skeleton height={16} width={40} className="mt-2" rounded />
            </div>
          </div>
        </div>

        {/* Conversion */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <TrendingDown className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Conversion</p>
            <div className="flex items-baseline gap-2">
              <Skeleton height={32} width={60} rounded />
              <Skeleton height={16} width={40} className="mt-2" rounded />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Revenue Overview</h3>
            <Skeleton height={24} width={100} rounded />
          </div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton height={12} width="10%" rounded />
                <Skeleton height={20} width={`${60 + Math.random() * 20}%`} rounded />
                <Skeleton height={16} width="15%" rounded />
              </div>
            ))}
          </div>
        </div>

        {/* Usage Chart */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Usage Statistics</h3>
            <Skeleton height={24} width={100} rounded />
          </div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton height={14} width="40%" rounded />
                  <Skeleton height={14} width="20%" rounded />
                </div>
                <Skeleton height={12} width={`${50 + Math.random() * 40}%`} rounded />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="rounded-lg p-6 border" style={getCardStyles()}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton height={18} width="60%" rounded />
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton height={14} width="70%" rounded />
                      <Skeleton height={12} width="50%" className="mt-1" rounded />
                    </div>
                    <Skeleton height={20} width={50} rounded />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
