import React from 'react';
import { 
  Shield, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  PieChart,
  Activity,
  Calendar,
  Users
} from 'lucide-react';
import type { SchemeStatistics } from '../../types/schemes';

interface SchemeAnalyticsProps {
  statistics: SchemeStatistics | null;
}

export const SchemeAnalytics: React.FC<SchemeAnalyticsProps> = ({ statistics }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Total Schemes</p>
              <p className="text-3xl font-bold" style={{ color: '#ffffff' }}>
                {statistics.total_schemes}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Shield className="w-6 h-6" style={{ color: '#d1d5db' }} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Active Schemes</p>
              <p className="text-3xl font-bold text-green-400">
                {statistics.active_schemes}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Inactive Schemes</p>
              <p className="text-3xl font-bold text-red-400">
                {statistics.inactive_schemes}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Activity className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Suspended Schemes</p>
              <p className="text-3xl font-bold text-amber-400">
                {statistics.suspended_schemes}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6" style={{ color: '#9ca3af' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Total Coverage Amount</h3>
          </div>
          <div className="text-3xl font-bold" style={{ color: '#ffffff' }}>
            {formatCurrency(statistics.total_coverage_amount)}
          </div>
          <p className="text-sm mt-2" style={{ color: '#9ca3af' }}>
            Combined coverage across all schemes
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="w-6 h-6" style={{ color: '#9ca3af' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Average Coverage</h3>
          </div>
          <div className="text-3xl font-bold" style={{ color: '#ffffff' }}>
            {formatCurrency(statistics.average_coverage_amount)}
          </div>
          <p className="text-sm mt-2" style={{ color: '#9ca3af' }}>
            Average coverage per scheme
          </p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
        <h3 className="text-lg font-semibold mb-6" style={{ color: '#ffffff' }}>Scheme Status Distribution</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>Active</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ 
                    width: `${statistics.total_schemes > 0 ? (statistics.active_schemes / statistics.total_schemes) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {statistics.active_schemes}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>Inactive</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-400 h-2 rounded-full" 
                  style={{ 
                    width: `${statistics.total_schemes > 0 ? (statistics.inactive_schemes / statistics.total_schemes) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {statistics.inactive_schemes}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>Suspended</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-amber-400 h-2 rounded-full" 
                  style={{ 
                    width: `${statistics.total_schemes > 0 ? (statistics.suspended_schemes / statistics.total_schemes) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {statistics.suspended_schemes}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5" style={{ color: '#9ca3af' }} />
            <h4 className="font-medium" style={{ color: '#ffffff' }}>Active Rate</h4>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
            {statistics.total_schemes > 0 
              ? `${((statistics.active_schemes / statistics.total_schemes) * 100).toFixed(1)}%`
              : '0%'
            }
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5" style={{ color: '#9ca3af' }} />
            <h4 className="font-medium" style={{ color: '#ffffff' }}>Coverage Efficiency</h4>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
            {statistics.total_schemes > 0 
              ? `${(statistics.total_coverage_amount / statistics.total_schemes / 1000000).toFixed(1)}M`
              : '0M'
            }
          </div>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>UGX per scheme</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5" style={{ color: '#9ca3af' }} />
            <h4 className="font-medium" style={{ color: '#ffffff' }}>Status Health</h4>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
            {statistics.total_schemes > 0 
              ? `${((statistics.active_schemes / statistics.total_schemes) * 100).toFixed(0)}/100`
              : '0/100'
            }
          </div>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Health Score</p>
        </div>
      </div>
    </div>
  );
};
