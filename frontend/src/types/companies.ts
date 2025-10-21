export interface Industry {
  id: string;
  industry_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Company {
  id: string;
  company_name: string;
  company_address: string;
  industry: string; // Industry ID
  industry_detail: Industry;
  contact_person: string;
  email: string;
  phone_number: string;
  website?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CompanyFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  industry?: string;
  ordering?: string;
}

export interface CompanyCreateData {
  company_name: string;
  company_address: string;
  industry: string;
  contact_person: string;
  email: string;
  phone_number: string;
  website?: string;
  remark?: string;
}

export interface CompanyUpdateData extends Partial<CompanyCreateData> {
  id: string;
}

export interface CompanyStatistics {
  total_companies: number;
  active_companies: number;
  inactive_companies: number;
  suspended_companies: number;
  by_industry: Array<{
    industry__industry_name: string;
    count: number;
  }>;
}
