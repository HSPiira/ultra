import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Plus,
  Grid3X3,
  List,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Search
} from 'lucide-react';
import { CompaniesList } from './CompaniesList';
import { CompanyForm } from './CompanyForm';
import { CompanyDetails } from './CompanyDetails';
import { CompanyAnalytics } from './CompanyAnalytics';
import { companiesApi } from '../../services/companies';
import type { Company, CompanyStatistics } from '../../types/companies';

type ViewMode = 'list' | 'grid';
type TabType = 'companies' | 'analytics';

const CompaniesPage: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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
    setSelectedCompany(company);
    setIsDetailsOpen(true);
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

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedCompany(null);
  };

  const refreshData = () => {
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header with Statistics */}
      <div className="px-6 py-1" style={{ backgroundColor: '#2a2a2a' }}>

        {/* Statistics Row */}
        {statistics && !loading && (
          <div className="flex items-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: '#d1d5db' }} />
              <span className="text-sm" style={{ color: '#9ca3af' }}>Total Companies</span>
              <span className="text-lg font-semibold" style={{ color: '#ffffff' }}>{statistics.total_companies}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#10b981' }} />
              <span className="text-sm" style={{ color: '#9ca3af' }}>Active</span>
              <span className="text-lg font-semibold" style={{ color: '#10b981' }}>{statistics.active_companies}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#ef4444' }} />
              <span className="text-sm" style={{ color: '#9ca3af' }}>Inactive</span>
              <span className="text-lg font-semibold" style={{ color: '#ef4444' }}>{statistics.inactive_companies}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <span className="text-sm" style={{ color: '#9ca3af' }}>Suspended</span>
              <span className="text-lg font-semibold" style={{ color: '#f59e0b' }}>{statistics.suspended_companies}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs with Actions */}
      <div className="border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('companies')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'companies'
                    ? 'border-b-2'
                    : 'border-b-2'
                }`}
                style={{
                  borderBottomColor: activeTab === 'companies' ? '#9ca3af' : 'transparent',
                  color: activeTab === 'companies' ? '#d1d5db' : '#9ca3af'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'companies') {
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'companies') {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                Companies
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-b-2'
                    : 'border-b-2'
                }`}
                style={{
                  borderBottomColor: activeTab === 'analytics' ? '#9ca3af' : 'transparent',
                  color: activeTab === 'analytics' ? '#d1d5db' : '#9ca3af'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'analytics') {
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'analytics') {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                Analytics
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleAddCompany}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                }}
                title="Add Company"
              >
                <Plus className="w-4 h-4" />
              </button>
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

      <CompanyDetails
        company={selectedCompany}
        isOpen={isDetailsOpen}
        onClose={handleDetailsClose}
        onEdit={handleCompanyEdit}
      />
    </div>
  );
};

export default CompaniesPage;
