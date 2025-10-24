import React from 'react';
import { 
  X, 
  Edit, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Calendar,
  User,
  Globe,
  FileText,
  Trash2
} from 'lucide-react';
import type { Company } from '../../types/companies';

interface CompanyDetailsProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (company: Company) => void;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  company,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen || !company) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-xs"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    >
      <div className="style={{ backgroundColor: '#2a2a2a' }} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold style={{ color: '#ffffff' }}">{company.company_name}</h2>
              <p className="style={{ color: '#9ca3af' }}">{company.industry_detail.industry_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(company)}
              className="p-2 style={{ color: '#9ca3af' }} hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit Company"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 style={{ color: '#9ca3af' }} hover:style={{ color: '#ffffff' }} hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 style={{ color: '#9ca3af' }} mt-0.5" />
                    <div>
                      <p className="text-sm style={{ color: '#9ca3af' }}">Contact Person</p>
                      <p className="style={{ color: '#ffffff' }} font-medium">{company.contact_person}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 style={{ color: '#9ca3af' }} mt-0.5" />
                    <div>
                      <p className="text-sm style={{ color: '#9ca3af' }}">Email</p>
                      <a 
                        href={`mailto:${company.email}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {company.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 style={{ color: '#9ca3af' }} mt-0.5" />
                    <div>
                      <p className="text-sm style={{ color: '#9ca3af' }}">Phone</p>
                      <a 
                        href={`tel:${company.phone_number}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {formatPhoneNumber(company.phone_number)}
                      </a>
                    </div>
                  </div>
                  
                  {company.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 style={{ color: '#9ca3af' }} mt-0.5" />
                      <div>
                        <p className="text-sm style={{ color: '#9ca3af' }}">Website</p>
                        <a 
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                          {company.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address
                </h3>
                <p className="style={{ color: '#d1d5db' }} leading-relaxed">{company.company_address}</p>
              </div>

              {/* Remarks */}
              {company.remark && (
                <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                  <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Remarks
                  </h3>
                  <p className="style={{ color: '#d1d5db' }} leading-relaxed">{company.remark}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-4">Status</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  company.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                </span>
              </div>

              {/* Industry */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-4">Industry</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {company.industry_detail.industry_name}
                </span>
                {company.industry_detail.description && (
                  <p className="style={{ color: '#9ca3af' }} text-sm mt-2">{company.industry_detail.description}</p>
                )}
              </div>

              {/* Dates */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm style={{ color: '#9ca3af' }}">Created</p>
                    <p className="style={{ color: '#ffffff' }}">{formatDate(company.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm style={{ color: '#9ca3af' }}">Last Updated</p>
                    <p className="style={{ color: '#ffffff' }}">{formatDate(company.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold style={{ color: '#ffffff' }} mb-4">Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => onEdit(company)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 style={{ color: '#ffffff' }} rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Company
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 style={{ color: '#ffffff' }} rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Company
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
