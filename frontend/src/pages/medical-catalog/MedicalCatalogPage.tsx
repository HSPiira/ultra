import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Pill,
  TestTube,
  Building2,
  RefreshCw,
  Download
} from 'lucide-react';
import { ServicesListNew } from './ServicesListNew';
import { MedicinesListNew } from './MedicinesListNew';
import { LabTestsListNew } from './LabTestsListNew';
import { HospitalPricesListNew } from './HospitalPricesListNew';
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
  const [statistics, setStatistics] = useState({
    totalServices: 0,
    totalMedicines: 0,
    totalLabTests: 0,
    totalHospitalPrices: 0,
    activeServices: 0,
    activeMedicines: 0,
    activeLabTests: 0,
    activeHospitalPrices: 0
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Mock statistics - in real app, you'd fetch from API
      setStatistics({
        totalServices: 45,
        totalMedicines: 128,
        totalLabTests: 67,
        totalHospitalPrices: 234,
        activeServices: 42,
        activeMedicines: 115,
        activeLabTests: 61,
        activeHospitalPrices: 201
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
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
          <ServicesListNew
            onServiceEdit={(service: Service) => handleEditItem(service, 'service')}
            onServiceDelete={() => setRefreshTrigger(prev => prev + 1)}
            onServiceStatusChange={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'medicines':
        return (
          <MedicinesListNew
            onMedicineEdit={(medicine: Medicine) => handleEditItem(medicine, 'medicine')}
            onMedicineDelete={() => setRefreshTrigger(prev => prev + 1)}
            onMedicineStatusChange={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'labtests':
        return (
          <LabTestsListNew
            onLabTestEdit={(labTest: LabTest) => handleEditItem(labTest, 'labtest')}
            onLabTestDelete={() => setRefreshTrigger(prev => prev + 1)}
            onLabTestStatusChange={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'prices':
        return (
          <HospitalPricesListNew
            onHospitalPriceEdit={(price: HospitalItemPrice) => handleEditItem(price, 'price')}
            onHospitalPriceDelete={() => setRefreshTrigger(prev => prev + 1)}
            onHospitalPriceStatusChange={() => setRefreshTrigger(prev => prev + 1)}
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
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header with Statistics */}
      <div className="px-6 py-1" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Statistics Row */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-5 h-5" style={{ color: '#9ca3af' }} />
              <div>
                <div className="text-2xl font-bold text-white">{statistics.totalServices}</div>
                <div className="text-sm" style={{ color: '#9ca3af' }}>Services</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Pill className="w-5 h-5" style={{ color: '#9ca3af' }} />
              <div>
                <div className="text-2xl font-bold text-white">{statistics.totalMedicines}</div>
                <div className="text-sm" style={{ color: '#9ca3af' }}>Medicines</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <TestTube className="w-5 h-5" style={{ color: '#9ca3af' }} />
              <div>
                <div className="text-2xl font-bold text-white">{statistics.totalLabTests}</div>
                <div className="text-sm" style={{ color: '#9ca3af' }}>Lab Tests</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" style={{ color: '#9ca3af' }} />
              <div>
                <div className="text-2xl font-bold text-white">{statistics.totalHospitalPrices}</div>
                <div className="text-sm" style={{ color: '#9ca3af' }}>Hospital Prices</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors"
                  style={{
                    borderBottomColor: activeTab === tab.id ? '#9ca3af' : 'transparent',
                    color: activeTab === tab.id ? '#d1d5db' : '#9ca3af'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = '#9ca3af';
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <button 
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
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button 
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
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-4" style={{ backgroundColor: '#1a1a1a' }}>
        {renderTabContent()}
      </div>

      {/* Forms */}
      {renderForm()}
    </div>
  );
};

export default MedicalCatalogPage;
