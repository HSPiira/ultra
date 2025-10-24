import React, { useState, useEffect } from 'react';
import type { Doctor, Hospital, DoctorFormData, DoctorFormErrors } from '../../../types/providers';
import { providersUtils } from '../../../services/providers';

interface DoctorFormProps {
  doctor?: Doctor;
  hospitals: Hospital[];
  onSubmit: (data: DoctorFormData) => void;
  onCancel: () => void;
  loading: boolean;
  errors?: DoctorFormErrors;
}

const DoctorForm: React.FC<DoctorFormProps> = ({
  doctor,
  hospitals,
  onSubmit,
  onCancel,
  loading,
  errors = {},
}) => {
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    specialization: '',
    license_number: '',
    qualification: '',
    phone_number: '',
    email: '',
    hospital: '',
    hospitals: [],
    affiliations_payload: [],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [affiliations, setAffiliations] = useState<Array<{
    hospital: string;
    role: string;
    start_date: string;
    end_date: string;
    is_primary: boolean;
  }>>([]);

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        specialization: doctor.specialization || '',
        license_number: doctor.license_number || '',
        qualification: doctor.qualification || '',
        phone_number: doctor.phone_number || '',
        email: doctor.email || '',
        hospital: doctor.hospital_detail?.id || '',
        hospitals: doctor.hospitals || [],
        affiliations_payload: doctor.affiliations?.map(aff => ({
          hospital: aff.hospital,
          role: aff.role || '',
          start_date: aff.start_date || '',
          end_date: aff.end_date || '',
          is_primary: aff.is_primary || false,
        })) || [],
      });
      
      setAffiliations(doctor.affiliations?.map(aff => ({
        hospital: aff.hospital,
        role: aff.role || '',
        start_date: aff.start_date || '',
        end_date: aff.end_date || '',
        is_primary: aff.is_primary || false,
      })) || []);
    }
  }, [doctor]);

  const handleInputChange = (field: keyof DoctorFormData, value: string | string[]) => {
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

  const handleAffiliationChange = (index: number, field: string, value: string | boolean) => {
    const updatedAffiliations = [...affiliations];
    updatedAffiliations[index] = {
      ...updatedAffiliations[index],
      [field]: value,
    };
    setAffiliations(updatedAffiliations);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      affiliations_payload: updatedAffiliations,
    }));
  };

  const addAffiliation = () => {
    const newAffiliation = {
      hospital: '',
      role: '',
      start_date: '',
      end_date: '',
      is_primary: false,
    };
    const updatedAffiliations = [...affiliations, newAffiliation];
    setAffiliations(updatedAffiliations);
    setFormData(prev => ({
      ...prev,
      affiliations_payload: updatedAffiliations,
    }));
  };

  const removeAffiliation = (index: number) => {
    const updatedAffiliations = affiliations.filter((_, i) => i !== index);
    setAffiliations(updatedAffiliations);
    setFormData(prev => ({
      ...prev,
      affiliations_payload: updatedAffiliations,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = providersUtils.validateDoctorForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Ensure only one primary affiliation
    const primaryCount = affiliations.filter(aff => aff.is_primary).length;
    if (primaryCount > 1) {
      setValidationErrors({ affiliations_payload: 'Only one primary affiliation is allowed' });
      return;
    }

    onSubmit(formData);
  };

  const getFieldError = (field: keyof DoctorFormData) => {
    return errors[field]?.[0] || validationErrors[field] || '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {doctor ? 'Edit Doctor' : 'Add New Doctor'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('name') ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Dr. John Doe"
                disabled={loading}
              />
              {getFieldError('name') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('name')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                License Number *
              </label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('license_number') ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="MD123456"
                disabled={loading}
              />
              {getFieldError('license_number') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('license_number')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cardiology"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Qualification
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => handleInputChange('qualification', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MBBS, MD"
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
                placeholder="doctor@hospital.com"
                disabled={loading}
              />
              {getFieldError('email') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('email')}</p>
              )}
            </div>
          </div>

          {/* Hospital Affiliations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Hospital Affiliations</h3>
              <button
                type="button"
                onClick={addAffiliation}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                disabled={loading}
              >
                Add Affiliation
              </button>
            </div>

            {affiliations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No hospital affiliations added yet.</p>
                <p className="text-sm">Click "Add Affiliation" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {affiliations.map((affiliation, index) => (
                  <div key={index} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-medium">Affiliation {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeAffiliation(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        disabled={loading}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Hospital *
                        </label>
                        <select
                          value={affiliation.hospital}
                          onChange={(e) => handleAffiliationChange(index, 'hospital', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          <option value="">Select Hospital</option>
                          {hospitals.map(hospital => (
                            <option key={hospital.id} value={hospital.id}>
                              {hospital.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Role
                        </label>
                        <input
                          type="text"
                          value={affiliation.role}
                          onChange={(e) => handleAffiliationChange(index, 'role', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Consultant, Resident, etc."
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={affiliation.start_date}
                          onChange={(e) => handleAffiliationChange(index, 'start_date', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={affiliation.end_date}
                          onChange={(e) => handleAffiliationChange(index, 'end_date', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={affiliation.is_primary}
                          onChange={(e) => handleAffiliationChange(index, 'is_primary', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading}
                        />
                        <span className="ml-2 text-sm text-gray-300">
                          Primary Hospital
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {getFieldError('affiliations_payload') && (
              <p className="mt-2 text-sm text-red-400">{getFieldError('affiliations_payload')}</p>
            )}
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
              {loading ? 'Saving...' : (doctor ? 'Update Doctor' : 'Create Doctor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm;
