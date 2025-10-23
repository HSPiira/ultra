export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  base_amount: number;
  service_type: string;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Medicine {
  id: string;
  name: string;
  dosage_form: string;
  unit_price: number;
  route: string;
  duration: string;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface LabTest {
  id: string;
  name: string;
  category: string;
  description: string;
  base_amount: number;
  normal_range: string;
  units: string;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Hospital {
  id: string;
  hospital_name: string;
  address: string;
  contact_person: string;
  email: string;
  phone_number: string;
}

export interface HospitalItemPrice {
  id: string;
  hospital: string;
  hospital_detail: Hospital;
  content_type: string;
  object_id: string;
  content_object: Service | Medicine | LabTest;
  amount: number;
  available: boolean;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// Filter interfaces
export interface ServiceFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  category?: string;
  service_type?: string;
  ordering?: string;
}

export interface MedicineFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  dosage_form?: string;
  route?: string;
  ordering?: string;
}

export interface LabTestFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  category?: string;
  ordering?: string;
}

export interface HospitalItemPriceFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  hospital?: string;
  content_type?: string;
  available?: boolean;
  ordering?: string;
}

// Create/Update data interfaces
export interface ServiceCreateData {
  name: string;
  category: string;
  description: string;
  base_amount: number;
  service_type: string;
}

export interface ServiceUpdateData extends Partial<ServiceCreateData> {
  id: string;
}

export interface MedicineCreateData {
  name: string;
  dosage_form: string;
  unit_price: number;
  route: string;
  duration: string;
}

export interface MedicineUpdateData extends Partial<MedicineCreateData> {
  id: string;
}

export interface LabTestCreateData {
  name: string;
  category: string;
  description: string;
  base_amount: number;
  normal_range: string;
  units: string;
}

export interface LabTestUpdateData extends Partial<LabTestCreateData> {
  id: string;
}

export interface HospitalItemPriceCreateData {
  hospital: string;
  content_type: string;
  object_id: string;
  amount: number;
  available: boolean;
}

export interface HospitalItemPriceUpdateData extends Partial<HospitalItemPriceCreateData> {
  id: string;
}

// Statistics interfaces
export interface MedicalCatalogStatistics {
  total_services: number;
  total_medicines: number;
  total_lab_tests: number;
  total_hospital_prices: number;
  active_services: number;
  active_medicines: number;
  active_lab_tests: number;
  total_value: number;
  average_service_price: number;
  average_medicine_price: number;
  average_lab_test_price: number;
}

// Union types for generic handling
export type MedicalItem = Service | Medicine | LabTest;
export type MedicalItemType = 'service' | 'medicine' | 'labtest';
export type MedicalItemFilters = ServiceFilters | MedicineFilters | LabTestFilters;
export type MedicalItemCreateData = ServiceCreateData | MedicineCreateData | LabTestCreateData;
export type MedicalItemUpdateData = ServiceUpdateData | MedicineUpdateData | LabTestUpdateData;
