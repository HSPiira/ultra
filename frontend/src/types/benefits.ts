export interface Benefit {
  id: string;
  benefit_name: string;
  description: string;
  in_or_out_patient: 'INPATIENT' | 'OUTPATIENT' | 'BOTH';
  limit_amount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface BenefitCreateData {
  benefit_name: string;
  description: string;
  in_or_out_patient: 'INPATIENT' | 'OUTPATIENT' | 'BOTH';
  limit_amount?: number;
}

export interface BenefitUpdateData extends BenefitCreateData {
  id: string;
}

export interface BenefitFilters {
  search?: string;
  status?: string;
  in_or_out_patient?: string;
  ordering?: string;
}
