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
      const data = await companiesApi.getCompanies();
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
    <div className="space-y-6">



      {/* Companies Display */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="style={{ backgroundColor: '#2a2a2a' }} rounded-lg border style={{ borderColor: '#4a4a4a' }} overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="style={{ backgroundColor: '#3b3b3b' }} border-b border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium style={{ color: '#9ca3af' }} uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium style={{ color: '#9ca3af' }} uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium style={{ color: '#9ca3af' }} uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium style={{ color: '#9ca3af' }} uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium style={{ color: '#9ca3af' }} uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:style={{ backgroundColor: '#3b3b3b' }} transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <div className="font-medium style={{ color: '#ffffff' }}">{company.company_name}</div>
                          <div className="text-sm style={{ color: '#9ca3af' }} flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {company.company_address}
                          </div>
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-300 hover:style={{ color: '#ffffff' }} flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                        {company.industry_detail.industry_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium style={{ color: '#ffffff' }}">{company.contact_person}</div>
                        <div className="style={{ color: '#9ca3af' }} flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {company.email}
                        </div>
                        <div className="style={{ color: '#9ca3af' }} flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {formatPhoneNumber(company.phone_number)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        company.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onCompanySelect?.(company)}
                          className="p-1 style={{ color: '#9ca3af' }} hover:style={{ color: '#ffffff' }} transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onCompanyEdit?.(company)}
                          className="p-1 style={{ color: '#9ca3af' }} hover:text-gray-300 transition-colors"
                          title="Edit Company"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(company)}
                          className="p-1 style={{ color: '#9ca3af' }} hover:text-red-400 transition-colors"
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
                <div className="flex items-center gap-2 text-sm style={{ color: '#9ca3af' }}">
                  <User className="w-4 h-4" />
                  <span>{company.contact_person}</span>
                </div>
                <div className="flex items-center gap-2 text-sm style={{ color: '#9ca3af' }}">
                  <Mail className="w-4 h-4" />
                  <span>{company.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm style={{ color: '#9ca3af' }}">
                  <Phone className="w-4 h-4" />
                  <span>{formatPhoneNumber(company.phone_number)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm style={{ color: '#9ca3af' }}">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{company.company_address}</span>
                </div>
                {company.website && (
                  <div className="flex items-center gap-2 text-sm style={{ color: '#9ca3af' }}">
                    <ExternalLink className="w-4 h-4" />
                    <a 
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:style={{ color: '#ffffff' }} transition-colors"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t style={{ borderColor: '#4a4a4a' }}">
                <button
                  onClick={() => onCompanySelect?.(company)}
                  className="p-2 style={{ color: '#9ca3af' }} hover:style={{ color: '#ffffff' }} hover:bg-gray-600 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCompanyEdit?.(company)}
                    className="p-2 style={{ color: '#9ca3af' }} hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit Company"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(company)}
                    className="p-2 style={{ color: '#9ca3af' }} hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
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
        <div className="style={{ backgroundColor: '#2a2a2a' }} rounded-lg border style={{ borderColor: '#4a4a4a' }} text-center py-12">
          <Building2 className="w-12 h-12 style={{ color: '#9ca3af' }} mx-auto mb-4" />
          <h3 className="text-lg font-medium style={{ color: '#ffffff' }} mb-2">No companies found</h3>
          <p className="style={{ color: '#9ca3af' }} mb-4">
            {'Get started by adding your first company'}
          </p>
          {(
              <button 
                onClick={onAddCompany}
                className="style={{ backgroundColor: '#3b3b3b' }} style={{ color: '#ffffff' }} px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
              Add Company
            </button>
          )}
        </div>
      )}
    </div>
  );
};
