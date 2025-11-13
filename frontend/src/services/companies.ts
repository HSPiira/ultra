import { api } from './api';
import type {
  Company,
  Industry,
  CompanyFilters,
  CompanyCreateData,
  CompanyUpdateData,
  CompanyStatistics,
  IndustryUpdateData,
  CompanyExportFormat,
} from '../types/companies';

export const companiesApi = {
  // Companies CRUD
  getCompanies: async (filters?: CompanyFilters): Promise<Company[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await api.get(`/companies/?${params.toString()}`);
    return (response.data as any).results as Company[];
  },

  getCompany: async (id: string): Promise<Company> => {
    const response = await api.get(`/companies/${id}/`);
    return response.data as Company;
  },

  createCompany: async (data: CompanyCreateData): Promise<Company> => {
    const response = await api.post('/companies/', data);
    return response.data as Company;
  },

  updateCompany: async (data: CompanyUpdateData): Promise<Company> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/companies/${id}/`, updateData);
    return response.data as Company;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}/`);
  },

  // Status management
  activateCompany: async (id: string): Promise<Company> => {
    const response = await api.post(`/companies/${id}/activate/`);
    return response.data as Company;
  },

  deactivateCompany: async (id: string): Promise<Company> => {
    const response = await api.post(`/companies/${id}/deactivate/`);
    return response.data as Company;
  },

  suspendCompany: async (id: string, reason: string): Promise<Company> => {
    const response = await api.post(`/companies/${id}/suspend/`, { reason });
    return response.data as Company;
  },

  // Industries
  getIndustries: async (): Promise<Industry[]> => {
    const response = await api.get('/industries/');
    return (response.data as any).results as Industry[];
  },

  createIndustry: async (data: { industry_name: string; description?: string }): Promise<Industry> => {
    const response = await api.post('/industries/', data);
    return response.data as Industry;
  },

  updateIndustry: async (data: IndustryUpdateData): Promise<Industry> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/industries/${id}/`, updateData);
    return response.data as Industry;
  },

  deleteIndustry: async (id: string): Promise<void> => {
    await api.delete(`/industries/${id}/`);
  },

  // Analytics
  getCompanyStatistics: async (): Promise<CompanyStatistics> => {
    const response = await api.get('/companies-analytics/statistics/');
    return response.data as CompanyStatistics;
  },

  getCompaniesByIndustry: async (industryId?: string): Promise<Company[]> => {
    const params = industryId ? `?industry_id=${industryId}` : '';
    const response = await api.get(`/companies-analytics/by_industry/${params}`);
    return response.data as Company[];
  },

  getCompaniesWithRecentActivity: async (days: number = 30): Promise<Company[]> => {
    const response = await api.get(`/companies-analytics/with_recent_activity/?days=${days}`);
    return response.data as Company[];
  },

  getCompaniesNeedingAttention: async (): Promise<Company[]> => {
    const response = await api.get('/companies-analytics/needing_attention/');
    return response.data as Company[];
  },

  exportCompanies: async ({
    format,
    filters,
  }: {
    format: CompanyExportFormat;
    filters?: CompanyFilters;
  }): Promise<Blob> => {
    const params: Record<string, string> = { file_format: format };

    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.status) {
      params.status = filters.status;
    }
    if (filters?.industry) {
      params.industry = filters.industry;
    }

    const response = await api.get('/companies/export/', {
      params,
      responseType: 'blob',
    });

    return response.data as Blob;
  },

  exportIndustries: async ({
    format,
    filters,
  }: {
    format: CompanyExportFormat;
    filters?: { search?: string; status?: string };
  }): Promise<Blob> => {
    const params: Record<string, string> = { file_format: format };

    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.status) {
      params.status = filters.status;
    }

    const response = await api.get('/industries/export/', {
      params,
      responseType: 'blob',
    });

    return response.data as Blob;
  },
};
