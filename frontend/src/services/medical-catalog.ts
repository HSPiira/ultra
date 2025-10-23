import { api } from './api';
import type { 
  Service,
  Medicine,
  LabTest,
  HospitalItemPrice,
  ServiceFilters,
  MedicineFilters,
  LabTestFilters,
  HospitalItemPriceFilters,
  ServiceCreateData,
  ServiceUpdateData,
  MedicineCreateData,
  MedicineUpdateData,
  LabTestCreateData,
  LabTestUpdateData,
  HospitalItemPriceCreateData,
  HospitalItemPriceUpdateData,
  MedicalCatalogStatistics
} from '../types/medical-catalog';

export const medicalCatalogApi = {
  // Services CRUD
  getServices: async (filters?: ServiceFilters): Promise<Service[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.service_type) params.append('service_type', filters.service_type);
    if (filters?.ordering) params.append('ordering', filters.ordering);

        const response = await api.get(`/services/?${params.toString()}`);
        return (response.data as any).results as Service[];
  },

  getService: async (id: string): Promise<Service> => {
    const response = await api.get(`/services/${id}/`);
    return response.data as Service;
  },

  createService: async (data: ServiceCreateData): Promise<Service> => {
    const response = await api.post('/services/', data);
    return response.data as Service;
  },

  updateService: async (data: ServiceUpdateData): Promise<Service> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/services/${id}/`, updateData);
    return response.data as Service;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}/`);
  },

  // Medicines CRUD
  getMedicines: async (filters?: MedicineFilters): Promise<Medicine[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dosage_form) params.append('dosage_form', filters.dosage_form);
    if (filters?.route) params.append('route', filters.route);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await api.get(`/medicines/?${params.toString()}`);
    return (response.data as any).results as Medicine[];
  },

  getMedicine: async (id: string): Promise<Medicine> => {
    const response = await api.get(`/medicines/${id}/`);
    return response.data as Medicine;
  },

  createMedicine: async (data: MedicineCreateData): Promise<Medicine> => {
    const response = await api.post('/medicines/', data);
    return response.data as Medicine;
  },

  updateMedicine: async (data: MedicineUpdateData): Promise<Medicine> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/medicines/${id}/`, updateData);
    return response.data as Medicine;
  },

  deleteMedicine: async (id: string): Promise<void> => {
    await api.delete(`/medicines/${id}/`);
  },

  // Lab Tests CRUD
  getLabTests: async (filters?: LabTestFilters): Promise<LabTest[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await api.get(`/lab-tests/?${params.toString()}`);
    return (response.data as any).results as LabTest[];
  },

  getLabTest: async (id: string): Promise<LabTest> => {
    const response = await api.get(`/lab-tests/${id}/`);
    return response.data as LabTest;
  },

  createLabTest: async (data: LabTestCreateData): Promise<LabTest> => {
    const response = await api.post('/lab-tests/', data);
    return response.data as LabTest;
  },

  updateLabTest: async (data: LabTestUpdateData): Promise<LabTest> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/lab-tests/${id}/`, updateData);
    return response.data as LabTest;
  },

  deleteLabTest: async (id: string): Promise<void> => {
    await api.delete(`/lab-tests/${id}/`);
  },

  // Hospital Item Prices CRUD
  getHospitalItemPrices: async (filters?: HospitalItemPriceFilters): Promise<HospitalItemPrice[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.hospital) params.append('hospital', filters.hospital);
    if (filters?.content_type) params.append('content_type', filters.content_type);
    if (filters?.available !== undefined) params.append('available', filters.available.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await api.get(`/hospital-item-prices/?${params.toString()}`);
    return (response.data as any).results as HospitalItemPrice[];
  },

  getHospitalItemPrice: async (id: string): Promise<HospitalItemPrice> => {
    const response = await api.get(`/hospital-item-prices/${id}/`);
    return response.data as HospitalItemPrice;
  },

  createHospitalItemPrice: async (data: HospitalItemPriceCreateData): Promise<HospitalItemPrice> => {
    const response = await api.post('/hospital-item-prices/', data);
    return response.data as HospitalItemPrice;
  },

  updateHospitalItemPrice: async (data: HospitalItemPriceUpdateData): Promise<HospitalItemPrice> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/hospital-item-prices/${id}/`, updateData);
    return response.data as HospitalItemPrice;
  },

  deleteHospitalItemPrice: async (id: string): Promise<void> => {
    await api.delete(`/hospital-item-prices/${id}/`);
  },

  // Status management for all items
  activateService: async (id: string): Promise<Service> => {
    const response = await api.post(`/services/${id}/activate/`);
    return response.data as Service;
  },

  deactivateService: async (id: string): Promise<Service> => {
    const response = await api.post(`/services/${id}/deactivate/`);
    return response.data as Service;
  },

  suspendService: async (id: string, reason: string): Promise<Service> => {
    const response = await api.post(`/services/${id}/suspend/`, { reason });
    return response.data as Service;
  },

  activateMedicine: async (id: string): Promise<Medicine> => {
    const response = await api.post(`/medicines/${id}/activate/`);
    return response.data as Medicine;
  },

  deactivateMedicine: async (id: string): Promise<Medicine> => {
    const response = await api.post(`/medicines/${id}/deactivate/`);
    return response.data as Medicine;
  },

  suspendMedicine: async (id: string, reason: string): Promise<Medicine> => {
    const response = await api.post(`/medicines/${id}/suspend/`, { reason });
    return response.data as Medicine;
  },

  activateLabTest: async (id: string): Promise<LabTest> => {
    const response = await api.post(`/lab-tests/${id}/activate/`);
    return response.data as LabTest;
  },

  deactivateLabTest: async (id: string): Promise<LabTest> => {
    const response = await api.post(`/lab-tests/${id}/deactivate/`);
    return response.data as LabTest;
  },

  suspendLabTest: async (id: string, reason: string): Promise<LabTest> => {
    const response = await api.post(`/lab-tests/${id}/suspend/`, { reason });
    return response.data as LabTest;
  },

  activateHospitalItemPrice: async (id: string): Promise<HospitalItemPrice> => {
    const response = await api.post(`/hospital-item-prices/${id}/activate/`);
    return response.data as HospitalItemPrice;
  },

  deactivateHospitalItemPrice: async (id: string): Promise<HospitalItemPrice> => {
    const response = await api.post(`/hospital-item-prices/${id}/deactivate/`);
    return response.data as HospitalItemPrice;
  },

  suspendHospitalItemPrice: async (id: string, reason: string): Promise<HospitalItemPrice> => {
    const response = await api.post(`/hospital-item-prices/${id}/suspend/`, { reason });
    return response.data as HospitalItemPrice;
  },

  // Statistics
  getMedicalCatalogStatistics: async (): Promise<MedicalCatalogStatistics> => {
    const response = await api.get('/statistics/statistics/');
    return response.data as MedicalCatalogStatistics;
  },

  // Bulk operations
  bulkUpdateServices: async (updates: ServiceUpdateData[]): Promise<Service[]> => {
    const response = await api.post('/services/bulk-update/', { updates });
    return response.data as Service[];
  },

  bulkUpdateMedicines: async (updates: MedicineUpdateData[]): Promise<Medicine[]> => {
    const response = await api.post('/medicines/bulk-update/', { updates });
    return response.data as Medicine[];
  },

  bulkUpdateLabTests: async (updates: LabTestUpdateData[]): Promise<LabTest[]> => {
    const response = await api.post('/lab-tests/bulk-update/', { updates });
    return response.data as LabTest[];
  },

  // Search and filtering
  searchMedicalItems: async (query: string, type?: 'service' | 'medicine' | 'labtest'): Promise<{
    services: Service[];
    medicines: Medicine[];
    lab_tests: LabTest[];
  }> => {
    const params = new URLSearchParams();
    params.append('search', query);
    if (type) params.append('type', type);

    const response = await api.get(`/search/?${params.toString()}`);
    return response.data as {
      services: Service[];
      medicines: Medicine[];
      lab_tests: LabTest[];
    };
  },

  // Price management
  updateItemPrice: async (itemId: string, itemType: 'service' | 'medicine' | 'labtest', hospitalId: string, amount: number): Promise<HospitalItemPrice> => {
    const response = await api.post('/update-price/', {
      item_id: itemId,
      item_type: itemType,
      hospital_id: hospitalId,
      amount
    });
    return response.data as HospitalItemPrice;
  },

  getItemPrices: async (itemId: string, itemType: 'service' | 'medicine' | 'labtest'): Promise<HospitalItemPrice[]> => {
    const response = await api.get(`/item-prices/${itemType}/${itemId}/`);
    return response.data as HospitalItemPrice[];
  },
};
