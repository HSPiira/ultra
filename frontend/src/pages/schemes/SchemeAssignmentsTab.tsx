import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  FileText, 
  Building2, 
  Stethoscope, 
  TestTube, 
  Pill,
  Search,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { schemeItemsApi } from '../../services/scheme-items';
import { AssignmentTable } from '../../components/tables/AssignmentTable';
import type { Scheme } from '../../types/schemes';
import type { SchemeItem, AvailableItem, SchemeAssignment } from '../../types/schemes';

interface SchemeAssignmentsTabProps {
  scheme: Scheme;
  activeGroup?: GroupType;
  activeType?: ContentType;
  onGroupChange?: (group: GroupType) => void;
  onTypeChange?: (type: ContentType) => void;
}

type ContentType = 'benefit' | 'plan' | 'hospital' | 'service' | 'labtest' | 'medicine';
type GroupType = 'coverage' | 'medical';

const CONTENT_TYPES: Record<ContentType, { label: string; icon: any; group: GroupType }> = {
  plan: { label: 'Plans', icon: FileText, group: 'coverage' },
  benefit: { label: 'Benefits', icon: Heart, group: 'coverage' },
  hospital: { label: 'Hospitals', icon: Building2, group: 'medical' },
  service: { label: 'Services', icon: Stethoscope, group: 'medical' },
  labtest: { label: 'Lab Tests', icon: TestTube, group: 'medical' },
  medicine: { label: 'Medicines', icon: Pill, group: 'medical' },
};

