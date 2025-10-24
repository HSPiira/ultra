import { api } from './api';
import type {
  Doctor,
  Hospital,
  DoctorFormData,
  HospitalFormData,
  DoctorFilters,
  HospitalFilters,
  DoctorListResponse,
  HospitalListResponse,
} from '../types/providers';

// Hospital API functions
export const hospitalApi = {
  // Get all hospitals with optional filters
  getHospitals: async (filters?: HospitalFilters): Promise<HospitalListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branch_of) params.append('branch_of', filters.branch_of);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const url = queryString ? `/hospitals/?${queryString}` : '/hospitals/';
    
    const response = await api.get<HospitalListResponse>(url);
    return response.data;
  },

  // Get single hospital by ID
  getHospital: async (id: string): Promise<Hospital> => {
    const response = await api.get<Hospital>(`/hospitals/${id}/`);
    return response.data;
  },

  // Create new hospital
  createHospital: async (data: HospitalFormData): Promise<Hospital> => {
    const response = await api.post<Hospital>('/hospitals/', data);
    return response.data;
  },

  // Update hospital
  updateHospital: async (id: string, data: Partial<HospitalFormData>): Promise<Hospital> => {
    const response = await api.put<Hospital>(`/hospitals/${id}/`, data);
    return response.data;
  },

  // Partial update hospital
  patchHospital: async (id: string, data: Partial<HospitalFormData>): Promise<Hospital> => {
    const response = await api.patch<Hospital>(`/hospitals/${id}/`, data);
    return response.data;
  },

  // Delete hospital (soft delete)
  deleteHospital: async (id: string): Promise<void> => {
    await api.delete(`/hospitals/${id}/`);
  },
};

// Doctor API functions
export const doctorApi = {
  // Get all doctors with optional filters
  getDoctors: async (filters?: DoctorFilters): Promise<DoctorListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.hospital) params.append('hospital', filters.hospital);
    if (filters?.hospitals) params.append('hospitals', filters.hospitals);
    if (filters?.specialization) params.append('specialization', filters.specialization);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const url = queryString ? `/doctors/?${queryString}` : '/doctors/';
    
    const response = await api.get<DoctorListResponse>(url);
    return response.data;
  },

  // Get single doctor by ID
  getDoctor: async (id: string): Promise<Doctor> => {
    const response = await api.get<Doctor>(`/doctors/${id}/`);
    return response.data;
  },

  // Create new doctor
  createDoctor: async (data: DoctorFormData): Promise<Doctor> => {
    const response = await api.post<Doctor>('/doctors/', data);
    return response.data;
  },

  // Update doctor
  updateDoctor: async (id: string, data: Partial<DoctorFormData>): Promise<Doctor> => {
    const response = await api.put<Doctor>(`/doctors/${id}/`, data);
    return response.data;
  },

  // Partial update doctor
  patchDoctor: async (id: string, data: Partial<DoctorFormData>): Promise<Doctor> => {
    const response = await api.patch<Doctor>(`/doctors/${id}/`, data);
    return response.data;
  },

  // Delete doctor (soft delete)
  deleteDoctor: async (id: string): Promise<void> => {
    await api.delete(`/doctors/${id}/`);
  },
};

// Combined providers API
export const providersApi = {
  hospitals: hospitalApi,
  doctors: doctorApi,
};

// Utility functions
export const providersUtils = {
  // Format doctor name for display
  formatDoctorName: (doctor: Doctor): string => {
    return doctor.name;
  },

  // Format hospital name for display
  formatHospitalName: (hospital: Hospital): string => {
    return hospital.name;
  },

  // Get doctor's primary hospital
  getPrimaryHospital: (doctor: Doctor): Hospital | null => {
    const primaryAffiliation = doctor.affiliations?.find(aff => aff.is_primary);
    return primaryAffiliation?.hospital_detail || null;
  },

  // Get doctor's specializations as comma-separated string
  getDoctorSpecializations: (doctor: Doctor): string => {
    return doctor.specialization || 'Not specified';
  },

  // Format phone number for display
  formatPhoneNumber: (phone: string): string => {
    if (!phone) return '';
    // Simple formatting - can be enhanced based on requirements
    return phone;
  },

  // Format email for display
  formatEmail: (email: string): string => {
    return email || 'Not provided';
  },

  // Check if doctor has active affiliations
  hasActiveAffiliations: (doctor: Doctor): boolean => {
    return doctor.affiliations && doctor.affiliations.length > 0;
  },

  // Get doctor's current role at a specific hospital
  getDoctorRoleAtHospital: (doctor: Doctor, hospitalId: string): string => {
    const affiliation = doctor.affiliations?.find(aff => aff.hospital === hospitalId);
    return affiliation?.role || 'Not specified';
  },

  // Check if hospital is a branch
  isBranchHospital: (hospital: Hospital): boolean => {
    return !!hospital.branch_of;
  },

  // Get hospital's parent hospital name
  getParentHospitalName: (hospital: Hospital, hospitals: Hospital[]): string => {
    if (!hospital.branch_of) return '';
    const parent = hospitals.find(h => h.id === hospital.branch_of);
    return parent?.name || 'Unknown';
  },

  // Validate doctor form data
  validateDoctorForm: (data: DoctorFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (!data.license_number?.trim()) {
      errors.license_number = 'License number is required';
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (data.phone_number && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone_number.replace(/\s/g, ''))) {
      errors.phone_number = 'Please enter a valid phone number';
    }

    return errors;
  },

  // Validate hospital form data
  validateHospitalForm: (data: HospitalFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (data.phone_number && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone_number.replace(/\s/g, ''))) {
      errors.phone_number = 'Please enter a valid phone number';
    }

    if (data.website && !/^https?:\/\/.+/.test(data.website)) {
      errors.website = 'Please enter a valid website URL (starting with http:// or https://)';
    }

    return errors;
  },
};

export default providersApi;
