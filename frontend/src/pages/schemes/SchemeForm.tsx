import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { schemesApi } from '../../services/schemes';
import { companiesApi } from '../../services/companies';
import type { Scheme, SchemeCreateData, SchemeUpdateData } from '../../types/schemes';
import type { Company } from '../../types/companies';

interface SchemeFormProps {
  scheme?: Scheme;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SchemeForm: React.FC<SchemeFormProps> = ({
  scheme,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<SchemeCreateData>({
    scheme_name: '',
    company: '',
    description: '',
    card_code: '',
    start_date: '',
    end_date: '',
    termination_date: '',
    limit_amount: 0,
    family_applicable: false,
    remark: ''
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
      if (scheme) {
        setFormData({
          scheme_name: scheme.scheme_name,
          company: scheme.company,
          description: scheme.description || '',
          card_code: scheme.card_code,
          start_date: scheme.start_date,
          end_date: scheme.end_date,
          termination_date: scheme.termination_date || '',
          limit_amount: scheme.limit_amount,
          family_applicable: scheme.family_applicable,
          remark: scheme.remark || ''
        });
      } else {
        setFormData({
          scheme_name: '',
          company: '',
          description: '',
          card_code: '',
          start_date: '',
          end_date: '',
          termination_date: '',
          limit_amount: 0,
          family_applicable: false,
          remark: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, scheme]);

  const loadCompanies = async () => {
    try {
      const data = await companiesApi.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const handleInputChange = (field: keyof SchemeCreateData, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-calculate end date when start date changes (for new schemes only)
      if (field === 'start_date' && !scheme && value) {
        const startDate = new Date(value as string);
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1); // Add 365 days
        newData.end_date = endDate.toISOString().split('T')[0];
        
        // Auto-calculate termination date (day after end date)
        const terminationDate = new Date(endDate);
        terminationDate.setDate(terminationDate.getDate() + 1);
        newData.termination_date = terminationDate.toISOString().split('T')[0];
      }

      // Auto-calculate start date when end date changes (for new schemes only)
      if (field === 'end_date' && !scheme && value) {
        const endDate = new Date(value as string);
        const startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1); // Subtract 365 days
        newData.start_date = startDate.toISOString().split('T')[0];
        
        // Auto-calculate termination date (day after end date)
        const terminationDate = new Date(endDate);
        terminationDate.setDate(terminationDate.getDate() + 1);
        newData.termination_date = terminationDate.toISOString().split('T')[0];
      }

      // Auto-calculate termination date when end date changes (for existing schemes)
      if (field === 'end_date' && scheme && value) {
        const endDate = new Date(value as string);
        const terminationDate = new Date(endDate);
        terminationDate.setDate(terminationDate.getDate() + 1);
        newData.termination_date = terminationDate.toISOString().split('T')[0];
      }

      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.scheme_name.trim()) {
      newErrors.scheme_name = 'Scheme name is required';
    } else if (formData.scheme_name.trim().length < 2) {
      newErrors.scheme_name = 'Scheme name must be at least 2 characters';
    }

    if (!formData.company) {
      newErrors.company = 'Company is required';
    }

    if (!formData.card_code.trim()) {
      newErrors.card_code = 'Card code is required';
    } else if (formData.card_code.trim().length !== 3) {
      newErrors.card_code = 'Card code must be exactly 3 characters';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (!formData.limit_amount || formData.limit_amount <= 0) {
      newErrors.limit_amount = 'Coverage amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (scheme) {
        const updateData: SchemeUpdateData = {
          ...formData,
          id: scheme.id
        };
        await schemesApi.updateScheme(updateData);
      } else {
        await schemesApi.createScheme(formData);
      }
      
      onSave();
    } catch (err) {
      console.error('Error saving scheme:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: '#4a4a4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Shield className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {scheme ? 'Edit Scheme' : 'Add New Scheme'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {scheme ? 'Update scheme information' : 'Create a new insurance scheme'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Scheme Name *
                </label>
                <input
                  type="text"
                  value={formData.scheme_name}
                  onChange={(e) => handleInputChange('scheme_name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#3b3b3b', 
                    color: '#ffffff',
                    borderColor: errors.scheme_name ? '#ef4444' : '#4a4a4a'
                  }}
                  placeholder="Enter scheme name"
                />
                {errors.scheme_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.scheme_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Card Code *
                </label>
                <input
                  type="text"
                  value={formData.card_code}
                  onChange={(e) => handleInputChange('card_code', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#3b3b3b', 
                    color: '#ffffff',
                    borderColor: errors.card_code ? '#ef4444' : '#4a4a4a'
                  }}
                  placeholder="ABC"
                  maxLength={3}
                />
                {errors.card_code && (
                  <p className="mt-1 text-sm text-red-400">{errors.card_code}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Company *
              </label>
              <select
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg transition-colors"
                style={{ 
                  backgroundColor: '#3b3b3b', 
                  color: '#ffffff',
                  borderColor: errors.company ? '#ef4444' : '#4a4a4a'
                }}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
              {errors.company && (
                <p className="mt-1 text-sm text-red-400">{errors.company}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg transition-colors"
                style={{ 
                  backgroundColor: '#3b3b3b', 
                  color: '#ffffff',
                  borderColor: '#4a4a4a'
                }}
                placeholder="Enter scheme description"
              />
            </div>
          </div>

          {/* Dates and Coverage */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>Dates & Coverage</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#3b3b3b', 
                    color: '#ffffff',
                    borderColor: errors.start_date ? '#ef4444' : '#4a4a4a'
                  }}
                />
                <div className="h-5 mt-1">
                  {errors.start_date && (
                    <p className="text-sm text-red-400">{errors.start_date}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  End Date *
                  {!scheme && (
                    <span className="text-xs text-gray-400 ml-1">(default: +365 days)</span>
                  )}
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#3b3b3b', 
                    color: '#ffffff',
                    borderColor: errors.end_date ? '#ef4444' : '#4a4a4a'
                  }}
                />
                <div className="h-5 mt-1">
                  {!scheme && (
                    <p className="text-xs text-gray-400">
                      Automatically set to 1 year from start date, but you can change it
                    </p>
                  )}
                  {errors.end_date && (
                    <p className="text-sm text-red-400">{errors.end_date}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Termination Date
                </label>
                <input
                  type="date"
                  value={formData.termination_date}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#2a2a2a', 
                    color: '#9ca3af',
                    borderColor: '#4a4a4a',
                    cursor: 'not-allowed'
                  }}
                />
                <div className="h-5 mt-1">
                  <p className="text-xs text-gray-400">
                    Automatically set to the day after end date
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Coverage Amount (UGX) *
                </label>
                <input
                  type="number"
                  value={formData.limit_amount}
                  onChange={(e) => handleInputChange('limit_amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#3b3b3b', 
                    color: '#ffffff',
                    borderColor: errors.limit_amount ? '#ef4444' : '#4a4a4a'
                  }}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.limit_amount && (
                  <p className="mt-1 text-sm text-red-400">{errors.limit_amount}</p>
                )}
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.family_applicable}
                    onChange={(e) => handleInputChange('family_applicable', e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>
                    Family Applicable
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Remarks
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg transition-colors"
                style={{ 
                  backgroundColor: '#3b3b3b', 
                  color: '#ffffff',
                  borderColor: '#4a4a4a'
                }}
                placeholder="Enter any additional remarks"
              />
            </div>
          </div>

          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0" style={{ borderColor: '#4a4a4a' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {loading ? 'Saving...' : (scheme ? 'Update' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
};
