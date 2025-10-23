import React, { useState } from 'react';
import {
  Stethoscope,
  Pill,
  TestTube,
  Building2,
  Plus
} from 'lucide-react';
import { ServicesList } from './ServicesList';
import { MedicinesList } from './MedicinesList';
import { LabTestsList } from './LabTestsList';
import { HospitalPricesList } from './HospitalPricesList';
import { ServiceForm } from './ServiceForm';
import { MedicineForm } from './MedicineForm';
import { LabTestForm } from './LabTestForm';
import { HospitalPriceForm } from './HospitalPriceForm';
import type { Service, Medicine, LabTest, HospitalItemPrice } from '../../types/medical-catalog';

type TabType = 'services' | 'medicines' | 'labtests' | 'prices';

const MedicalCatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'service' | 'medicine' | 'labtest' | 'price'>('service');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddItem = (type: 'service' | 'medicine' | 'labtest' | 'price') => {
    setFormType(type);
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: Service | Medicine | LabTest | HospitalItemPrice, type: 'service' | 'medicine' | 'labtest' | 'price') => {
    setFormType(type);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingItem(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    {
      id: 'services' as TabType,
      label: 'Services',
      icon: Stethoscope
    },
    {
      id: 'medicines' as TabType,
      label: 'Medicines',
      icon: Pill
    },
    {
      id: 'labtests' as TabType,
      label: 'Lab Tests',
      icon: TestTube
    },
    {
      id: 'prices' as TabType,
      label: 'Hospital Prices',
      icon: Building2
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'services':
        return (
          <ServicesList
            onServiceEdit={(service: Service) => handleEditItem(service, 'service')}
            onServiceDelete={() => setRefreshTrigger(prev => prev + 1)}
            onServiceStatusChange={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'medicines':
        return (
          <MedicinesList
            onMedicineEdit={(medicine: Medicine) => handleEditItem(medicine, 'medicine')}
            onMedicineDelete={() => setRefreshTrigger(prev => prev + 1)}
            onMedicineStatusChange={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'labtests':
        return (
          <LabTestsList
            onLabTestEdit={(labTest: LabTest) => handleEditItem(labTest, 'labtest')}
            onLabTestDelete={() => setRefreshTrigger(prev => prev + 1)}
            onLabTestStatusChange={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'prices':
        return (
          <HospitalPricesList
            onPriceEdit={(price: HospitalItemPrice) => handleEditItem(price, 'price')}
            onPriceDelete={() => setRefreshTrigger(prev => prev + 1)}
            onPriceStatusChange={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        );
      default:
        return null;
    }
  };

  const renderForm = () => {
    if (!showForm) return null;

    switch (formType) {
      case 'service':
        return (
          <ServiceForm
            service={editingItem}
            isOpen={showForm}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        );
      case 'medicine':
        return (
          <MedicineForm
            medicine={editingItem}
            isOpen={showForm}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        );
      case 'labtest':
        return (
          <LabTestForm
            labTest={editingItem}
            isOpen={showForm}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        );
      case 'price':
        return (
          <HospitalPriceForm
            price={editingItem}
            isOpen={showForm}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        );
      default:
        return null;
    }
  };


      return (
        <div className="h-screen overflow-hidden" style={{ backgroundColor: '#0f0f0f' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 h-full flex flex-col">
        {/* Header Section */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">Medical Catalog</h1>
              <p className="text-gray-400 mt-2">
                Manage medical services, medicines, lab tests, and hospital pricing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAddItem(activeTab === 'prices' ? 'price' : activeTab.slice(0, -1) as any)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </button>
            </div>
          </div>
        </div>


        {/* Tabs */}
        <div className="mb-3 flex-shrink-0">
          <div className="border-b overflow-x-auto" style={{ borderColor: '#374151' }}>
            <nav className="-mb-px flex space-x-2 sm:space-x-8 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <div className="rounded-lg border h-full flex flex-col" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
            {renderTabContent()}
          </div>
        </div>

        {/* Forms */}
        {renderForm()}
      </div>
    </div>
  );
};

export default MedicalCatalogPage;
