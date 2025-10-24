import React, { useState, useEffect } from 'react';
import type { Hospital, HospitalFormData, HospitalFormErrors } from '../../../types/providers';
import { providersUtils } from '../../../services/providers';

interface HospitalFormProps {
  hospital?: Hospital;
  hospitals: Hospital[]; // For branch selection
  onSubmit: (data: HospitalFormData) => void;
  onCancel: () => void;
  loading: boolean;
  errors?: HospitalFormErrors;
}

const HospitalForm: React.FC<HospitalFormProps> = ({
  hospital,
  hospitals,
  onSubmit,
  onCancel,
  loading,
  errors = {},
}) => {
  const [formData, setFormData] = useState<HospitalFormData>({
    name: '',
    address: '',
    branch_of: '',
    contact_person: '',
    phone_number: '',
    email: '',
    website: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        address: hospital.address || '',
        branch_of: hospital.branch_of || '',
        contact_person: hospital.contact_person || '',
        phone_number: hospital.phone_number || '',
        email: hospital.email || '',
        website: hospital.website || '',
      });
    }
  }, [hospital]);

  const handleInputChange = (field: keyof HospitalFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = providersUtils.validateHospitalForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  const getFieldError = (field: keyof HospitalFormData) => {
    return errors[field]?.[0] || validationErrors[field] || '';
  };

  // Filter out current hospital from branch options to prevent self-reference
  const branchOptions = hospitals.filter(h => h.id !== hospital?.id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {hospital ? 'Edit Hospital' : 'Add New Hospital'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('name') ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="General Hospital"
                  disabled={loading}
                />
                {getFieldError('name') && (
                  <p className="mt-1 text-sm text-red-400">{getFieldError('name')}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street, City, State, ZIP Code"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent Hospital (if branch)
                </label>
                <select
                  value={formData.branch_of}
                  onChange={(e) => handleInputChange('branch_of', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Select Parent Hospital (optional)</option>
                  {branchOptions.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Leave empty if this is a main hospital, not a branch
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('phone_number') ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="+1234567890"
                  disabled={loading}
                />
                {getFieldError('phone_number') && (
                  <p className="mt-1 text-sm text-red-400">{getFieldError('phone_number')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('email') ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="contact@hospital.com"
                  disabled={loading}
                />
                {getFieldError('email') && (
                  <p className="mt-1 text-sm text-red-400">{getFieldError('email')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('website') ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="https://www.hospital.com"
                  disabled={loading}
                />
                {getFieldError('website') && (
                  <p className="mt-1 text-sm text-red-400">{getFieldError('website')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (hospital ? 'Update Hospital' : 'Create Hospital')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalForm;
