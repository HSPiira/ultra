import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { companiesApi } from '../../services/companies';
import type { Company, Industry, CompanyCreateData, CompanyUpdateData } from '../../types/companies';

interface CompanyFormProps {
  company?: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Company) => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<CompanyCreateData>({
    company_name: '',
    company_address: '',
    industry: '',
    contact_person: '',
    email: '',
    phone_number: '',
    website: '',
    remark: ''
  });
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadIndustries();
      if (company) {
        setFormData({
          company_name: company.company_name,
          company_address: company.company_address,
          industry: company.industry,
          contact_person: company.contact_person,
          email: company.email,
          phone_number: company.phone_number,
          website: company.website || '',
          remark: company.remark || ''
        });
      } else {
        setFormData({
          company_name: '',
          company_address: '',
          industry: '',
          contact_person: '',
          email: '',
          phone_number: '',
          website: '',
          remark: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, company]);

  const loadIndustries = async () => {
    try {
      const data = await companiesApi.getIndustries();
      setIndustries(data);
    } catch (err) {
      console.error('Error loading industries:', err);
    }
  };

  const handleInputChange = (field: keyof CompanyCreateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    } else if (formData.company_name.trim().length < 2) {
      newErrors.company_name = 'Company name must be at least 2 characters';
    }

    if (!formData.company_address.trim()) {
      newErrors.company_address = 'Company address is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }

    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    } else if (formData.contact_person.trim().length < 2) {
      newErrors.contact_person = 'Contact person name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone_number.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        newErrors.phone_number = 'Phone number must be at least 10 digits';
      }
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let savedCompany: Company;
      
      if (company) {
        // Update existing company
        const updateData: CompanyUpdateData = {
          id: company.id,
          ...formData
        };
        savedCompany = await companiesApi.updateCompany(updateData);
      } else {
        // Create new company
        savedCompany = await companiesApi.createCompany(formData);
      }
      
      onSave(savedCompany);
      onClose();
    } catch (err: any) {
      console.error('Error saving company:', err);
      // Handle API validation errors
      if (err.response?.data) {
        const apiErrors = err.response.data;
        const fieldErrors: Record<string, string> = {};
        
        Object.keys(apiErrors).forEach(field => {
          if (Array.isArray(apiErrors[field])) {
            fieldErrors[field] = apiErrors[field][0];
          } else {
            fieldErrors[field] = apiErrors[field];
          }
        });
        
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-xs"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    >
      <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Building2 className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {company ? 'Edit Company' : 'Add New Company'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {company ? 'Update company information' : 'Create a new company profile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#404040';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                errors.company_name ? 'border-red-500' : ''
              }`}
              style={{ 
                backgroundColor: '#1f1f1f', 
                color: '#ffffff',
                borderColor: errors.company_name ? '#ef4444' : '#404040'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#606060';
                e.target.style.boxShadow = '0 0 0 2px rgba(96, 96, 96, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.company_name ? '#ef4444' : '#404040';
                e.target.style.boxShadow = 'none';
              }}
                placeholder="Enter company name"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-400">{errors.company_name}</p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Industry *
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  errors.industry ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderColor: errors.industry ? '#ef4444' : '#404040'
                }}
              >
                <option value="">Select an industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.industry_name}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-400">{errors.industry}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Contact Person *
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  errors.contact_person ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderColor: errors.contact_person ? '#ef4444' : '#404040'
                }}
                placeholder="Enter contact person name"
              />
              {errors.contact_person && (
                <p className="mt-1 text-sm text-red-400">{errors.contact_person}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  errors.email ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderColor: errors.email ? '#ef4444' : '#404040'
                }}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  errors.phone_number ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderColor: errors.phone_number ? '#ef4444' : '#404040'
                }}
                placeholder="Enter phone number"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-400">{errors.phone_number}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  errors.website ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderColor: errors.website ? '#ef4444' : '#404040'
                }}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-400">{errors.website}</p>
              )}
            </div>

            {/* Company Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Company Address *
              </label>
              <textarea
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  errors.company_address ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderColor: errors.company_address ? '#ef4444' : '#404040'
                }}
                placeholder="Enter company address"
              />
              {errors.company_address && (
                <p className="mt-1 text-sm text-red-400">{errors.company_address}</p>
              )}
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Remarks
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg transition-colors"
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderColor: '#404040'
                }}
                placeholder="Additional notes about the company"
              />
            </div>
          </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors border text-sm"
            style={{ 
              backgroundColor: 'transparent',
              color: '#d1d5db',
              borderColor: '#404040'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#404040';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#d1d5db';
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm"
            style={{ 
              backgroundColor: '#3b3b3b',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#4a4a4a';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#3b3b3b';
              }
            }}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <Save className="w-3 h-3" />
            )}
            {company ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