export const SchemeAssignmentsTab: React.FC<SchemeAssignmentsTabProps> = ({ 
  scheme, 
  activeGroup: propActiveGroup, 
  activeType: propActiveType,
  onGroupChange,
  onTypeChange
}) => {
  const [activeGroup, setActiveGroup] = useState<GroupType>(propActiveGroup || 'coverage');
  const [activeType, setActiveType] = useState<ContentType>(propActiveType || 'plan');
  const [assignedItems, setAssignedItems] = useState<SchemeItem[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedPlans, setAssignedPlans] = useState<SchemeItem[]>([]);
  const [contentTypeMapping, setContentTypeMapping] = useState<Record<string, number>>({});

  useEffect(() => {
    loadContentTypeMapping();
    loadItems();
  }, [scheme.id, activeType]);

  // Sync with props
  useEffect(() => {
    if (propActiveGroup && propActiveGroup !== activeGroup) {
      setActiveGroup(propActiveGroup);
    }
  }, [propActiveGroup, activeGroup]);

  useEffect(() => {
    if (propActiveType && propActiveType !== activeType) {
      setActiveType(propActiveType);
    }
  }, [propActiveType, activeType]);

  const loadContentTypeMapping = async () => {
    try {
      // Fetch ContentType mapping from backend
      const response = await fetch('http://localhost:8000/content-types/');
      if (response.ok) {
        const contentTypes = await response.json();
        const mapping: Record<string, number> = {};
        contentTypes.forEach((ct: any) => {
          if (ct.app_label === 'schemes' && ct.model === 'plan') mapping['plan'] = ct.id;
          if (ct.app_label === 'schemes' && ct.model === 'benefit') mapping['benefit'] = ct.id;
          if (ct.app_label === 'providers' && ct.model === 'hospital') mapping['hospital'] = ct.id;
          if (ct.app_label === 'medical_catalog' && ct.model === 'service') mapping['service'] = ct.id;
          if (ct.app_label === 'medical_catalog' && ct.model === 'labtest') mapping['labtest'] = ct.id;
          if (ct.app_label === 'medical_catalog' && ct.model === 'medicine') mapping['medicine'] = ct.id;
        });
        setContentTypeMapping(mapping);
      }
    } catch (err) {
      console.error('Error loading ContentType mapping:', err);
      // Fallback to hardcoded values if API fails
      setContentTypeMapping({
        'plan': 10,
        'benefit': 9,
        'hospital': 15,
        'service': 19,
        'labtest': 18,
        'medicine': 16,
      });
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      const [assigned, available, plans] = await Promise.all([
        schemeItemsApi.getSchemeItems(scheme.id, { content_type: activeType }),
        schemeItemsApi.getAvailableItems(scheme.id, activeType),
        schemeItemsApi.getSchemeItems(scheme.id, { content_type: 'plan' })
      ]);
      
      // Filter out any items with null/undefined properties
      const validAssigned = assigned.filter(item => item && item.id);
      const validAvailable = available.filter(item => item && item.id && item.name);
      const validPlans = plans.filter(item => item && item.id);
      
      setAssignedItems(validAssigned);
      setAvailableItems(validAvailable);
      setAssignedPlans(validPlans);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailable = availableItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAssigned = assignedItems.filter(item => {
    const matchesSearch = item.item_detail?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAvailable = (item: SchemeItem | AvailableItem) => {
    if ('name' in item) {
      const newSelected = new Set(selectedAvailable);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedAvailable(newSelected);
    }
  };

  const handleSelectAssigned = (item: SchemeItem | AvailableItem) => {
    if ('item_detail' in item) {
      const newSelected = new Set(selectedAssigned);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedAssigned(newSelected);
    }
  };

  const handleSelectAllAvailable = (selected: boolean) => {
    if (selected) {
      setSelectedAvailable(new Set(filteredAvailable.map(item => item.id)));
    } else {
      setSelectedAvailable(new Set());
    }
  };

  const handleSelectAllAssigned = (selected: boolean) => {
    if (selected) {
      setSelectedAssigned(new Set(filteredAssigned.map(item => item.id)));
    } else {
      setSelectedAssigned(new Set());
    }
  };

  const handleAssignItems = async () => {
    if (selectedAvailable.size === 0) return;

    // Check if trying to assign benefits without plans
    if (activeType === 'benefit' && assignedPlans.length === 0) {
      setError('You must assign at least one plan before assigning benefits. Benefits fall under plans.');
      return;
    }

    try {
      const contentTypeId = contentTypeMapping[activeType];
      if (!contentTypeId) {
        setError(`ContentType mapping not found for ${activeType}`);
        return;
      }

      const assignments: SchemeAssignment[] = Array.from(selectedAvailable).map(itemId => ({
        content_type: contentTypeId,
        object_id: itemId,
      }));

      await schemeItemsApi.bulkAssignItems({
        scheme_id: scheme.id,
        assignments,
      });

      setSelectedAvailable(new Set());
      await loadItems();
    } catch (err) {
      console.error('Error assigning items:', err);
      setError('Failed to assign items');
    }
  };

  const handleRemoveItems = async () => {
    if (selectedAssigned.size === 0) return;

    try {
      await schemeItemsApi.bulkRemoveItems(Array.from(selectedAssigned));
      setSelectedAssigned(new Set());
      await loadItems();
    } catch (err) {
      console.error('Error removing items:', err);
      setError('Failed to remove items');
    }
  };

  const handleUpdateLimit = async (item: SchemeItem, limitAmount: number) => {
    try {
      await schemeItemsApi.updateSchemeItem(item.id, { limit_amount: limitAmount });
      await loadItems();
    } catch (err) {
      console.error('Error updating limit:', err);
      setError('Failed to update limit');
    }
  };

  const handleUpdateCopayment = async (item: SchemeItem, copaymentPercent: number) => {
    try {
      await schemeItemsApi.updateSchemeItem(item.id, { copayment_percent: copaymentPercent });
      await loadItems();
    } catch (err) {
      console.error('Error updating copayment:', err);
      setError('Failed to update copayment');
    }
  };

  const handleRemoveItem = async (item: SchemeItem) => {
    try {
      await schemeItemsApi.deleteSchemeItem(item.id);
      await loadItems();
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item');
    }
  };

  const getGroupTypes = (group: GroupType): ContentType[] => {
    return Object.entries(CONTENT_TYPES)
      .filter(([_, config]) => config.group === group)
      .map(([type, _]) => type as ContentType);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
            Scheme Assignments
          </h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Manage benefits, plans, hospitals, services, labs, and medicines for this scheme
          </p>
        </div>
        <button
          onClick={loadItems}
          className="p-2 rounded-lg transition-colors"
          style={{ color: '#9ca3af' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3b3b3b';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }}
          title="Refresh Items"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Group Tabs */}
      <div className="border-b" style={{ borderColor: '#4a4a4a' }}>
        <div className="flex space-x-6">
          {[
            { id: 'coverage', label: 'Coverage', icon: Heart },
            { id: 'medical', label: 'Medical Catalog', icon: Stethoscope }
          ].map((group) => {
            const Icon = group.icon;
            return (
              <button
                key={group.id}
                    onClick={() => {
                      const newGroup = group.id as GroupType;
                      setActiveGroup(newGroup);
                      onGroupChange?.(newGroup);
                      const types = getGroupTypes(newGroup);
                      if (types.length > 0) {
                        const newType = types[0];
                        setActiveType(newType);
                        onTypeChange?.(newType);
                      }
                    }}
                className={`px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeGroup === group.id
                    ? 'border-b-2'
                    : 'border-b-2'
                }`}
                style={{
                  borderBottomColor: activeGroup === group.id ? '#9ca3af' : 'transparent',
                  color: activeGroup === group.id ? '#d1d5db' : '#9ca3af'
                }}
                onMouseEnter={(e) => {
                  if (activeGroup !== group.id) {
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeGroup !== group.id) {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <Icon className="w-4 h-4" />
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type Sub-tabs */}
      <div className="border-b" style={{ borderColor: '#4a4a4a' }}>
        <div className="flex space-x-4">
          {getGroupTypes(activeGroup).map((type) => {
            const config = CONTENT_TYPES[type];
            const Icon = config.icon;
            const isDisabled = type === 'benefit' && assignedPlans.length === 0;
            
            return (
              <button
                key={type}
                    onClick={() => {
                      if (!isDisabled) {
                        const newType = type;
                        setActiveType(newType);
                        onTypeChange?.(newType);
                      }
                    }}
                disabled={isDisabled}
                className={`px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeType === type
                    ? 'border-b-2'
                    : 'border-b-2'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  borderBottomColor: activeType === type ? '#9ca3af' : 'transparent',
                  color: isDisabled ? '#6b7280' : (activeType === type ? '#d1d5db' : '#9ca3af')
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled && activeType !== type) {
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled && activeType !== type) {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
                title={isDisabled ? 'Assign plans first before assigning benefits' : ''}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder={`Search ${CONTENT_TYPES[activeType].label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
            style={{ 
              backgroundColor: '#1f1f1f', 
              color: '#ffffff', 
              borderColor: '#4a4a4a' 
            }}
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border transition-colors"
          style={{ 
            backgroundColor: '#1f1f1f', 
            color: '#ffffff', 
            borderColor: '#4a4a4a' 
          }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Warning for benefits without plans */}
      {activeType === 'benefit' && assignedPlans.length === 0 && (
        <div className="bg-amber-900 border border-amber-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-medium text-amber-200">Benefits Require Plans</h3>
              <p className="text-xs text-amber-300 mt-1">
                You must assign at least one plan before you can assign benefits. Benefits fall under plans.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
              Available {CONTENT_TYPES[activeType].label}
            </h3>
            {selectedAvailable.size > 0 && (
              <button
                onClick={handleAssignItems}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                <Plus className="w-4 h-4" />
                Assign ({selectedAvailable.size})
              </button>
            )}
          </div>
          
          <AssignmentTable
            items={filteredAvailable}
            isAssigned={false}
            onSelect={handleSelectAvailable}
            onSelectAll={handleSelectAllAvailable}
            selectedItems={selectedAvailable}
            loading={loading}
            error={error}
            onRetry={loadItems}
          />
        </div>

        {/* Assigned Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
              Assigned {CONTENT_TYPES[activeType].label}
            </h3>
            {selectedAssigned.size > 0 && (
              <button
                onClick={handleRemoveItems}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }}
              >
                <Minus className="w-4 h-4" />
                Remove ({selectedAssigned.size})
              </button>
            )}
          </div>
          
          <AssignmentTable
            items={filteredAssigned}
            isAssigned={true}
            onSelect={handleSelectAssigned}
            onSelectAll={handleSelectAllAssigned}
            onRemove={handleRemoveItem}
            onUpdateLimit={handleUpdateLimit}
            onUpdateCopayment={handleUpdateCopayment}
            selectedItems={selectedAssigned}
            loading={loading}
            error={error}
            onRetry={loadItems}
          />
        </div>
      </div>
    </div>
  );
};
