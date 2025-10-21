import { api } from './api';
import type { 
  Company, 
  Industry, 
  CompanyFilters, 
  CompanyCreateData, 
  CompanyUpdateData,
  CompanyStatistics 
} from '../types/companies';

export const companiesApi = {
  // Companies CRUD
  getCompanies: async (filters?: CompanyFilters): Promise<Company[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await api.get(`/companies/companies/?${params.toString()}`);
    return response.data as Company[];
  },

  getCompany: async (id: string): Promise<Company> => {
    const response = await api.get(`/companies/companies/${id}/`);
    return response.data as Company;
  },

  createCompany: async (data: CompanyCreateData): Promise<Company> => {
    const response = await api.post('/companies/companies/', data);
    return response.data as Company;
  },

  updateCompany: async (data: CompanyUpdateData): Promise<Company> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/companies/companies/${id}/`, updateData);
    return response.data as Company;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/companies/companies/${id}/`);
  },

  // Industries
  getIndustries: async (): Promise<Industry[]> => {
    const response = await api.get('/companies/industries/');
    return response.data as Industry[];
  },

  createIndustry: async (data: { industry_name: string; description?: string }): Promise<Industry> => {
    const response = await api.post('/companies/industries/', data);
    return response.data as Industry;
  },

  // Analytics
  getCompanyStatistics: async (): Promise<CompanyStatistics> => {
    const response = await api.get('/companies/companies-analytics/statistics/');
    return response.data as CompanyStatistics;
  },

  getCompaniesByIndustry: async (industryId?: string): Promise<Company[]> => {
    const params = industryId ? `?industry_id=${industryId}` : '';
    const response = await api.get(`/companies/companies-analytics/by_industry/${params}`);
    return response.data as Company[];
  },

  getCompaniesWithRecentActivity: async (days: number = 30): Promise<Company[]> => {
    const response = await api.get(`/companies/companies-analytics/with_recent_activity/?days=${days}`);
    return response.data as Company[];
  },

  getCompaniesNeedingAttention: async (): Promise<Company[]> => {
    const response = await api.get('/companies/companies-analytics/needing_attention/');
    return response.data as Company[];
  },
};
