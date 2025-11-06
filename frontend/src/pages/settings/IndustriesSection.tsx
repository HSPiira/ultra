import React, { useState } from 'react';
import { IndustryList } from './IndustryList';
import { IndustryForm } from './IndustryForm';
import { IndustryDetails } from './IndustryDetails';
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
    // Clear cache and trigger refresh
    localStorage.removeItem('industries_cache');
    localStorage.removeItem('industries_cache_timestamp');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddIndustry = () => {
    setEditingIndustry(null);
    setIsFormOpen(true);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingIndustry(null);
    // Clear cache and trigger refresh
    localStorage.removeItem('industries_cache');
    localStorage.removeItem('industries_cache_timestamp');
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

  return (
    <div className="space-y-6 p-6">
      {/* Content */}
      <div>
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
