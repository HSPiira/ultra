import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Plus,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { SchemesList } from './SchemesList';
import { SchemeForm } from './SchemeForm';
import { SchemeAnalytics } from './SchemeAnalytics';
import { schemesApi } from '../../services/schemes';
import type { Scheme, SchemeStatistics } from '../../types/schemes';
import { useThemeStyles } from '../../hooks';
import { Tooltip } from '../../components/common';

type ViewMode = 'list' | 'grid';
type TabType = 'schemes' | 'analytics';

const SchemesPage: React.FC = () => {
  const navigate = useNavigate();
  const { colors, getPageStyles, getTabProps, getIconButtonProps } = useThemeStyles();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [viewMode] = useState<ViewMode>('list');
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
    navigate(`/schemes/${scheme.id}`);
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


  const refreshData = () => {
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col" style={getPageStyles()}>
      {/* Header with Statistics */}
      <div className="px-6 py-1" style={{ backgroundColor: colors.background.primary }}>

        {/* Statistics Row */}
        {statistics && !loading && (
          <div className="flex items-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: colors.text.secondary }} />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>Total Schemes</span>
              <span className="text-lg font-semibold" style={{ color: colors.text.primary }}>{statistics.total_schemes}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: colors.status.active }} />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>Active</span>
              <span className="text-lg font-semibold" style={{ color: colors.status.active }}>{statistics.active_schemes}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: colors.status.inactive }} />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>Inactive</span>
              <span className="text-lg font-semibold" style={{ color: colors.status.inactive }}>{statistics.inactive_schemes}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: colors.status.suspended }} />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>Suspended</span>
              <span className="text-lg font-semibold" style={{ color: colors.status.suspended }}>{statistics.suspended_schemes}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs with Actions */}
      <div className="border-b" style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('schemes')}
                className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                {...getTabProps(activeTab === 'schemes')}
              >
                Schemes
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                {...getTabProps(activeTab === 'analytics')}
              >
                Analytics
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <Tooltip content="Refresh schemes data and statistics">
                <button
                  onClick={refreshData}
                  className="p-2 rounded-lg transition-colors"
                  aria-label="Refresh schemes data and statistics"
                  title="Refresh schemes data and statistics"
                  {...getIconButtonProps()}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </Tooltip>
              
              <Tooltip content="Add new scheme">
                <button
                  onClick={handleAddScheme}
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
    </div>
  );
};

export default SchemesPage;
