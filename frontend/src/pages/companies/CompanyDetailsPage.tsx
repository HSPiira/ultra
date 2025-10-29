import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { companiesApi } from '../../services/companies';
import type { Company } from '../../types/companies';
import { CompanyOverviewTab } from './CompanyOverviewTab';
import { CompanySchemesTab } from './CompanySchemesTab';
import { CompanyMembersTab } from './CompanyMembersTab';
import { CompanyAnalyticsTab } from './CompanyAnalyticsTab';

type CompanyDetailsTab = 'overview' | 'schemes' | 'members' | 'analytics';

export const CompanyDetailsPage: React.FC = () => {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CompanyDetailsTab>('overview');

  useEffect(() => {
    if (id) {
      loadCompany();
    }
  }, [id]);

  // Handle tab from URL
  useEffect(() => {
    if (tab && isValidTab(tab)) {
      setActiveTab(tab as CompanyDetailsTab);
    } else if (tab && !isValidTab(tab)) {
      // Invalid tab, redirect to default tab
      navigate(`/companies/${id}`, { replace: true });
    }
  }, [tab, id, navigate]);

  const isValidTab = (tabName: string): tabName is CompanyDetailsTab => {
    return ['overview', 'schemes', 'members', 'analytics'].includes(tabName);
  };

  const loadCompany = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const companies = await companiesApi.getCompanies();
      const foundCompany = companies.find(c => c.id === id);
      if (foundCompany) {
        setCompany(foundCompany);
      } else {
        // Company not found, redirect back to companies list
        navigate('/companies');
      }
    } catch (error) {
      console.error('Error loading company:', error);
      navigate('/companies');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/companies');
  };

  const handleTabChange = (newTab: CompanyDetailsTab) => {
    setActiveTab(newTab);
    navigate(`/companies/${id}/${newTab}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>Company not found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            The company you're looking for doesn't exist or has been removed.
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
            Back to Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ backgroundColor: '#1a1a1a', borderColor: '#4a4a4a' }}>
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
            title="Back to Companies"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Building2 className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {company.company_name} - <span className="text-sm font-normal" style={{ color: '#9ca3af' }}>
                  {company.industry_detail?.industry_name || 'Unknown Industry'} • {company.status}
                </span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ backgroundColor: '#1a1a1a', borderColor: '#4a4a4a' }}>
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'schemes', label: 'Schemes' },
              { id: 'members', label: 'Members' },
              { id: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as CompanyDetailsTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'overview' && <CompanyOverviewTab company={company} />}
        {activeTab === 'schemes' && <CompanySchemesTab company={company} />}
        {activeTab === 'members' && <CompanyMembersTab company={company} />}
        {activeTab === 'analytics' && <CompanyAnalyticsTab company={company} />}
      </div>
    </div>
  );
};
