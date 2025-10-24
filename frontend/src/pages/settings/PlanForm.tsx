import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { plansApi } from '../../services/plans';
import type { Plan, PlanCreateData, PlanUpdateData } from '../../types/plans';

interface PlanFormProps {
  plan?: Plan;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const PlanForm: React.FC<PlanFormProps> = ({
  plan,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<PlanCreateData>({
    plan_name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        setFormData({
          plan_name: plan.plan_name,
          description: plan.description || ''
        });
      } else {
        setFormData({
          plan_name: '',
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, plan]);

  const handleInputChange = (field: keyof PlanCreateData, value: string) => {
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

    if (!formData.plan_name.trim()) {
      newErrors.plan_name = 'Plan name is required';
    } else if (formData.plan_name.trim().length < 2) {
      newErrors.plan_name = 'Plan name must be at least 2 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
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
      
      if (plan) {
        const updateData: PlanUpdateData = {
          ...formData,
          id: plan.id
        };
        await plansApi.updatePlan(updateData);
      } else {
        await plansApi.createPlan(formData);
      }
      
      onSave();
    } catch (err) {
      console.error('Error saving plan:', err);
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
                {plan ? 'Edit Plan' : 'Add New Plan'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {plan ? 'Update plan information' : 'Create a new insurance plan'}
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
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>Plan Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.plan_name}
                  onChange={(e) => handleInputChange('plan_name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#3b3b3b', 
                    color: '#ffffff',
                    borderColor: errors.plan_name ? '#ef4444' : '#4a4a4a'
                  }}
                  placeholder="Enter plan name"
                />
                {errors.plan_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.plan_name}</p>
                )}
              </div>

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
                    backgroundColor: '#3b3b3b', 
                    color: '#ffffff',
                    borderColor: errors.description ? '#ef4444' : '#4a4a4a'
                  }}
                  placeholder="Enter plan description"
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
            {loading ? 'Saving...' : (plan ? 'Update' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
};
