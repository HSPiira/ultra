import React, { useState } from 'react';
import { Check, X, Edit2, Trash2, DollarSign, Percent } from 'lucide-react';
import type { SchemeItem, AvailableItem } from '../../types/schemes';

interface AssignmentTableProps {
  items: (SchemeItem | AvailableItem)[];
  isAssigned?: boolean;
  onSelect?: (item: SchemeItem | AvailableItem) => void;
  onSelectAll?: (selected: boolean) => void;
  onRemove?: (item: SchemeItem) => void;
  onUpdateLimit?: (item: SchemeItem, limitAmount: number) => void;
  onUpdateCopayment?: (item: SchemeItem, copaymentPercent: number) => void;
  selectedItems?: Set<string>;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export const AssignmentTable: React.FC<AssignmentTableProps> = ({
  items,
  isAssigned = false,
  onSelect,
  onSelectAll,
  onRemove,
  onUpdateLimit,
  onUpdateCopayment,
  selectedItems = new Set(),
  loading = false,
  error,
  onRetry,
}) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ limitAmount: string; copaymentPercent: string }>({
    limitAmount: '',
    copaymentPercent: '',
  });

  const handleEditStart = (item: SchemeItem) => {
    setEditingItem(item.id);
    setEditValues({
      limitAmount: item.limit_amount?.toString() || '',
      copaymentPercent: item.copayment_percent?.toString() || '',
    });
  };

  const handleEditSave = (item: SchemeItem) => {
    const limitAmount = parseFloat(editValues.limitAmount);
    const copaymentPercent = parseFloat(editValues.copaymentPercent);

    if (!isNaN(limitAmount) && onUpdateLimit) {
      onUpdateLimit(item, limitAmount);
    }
    if (!isNaN(copaymentPercent) && onUpdateCopayment) {
      onUpdateCopayment(item, copaymentPercent);
    }

    setEditingItem(null);
    setEditValues({ limitAmount: '', copaymentPercent: '' });
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditValues({ limitAmount: '', copaymentPercent: '' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-900';
      case 'INACTIVE':
        return 'text-red-400 bg-red-900';
      case 'SUSPENDED':
        return 'text-amber-400 bg-amber-900';
      default:
        return 'text-gray-400 bg-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">Error loading items</div>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4a4a4a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          {isAssigned ? 'No assigned items' : 'No available items'}
        </div>
        <p className="text-sm text-gray-500">
          {isAssigned 
            ? 'This scheme has no assigned items yet.' 
            : 'All items of this type are already assigned to this scheme.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: '#4a4a4a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedItems.size === items.length && items.length > 0}
              onChange={(e) => onSelectAll?.(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600"
              style={{ backgroundColor: '#1f1f1f', borderColor: '#4a4a4a' }}
            />
            <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>
              {isAssigned ? 'Assigned Items' : 'Available Items'} ({items.length})
            </span>
          </div>
          {isAssigned && (
            <div className="text-xs text-gray-400">
              Click edit to modify limits and copayment
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y" style={{ borderColor: '#4a4a4a' }}>
        {items.map((item) => {
          const isSelected = selectedItems.has(item.id);
          const isEditing = editingItem === item.id;
          const schemeItem = item as SchemeItem;

          return (
            <div
              key={item.id}
              className={`p-6 transition-colors ${
                isSelected ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              style={{ backgroundColor: isSelected ? '#3b3b3b' : 'transparent' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect?.(item)}
                    className="w-4 h-4 rounded border-gray-600"
                    style={{ backgroundColor: '#1f1f1f', borderColor: '#4a4a4a' }}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
                        {'name' in item ? item.name : item.item_detail.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    {isAssigned && schemeItem.limit_amount !== undefined && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.limitAmount}
                                onChange={(e) => setEditValues(prev => ({ ...prev, limitAmount: e.target.value }))}
                                className="w-32 px-2 py-1 rounded border"
                                style={{ backgroundColor: '#1f1f1f', color: '#ffffff', borderColor: '#4a4a4a' }}
                                placeholder="Limit amount"
                              />
                            ) : (
                              formatCurrency(schemeItem.limit_amount)
                            )}
                          </span>
                        </div>
                        
                        {schemeItem.copayment_percent !== undefined && (
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4" style={{ color: '#9ca3af' }} />
                            <span style={{ color: '#d1d5db' }}>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.copaymentPercent}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, copaymentPercent: e.target.value }))}
                                  className="w-24 px-2 py-1 rounded border"
                                  style={{ backgroundColor: '#1f1f1f', color: '#ffffff', borderColor: '#4a4a4a' }}
                                  placeholder="Copayment %"
                                  min="0"
                                  max="100"
                                />
                              ) : (
                                `${schemeItem.copayment_percent}%`
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isAssigned && (
                    <>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleEditSave(schemeItem)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#10b981' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b3b3b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#ef4444' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b3b3b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditStart(schemeItem)}
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
                            title="Edit limits"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemove?.(schemeItem)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#ef4444' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b3b3b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Remove assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
