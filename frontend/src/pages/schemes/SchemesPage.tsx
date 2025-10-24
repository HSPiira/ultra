import React, { useState, useEffect } from 'react';
import { 
  Shield, 
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
import { SchemesList } from './SchemesList';
import { SchemeForm } from './SchemeForm';
import { SchemeDetails } from './SchemeDetails';
import { SchemeAnalytics } from './SchemeAnalytics';
import { schemesApi } from '../../services/schemes';
import type { Scheme, SchemeStatistics } from '../../types/schemes';

type ViewMode = 'list' | 'grid';
type TabType = 'schemes' | 'analytics';

const SchemesPage: React.FC = () => {
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<TabType>('schemes');
  const [statistics, setStatistics] = useState<SchemeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await schemesApi.getSchemeStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchemeSelect = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setIsDetailsOpen(true);
  };

  const handleSchemeEdit = (scheme: Scheme) => {
    setEditingScheme(scheme);
    setIsFormOpen(true);
  };

  const handleSchemeDelete = (scheme: Scheme) => {
    console.log('Scheme deleted:', scheme);
    // Refresh statistics and schemes list after deletion
    loadStatistics();
    setRefreshTrigger(prev => {
      const newValue = prev + 1;
      console.log('Incrementing refresh trigger from', prev, 'to', newValue);
      return newValue;
    });
  };

  const handleSchemeStatusChange = (scheme: Scheme) => {
    console.log('Scheme status changed:', scheme);
    // Refresh statistics and schemes list after status change
    loadStatistics();
    setRefreshTrigger(prev => {
      const newValue = prev + 1;
      console.log('Incrementing refresh trigger from', prev, 'to', newValue);
      return newValue;
    });
  };

  const handleAddScheme = () => {
    setEditingScheme(null);
    setIsFormOpen(true);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingScheme(null);
    // Refresh statistics and schemes list after save
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingScheme(null);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedScheme(null);
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
              <Shield className="w-5 h-5" style={{ color: '#d1d5db' }} />
              <span className="text-sm" style={{ color: '#9ca3af' }}>Total Schemes</span>
              <span className="text-lg font-semibold" style={{ color: '#ffffff' }}>{statistics.total_schemes}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#10b981' }} />
              <span className="text-sm" style={{ color: '#9ca3af' }}>Active</span>
              <span className="text-lg font-semibold" style={{ color: '#10b981' }}>{statistics.active_schemes}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#ef4444' }} />
              <span className="text-sm" style={{ color: '#9ca3af' }}>Inactive</span>
              <span className="text-lg font-semibold" style={{ color: '#ef4444' }}>{statistics.inactive_schemes}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <span className="text-sm" style={{ color: '#9ca3af' }}>Suspended</span>
              <span className="text-lg font-semibold" style={{ color: '#f59e0b' }}>{statistics.suspended_schemes}</span>
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
                onClick={() => setActiveTab('schemes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'schemes'
                    ? 'border-b-2'
                    : 'border-b-2'
                }`}
                style={{
                  borderBottomColor: activeTab === 'schemes' ? '#9ca3af' : 'transparent',
                  color: activeTab === 'schemes' ? '#d1d5db' : '#9ca3af'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'schemes') {
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'schemes') {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                Schemes
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
                onClick={handleAddScheme}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                }}
                title="Add Scheme"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'schemes' && (
          <div>

            <SchemesList
              onSchemeSelect={handleSchemeSelect}
              onSchemeEdit={handleSchemeEdit}
              onSchemeDelete={handleSchemeDelete}
              onSchemeStatusChange={handleSchemeStatusChange}
              onAddScheme={handleAddScheme}
              viewMode={viewMode}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <SchemeAnalytics statistics={statistics} />
        )}
      </div>

      {/* Modals */}
      <SchemeForm
        scheme={editingScheme || undefined}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />

      <SchemeDetails
        scheme={selectedScheme}
        isOpen={isDetailsOpen}
        onClose={handleDetailsClose}
        onEdit={handleSchemeEdit}
      />
    </div>
  );
};

export default SchemesPage;
