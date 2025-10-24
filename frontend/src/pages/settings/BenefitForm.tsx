import React, { useState, useEffect } from 'react';
import { X, Heart, Activity } from 'lucide-react';
import { benefitsApi } from '../../services/benefits';
import type { Benefit, BenefitCreateData, BenefitUpdateData } from '../../types/benefits';

interface BenefitFormProps {
  benefit?: Benefit;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const BenefitForm: React.FC<BenefitFormProps> = ({
  benefit,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<BenefitCreateData>({
    benefit_name: '',
    description: '',
    in_or_out_patient: 'BOTH',
    limit_amount: undefined
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (benefit) {
        setFormData({
          benefit_name: benefit.benefit_name,
          description: benefit.description || '',
          in_or_out_patient: benefit.in_or_out_patient,
          limit_amount: benefit.limit_amount
        });
      } else {
        setFormData({
          benefit_name: '',
          description: '',
          in_or_out_patient: 'BOTH',
          limit_amount: undefined
        });
      }
      setErrors({});
    }
  }, [isOpen, benefit]);

  const handleInputChange = (field: keyof BenefitCreateData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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

    if (!formData.benefit_name.trim()) {
      newErrors.benefit_name = 'Benefit name is required';
    } else if (formData.benefit_name.trim().length < 2) {
      newErrors.benefit_name = 'Benefit name must be at least 2 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    if (formData.limit_amount !== undefined && formData.limit_amount < 0) {
      newErrors.limit_amount = 'Limit amount cannot be negative';
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
      
      if (benefit) {
        const updateData: BenefitUpdateData = {
          ...formData,
          id: benefit.id
        };
        await benefitsApi.updateBenefit(updateData);
      } else {
        await benefitsApi.createBenefit(formData);
      }
      
      onSave();
    } catch (err) {
      console.error('Error saving benefit:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientTypeIcon = (type: string) => {
    switch (type) {
      case 'INPATIENT':
        return <Activity className="w-4 h-4" />;
      case 'OUTPATIENT':
        return <Heart className="w-4 h-4" />;
      case 'BOTH':
        return <div className="flex gap-1"><Heart className="w-3 h-3" /><Activity className="w-3 h-3" /></div>;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xs"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    >
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: '#4a4a4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              {getPatientTypeIcon(formData.in_or_out_patient)}
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {benefit ? 'Edit Benefit' : 'Add New Benefit'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {benefit ? 'Update benefit information' : 'Create a new insurance benefit'}
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
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>Benefit Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Benefit Name *
                  </label>
                  <input
                    type="text"
                    value={formData.benefit_name}
                    onChange={(e) => handleInputChange('benefit_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: '#3b3b3b', 
                      color: '#ffffff',
                      borderColor: errors.benefit_name ? '#ef4444' : '#4a4a4a'
                    }}
                    placeholder="Enter benefit name"
                  />
                  {errors.benefit_name && (
                    <p className="mt-1 text-sm text-red-400">{errors.benefit_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Patient Type *
                  </label>
                  <select
                    value={formData.in_or_out_patient}
                    onChange={(e) => handleInputChange('in_or_out_patient', e.target.value as 'INPATIENT' | 'OUTPATIENT' | 'BOTH')}
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: '#3b3b3b', 
                      color: '#ffffff',
                      borderColor: '#4a4a4a'
                    }}
                  >
                    <option value="INPATIENT">Inpatient</option>
                    <option value="OUTPATIENT">Outpatient</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
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
                    borderColor: errors.description ? '#ef4444' : '#4a4a4a'
                  }}
                  placeholder="Enter benefit description"
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <p className="text-sm text-red-400">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-400 ml-auto">
                    {formData.description.length}/500 characters
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Limit Amount (UGX)
                </label>
                <input
                  type="number"
                  value={formData.limit_amount || ''}
                  onChange={(e) => handleInputChange('limit_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#3b3b3b', 
                    color: '#ffffff',
                    borderColor: errors.limit_amount ? '#ef4444' : '#4a4a4a'
                  }}
                  placeholder="Enter limit amount (optional)"
                  min="0"
                  step="0.01"
                />
                {errors.limit_amount && (
                  <p className="mt-1 text-sm text-red-400">{errors.limit_amount}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Leave empty for unlimited coverage
                </p>
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
            {loading ? 'Saving...' : (benefit ? 'Update' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
};
