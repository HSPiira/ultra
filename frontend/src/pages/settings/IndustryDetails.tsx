import React from 'react';
import { X, Edit, Building2, Calendar, User } from 'lucide-react';
import type { Industry } from '../../types/companies';

interface IndustryDetailsProps {
  industry: Industry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (industry: Industry) => void;
}

export const IndustryDetails: React.FC<IndustryDetailsProps> = ({
  industry,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen || !industry) return null;

  const handleEdit = () => {
    onEdit(industry);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Building2 className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                Industry Details
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                View industry information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#404040';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Industry Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Industry Name
              </label>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f', color: '#ffffff' }}>
                {industry.industry_name}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Description
              </label>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#1f1f1f', color: '#ffffff' }}>
                {industry.description || 'No description provided'}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Status
              </label>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  industry.status === 'ACTIVE' 
                    ? 'bg-green-900 text-green-300' 
                    : industry.status === 'INACTIVE'
                    ? 'bg-red-900 text-red-300'
                    : 'bg-amber-900 text-amber-300'
                }`}>
                  {industry.status}
                </span>
              </div>
            </div>

            {/* Created Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Created Date
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <span style={{ color: '#ffffff' }}>
                  {new Date(industry.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Last Updated */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Last Updated
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <span style={{ color: '#ffffff' }}>
                  {new Date(industry.updated_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* ID */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                Industry ID
              </label>
              <div className="p-3 rounded-lg font-mono text-sm" style={{ backgroundColor: '#1f1f1f', color: '#9ca3af' }}>
                {industry.id}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors border text-sm"
            style={{ 
              backgroundColor: 'transparent',
              color: '#d1d5db',
              borderColor: '#404040'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#404040';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#d1d5db';
            }}
          >
            Close
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
            style={{ 
              backgroundColor: '#3b3b3b',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4a4a4a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
            }}
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};
