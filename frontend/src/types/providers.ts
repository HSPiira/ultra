// Base types for providers
export interface BaseProvider {
  id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

// Hospital types
export interface Hospital extends BaseProvider {
  name: string;
  address: string;
  branch_of?: string;
  contact_person: string;
  phone_number: string;
  email: string;
  website: string;
}

export interface HospitalFormData {
  name: string;
  address: string;
  branch_of?: string;
  contact_person: string;
  phone_number: string;
  email: string;
  website: string;
}

// Doctor types
export interface Doctor extends BaseProvider {
  name: string;
  specialization: string;
  license_number: string;
  qualification: string;
  phone_number: string;
  email: string;
  hospitals: string[];
  hospital_detail?: Hospital;
  affiliations: DoctorHospitalAffiliation[];
}

export interface DoctorFormData {
  name: string;
  specialization: string;
  license_number: string;
  qualification: string;
  phone_number: string;
  email: string;
  hospital?: string;
  hospitals?: string[];
  affiliations_payload?: DoctorHospitalAffiliationFormData[];
}

// Doctor-Hospital Affiliation types
export interface DoctorHospitalAffiliation extends BaseProvider {
  hospital: string;
  hospital_detail: Hospital;
  role: string;
  start_date?: string;
  end_date?: string;
  is_primary: boolean;
}

export interface DoctorHospitalAffiliationFormData {
  hospital: string;
  role: string;
  start_date?: string;
  end_date?: string;
  is_primary: boolean;
}

// API response types
export interface ProvidersListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: (Doctor | Hospital)[];
}

export interface DoctorListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Doctor[];
}

export interface HospitalListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Hospital[];
}

// Filter and search types
export interface DoctorFilters {
  search?: string;
  status?: 'active' | 'inactive';
  hospital?: string;
  hospitals?: string;
  specialization?: string;
  ordering?: string;
  page_size?: number;
  page?: number;
}

export interface HospitalFilters {
  search?: string;
  status?: 'active' | 'inactive';
  branch_of?: string;
  ordering?: string;
  page_size?: number;
  page?: number;
}

// Form validation types
export interface DoctorFormErrors {
  name?: string[];
  specialization?: string[];
  license_number?: string[];
  qualification?: string[];
  phone_number?: string[];
  email?: string[];
  hospital?: string[];
  hospitals?: string[];
  affiliations_payload?: string[];
  non_field_errors?: string[];
}

export interface HospitalFormErrors {
  name?: string[];
  address?: string[];
  branch_of?: string[];
  contact_person?: string[];
  phone_number?: string[];
  email?: string[];
  website?: string[];
  non_field_errors?: string[];
}

// Component props types
export interface DoctorListProps {
  doctors: Doctor[];
  loading: boolean;
  error?: string;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
  onView: (doctor: Doctor) => void;
}

export interface DoctorFormProps {
  doctor?: Doctor;
  hospitals: Hospital[];
  onSubmit: (data: DoctorFormData) => void;
  onCancel: () => void;
  loading: boolean;
  errors?: DoctorFormErrors;
}

export interface HospitalListProps {
  hospitals: Hospital[];
  loading: boolean;
  error?: string;
  onEdit: (hospital: Hospital) => void;
  onDelete: (hospital: Hospital) => void;
  onView: (hospital: Hospital) => void;
}

export interface HospitalFormProps {
  hospital?: Hospital;
  hospitals: Hospital[]; // For branch selection
  onSubmit: (data: HospitalFormData) => void;
  onCancel: () => void;
  loading: boolean;
  errors?: HospitalFormErrors;
}

export interface DoctorDetailProps {
  doctor: Doctor;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export interface HospitalDetailProps {
  hospital: Hospital;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

// Store types
export interface ProvidersState {
  doctors: {
    items: Doctor[];
    loading: boolean;
    error: string | null;
    filters: DoctorFilters;
  };
  hospitals: {
    items: Hospital[];
    loading: boolean;
    error: string | null;
    filters: HospitalFilters;
  };
  selectedDoctor: Doctor | null;
  selectedHospital: Hospital | null;
}

// Action types
export interface SetDoctorsAction {
  type: 'SET_DOCTORS';
  payload: Doctor[];
}

export interface SetHospitalsAction {
  type: 'SET_HOSPITALS';
  payload: Hospital[];
}

export interface SetDoctorsLoadingAction {
  type: 'SET_DOCTORS_LOADING';
  payload: boolean;
}

export interface SetHospitalsLoadingAction {
  type: 'SET_HOSPITALS_LOADING';
  payload: boolean;
}

export interface SetDoctorsErrorAction {
  type: 'SET_DOCTORS_ERROR';
  payload: string | null;
}

export interface SetHospitalsErrorAction {
  type: 'SET_HOSPITALS_ERROR';
  payload: string | null;
}

export interface SetDoctorFiltersAction {
  type: 'SET_DOCTOR_FILTERS';
  payload: Partial<DoctorFilters>;
}

export interface SetHospitalFiltersAction {
  type: 'SET_HOSPITAL_FILTERS';
  payload: Partial<HospitalFilters>;
}

export interface SetSelectedDoctorAction {
  type: 'SET_SELECTED_DOCTOR';
  payload: Doctor | null;
}

export interface SetSelectedHospitalAction {
  type: 'SET_SELECTED_HOSPITAL';
  payload: Hospital | null;
}

export type ProvidersAction =
  | SetDoctorsAction
  | SetHospitalsAction
  | SetDoctorsLoadingAction
  | SetHospitalsLoadingAction
  | SetDoctorsErrorAction
  | SetHospitalsErrorAction
  | SetDoctorFiltersAction
  | SetHospitalFiltersAction
  | SetSelectedDoctorAction
  | SetSelectedHospitalAction;
