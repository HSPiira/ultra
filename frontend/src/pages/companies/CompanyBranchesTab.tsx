import React from 'react';
import { Plus, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import type { Company } from '../../types/companies';

interface CompanyBranchesTabProps {
  company: Company;
}

export const CompanyBranchesTab: React.FC<CompanyBranchesTabProps> = ({ company }) => {
  // Mock data for branches - in real app, this would come from API
  const branches = [
    {
      id: '1',
      name: 'Main Branch',
      address: '123 Main Street, Kampala, Uganda',
      phone: '+256 123 456 789',
      email: 'main@example.com',
      manager: 'John Doe',
      status: 'ACTIVE'
    },
    {
      id: '2',
      name: 'Entebbe Branch',
      address: '456 Airport Road, Entebbe, Uganda',
      phone: '+256 987 654 321',
      email: 'entebbe@example.com',
      manager: 'Jane Smith',
      status: 'ACTIVE'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Company Branches</h2>
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
          Add Branch
        </button>
      </div>

      {/* Branches List */}
      {branches.length === 0 ? (
        <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No branches found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            This company doesn't have any branches yet.
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
            Add First Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-lg border p-6 hover:bg-gray-800 transition-colors"
              style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: '#ffffff' }}>
                    {branch.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    branch.status === 'ACTIVE' 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {branch.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-1" style={{ color: '#9ca3af' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>Address</p>
                    <p className="text-sm" style={{ color: '#ffffff' }}>{branch.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>Phone</p>
                    <a 
                      href={`tel:${branch.phone}`}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {branch.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>Email</p>
                    <a 
                      href={`mailto:${branch.email}`}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {branch.email}
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t" style={{ borderColor: '#4a4a4a' }}>
                  <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>Manager</p>
                  <p className="text-sm" style={{ color: '#ffffff' }}>{branch.manager}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
