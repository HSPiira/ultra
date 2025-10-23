import { api } from './api';
import type { Benefit, BenefitCreateData, BenefitUpdateData, BenefitFilters } from '../types/benefits';

export const benefitsApi = {
  // Benefits CRUD
  getBenefits: async (filters?: BenefitFilters): Promise<Benefit[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.in_or_out_patient) params.append('in_or_out_patient', filters.in_or_out_patient);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await api.get(`/benefits/?${params.toString()}`);
    return (response.data as any).results as Benefit[];
  },

  getBenefit: async (id: string): Promise<Benefit> => {
    const response = await api.get(`/benefits/${id}/`);
    return response.data as Benefit;
  },

  createBenefit: async (data: BenefitCreateData): Promise<Benefit> => {
    const response = await api.post('/benefits/', data);
    return response.data as Benefit;
  },

  updateBenefit: async (data: BenefitUpdateData): Promise<Benefit> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/benefits/${id}/`, updateData);
    return response.data as Benefit;
  },

  deleteBenefit: async (id: string): Promise<void> => {
    await api.delete(`/benefits/${id}/`);
  },

  // Status management
  activateBenefit: async (id: string): Promise<Benefit> => {
    const response = await api.post(`/benefits/${id}/activate/`);
    return response.data as Benefit;
  },

  deactivateBenefit: async (id: string): Promise<Benefit> => {
    const response = await api.post(`/benefits/${id}/deactivate/`);
    return response.data as Benefit;
  },

  suspendBenefit: async (id: string, reason?: string): Promise<Benefit> => {
    const response = await api.post(`/benefits/${id}/suspend/`, reason ? { reason } : {});
    return response.data as Benefit;
  },
};
