import React from 'react';
import { Plus, CreditCard, Users, DollarSign, Calendar } from 'lucide-react';
import type { Company } from '../../types/companies';

interface CompanySchemesTabProps {
  company: Company;
}

export const CompanySchemesTab: React.FC<CompanySchemesTabProps> = ({ company }) => {
  // Mock data for schemes - in real app, this would come from API
  const schemes = [
    {
      id: '1',
      name: 'Employee Health Insurance',
      type: 'Health',
      premium: 50000,
      coverage: 'Full Medical Coverage',
      members: 150,
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    {
      id: '2',
      name: 'Family Medical Plan',
      type: 'Health',
      premium: 75000,
      coverage: 'Family Medical Coverage',
      members: 75,
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    {
      id: '3',
      name: 'Executive Health Plan',
      type: 'Health',
      premium: 120000,
      coverage: 'Premium Medical Coverage',
      members: 25,
      status: 'INACTIVE',
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Insurance Schemes</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4a4a4a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b3b3b';
          }}
        >
          <Plus className="w-4 h-4" />
          Add Scheme
        </button>
      </div>

      {/* Schemes List */}
      {schemes.length === 0 ? (
        <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No schemes found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            This company doesn't have any insurance schemes yet.
          </p>
          <button
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4a4a4a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
            }}
          >
            Add First Scheme
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              className="rounded-lg border p-6 hover:bg-gray-800 transition-colors"
              style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
                    <CreditCard className="w-5 h-5" style={{ color: '#d1d5db' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>
                      {scheme.name}
                    </h3>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>{scheme.type} Insurance</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  scheme.status === 'ACTIVE' 
                    ? 'bg-green-900 text-green-300' 
                    : 'bg-red-900 text-red-300'
                }`}>
                  {scheme.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>Premium</p>
                      <p className="text-base font-semibold" style={{ color: '#ffffff' }}>
                        {formatCurrency(scheme.premium)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>Members</p>
                      <p className="text-base font-semibold" style={{ color: '#ffffff' }}>
                        {scheme.members}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>Coverage</p>
                    <p className="text-sm" style={{ color: '#ffffff' }}>{scheme.coverage}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>Period</p>
                      <p className="text-sm" style={{ color: '#ffffff' }}>
                        {formatDate(scheme.startDate)} - {formatDate(scheme.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
