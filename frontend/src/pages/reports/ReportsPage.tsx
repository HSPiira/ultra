import React from 'react';
import { useThemeStyles } from '../../hooks';
import { Skeleton } from '../../components/common';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const { colors, getCardStyles, getPageStyles } = useThemeStyles();
  
  return (
    <div className="h-full flex flex-col" style={getPageStyles()}>
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reports */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <FileText className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Total Reports</p>
            <Skeleton height={32} width={80} rounded />
          </div>
        </div>

        {/* This Month */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Calendar className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>This Month</p>
            <Skeleton height={32} width={80} rounded />
          </div>
        </div>

        {/* Downloads */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Download className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Downloads</p>
            <Skeleton height={32} width={80} rounded />
          </div>
        </div>

        {/* Generated */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <TrendingUp className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>Generated</p>
            <Skeleton height={32} width={80} rounded />
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Reports */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
              <Skeleton height={20} width="70%" rounded />
              <Skeleton height={14} width="50%" className="mt-2" rounded />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton height={14} width="80%" rounded />
                  <Skeleton height={12} width="60%" className="mt-1" rounded />
                </div>
                <Skeleton height={24} width={40} rounded />
              </div>
            ))}
          </div>
        </div>

        {/* Claims Reports */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
              <Skeleton height={20} width="65%" rounded />
              <Skeleton height={14} width="55%" className="mt-2" rounded />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton height={14} width="75%" rounded />
                  <Skeleton height={12} width="55%" className="mt-1" rounded />
                </div>
                <Skeleton height={24} width={40} rounded />
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Reports */}
        <div className="rounded-lg p-6 border" style={getCardStyles()}>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
              <Skeleton height={20} width="72%" rounded />
              <Skeleton height={14} width="58%" className="mt-2" rounded />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton height={14} width="70%" rounded />
                  <Skeleton height={12} width="50%" className="mt-1" rounded />
                </div>
                <Skeleton height={24} width={40} rounded />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-lg p-6 border" style={getCardStyles()}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Recent Reports</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b last:border-b-0" style={{ borderColor: colors.border.primary }}>
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1 space-y-1">
                <Skeleton height={16} width="40%" rounded />
                <Skeleton height={12} width="30%" rounded />
              </div>
              <Skeleton height={32} width={100} rounded />
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default ReportsPage;
