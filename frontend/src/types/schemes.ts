export interface CompanyDetail {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
}

export interface Scheme {
  id: string;
  scheme_name: string;
  company: string;
  company_detail: CompanyDetail;
  description: string;
  card_code: string;
  start_date: string;
  end_date: string;
  termination_date?: string;
  limit_amount: number;
  family_applicable: boolean;
  remark: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface SchemeFilters {
  search?: string;
  status?: string;
  company?: string;
  ordering?: string;
}

export interface SchemeCreateData {
  scheme_name: string;
  company: string;
  description?: string;
  card_code: string;
  start_date: string;
  end_date: string;
  termination_date?: string;
  limit_amount: number;
  family_applicable?: boolean;
  remark?: string;
}

export interface SchemeUpdateData extends SchemeCreateData {
  id: string;
}

export interface SchemeStatistics {
  total_schemes: number;
  active_schemes: number;
  inactive_schemes: number;
  suspended_schemes: number;
  total_coverage_amount: number;
  average_coverage_amount: number;
}

export interface SchemeItem {
  id: string;
  scheme: string;
  scheme_detail: {
    id: string;
    scheme_name: string;
    card_code: string;
  };
  content_type: string;
  object_id: string;
  item_detail: {
    id: string;
    name: string;
    type: string;
    app_label: string;
  };
  limit_amount?: number;
  copayment_percent?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface AvailableItem {
  id: string;
  name: string;
  content_type: string;
  status: string;
}

export interface SchemeAssignment {
  content_type: number;
  object_id: string;
  limit_amount?: number;
  copayment_percent?: number;
}

export interface BulkAssignmentRequest {
  scheme_id: string;
  assignments: SchemeAssignment[];
}

export interface BulkAssignmentResponse {
  created_items: SchemeItem[];
  errors?: string[];
}

export interface AssignmentFilters {
  content_type?: string;
  search?: string;
  status?: string;
}
