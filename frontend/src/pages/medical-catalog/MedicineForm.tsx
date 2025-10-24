import React, { useState, useEffect } from 'react';
import { X, Save, Pill } from 'lucide-react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { Medicine, MedicineCreateData, MedicineUpdateData } from '../../types/medical-catalog';

interface MedicineFormProps {
  medicine?: Medicine | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicine: Medicine) => void;
}

export const MedicineForm: React.FC<MedicineFormProps> = ({
  medicine,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<MedicineCreateData>({
    name: '',
    dosage_form: '',
    unit_price: 0,
    route: '',
    duration: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (medicine) {
        setFormData({
          name: medicine.name,
          dosage_form: medicine.dosage_form,
          unit_price: medicine.unit_price,
          route: medicine.route,
          duration: medicine.duration
        });
      } else {
        setFormData({
          name: '',
          dosage_form: '',
          unit_price: 0,
          route: '',
          duration: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, medicine]);

  const handleInputChange = (field: keyof MedicineCreateData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Medicine name must be at least 2 characters';
    }

    if (!formData.dosage_form.trim()) {
      newErrors.dosage_form = 'Dosage form is required';
    }

    if (!formData.route.trim()) {
      newErrors.route = 'Route is required';
    }

    if (formData.unit_price <= 0) {
      newErrors.unit_price = 'Unit price must be greater than 0';
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
      let savedMedicine: Medicine;
      
      if (medicine) {
        // Update existing medicine
        const updateData: MedicineUpdateData = {
          id: medicine.id,
          ...formData
        };
        savedMedicine = await medicalCatalogApi.updateMedicine(updateData);
      } else {
        // Create new medicine
        savedMedicine = await medicalCatalogApi.createMedicine(formData);
      }
      
      onSave(savedMedicine);
      onClose();
    } catch (err: any) {
      console.error('Error saving medicine:', err);
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
              <Pill className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {medicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {medicine ? 'Update medicine information' : 'Create a new medicine entry'}
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
              {/* Medicine Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Medicine Name *
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
                  placeholder="Enter medicine name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Dosage Form */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Dosage Form *
                </label>
                <select
                  value={formData.dosage_form}
                  onChange={(e) => handleInputChange('dosage_form', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.dosage_form ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.dosage_form ? '#ef4444' : '#404040'
                  }}
                >
                  <option value="">Select dosage form</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drops">Drops</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Patch">Patch</option>
                  <option value="Suppository">Suppository</option>
                </select>
                {errors.dosage_form && (
                  <p className="mt-1 text-sm text-red-400">{errors.dosage_form}</p>
                )}
              </div>

              {/* Route */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Route *
                </label>
                <select
                  value={formData.route}
                  onChange={(e) => handleInputChange('route', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.route ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.route ? '#ef4444' : '#404040'
                  }}
                >
                  <option value="">Select route</option>
                  <option value="Oral">Oral</option>
                  <option value="Intravenous">Intravenous</option>
                  <option value="Intramuscular">Intramuscular</option>
                  <option value="Subcutaneous">Subcutaneous</option>
                  <option value="Topical">Topical</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Rectal">Rectal</option>
                  <option value="Vaginal">Vaginal</option>
                  <option value="Ophthalmic">Ophthalmic</option>
                  <option value="Otic">Otic</option>
                </select>
                {errors.route && (
                  <p className="mt-1 text-sm text-red-400">{errors.route}</p>
                )}
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Unit Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.unit_price ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.unit_price ? '#ef4444' : '#404040'
                  }}
                  placeholder="0.00"
                />
                {errors.unit_price && (
                  <p className="mt-1 text-sm text-red-400">{errors.unit_price}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: '#404040'
                  }}
                  placeholder="e.g., 7 days, 2 weeks"
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
            {medicine ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
