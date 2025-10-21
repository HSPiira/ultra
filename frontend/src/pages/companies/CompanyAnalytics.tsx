import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { companiesApi } from '../../services/companies';
import type { Company, CompanyStatistics } from '../../types/companies';

interface CompanyAnalyticsProps {
  statistics: CompanyStatistics | null;
}

export const CompanyAnalytics: React.FC<CompanyAnalyticsProps> = ({ statistics }) => {
  const [, setCompaniesByIndustry] = useState<Company[]>([]);
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [byIndustry, recent] = await Promise.all([
        companiesApi.getCompaniesByIndustry(),
        companiesApi.getCompaniesWithRecentActivity(30)
      ]);
      setCompaniesByIndustry(byIndustry);
      setRecentCompanies(recent);
    } catch (err) {
      console.error('Error loading analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIndustryStats = () => {
    if (!statistics?.companies_by_industry) return [];
    return statistics.companies_by_industry.map(item => ({
      name: item.industry_name,
      value: item.count,
      percentage: statistics.total_companies > 0 ? (item.count / statistics.total_companies) * 100 : 0
    }));
  };

  const industryStats = getIndustryStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="style={{ backgroundColor: '#3b3b3b' }} rounded-lg p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm style={{ color: '#9ca3af' }}">Growth Rate</p>
              <p className="text-2xl font-bold text-green-400">+12.5%</p>
              <p className="text-xs text-gray-500">vs last month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="style={{ backgroundColor: '#3b3b3b' }} rounded-lg p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm style={{ color: '#9ca3af' }}">Active Rate</p>
              <p className="text-2xl font-bold text-blue-400">
                {statistics ? ((statistics.active_companies / statistics.total_companies) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-gray-500">of total companies</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="style={{ backgroundColor: '#3b3b3b' }} rounded-lg p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm style={{ color: '#9ca3af' }}">Top Industry</p>
              <p className="text-lg font-bold style={{ color: '#ffffff' }}">
                {industryStats.length > 0 ? industryStats[0].name : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {industryStats.length > 0 ? `${industryStats[0].value} companies` : ''}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="style={{ backgroundColor: '#3b3b3b' }} rounded-lg p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm style={{ color: '#9ca3af' }}">New This Month</p>
              <p className="text-2xl font-bold text-yellow-400">
                {statistics?.recent_companies || 0}
              </p>
              <p className="text-xs text-gray-500">companies added</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <div className="style={{ backgroundColor: '#3b3b3b' }} rounded-lg p-6 border border-gray-600">
          <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Industry Distribution
          </h3>
          
          {industryStats.length > 0 ? (
            <div className="space-y-4">
              {industryStats.map((industry, index) => (
                <div key={industry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                      }}
                    />
                    <span className="style={{ color: '#ffffff' }} font-medium">{industry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="style={{ color: '#9ca3af' }}">{industry.value}</span>
                    <span className="text-sm text-gray-500">({industry.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <PieChart className="w-12 h-12 style={{ color: '#9ca3af' }} mx-auto mb-4" />
              <p className="style={{ color: '#9ca3af' }}">No industry data available</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="style={{ backgroundColor: '#3b3b3b' }} rounded-lg p-6 border border-gray-600">
          <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Companies
          </h3>
          
          {recentCompanies.length > 0 ? (
            <div className="space-y-4">
              {recentCompanies.slice(0, 5).map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="style={{ color: '#ffffff' }} font-medium">{company.company_name}</p>
                      <p className="text-sm style={{ color: '#9ca3af' }}">{company.industry_detail.industry_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm style={{ color: '#9ca3af' }}">
                      {new Date(company.created_at).toLocaleDateString()}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      company.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 style={{ color: '#9ca3af' }} mx-auto mb-4" />
              <p className="style={{ color: '#9ca3af' }}">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Trend Chart Placeholder */}
      <div className="style={{ backgroundColor: '#3b3b3b' }} rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Company Growth Trend
        </h3>
        
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 style={{ color: '#9ca3af' }} mx-auto mb-4" />
            <p className="style={{ color: '#9ca3af' }}">Chart visualization would go here</p>
            <p className="text-sm text-gray-500">Integration with chart library needed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="style={{ backgroundColor: '#3b3b3b' }} rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-6">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="w-5 h-5" />
              <span className="style={{ color: '#ffffff' }} font-medium">Export Data</span>
            </div>
          </button>
          
          <button className="p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5" />
              <span className="style={{ color: '#ffffff' }} font-medium">Add Company</span>
            </div>
          </button>
          
          <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <ArrowDownRight className="w-5 h-5" />
              <span className="style={{ color: '#ffffff' }} font-medium">Generate Report</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
