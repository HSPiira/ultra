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
}

type ContentType = 'benefit' | 'plan' | 'hospital' | 'service' | 'labtest' | 'medicine';
type GroupType = 'coverage' | 'medical';

const CONTENT_TYPES: Record<ContentType, { label: string; icon: any; group: GroupType }> = {
  benefit: { label: 'Benefits', icon: Heart, group: 'coverage' },
  plan: { label: 'Plans', icon: FileText, group: 'coverage' },
  hospital: { label: 'Hospitals', icon: Building2, group: 'medical' },
  service: { label: 'Services', icon: Stethoscope, group: 'medical' },
  labtest: { label: 'Lab Tests', icon: TestTube, group: 'medical' },
  medicine: { label: 'Medicines', icon: Pill, group: 'medical' },
};

export const SchemeAssignmentsTab: React.FC<SchemeAssignmentsTabProps> = ({ scheme }) => {
  const [activeGroup, setActiveGroup] = useState<GroupType>('coverage');
  const [activeType, setActiveType] = useState<ContentType>('benefit');
  const [assignedItems, setAssignedItems] = useState<SchemeItem[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadItems();
  }, [scheme.id, activeType]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      const [assigned, available] = await Promise.all([
        schemeItemsApi.getSchemeItems(scheme.id, { content_type: activeType }),
        schemeItemsApi.getAvailableItems(scheme.id, activeType)
      ]);
      
      setAssignedItems(assigned);
      setAvailableItems(available);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailable = availableItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAssigned = assignedItems.filter(item => {
    const matchesSearch = item.item_detail.name.toLowerCase().includes(searchTerm.toLowerCase());
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

    try {
      const assignments: SchemeAssignment[] = Array.from(selectedAvailable).map(itemId => ({
        content_type: activeType,
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
        <div className="flex space-x-8">
          {[
            { id: 'coverage', label: 'Coverage', icon: Heart },
            { id: 'medical', label: 'Medical Catalog', icon: Stethoscope }
          ].map((group) => {
            const Icon = group.icon;
            return (
              <button
                key={group.id}
                onClick={() => {
                  setActiveGroup(group.id as GroupType);
                  const types = getGroupTypes(group.id as GroupType);
                  if (types.length > 0) {
                    setActiveType(types[0]);
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
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
        <div className="flex space-x-6">
          {getGroupTypes(activeGroup).map((type) => {
            const config = CONTENT_TYPES[type];
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeType === type
                    ? 'border-b-2'
                    : 'border-b-2'
                }`}
                style={{
                  borderBottomColor: activeType === type ? '#9ca3af' : 'transparent',
                  color: activeType === type ? '#d1d5db' : '#9ca3af'
                }}
                onMouseEnter={(e) => {
                  if (activeType !== type) {
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeType !== type) {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
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
