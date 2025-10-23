import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { IndustryList } from './IndustryList';
import { IndustryForm } from './IndustryForm';
import { IndustryDetails } from './IndustryDetails';
import { companiesApi } from '../../services/companies';
import type { Industry } from '../../types/companies';

export const IndustriesSection: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleIndustrySelect = (industry: Industry) => {
    setSelectedIndustry(industry);
    setIsDetailsOpen(true);
  };

  const handleIndustryEdit = (industry: Industry) => {
    setEditingIndustry(industry);
    setIsFormOpen(true);
  };

  const handleIndustryDelete = (industry: Industry) => {
    console.log('Industry deleted:', industry);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddIndustry = () => {
    setEditingIndustry(null);
    setIsFormOpen(true);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingIndustry(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingIndustry(null);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedIndustry(null);
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <Building2 className="w-4 h-4" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                Industries
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                Manage company industry categories and types
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#9ca3af' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = '#3b3b3b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleAddIndustry}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4a4a4a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b3b3b';
              }}
              title="Add Industry"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <IndustryList
          onIndustrySelect={handleIndustrySelect}
          onIndustryEdit={handleIndustryEdit}
          onIndustryDelete={handleIndustryDelete}
          onAddIndustry={handleAddIndustry}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Modals */}
      <IndustryForm
        industry={editingIndustry || undefined}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />

      <IndustryDetails
        industry={selectedIndustry}
        isOpen={isDetailsOpen}
        onClose={handleDetailsClose}
        onEdit={handleIndustryEdit}
      />
    </div>
  );
};
