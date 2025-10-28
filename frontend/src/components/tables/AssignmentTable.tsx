import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
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
  selectedItems = new Set(),
  loading = false,
  error,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">Error loading items</div>
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
      <div className="text-center py-8">
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
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#1f1f1f' }}>
      {/* Header */}
      <div className="px-4 py-2 border-b" style={{ borderBottomColor: '#4a4a4a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Items List */}
      <div>
        {items.map((item, index) => {
          const isSelected = selectedItems.has(item.id);
          const schemeItem = item as SchemeItem;

          return (
            <div
              key={item.id}
              className={`px-4 py-1 transition-colors ${
                isSelected ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              style={{ backgroundColor: isSelected ? '#2a2a2a' : 'transparent' }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#252525';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect?.(item)}
                    className="w-4 h-4 rounded border-gray-600"
                    style={{ backgroundColor: '#1f1f1f', borderColor: '#4a4a4a' }}
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-medium" style={{ color: '#ffffff' }}>
                      {'name' in item ? item.name : (item.item_detail?.name || 'Unknown')}
                    </h3>
                  </div>
                </div>

                {/* Actions */}
                {isAssigned && onRemove && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRemove(schemeItem)}
                      className="p-1 rounded transition-colors"
                      style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b3b3b';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};