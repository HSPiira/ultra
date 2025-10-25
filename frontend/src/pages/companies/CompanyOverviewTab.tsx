import React from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Users,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import type { Company } from '../../types/companies';

interface CompanyOverviewTabProps {
  company: Company;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export const CompanyOverviewTab: React.FC<CompanyOverviewTabProps> = ({ company }) => {
  // Mock data for branches - in real app, this would come from API
  const branches: Branch[] = [
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
    },
    {
      id: '3',
      name: 'Jinja Branch',
      address: '789 Nile Street, Jinja, Uganda',
      phone: '+256 555 123 456',
      email: 'jinja@example.com',
      manager: 'Mike Johnson',
      status: 'INACTIVE'
    }
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

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

  return (
    <div className="space-y-8">
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - Company Information */}
        <div className="lg:col-span-2 lg:border-r lg:pr-6" style={{ borderColor: '#374151' }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#ffffff' }}>Company Information</h2>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Company Name</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{company.company_name}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Industry</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {company.industry_detail?.industry_name || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Email</span>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {company.email || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Phone</span>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {formatPhoneNumber(company.phone_number)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Address</span>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {company.company_address || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Website</span>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <a 
                  href={company.website || '#'} 
                  className="text-sm font-medium text-blue-400 hover:text-blue-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {company.website || 'N/A'}
                </a>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Status</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                {company.status}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Date Created</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {formatDate(company.created_at)}
              </span>
            </div>

            {company.remark && (
              <div className="pt-2">
                <span className="text-sm font-medium block mb-1" style={{ color: '#9ca3af' }}>Description</span>
                <p className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>{company.remark}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Branches List */}
        <div className="lg:col-span-3 lg:pl-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Company Branches</h2>
            <button
              className="flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm"
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

          {branches.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#6b7280' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No Branches Found</h3>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                This company has no branches registered yet.
              </p>
            </div>
          ) : (
            <div className="space-y-0" style={{ backgroundColor: '#1a1a1a' }}>
              {branches.map((branch, index) => (
                <div key={branch.id}>
                  <div className="px-4 py-3 flex items-center justify-between transition-colors border-b"
                    style={{ backgroundColor: '#1a1a1a', borderBottomColor: '#4a4a4a' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
                        <Building2 className="w-5 h-5" style={{ color: '#d1d5db' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-sm font-medium" style={{ color: '#ffffff' }}>
                            {branch.name}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(branch.status)}`}>
                            {branch.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                            <MapPin className="w-3 h-3" />
                            <span>{branch.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                            <Phone className="w-3 h-3" />
                            <span>{branch.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                            <Mail className="w-3 h-3" />
                            <span>{branch.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                            <Users className="w-3 h-3" />
                            <span>Manager: {branch.manager}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 rounded transition-colors"
                        style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4a4a4a';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b3b3b';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                        title="View Details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 rounded transition-colors"
                        style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4a4a4a';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b3b3b';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                        title="Edit Branch"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 rounded transition-colors"
                        style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b3b3b';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                        title="Delete Branch"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {/* Separator line */}
                  {index < branches.length - 1 && (
                    <div className="h-px" style={{ backgroundColor: '#4a4a4a' }}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
