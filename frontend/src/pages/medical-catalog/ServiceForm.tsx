import React, { useState, useEffect } from 'react';
import { X, Save, Stethoscope } from 'lucide-react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { Service, ServiceCreateData, ServiceUpdateData } from '../../types/medical-catalog';

interface ServiceFormProps {
  service?: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<ServiceCreateData>({
    name: '',
    category: '',
    description: '',
    base_amount: 0,
    service_type: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (service) {
        setFormData({
          name: service.name,
          category: service.category,
          description: service.description,
          base_amount: service.base_amount,
          service_type: service.service_type
        });
      } else {
        setFormData({
          name: '',
          category: '',
          description: '',
          base_amount: 0,
          service_type: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, service]);

  const handleInputChange = (field: keyof ServiceCreateData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Service name must be at least 2 characters';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.service_type.trim()) {
      newErrors.service_type = 'Service type is required';
    }

    if (formData.base_amount <= 0) {
      newErrors.base_amount = 'Base amount must be greater than 0';
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
      let savedService: Service;
      
      if (service) {
        // Update existing service
        const updateData: ServiceUpdateData = {
          id: service.id,
          ...formData
        };
        savedService = await medicalCatalogApi.updateService(updateData);
      } else {
        // Create new service
        savedService = await medicalCatalogApi.createService(formData);
      }
      
      onSave(savedService);
      onClose();
    } catch (err: any) {
      console.error('Error saving service:', err);
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
      <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Stethoscope className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {service ? 'Edit Service' : 'Add New Service'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {service ? 'Update service information' : 'Create a new medical service'}
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
              {/* Service Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  style={{ 
                    backgroundColor: '#1f1f1f', 
                    color: '#ffffff',
                    borderColor: errors.name ? '#ef4444' : '#404040'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#606060';
                    e.target.style.boxShadow = '0 0 0 2px rgba(96, 96, 96, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.name ? '#ef4444' : '#404040';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter service name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.category ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.category ? '#ef4444' : '#404040'
                  }}
                  placeholder="Enter category"
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-400">{errors.category}</p>
                )}
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Service Type *
                </label>
                <input
                  type="text"
                  value={formData.service_type}
                  onChange={(e) => handleInputChange('service_type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.service_type ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.service_type ? '#ef4444' : '#404040'
                  }}
                  placeholder="Enter service type"
                />
                {errors.service_type && (
                  <p className="mt-1 text-sm text-red-400">{errors.service_type}</p>
                )}
              </div>

              {/* Base Amount */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Base Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_amount}
                  onChange={(e) => handleInputChange('base_amount', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.base_amount ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.base_amount ? '#ef4444' : '#404040'
                  }}
                  placeholder="0.00"
                />
                {errors.base_amount && (
                  <p className="mt-1 text-sm text-red-400">{errors.base_amount}</p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: '#404040'
                  }}
                  placeholder="Enter service description"
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
            {service ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
