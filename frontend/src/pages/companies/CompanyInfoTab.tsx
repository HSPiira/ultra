import React from 'react';
import { Mail, Phone, MapPin, ExternalLink, Calendar, Edit, Building2 } from 'lucide-react';
import type { Company } from '../../types/companies';

interface CompanyInfoTabProps {
  company: Company;
}

export const CompanyInfoTab: React.FC<CompanyInfoTabProps> = ({ company }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <div className="rounded-lg border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Company Overview</h2>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4a4a4a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
            }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
                Company Name
              </label>
              <p className="text-base" style={{ color: '#ffffff' }}>{company.company_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
                Industry
              </label>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <span className="text-base" style={{ color: '#ffffff' }}>
                  {company.industry_detail.industry_name}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
                Status
              </label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                company.status === 'ACTIVE' 
                  ? 'bg-green-900 text-green-300' 
                  : company.status === 'INACTIVE'
                  ? 'bg-red-900 text-red-300'
                  : 'bg-amber-900 text-amber-300'
              }`}>
                {company.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
                Contact Person
              </label>
              <p className="text-base" style={{ color: '#ffffff' }}>{company.contact_person}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <a 
                  href={`mailto:${company.email}`}
                  className="text-base text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {company.email}
                </a>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <a 
                  href={`tel:${company.phone_number}`}
                  className="text-base text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {formatPhoneNumber(company.phone_number)}
                </a>
              </div>
            </div>

            {company.website && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
                  Website
                </label>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {company.website}
                  </a>
                </div>
              </div>
            )}

            {company.company_address && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>
                  Address
                </label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <p className="text-base" style={{ color: '#ffffff' }}>{company.company_address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {company.remark && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#4a4a4a' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
              Remarks
            </label>
            <p className="text-base" style={{ color: '#ffffff' }}>{company.remark}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-lg border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>Timeline</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Calendar className="w-4 h-4" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#ffffff' }}>Company Created</p>
              <p className="text-sm" style={{ color: '#9ca3af' }}>{formatDate(company.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Edit className="w-4 h-4" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#ffffff' }}>Last Updated</p>
              <p className="text-sm" style={{ color: '#9ca3af' }}>{formatDate(company.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
