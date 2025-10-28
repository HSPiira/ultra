import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw,
  Heart,
  FileText,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import { benefitsApi } from '../../services/benefits';
import { plansApi } from '../../services/plans';
import type { Scheme } from '../../types/schemes';
import type { Benefit } from '../../types/benefits';
import type { Plan } from '../../types/plans';

interface SchemeItemsTabProps {
  scheme: Scheme;
}

export const SchemeItemsTab: React.FC<SchemeItemsTabProps> = ({ scheme }) => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'benefits' | 'plans'>('benefits');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const [benefitsData, plansData] = await Promise.all([
        benefitsApi.getBenefits(),
        plansApi.getPlans()
      ]);
      setBenefits(benefitsData);
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBenefits = benefits.filter(benefit => {
    const matchesSearch = benefit.benefit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         benefit.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || benefit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-900';
      case 'INACTIVE':
        return 'text-red-400 bg-red-900';
      case 'SUSPENDED':
        return 'text-amber-400 bg-amber-900';
      default:
        return 'text-gray-400 bg-gray-900';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INPATIENT':
        return 'text-blue-400 bg-blue-900';
      case 'OUTPATIENT':
        return 'text-purple-400 bg-purple-900';
      case 'BOTH':
        return 'text-indigo-400 bg-indigo-900';
      default:
        return 'text-gray-400 bg-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
            Scheme Items
          </h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Manage benefits and plans associated with this scheme
          </p>
        </div>
        <button
          onClick={loadItems}
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
          title="Refresh Items"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: '#4a4a4a' }}>
        <div className="flex space-x-8">
          {[
            { id: 'benefits', label: 'Benefits', icon: Heart, count: filteredBenefits.length },
            { id: 'plans', label: 'Plans', icon: FileText, count: filteredPlans.length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'benefits' | 'plans')}
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
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
            style={{ 
              backgroundColor: '#1f1f1f', 
              color: '#ffffff', 
              borderColor: '#4a4a4a' 
            }}
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border transition-colors"
          style={{ 
            backgroundColor: '#1f1f1f', 
            color: '#ffffff', 
            borderColor: '#4a4a4a' 
          }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
        {activeTab === 'benefits' ? (
          filteredBenefits.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No Benefits Found</h3>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {searchTerm ? 'No benefits match your search criteria.' : 'No benefits are associated with this scheme.'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#4a4a4a' }}>
              {filteredBenefits.map((benefit) => (
                <div key={benefit.id} className="p-6 hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
                          {benefit.benefit_name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(benefit.status)}`}>
                          {benefit.status}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(benefit.in_or_out_patient)}`}>
                          {benefit.in_or_out_patient}
                        </span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: '#9ca3af' }}>
                        {benefit.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>
                            {benefit.limit_amount ? `UGX ${benefit.limit_amount.toLocaleString()}` : 'No limit'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>
                            {benefit.family_applicable ? 'Family' : 'Individual'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No Plans Found</h3>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {searchTerm ? 'No plans match your search criteria.' : 'No plans are associated with this scheme.'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#4a4a4a' }}>
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="p-6 hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
                          {plan.plan_name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                          {plan.status}
                        </span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: '#9ca3af' }}>
                        {plan.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>
                            {plan.limit_amount ? `UGX ${plan.limit_amount.toLocaleString()}` : 'No limit'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>
                            {plan.family_applicable ? 'Family' : 'Individual'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
