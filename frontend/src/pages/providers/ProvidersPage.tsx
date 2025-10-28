import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Building2, 
  Plus,
  RefreshCw
} from 'lucide-react';
import type { Doctor, Hospital } from '../../types/providers';
import DoctorForm from '../../components/features/doctors/DoctorForm';
import DoctorDetail from '../../components/features/doctors/DoctorDetail';
import HospitalForm from '../../components/features/hospitals/HospitalForm';
import HospitalDetail from '../../components/features/hospitals/HospitalDetail';
import { DoctorsList } from './DoctorsList';
import { HospitalsList } from './HospitalsList';

type TabType = 'doctors' | 'hospitals';

interface ProviderStatistics {
  totalDoctors: number;
  totalHospitals: number;
  activeDoctors: number;
  activeHospitals: number;
  inactiveDoctors: number;
  inactiveHospitals: number;
}

const ProvidersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('doctors');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [statistics, setStatistics] = useState<ProviderStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      // Mock statistics - in real app, you'd fetch from API
      setStatistics({
        totalDoctors: 45,
        totalHospitals: 23,
        activeDoctors: 42,
        activeHospitals: 20,
        inactiveDoctors: 3,
        inactiveHospitals: 3
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailsOpen(true);
  };

  const handleDoctorEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsFormOpen(true);
  };

  const handleDoctorDelete = (doctor: Doctor) => {
    console.log('Doctor deleted:', doctor);
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setIsDetailsOpen(true);
  };

  const handleHospitalEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setIsFormOpen(true);
  };

  const handleHospitalDelete = (hospital: Hospital) => {
    console.log('Hospital deleted:', hospital);
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setIsFormOpen(true);
  };

  const handleAddHospital = () => {
    setEditingHospital(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDoctor(null);
    setEditingHospital(null);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingDoctor(null);
    setEditingHospital(null);
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedDoctor(null);
    setSelectedHospital(null);
  };

  const refreshData = () => {
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>

      {/* Tabs with Actions */}
      <div className="border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('doctors')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'doctors'
                    ? 'border-b-2'
                    : 'border-b-2'
                }`}
                style={{
                  borderBottomColor: activeTab === 'doctors' ? '#9ca3af' : 'transparent',
                  color: activeTab === 'doctors' ? '#d1d5db' : '#9ca3af'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'doctors') {
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'doctors') {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctors</span>
                  {statistics && (
                    <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}>
                      {statistics.totalDoctors}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('hospitals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'hospitals'
                    ? 'border-b-2'
                    : 'border-b-2'
                }`}
                style={{
                  borderBottomColor: activeTab === 'hospitals' ? '#9ca3af' : 'transparent',
                  color: activeTab === 'hospitals' ? '#d1d5db' : '#9ca3af'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'hospitals') {
                    e.currentTarget.style.color = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'hospitals') {
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Hospitals</span>
                  {statistics && (
                    <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}>
                      {statistics.totalHospitals}
                    </span>
                  )}
                </div>
              </button>
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
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={activeTab === 'doctors' ? handleAddDoctor : handleAddHospital}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                }}
                title={activeTab === 'doctors' ? 'Add Doctor' : 'Add Hospital'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'doctors' && (
          <DoctorsList
            onDoctorSelect={handleDoctorSelect}
            onDoctorEdit={handleDoctorEdit}
            onDoctorDelete={handleDoctorDelete}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'hospitals' && (
          <HospitalsList
            onHospitalSelect={handleHospitalSelect}
            onHospitalEdit={handleHospitalEdit}
            onHospitalDelete={handleHospitalDelete}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>

      {/* Modals */}
      {isFormOpen && editingDoctor && (
        <DoctorForm
          doctor={editingDoctor}
          hospitals={[]}
          onSubmit={handleFormSave}
          onCancel={handleFormClose}
          loading={false}
        />
      )}

      {isFormOpen && editingHospital && (
        <HospitalForm
          hospital={editingHospital}
          hospitals={[]}
          onSubmit={handleFormSave}
          onCancel={handleFormClose}
          loading={false}
        />
      )}

      {isDetailsOpen && selectedDoctor && (
        <DoctorDetail
          doctor={selectedDoctor}
          onEdit={() => handleDoctorEdit(selectedDoctor)}
          onDelete={() => handleDoctorDelete(selectedDoctor)}
          onBack={handleDetailsClose}
        />
      )}

      {isDetailsOpen && selectedHospital && (
        <HospitalDetail
          hospital={selectedHospital}
          hospitals={[]}
          onEdit={() => handleHospitalEdit(selectedHospital)}
          onDelete={() => handleHospitalDelete(selectedHospital)}
          onBack={handleDetailsClose}
        />
      )}
    </div>
  );
};

export default ProvidersPage;