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
  RefreshCw
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
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <div className="border-b px-6 py-4" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#ffffff' }}>
              <Building2 className="w-8 h-8" style={{ color: '#d1d5db' }} />
              Companies
            </h1>
            <p className="mt-1" style={{ color: '#9ca3af' }}>Manage your company directory and analytics</p>
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

        {/* Statistics Cards */}
        {statistics && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="rounded-lg p-4 border" style={{ backgroundColor: '#3b3b3b', borderColor: '#4a4a4a' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Companies</p>
                  <p className="text-2xl font-bold text-white">{statistics.total_companies}</p>
                </div>
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            
            <div className="rounded-lg p-4 border" style={{ backgroundColor: '#3b3b3b', borderColor: '#4a4a4a' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Companies</p>
                  <p className="text-2xl font-bold text-green-400">{statistics.active_companies}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="rounded-lg p-4 border" style={{ backgroundColor: '#3b3b3b', borderColor: '#4a4a4a' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Inactive Companies</p>
                  <p className="text-2xl font-bold text-red-400">{statistics.inactive_companies}</p>
                </div>
                <Users className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className="rounded-lg p-4 border" style={{ backgroundColor: '#3b3b3b', borderColor: '#4a4a4a' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Recent Additions</p>
                  <p className="text-2xl font-bold text-yellow-400">{statistics.recent_companies}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="px-6">
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
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'companies' && (
          <div className="space-y-6">
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#9ca3af' }}>View:</span>
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
                  title="Advanced Filters"
                >
                  <Filter className="w-4 h-4" />
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
