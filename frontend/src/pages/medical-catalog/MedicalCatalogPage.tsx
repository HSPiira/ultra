import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Pill, 
  TestTube,
  Building2,
  RefreshCw,
  Plus,
  Upload
} from 'lucide-react';
import { useThemeStyles, useBulkUpload } from '../../hooks';
import { Tooltip, BulkUploadModal } from '../../components/common';
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
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { colors, getPageStyles, getTabProps, getIconButtonProps } = useThemeStyles();
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

  // Bulk upload functionality
  const bulkUpload = useBulkUpload({
    onUpload: async (data) => {
      try {
        // Process bulk upload - in real implementation, you'd call a bulk API endpoint
        console.log('Bulk uploading medical catalog data:', data);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshTrigger(prev => prev + 1);
        return { success: true };
      } catch (error) {
        console.error('Bulk upload failed:', error);
        return { success: false, errors: [] };
      }
    },
    onSuccess: () => {
      console.log('Bulk upload completed successfully');
    },
    onError: (error) => {
      console.error('Bulk upload error:', error);
    }
  });

  // Bulk upload configuration
  const MEDICAL_CATALOG_BULK_UPLOAD_CONFIG = {
    title: 'Upload Medical Catalog Data',
    description: 'Upload medical catalog items from a CSV file. The file should contain the appropriate columns for the selected tab.',
    acceptedFileTypes: ['.csv'],
    sampleFileName: 'medical_catalog_sample.csv',
    fieldMappings: {
      'name': 'name',
      'description': 'description',
      'code': 'code',
      'price': 'price',
      'status': 'status'
    },
    sampleData: [
      { name: 'Sample Item', description: 'Sample description', code: 'SAMPLE001', price: '100.00', status: 'ACTIVE' }
    ]
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  // Handle tab from URL
  useEffect(() => {
    if (tab && isValidTab(tab)) {
      setActiveTab(tab as TabType);
    } else if (tab && !isValidTab(tab)) {
      // Invalid tab, redirect to default tab
      navigate('/medical-catalog', { replace: true });
    }
  }, [tab, navigate]);

  const isValidTab = (tabName: string): tabName is TabType => {
    return ['services', 'medicines', 'labtests', 'prices'].includes(tabName);
  };

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    navigate(`/medical-catalog/${newTab}`, { replace: true });
  };

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
    <div className="h-full flex flex-col" style={getPageStyles()}>
      {/* Tabs with Actions */}
      <div className="border-b" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary }}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const getCount = () => {
                  switch (tab.id) {
                    case 'services': return statistics.totalServices;
                    case 'medicines': return statistics.totalMedicines;
                    case 'labtests': return statistics.totalLabTests;
                    case 'prices': return statistics.totalHospitalPrices;
                    default: return 0;
                  }
                };
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                    {...getTabProps(activeTab === tab.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: colors.background.quaternary, color: colors.text.tertiary }}>
                        {getCount()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Tooltip content="Refresh medical catalog data">
                <button 
                  className="p-2 rounded-lg transition-colors" 
                  {...getIconButtonProps()}
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content="Add new medical item">
                <button 
                  className="p-2 rounded-lg transition-colors" 
                  {...getIconButtonProps()}
                  onClick={() => {
                    setEditingItem(null);
                    setFormType(
                      activeTab === 'services' ? 'service' :
                      activeTab === 'medicines' ? 'medicine' :
                      activeTab === 'labtests' ? 'labtest' : 'price'
                    );
                    setShowForm(true);
                  }}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content="Upload medical catalog data from CSV">
                <button 
                  className="p-2 rounded-lg transition-colors" 
                  {...getIconButtonProps()}
                  onClick={bulkUpload.openModal}
                >
                  <Upload className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-4" style={getPageStyles()}>
        {renderTabContent()}
      </div>

      {/* Forms */}
      {renderForm()}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUpload.isModalOpen}
        onClose={bulkUpload.closeModal}
        onUpload={bulkUpload.handleUpload}
        {...MEDICAL_CATALOG_BULK_UPLOAD_CONFIG}
      />
    </div>
  );
};

export default MedicalCatalogPage;
