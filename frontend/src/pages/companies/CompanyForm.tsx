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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#4a4a4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Building2 className="w-4 h-4" style={{ color: '#d1d5db' }} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
              {company ? 'Edit Company' : 'Add New Company'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 style={{ color: '#9ca3af' }}" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium style={{ color: '#d1d5db' }} mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg style={{ color: '#ffffff' }} placeholder-gray-400 transition-colors ${
                errors.company_name ? 'border-red-500' : ''
              }`}
              style={{ 
                backgroundColor: '#2a2a2a', 
                borderColor: errors.company_name ? '#ef4444' : '#3a3a3a'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4a4a4a';
                e.target.style.boxShadow = '0 0 0 2px #4a4a4a';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.company_name ? '#ef4444' : '#3a3a3a';
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
              <label className="block text-sm font-medium style={{ color: '#d1d5db' }} mb-2">
                Industry *
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg style={{ color: '#ffffff' }} placeholder-gray-400 transition-colors ${
                  errors.industry ? 'border-red-500' : 'border-gray-600'
                }`}
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
              <label className="block text-sm font-medium style={{ color: '#d1d5db' }} mb-2">
                Contact Person *
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg style={{ color: '#ffffff' }} placeholder-gray-400 transition-colors ${
                  errors.contact_person ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter contact person name"
              />
              {errors.contact_person && (
                <p className="mt-1 text-sm text-red-400">{errors.contact_person}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium style={{ color: '#d1d5db' }} mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg style={{ color: '#ffffff' }} placeholder-gray-400 transition-colors ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium style={{ color: '#d1d5db' }} mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg style={{ color: '#ffffff' }} placeholder-gray-400 transition-colors ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-400">{errors.phone_number}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium style={{ color: '#d1d5db' }} mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg style={{ color: '#ffffff' }} placeholder-gray-400 transition-colors ${
                  errors.website ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-400">{errors.website}</p>
              )}
            </div>

            {/* Company Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium style={{ color: '#d1d5db' }} mb-2">
                Company Address *
              </label>
              <textarea
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg style={{ color: '#ffffff' }} placeholder-gray-400 transition-colors ${
                  errors.company_address ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter company address"
              />
              {errors.company_address && (
                <p className="mt-1 text-sm text-red-400">{errors.company_address}</p>
              )}
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium style={{ color: '#d1d5db' }} mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg style={{ color: '#ffffff' }} placeholder-gray-400 transition-colors"
                placeholder="Additional notes about the company"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t #2a2a2a">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 style={{ color: '#d1d5db' }} #2a2a2a rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 style={{ color: '#ffffff' }} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {company ? 'Update Company' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
