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
    // Refresh statistics after deletion
    loadStatistics();
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsFormOpen(true);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
    // Refresh statistics after save
    loadStatistics();
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
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                }}
              >
                <Plus className="w-4 h-4" />
                Add Company
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'companies' && (
          <div>
            {/* View Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg p-1" style={{ backgroundColor: '#3b3b3b' }}>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors`}
                      style={{
                        backgroundColor: viewMode === 'list' ? '#4a4a4a' : 'transparent',
                        color: viewMode === 'list' ? '#ffffff' : '#9ca3af'
                      }}
                      onMouseEnter={(e) => {
                        if (viewMode !== 'list') {
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (viewMode !== 'list') {
                          e.currentTarget.style.color = '#9ca3af';
                        }
                      }}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors`}
                      style={{
                        backgroundColor: viewMode === 'grid' ? '#4a4a4a' : 'transparent',
                        color: viewMode === 'grid' ? '#ffffff' : '#9ca3af'
                      }}
                      onMouseEnter={(e) => {
                        if (viewMode !== 'grid') {
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (viewMode !== 'grid') {
                          e.currentTarget.style.color = '#9ca3af';
                        }
                      }}
                      title="Grid View"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    className="w-64 pl-10 pr-4 py-2 border rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: '#3b3b3b', 
                      color: '#ffffff',
                      borderColor: '#4a4a4a'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#5a5a5a';
                      e.target.style.boxShadow = '0 0 0 2px #5a5a5a';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#4a4a4a';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                <button 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border" 
                  style={{ 
                    color: '#9ca3af',
                    backgroundColor: '#3b3b3b',
                    borderColor: '#4a4a4a'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.backgroundColor = '#4a4a4a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.backgroundColor = '#3b3b3b';
                  }}
                  title="Filters"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
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
                  title="Export"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <CompaniesList
              onCompanySelect={handleCompanySelect}
              onCompanyEdit={handleCompanyEdit}
              onCompanyDelete={handleCompanyDelete}
              onAddCompany={handleAddCompany}
              viewMode={viewMode}
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
