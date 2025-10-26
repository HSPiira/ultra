import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react';
import { schemeItemsApi } from '../../services/scheme-items';
import type { Scheme } from '../../types/schemes';
import type { Plan } from '../../types/plans';
import type { Benefit } from '../../types/benefits';

interface SchemeOverviewTabProps {
  scheme: Scheme;
}

interface PlanWithBenefits {
  plan: Plan;
  benefits: Benefit[];
}

export const SchemeOverviewTab: React.FC<SchemeOverviewTabProps> = ({ scheme }) => {
  const [plansWithBenefits, setPlansWithBenefits] = useState<PlanWithBenefits[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPlansAndBenefits();
  }, [scheme.id]);

  const loadPlansAndBenefits = async () => {
    try {
      setLoading(true);
      
      // Get assigned plans and benefits for this scheme
      const [planItems, benefitItems] = await Promise.all([
        schemeItemsApi.getSchemeItems(scheme.id, { content_type: 'plan' }),
        schemeItemsApi.getSchemeItems(scheme.id, { content_type: 'benefit' })
      ]);

      // Group benefits by plan
      const plansMap = new Map<string, PlanWithBenefits>();
      
      // Process plan items
      planItems.forEach(item => {
        if (item.item_detail && item.item_detail.type === 'plan') {
          const plan: Plan = {
            id: item.item_detail.id,
            plan_name: item.item_detail.name,
            description: '', // We don't have description in item_detail
            status: 'ACTIVE', // Default status
            created_at: item.created_at,
            updated_at: item.updated_at
          };
          plansMap.set(plan.id, {
            plan: plan,
            benefits: []
          });
        }
      });

      // Process benefit items and group them by their plans
      // Fetch the actual benefit data to get plan information
      const benefitIds = benefitItems
        .filter(item => item.item_detail && item.item_detail.type === 'benefit')
        .map(item => item.item_detail.id);
      
      // If we have benefits, fetch their full data to get plan information
      if (benefitIds.length > 0) {
        const benefitData = new Map<string, Benefit>();
        try {
          // Import benefits API
          const { benefitsApi } = await import('../../services/benefits');
          const benefits = await benefitsApi.getBenefits();
          benefits.forEach(benefit => {
            if (benefitIds.includes(benefit.id)) {
              benefitData.set(benefit.id, benefit);
            }
          });
        } catch (error) {
          console.error('Error fetching benefit details:', error);
        }

        // Process benefit items and assign to correct plans
        benefitItems.forEach(item => {
          if (item.item_detail && item.item_detail.type === 'benefit') {
            const benefitDetail = benefitData.get(item.item_detail.id);
            const benefit: Benefit = {
              id: item.item_detail.id,
              benefit_name: item.item_detail.name,
              description: benefitDetail?.description || '', 
              in_or_out_patient: benefitDetail?.in_or_out_patient || 'BOTH',
              limit_amount: item.limit_amount ?? undefined,
              status: item.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
              created_at: item.created_at,
              updated_at: item.updated_at,
              plan: benefitDetail?.plan,
              plan_detail: benefitDetail?.plan_detail
            };
            
            // Determine the target plan ID
            const targetPlanId = benefitDetail?.plan || benefitDetail?.plan_detail?.id;
            
            if (targetPlanId && plansMap.has(targetPlanId)) {
              // Add benefit to the correct plan
              const targetPlan = plansMap.get(targetPlanId);
              if (targetPlan) {
                targetPlan.benefits.push(benefit);
              }
            } else {
              // Create an "unassigned" plan for benefits without a plan or with an unknown plan
              if (!plansMap.has('unassigned')) {
                plansMap.set('unassigned', {
                  plan: {
                    id: 'unassigned',
                    plan_name: 'Unassigned Benefits',
                    description: 'Benefits not assigned to a specific plan',
                    status: 'ACTIVE',
                    created_at: '',
                    updated_at: ''
                  },
                  benefits: []
                });
              }
              const unassignedPlan = plansMap.get('unassigned');
              if (unassignedPlan) {
                unassignedPlan.benefits.push(benefit);
              }
            }
          }
        });
      }

      setPlansWithBenefits(Array.from(plansMap.values()));
    } catch (error) {
      console.error('Error loading plans and benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlanExpansion = (planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };


  const getDaysTillExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (endDate: string) => {
    const days = getDaysTillExpiry(endDate);
    if (days < 0) return { status: 'expired', color: 'text-red-400', bgColor: 'bg-red-900' };
    if (days <= 30) return { status: 'expiring', color: 'text-amber-400', bgColor: 'bg-amber-900' };
    if (days <= 90) return { status: 'warning', color: 'text-yellow-400', bgColor: 'bg-yellow-900' };
    return { status: 'active', color: 'text-green-400', bgColor: 'bg-green-900' };
  };

  const expiryStatus = getExpiryStatus(scheme.end_date);
  const daysLeft = getDaysTillExpiry(scheme.end_date);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - Scheme Information */}
        <div className="lg:col-span-2 lg:border-r lg:pr-6" style={{ borderColor: '#374151' }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#ffffff' }}>Scheme Information</h2>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Card Code</span>
              <span className="text-sm font-mono font-medium" style={{ color: '#ffffff' }}>{scheme.card_code}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Company</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{scheme.company_detail.company_name}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Coverage Amount</span>
              <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                {formatCurrency(scheme.limit_amount)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Family Applicable</span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: scheme.family_applicable ? '#10b981' : '#6b7280' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {scheme.family_applicable ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Start Date</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{formatDate(scheme.start_date)}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>End Date</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{formatDate(scheme.end_date)}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Days Remaining</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${expiryStatus.bgColor}`}></div>
                <span className={`text-sm font-medium ${expiryStatus.color}`}>
                  {daysLeft < 0 ? 'Expired' : `${daysLeft} days`}
                </span>
              </div>
            </div>

            {scheme.termination_date && (
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Termination Date</span>
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{formatDate(scheme.termination_date)}</span>
              </div>
            )}

            {scheme.description && (
              <div className="pt-2">
                <span className="text-sm font-medium block mb-1" style={{ color: '#9ca3af' }}>Description</span>
                <p className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>{scheme.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Plans & Benefits Accordion */}
        <div className="lg:col-span-3 lg:pl-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#ffffff' }}>Plans & Benefits</h2>

          {plansWithBenefits.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4" style={{ color: '#6b7280' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No Plans Assigned</h3>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                This scheme has no plans or benefits assigned yet.
              </p>
            </div>
          ) : (
            <div className="space-y-0" style={{ backgroundColor: '#1a1a1a' }}>
              {plansWithBenefits.map((planWithBenefits, index) => (
                <div key={planWithBenefits.plan.id}>
                  <button
                    onClick={() => togglePlanExpansion(planWithBenefits.plan.id)}
                    className="w-full px-4 py-2 flex items-center justify-between transition-colors border-b"
                    style={{ backgroundColor: '#1a1a1a', borderBottomColor: '#4a4a4a' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
                          {planWithBenefits.plan.plan_name} ({planWithBenefits.benefits.length})
                        </h3>
                        {planWithBenefits.plan.description && (
                          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                            {planWithBenefits.plan.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {expandedPlans.has(planWithBenefits.plan.id) ? (
                        <ChevronDown className="w-5 h-5" style={{ color: '#9ca3af' }} />
                      ) : (
                        <ChevronRight className="w-5 h-5" style={{ color: '#9ca3af' }} />
                      )}
                    </div>
                  </button>

                  {expandedPlans.has(planWithBenefits.plan.id) && (
                    <div className="px-4 pb-2" style={{ backgroundColor: '#1a1a1a' }}>
                      {planWithBenefits.benefits.length === 0 ? (
                        <p className="text-sm" style={{ color: '#9ca3af' }}>
                          No benefits assigned to this plan.
                        </p>
                      ) : (
                        <div className="space-y-0">
                          {planWithBenefits.benefits.map((benefit, benefitIndex) => (
                            <div key={benefit.id}>
                              <div className="flex items-center gap-2 py-1 px-0">
                                <span className="text-sm font-medium" style={{ color: '#ffffff', minWidth: '25px' }}>
                                  {String(benefitIndex + 1).padStart(2, '0')}.
                                </span>
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium" style={{ color: '#ffffff' }}>
                                    {benefit.benefit_name}
                                  </h4>
                                  {benefit.description && (
                                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                                      {benefit.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* Separator line between benefits */}
                              {benefitIndex < planWithBenefits.benefits.length - 1 && (
                                <div className="h-px" style={{ backgroundColor: '#4a4a4a' }}></div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Separator line */}
                  {index < plansWithBenefits.length - 1 && (
                    <div className="h-px" style={{ backgroundColor: '#4a4a4a' }}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expiry Warning */}
      {daysLeft <= 30 && daysLeft >= 0 && (
        <div className="bg-amber-900 border border-amber-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-medium text-amber-200">Scheme Expiring Soon</h3>
              <p className="text-xs text-amber-300 mt-1">
                This scheme expires in {daysLeft} days. Consider renewing or updating the end date.
              </p>
            </div>
          </div>
        </div>
      )}

      {daysLeft < 0 && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-sm font-medium text-red-200">Scheme Expired</h3>
              <p className="text-xs text-red-300 mt-1">
                This scheme expired {Math.abs(daysLeft)} days ago. Please review and update if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
