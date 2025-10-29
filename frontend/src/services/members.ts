import { api } from './api';
import type { Member, MemberFormData, MemberListResponse, MemberStatistics } from '../types/members';

const BASE_URL = '/persons';

export const membersApi = {
  // Get all members
  getMembers: async (): Promise<MemberListResponse> => {
    const url = `${BASE_URL}/`;
    const response = await api.get<MemberListResponse>(url);
    return response.data;
  },

  // Get member by ID
  getMember: async (id: string): Promise<Member> => {
    const url = `${BASE_URL}/${id}/`;
    const response = await api.get<Member>(url);
    return response.data;
  },

  // Create new member
  createMember: async (data: MemberFormData): Promise<Member> => {
    const url = `${BASE_URL}/`;
    const response = await api.post<Member>(url, data);
    return response.data;
  },

  // Update member
  updateMember: async (id: string, data: Partial<MemberFormData>): Promise<Member> => {
    const url = `${BASE_URL}/${id}/`;
    const response = await api.put<Member>(url, data);
    return response.data;
  },

  // Partial update member
  patchMember: async (id: string, data: Partial<MemberFormData>): Promise<Member> => {
    const url = `${BASE_URL}/${id}/`;
    const response = await api.patch<Member>(url, data);
    return response.data;
  },

  // Delete member
  deleteMember: async (id: string): Promise<void> => {
    const url = `${BASE_URL}/${id}/`;
    await api.delete<void>(url);
  },

  // Get member statistics
  getMemberStatistics: async (): Promise<MemberStatistics> => {
    const url = `${BASE_URL}/statistics/`;
    const response = await api.get<MemberStatistics>(url);
    return response.data;
  },

  // Search members
  searchMembers: async (query: string): Promise<MemberListResponse> => {
    const url = `${BASE_URL}/?search=${encodeURIComponent(query)}`;
    const response = await api.get<MemberListResponse>(url);
    return response.data;
  },

  // Get members by company
  getMembersByCompany: async (companyId: string): Promise<MemberListResponse> => {
    const url = `${BASE_URL}/?company=${companyId}`;
    const response = await api.get<MemberListResponse>(url);
    return response.data;
  },

  // Get members by scheme
  getMembersByScheme: async (schemeId: string): Promise<MemberListResponse> => {
    const url = `${BASE_URL}/?scheme=${schemeId}`;
    const response = await api.get<MemberListResponse>(url);
    return response.data;
  },

  // Get members by relationship
  getMembersByRelationship: async (relationship: 'SELF' | 'SPOUSE' | 'CHILD'): Promise<MemberListResponse> => {
    const url = `${BASE_URL}/?relationship=${relationship}`;
    const response = await api.get<MemberListResponse>(url);
    return response.data;
  },

  // Get dependants of a member
  getDependants: async (parentId: string): Promise<MemberListResponse> => {
    const url = `${BASE_URL}/?parent=${parentId}`;
    const response = await api.get<MemberListResponse>(url);
    return response.data;
  },

  // Get next card number that would be assigned
  getNextCardNumber: async (schemeId: string, relationship: 'SELF' | 'SPOUSE' | 'CHILD', parentId?: string): Promise<string> => {
    const params = new URLSearchParams();
    params.append('scheme', schemeId);
    params.append('relationship', relationship);
    if (parentId) {
      params.append('parent', parentId);
    }
    const url = `${BASE_URL}/next_card_number/?${params.toString()}`;
    const response = await api.get<{ card_number: string }>(url);
    return response.data.card_number;
  },
};
