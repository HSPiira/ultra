import { api } from './api';
import type { Plan, PlanCreateData, PlanUpdateData, PlanFilters } from '../types/plans';

export const plansApi = {
  // Plans CRUD
  getPlans: async (filters?: PlanFilters): Promise<Plan[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await api.get(`/plans/?${params.toString()}`);
    return (response.data as any).results as Plan[];
  },

  getPlan: async (id: string): Promise<Plan> => {
    const response = await api.get(`/plans/${id}/`);
    return response.data as Plan;
  },

  createPlan: async (data: PlanCreateData): Promise<Plan> => {
    const response = await api.post('/plans/', data);
    return response.data as Plan;
  },

  updatePlan: async (data: PlanUpdateData): Promise<Plan> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/plans/${id}/`, updateData);
    return response.data as Plan;
  },

  deletePlan: async (id: string): Promise<void> => {
    await api.delete(`/plans/${id}/`);
  },

  // Status management
  activatePlan: async (id: string): Promise<Plan> => {
    const response = await api.post(`/plans/${id}/activate/`);
    return response.data as Plan;
  },

  deactivatePlan: async (id: string): Promise<Plan> => {
    const response = await api.post(`/plans/${id}/deactivate/`);
    return response.data as Plan;
  },

  suspendPlan: async (id: string, reason?: string): Promise<Plan> => {
    const response = await api.post(`/plans/${id}/suspend/`, reason ? { reason } : {});
    return response.data as Plan;
  },
};
