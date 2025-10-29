// Base types for members
export interface BaseMember {
  id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// Member types
export interface Member extends BaseMember {
  company: string;
  scheme: string;
  name: string;
  national_id?: string;
  gender: 'MALE' | 'FEMALE';
  relationship: 'SELF' | 'SPOUSE' | 'CHILD';
  parent?: string;
  date_of_birth?: string;
  card_number: string;
  address?: string;
  phone_number?: string;
  email?: string;
  // Related data
  company_detail?: {
    id: string;
    company_name: string;
  };
  scheme_detail?: {
    id: string;
    scheme_name: string;
  };
  parent_detail?: {
    id: string;
    name: string;
  };
}

export interface MemberFormData {
  company: string;
  scheme: string;
  name: string;
  national_id?: string;
  gender: 'MALE' | 'FEMALE';
  relationship: 'SELF' | 'SPOUSE' | 'CHILD';
  parent?: string;
  date_of_birth?: string;
  card_number?: string;
  address?: string;
  phone_number?: string;
  email?: string;
}

export interface MemberFormErrors {
  company?: string;
  scheme?: string;
  name?: string;
  national_id?: string;
  gender?: string;
  relationship?: string;
  parent?: string;
  date_of_birth?: string;
  card_number?: string;
  address?: string;
  phone_number?: string;
  email?: string;
}

export interface MemberStatistics {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  suspendedMembers: number;
  selfMembers: number;
  spouseMembers: number;
  childMembers: number;
}

export interface MemberListResponse {
  results: Member[];
  count: number;
  next?: string;
  previous?: string;
}
