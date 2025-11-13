// Shared type definitions
export type Status = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// content_type can be a string when reading from API (model name) or number when writing (ContentType ID)
export type ContentTypeString = 'plan' | 'benefit' | 'hospital' | 'service' | 'labtest' | 'medicine';
export type ContentTypeId = number;

export interface CompanyDetail {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
}

export interface SchemePeriodSummary {
  id: string;
  period_number: number;
  start_date: string;
  end_date: string;
  termination_date?: string | null;
  limit_amount: string;
  is_current: boolean;
  renewal_date?: string | null;
  changes_summary?: Record<string, unknown>;
}

export interface Scheme {
  id: string;
  scheme_name: string;
  company: string;
  company_detail: CompanyDetail;
  description: string;
  card_code: string;
  is_renewable: boolean;
  family_applicable: boolean;
  remark: string;
  status: Status;
  current_period?: SchemePeriodSummary | null;
  total_periods: number;
  created_at: string;
  updated_at: string;
}

export interface SchemeFilters {
  search?: string;
  status?: Status | string;
  company?: string;
  ordering?: string;
}

export interface SchemeCreateData {
  scheme_name: string;
  company: string;
  description?: string;
  card_code: string;
  is_renewable?: boolean;
  family_applicable?: boolean;
  remark?: string;
  initial_period: {
    start_date: string;
    end_date: string;
    limit_amount: number;
    remark?: string;
  };
}

export interface SchemeUpdateData {
  id: string;
  scheme_name?: string;
  company?: string;
  description?: string;
  card_code?: string;
  is_renewable?: boolean;
  family_applicable?: boolean;
  remark?: string;
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
  limit_amount: number | null;
  copayment_percent: number | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface AvailableItem {
  id: string;
  name: string;
  content_type: string;
  status: Status;
}

export interface SchemeAssignment {
  content_type: ContentTypeId;
  object_id: string;
  limit_amount?: number | null;
  copayment_percent?: number | null;
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
  status?: Status | string;
}
