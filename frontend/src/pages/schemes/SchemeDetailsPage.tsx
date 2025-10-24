import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Info, Users, BarChart3, Settings } from 'lucide-react';
import { schemesApi } from '../../services/schemes';
import type { Scheme } from '../../types/schemes';
import { SchemeOverviewTab } from './SchemeOverviewTab';
import { SchemeAssignmentsTab } from './SchemeAssignmentsTab';
import { SchemeMembersTab } from './SchemeMembersTab';
import { SchemeAnalyticsTab } from './SchemeAnalyticsTab';

type SchemeDetailsTab = 'overview' | 'assignments' | 'members' | 'analytics';

export const SchemeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SchemeDetailsTab>('overview');

  useEffect(() => {
    if (id) {
      loadScheme();
    }
  }, [id]);

  const loadScheme = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const schemes = await schemesApi.getSchemes();
      const foundScheme = schemes.find(s => s.id === id);
      if (foundScheme) {
        setScheme(foundScheme);
      } else {
        // Scheme not found, redirect back to schemes list
        navigate('/schemes');
      }
    } catch (error) {
      console.error('Error loading scheme:', error);
      navigate('/schemes');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/schemes');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>Scheme not found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            The scheme you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4a4a4a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
            }}
          >
            Back to Schemes
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400';
      case 'INACTIVE':
        return 'text-red-400';
      case 'SUSPENDED':
        return 'text-amber-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
            title="Back to Schemes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Shield className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {scheme.scheme_name} - <span className={`text-sm ${getStatusColor(scheme.status)}`}>{scheme.status}</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'assignments', label: 'Assignments', icon: Settings },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SchemeDetailsTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-b-2'
                      : 'border-b-2'
                  }`}
                  style={{
                    borderBottomColor: activeTab === tab.id ? '#9ca3af' : 'transparent',
                    color: activeTab === tab.id ? '#d1d5db' : '#9ca3af'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = '#9ca3af';
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'overview' && <SchemeOverviewTab scheme={scheme} />}
        {activeTab === 'assignments' && <SchemeAssignmentsTab scheme={scheme} />}
        {activeTab === 'members' && <SchemeMembersTab scheme={scheme} />}
        {activeTab === 'analytics' && <SchemeAnalyticsTab scheme={scheme} />}
      </div>
    </div>
  );
};
