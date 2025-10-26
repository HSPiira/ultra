import { api } from './api';
import type { 
  SchemeItem, 
  AvailableItem, 
  BulkAssignmentRequest,
  AssignmentFilters
} from '../types/schemes';

export const schemeItemsApi = {
  // Get scheme items for a specific scheme
  getSchemeItems: async (schemeId: string, filters?: AssignmentFilters): Promise<SchemeItem[]> => {
    const params = new URLSearchParams();
    if (filters?.content_type) params.append('content_type', filters.content_type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/scheme-items/scheme/${schemeId}/items/?${params.toString()}`);
    return response.data as SchemeItem[];
  },

  // Get available items for assignment to a scheme
  getAvailableItems: async (schemeId: string, contentType: string): Promise<AvailableItem[]> => {
    const response = await api.get(`/scheme-items/scheme/${schemeId}/available/?type=${contentType}`);
    return response.data as AvailableItem[];
  },

  // Get a single scheme item
  getSchemeItem: async (id: string): Promise<SchemeItem> => {
    const response = await api.get(`/scheme-items/${id}/`);
    return response.data as SchemeItem;
  },

  // Create a single scheme item
  createSchemeItem: async (data: Partial<SchemeItem>): Promise<SchemeItem> => {
    const response = await api.post('/scheme-items/', data);
    return response.data as SchemeItem;
  },

  // Update a scheme item
  updateSchemeItem: async (id: string, data: Partial<SchemeItem>): Promise<SchemeItem> => {
    const response = await api.put(`/scheme-items/${id}/`, data);
    return response.data as SchemeItem;
  },

  // Delete a scheme item
  deleteSchemeItem: async (id: string): Promise<void> => {
    await api.delete(`/scheme-items/${id}/`);
  },

  // Bulk assign items to a scheme
  bulkAssignItems: async (data: BulkAssignmentRequest): Promise<SchemeItem[]> => {
    const response = await api.post('/scheme-items/bulk/', data);
    return response.data as SchemeItem[];
  },

  // Bulk remove items from a scheme
  bulkRemoveItems: async (schemeItemIds: string[]): Promise<{ removed_count: number }> => {
    const response = await api.post('/scheme-items/bulk-remove/', {
      scheme_item_ids: schemeItemIds
    });
    return response.data as { removed_count: number };
  },

  // Get all scheme items with filters
  getAllSchemeItems: async (filters?: AssignmentFilters): Promise<SchemeItem[]> => {
    const params = new URLSearchParams();
    if (filters?.content_type) params.append('content_type', filters.content_type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/scheme-items/?${params.toString()}`);
    return response.data as SchemeItem[];
  },
};
