import React, { useState } from 'react';
import { CompaniesList } from './CompaniesList';
import { CompanyForm } from './CompanyForm';
import type { Company } from '../../types/companies';

export const CompaniesPage: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    // Could open a detail view or modal here
  };

  const handleCompanyEdit = (company: Company) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  const handleCompanyDelete = (company: Company) => {
    // The delete logic is handled in CompaniesList
    console.log('Company deleted:', company);
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsFormOpen(true);
  };

  const handleFormSave = (company: Company) => {
    setIsFormOpen(false);
    setEditingCompany(null);
    // The list will refresh automatically
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
  };

  return (
    <div className="space-y-6">
      <CompaniesList
        onCompanySelect={handleCompanySelect}
        onCompanyEdit={handleCompanyEdit}
        onCompanyDelete={handleCompanyDelete}
        onAddCompany={handleAddCompany}
      />
      
      <CompanyForm
        company={editingCompany}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />
    </div>
  );
};
