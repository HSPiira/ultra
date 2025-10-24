import React from 'react';
import type { Doctor } from '../../../types/providers';
import { providersUtils } from '../../../services/providers';

interface DoctorDetailProps {
  doctor: Doctor;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const DoctorDetail: React.FC<DoctorDetailProps> = ({
  doctor,
  onEdit,
  onDelete,
  onBack,
}) => {
  const primaryHospital = providersUtils.getPrimaryHospital(doctor);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {providersUtils.formatDoctorName(doctor)}
              </h1>
              <p className="text-blue-400 text-lg">
                {providersUtils.getDoctorSpecializations(doctor)}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white font-medium">{doctor.name}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">License Number</p>
                  <p className="text-white font-medium">{doctor.license_number}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Specialization</p>
                  <p className="text-white font-medium">{doctor.specialization || 'Not specified'}</p>
                </div>
              </div>

              {doctor.qualification && (
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Qualification</p>
                    <p className="text-white font-medium">{doctor.qualification}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
            <div className="space-y-4">
              {doctor.email && (
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <a 
                      href={`mailto:${doctor.email}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {doctor.email}
                    </a>
                  </div>
                </div>
              )}

              {doctor.phone_number && (
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <a 
                      href={`tel:${doctor.phone_number}`}
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      {providersUtils.formatPhoneNumber(doctor.phone_number)}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    doctor.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {doctor.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hospital Affiliations */}
        {providersUtils.hasActiveAffiliations(doctor) && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Hospital Affiliations</h2>
            <div className="space-y-4">
              {doctor.affiliations?.map((affiliation, index) => (
                <div key={index} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-white">
                          {affiliation.hospital_detail?.name}
                        </h3>
                        {affiliation.is_primary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Primary
                          </span>
                        )}
                      </div>
                      
                      {affiliation.role && (
                        <p className="text-gray-300 mb-2">
                          <span className="font-medium">Role:</span> {affiliation.role}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        {affiliation.start_date && (
                          <div>
                            <span className="font-medium">Start:</span> {new Date(affiliation.start_date).toLocaleDateString()}
                          </div>
                        )}
                        {affiliation.end_date && (
                          <div>
                            <span className="font-medium">End:</span> {new Date(affiliation.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Hospital Summary */}
        {primaryHospital && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Primary Hospital</h2>
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">
                {primaryHospital.name}
              </h3>
              {primaryHospital.address && (
                <p className="text-gray-300 mb-1">{primaryHospital.address}</p>
              )}
              {primaryHospital.phone_number && (
                <p className="text-gray-300 mb-1">
                  <span className="font-medium">Phone:</span> {primaryHospital.phone_number}
                </p>
              )}
              {primaryHospital.email && (
                <p className="text-gray-300">
                  <span className="font-medium">Email:</span> {primaryHospital.email}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <span className="font-medium">Created:</span> {new Date(doctor.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(doctor.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;
