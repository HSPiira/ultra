export interface Plan {
  id: string;
  plan_name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface PlanCreateData {
  plan_name: string;
  description: string;
}

export interface PlanUpdateData extends PlanCreateData {
  id: string;
}

export interface PlanFilters {
  search?: string;
  status?: string;
  ordering?: string;
}
