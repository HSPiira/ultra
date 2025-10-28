import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { medicalCatalogApi } from '../../services/medical-catalog';
import type { HospitalItemPrice, HospitalItemPriceCreateData, HospitalItemPriceUpdateData } from '../../types/medical-catalog';

interface HospitalPriceFormProps {
  price?: HospitalItemPrice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (price: HospitalItemPrice) => void;
}

export const HospitalPriceForm: React.FC<HospitalPriceFormProps> = ({
  price,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<HospitalItemPriceCreateData>({
    hospital: '',
    content_type: '',
    object_id: '',
    amount: 0,
    available: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [medicalItems, setMedicalItems] = useState<{
    services: any[];
    medicines: any[];
    labTests: any[];
  }>({
    services: [],
    medicines: [],
    labTests: []
  });

  useEffect(() => {
    if (isOpen) {
      loadHospitals();
      loadMedicalItems();
      
      if (price) {
        setFormData({
          hospital: price.hospital,
          content_type: price.content_type,
          object_id: price.object_id,
          amount: price.amount,
          available: price.available
        });
      } else {
        setFormData({
          hospital: '',
          content_type: '',
          object_id: '',
          amount: 0,
          available: true
        });
      }
      setErrors({});
    }
  }, [isOpen, price]);

  const loadHospitals = async () => {
    try {
      // This would need to be implemented in the API service
      // For now, we'll use mock data
      setHospitals([
        { id: '1', hospital_name: 'General Hospital' },
        { id: '2', hospital_name: 'City Medical Center' },
        { id: '3', hospital_name: 'University Hospital' }
      ]);
    } catch (err) {
      console.error('Error loading hospitals:', err);
    }
  };

  const loadMedicalItems = async () => {
    try {
      const [services, medicines, labTests] = await Promise.all([
        medicalCatalogApi.getServices(),
        medicalCatalogApi.getMedicines(),
        medicalCatalogApi.getLabTests()
      ]);
      
      setMedicalItems({
        services,
        medicines,
        labTests
      });
    } catch (err) {
      console.error('Error loading medical items:', err);
    }
  };

  const handleInputChange = (field: keyof HospitalItemPriceCreateData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getItemsForType = (contentType: string) => {
    switch (contentType) {
      case 'service':
        return medicalItems.services;
      case 'medicine':
        return medicalItems.medicines;
      case 'labtest':
        return medicalItems.labTests;
      default:
        return [];
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.hospital) {
      newErrors.hospital = 'Hospital is required';
    }

    if (!formData.content_type) {
      newErrors.content_type = 'Item type is required';
    }

    if (!formData.object_id) {
      newErrors.object_id = 'Item is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
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
      let savedPrice: HospitalItemPrice;
      
      if (price) {
        // Update existing price
        const updateData: HospitalItemPriceUpdateData = {
          id: price.id,
          ...formData
        };
        savedPrice = await medicalCatalogApi.updateHospitalItemPrice(updateData);
      } else {
        // Create new price
        savedPrice = await medicalCatalogApi.createHospitalItemPrice(formData);
      }
      
      onSave(savedPrice);
      onClose();
    } catch (err: any) {
      console.error('Error saving hospital price:', err);
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
              <Building2 className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {price ? 'Edit Hospital Price' : 'Add New Hospital Price'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {price ? 'Update hospital pricing information' : 'Create a new hospital price entry'}
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
              {/* Hospital */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Hospital *
                </label>
                <select
                  value={formData.hospital}
                  onChange={(e) => handleInputChange('hospital', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.hospital ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.hospital ? '#ef4444' : '#404040'
                  }}
                >
                  <option value="">Select hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.hospital_name}
                    </option>
                  ))}
                </select>
                {errors.hospital && (
                  <p className="mt-1 text-sm text-red-400">{errors.hospital}</p>
                )}
              </div>

              {/* Item Type */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Item Type *
                </label>
                <select
                  value={formData.content_type}
                  onChange={(e) => {
                    handleInputChange('content_type', e.target.value);
                    handleInputChange('object_id', ''); // Reset item selection
                  }}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.content_type ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.content_type ? '#ef4444' : '#404040'
                  }}
                >
                  <option value="">Select item type</option>
                  <option value="service">Service</option>
                  <option value="medicine">Medicine</option>
                  <option value="labtest">Lab Test</option>
                </select>
                {errors.content_type && (
                  <p className="mt-1 text-sm text-red-400">{errors.content_type}</p>
                )}
              </div>

              {/* Item Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Item *
                </label>
                <select
                  value={formData.object_id}
                  onChange={(e) => handleInputChange('object_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.object_id ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.object_id ? '#ef4444' : '#404040'
                  }}
                  disabled={!formData.content_type}
                >
                  <option value="">Select item</option>
                  {getItemsForType(formData.content_type).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {errors.object_id && (
                  <p className="mt-1 text-sm text-red-400">{errors.object_id}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    errors.amount ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderColor: errors.amount ? '#ef4444' : '#404040'
                  }}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
                )}
              </div>

              {/* Available */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Available
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="available"
                      checked={formData.available === true}
                      onChange={() => handleInputChange('available', true)}
                      className="mr-2"
                    />
                    <span className="text-sm" style={{ color: '#d1d5db' }}>Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="available"
                      checked={formData.available === false}
                      onChange={() => handleInputChange('available', false)}
                      className="mr-2"
                    />
                    <span className="text-sm" style={{ color: '#d1d5db' }}>No</span>
                  </label>
                </div>
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
            {price ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
