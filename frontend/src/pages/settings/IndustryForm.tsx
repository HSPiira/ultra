import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { companiesApi } from '../../services/companies';
import type { Industry, IndustryCreateData, IndustryUpdateData } from '../../types/companies';

interface IndustryFormProps {
  industry?: Industry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (industry: Industry) => void;
}

export const IndustryForm: React.FC<IndustryFormProps> = ({
  industry,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<IndustryCreateData>({
    industry_name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (industry) {
        setFormData({
          industry_name: industry.industry_name,
          description: industry.description || ''
        });
      } else {
        setFormData({
          industry_name: '',
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, industry]);

  const handleInputChange = (field: keyof IndustryCreateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.industry_name.trim()) {
      newErrors.industry_name = 'Industry name is required';
    } else if (formData.industry_name.trim().length < 2) {
      newErrors.industry_name = 'Industry name must be at least 2 characters';
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
      let savedIndustry: Industry;
      
      if (industry) {
        // Update existing industry
        const updateData: IndustryUpdateData = {
          id: industry.id,
          ...formData
        };
        savedIndustry = await companiesApi.updateIndustry(updateData);
      } else {
        // Create new industry
        savedIndustry = await companiesApi.createIndustry(formData);
      }
      
      onSave(savedIndustry);
      onClose();
    } catch (err: any) {
      console.error('Error saving industry:', err);
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
      <div className="rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Building2 className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {industry ? 'Edit Industry' : 'Add New Industry'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {industry ? 'Update industry information' : 'Create a new industry category'}
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
            {/* Industry Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Industry Name *
              </label>
              <input
                type="text"
                value={formData.industry_name}
                onChange={(e) => handleInputChange('industry_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  errors.industry_name ? 'border-red-500' : ''
                }`}
                style={{ 
                  backgroundColor: '#1f1f1f', 
                  color: '#ffffff',
                  borderColor: errors.industry_name ? '#ef4444' : '#404040'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#606060';
                  e.target.style.boxShadow = '0 0 0 2px rgba(96, 96, 96, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.industry_name ? '#ef4444' : '#404040';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter industry name"
              />
              {errors.industry_name && (
                <p className="mt-1 text-sm text-red-400">{errors.industry_name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg transition-colors"
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#ffffff',
                  borderColor: '#404040'
                }}
                placeholder="Enter industry description"
              />
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
            {industry ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
