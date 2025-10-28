import { api } from './api';
import type { 
  Scheme, 
  SchemeFilters, 
  SchemeCreateData, 
  SchemeUpdateData,
  SchemeStatistics
} from '../types/schemes';

export const schemesApi = {
  // Schemes CRUD
  getSchemes: async (filters?: SchemeFilters): Promise<Scheme[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.company) params.append('company', filters.company);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await api.get(`/schemes/?${params.toString()}`);
    return (response.data as any).results as Scheme[];
  },

  getScheme: async (id: string): Promise<Scheme> => {
    const response = await api.get(`/schemes/${id}/`);
    return response.data as Scheme;
  },

  createScheme: async (data: SchemeCreateData): Promise<Scheme> => {
    const response = await api.post('/schemes/', data);
    return response.data as Scheme;
  },

  updateScheme: async (data: SchemeUpdateData): Promise<Scheme> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/schemes/${id}/`, updateData);
    return response.data as Scheme;
  },

  deleteScheme: async (id: string): Promise<void> => {
    await api.delete(`/schemes/${id}/`);
  },

  // Status management
  activateScheme: async (id: string): Promise<Scheme> => {
    const response = await api.post(`/schemes/${id}/activate/`);
    return response.data as Scheme;
  },

  deactivateScheme: async (id: string): Promise<Scheme> => {
    const response = await api.post(`/schemes/${id}/deactivate/`);
    return response.data as Scheme;
  },

  suspendScheme: async (id: string, reason: string): Promise<Scheme> => {
    const response = await api.post(`/schemes/${id}/suspend/`, { reason });
    return response.data as Scheme;
  },

  // Statistics
  getSchemeStatistics: async (): Promise<SchemeStatistics> => {
    const response = await api.get('/schemes/statistics/');
    return response.data as SchemeStatistics;
  },
};
