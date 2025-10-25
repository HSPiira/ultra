import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Plus,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { CompaniesList } from './CompaniesList';
import { CompanyForm } from './CompanyForm';
import { CompanyAnalytics } from './CompanyAnalytics';
import { companiesApi } from '../../services/companies';
import type { Company, CompanyStatistics } from '../../types/companies';
import { useThemeStyles } from '../../hooks';
import { Tooltip } from '../../components/common';

type ViewMode = 'list' | 'grid';
type TabType = 'companies' | 'analytics';

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const { colors, getPageStyles, getTabStyles, getIconButtonStyles } = useThemeStyles();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<TabType>('companies');
  const [statistics, setStatistics] = useState<CompanyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await companiesApi.getCompanyStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    navigate(`/companies/${company.id}`);
  };

  const handleCompanyEdit = (company: Company) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  const handleCompanyDelete = (company: Company) => {
    console.log('Company deleted:', company);
    // Refresh statistics and companies list after deletion
    loadStatistics();
    setRefreshTrigger(prev => {
      const newValue = prev + 1;
      console.log('Incrementing refresh trigger from', prev, 'to', newValue);
      return newValue;
    });
  };

  const handleCompanyStatusChange = (company: Company) => {
    console.log('Company status changed:', company);
    // Refresh statistics and companies list after status change
    loadStatistics();
    setRefreshTrigger(prev => {
      const newValue = prev + 1;
      console.log('Incrementing refresh trigger from', prev, 'to', newValue);
      return newValue;
    });
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsFormOpen(true);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
    // Refresh statistics and companies list after save
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
  };


  const refreshData = () => {
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col" style={getPageStyles()}>
      {/* Header with Statistics */}
      <div className="px-6 py-1" style={{ backgroundColor: colors.background.secondary }}>

        {/* Statistics Row */}
        {statistics && !loading && (
          <div className="flex items-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: colors.text.secondary }} />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>Total Companies</span>
              <span className="text-lg font-semibold" style={{ color: colors.text.primary }}>{statistics.total_companies}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: colors.status.active }} />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>Active</span>
              <span className="text-lg font-semibold" style={{ color: colors.status.active }}>{statistics.active_companies}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: colors.status.inactive }} />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>Inactive</span>
              <span className="text-lg font-semibold" style={{ color: colors.status.inactive }}>{statistics.inactive_companies}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: colors.status.suspended }} />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>Suspended</span>
              <span className="text-lg font-semibold" style={{ color: colors.status.suspended }}>{statistics.suspended_companies}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs with Actions */}
      <div className="border-b" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary }}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('companies')}
                className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                style={getTabStyles(activeTab === 'companies')}
              >
                Companies
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                style={getTabStyles(activeTab === 'analytics')}
              >
                Analytics
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <Tooltip content="Refresh data and statistics">
                <button
                  onClick={refreshData}
                  className="p-2 rounded-lg transition-colors"
                  style={getIconButtonStyles()}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </Tooltip>
              
              <Tooltip content="Add new company">
                <button
                  onClick={handleAddCompany}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: colors.background.quaternary, color: colors.text.primary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.quaternary;
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'companies' && (
          <div>

            <CompaniesList
              onCompanySelect={handleCompanySelect}
              onCompanyEdit={handleCompanyEdit}
              onCompanyDelete={handleCompanyDelete}
              onCompanyStatusChange={handleCompanyStatusChange}
              onAddCompany={handleAddCompany}
              viewMode={viewMode}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <CompanyAnalytics statistics={statistics} />
        )}
      </div>

      {/* Modals */}
      <CompanyForm
        company={editingCompany || undefined}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />
    </div>
  );
};

export default CompaniesPage;
