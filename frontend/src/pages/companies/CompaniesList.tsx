import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  User,
} from 'lucide-react';
import { companiesApi } from '../../services/companies';
import type { Company } from '../../types/companies';

interface CompaniesListProps {
  onCompanySelect?: (company: Company) => void;
  onCompanyEdit?: (company: Company) => void;
  onCompanyDelete?: (company: Company) => void;
  onAddCompany?: () => void;
  viewMode?: 'list' | 'grid';
}

export const CompaniesList: React.FC<CompaniesListProps> = ({
  onCompanySelect,
  onCompanyEdit,
  onCompanyDelete,
  onAddCompany,
  viewMode = 'list'
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log('Loading companies...');
      const data = await companiesApi.getCompanies();
      console.log('Companies loaded:', data);
      setCompanies(data);
    } catch (err) {
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (company: Company) => {
    if (window.confirm(`Are you sure you want to delete ${company.company_name}?`)) {
      try {
        await companiesApi.deleteCompany(company.id);
        await loadCompanies();
        onCompanyDelete?.(company);
      } catch (err) {
        console.error('Failed to delete company');
        console.error('Error deleting company:', err);
      }
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Companies Display */}
      {viewMode === 'list' ? (
        /* List View - Clean table without outline */
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: '#374151' }}>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Person
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr 
                    key={company.id} 
                    className="border-b hover:bg-gray-800 transition-colors" 
                    style={{ borderColor: '#374151' }}
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium text-white">{company.company_name}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-400">{company.industry_detail.industry_name}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-400">{company.contact_person}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-400">{company.email}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-400">{company.phone_number}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        company.status === 'ACTIVE' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onCompanySelect?.(company)}
                          className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onCompanyEdit?.(company)}
                          className="p-1 text-gray-400 hover:text-blue-400 transition-colors rounded"
                          title="Edit Company"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(company)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors rounded"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="style={{ backgroundColor: '#2a2a2a' }} rounded-lg border style={{ borderColor: '#4a4a4a' }} p-6 hover:style={{ backgroundColor: '#3b3b3b' }} transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold style={{ color: '#ffffff' }}">{company.company_name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                      {company.industry_detail.industry_name}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  company.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {company.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <User className="w-4 h-4" />
                  <span>{company.contact_person}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <Mail className="w-4 h-4" />
                  <span>{company.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <Phone className="w-4 h-4" />
                  <span>{formatPhoneNumber(company.phone_number)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{company.company_address}</span>
                </div>
                {company.website && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
                    <ExternalLink className="w-4 h-4" />
                    <a 
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#4a4a4a' }}>
                <button
                  onClick={() => onCompanySelect?.(company)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCompanyEdit?.(company)}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit Company"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(company)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete Company"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {companies.length === 0 && !loading && (
        <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No companies found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            Get started by adding your first company
          </p>
          <button 
            onClick={onAddCompany}
            className="px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
          >
            Add Company
          </button>
        </div>
      )}
    </div>
  );
};
