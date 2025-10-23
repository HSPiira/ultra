import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Building2,
} from 'lucide-react';
import { companiesApi } from '../../services/companies';
import type { Industry } from '../../types/companies';

interface IndustryListProps {
  onIndustrySelect?: (industry: Industry) => void;
  onIndustryEdit?: (industry: Industry) => void;
  onIndustryDelete?: (industry: Industry) => void;
  onAddIndustry?: () => void;
  refreshTrigger?: number;
}

export const IndustryList: React.FC<IndustryListProps> = ({
  onIndustrySelect,
  onIndustryEdit,
  onIndustryDelete,
  onAddIndustry,
  refreshTrigger
}) => {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIndustries();
  }, []);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Industry refresh trigger changed:', refreshTrigger);
      loadIndustries();
    }
  }, [refreshTrigger]);

  const loadIndustries = async () => {
    try {
      setLoading(true);
      console.log('Loading industries...');
      const data = await companiesApi.getIndustries();
      console.log('Industries loaded:', data);
      setIndustries(data);
    } catch (err) {
      console.error('Error loading industries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (industry: Industry) => {
    if (window.confirm(`Are you sure you want to delete ${industry.industry_name}?`)) {
      try {
        await companiesApi.deleteIndustry(industry.id);
        // Let the parent component handle the refresh via refreshTrigger
        onIndustryDelete?.(industry);
      } catch (err) {
        console.error('Failed to delete industry');
        console.error('Error deleting industry:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#9ca3af' }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Industries Display */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#374151' }}>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {industries.map((industry) => (
                <tr 
                  key={industry.id} 
                  className="border-b hover:bg-gray-800 transition-colors" 
                  style={{ borderColor: '#374151' }}
                >
                  <td className="px-4 py-2">
                    <div className="font-medium text-white">{industry.industry_name}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm text-gray-400">
                      {industry.description || 'No description'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                industry.status === 'ACTIVE'
                                  ? 'bg-green-900 text-green-300'
                                  : industry.status === 'INACTIVE'
                                  ? 'bg-red-900 text-red-300'
                                  : 'bg-amber-900 text-amber-300'
                              }`}>
                      {industry.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm text-gray-400">
                      {new Date(industry.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onIndustrySelect?.(industry)}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onIndustryEdit?.(industry)}
                        className="p-1 text-gray-400 hover:text-blue-400 transition-colors rounded"
                        title="Edit Industry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(industry)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors rounded"
                        title="Delete Industry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {industries.length === 0 && !loading && (
        <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No industries found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            Get started by adding your first industry
          </p>
          <button 
            onClick={onAddIndustry}
            className="px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
          >
            Add Industry
          </button>
        </div>
      )}
    </div>
  );
};
