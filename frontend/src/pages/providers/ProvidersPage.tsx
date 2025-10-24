import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Building2, 
  Plus,
  RefreshCw,
  Filter,
  Download,
  CheckCircle
} from 'lucide-react';
import type { Doctor, Hospital, DoctorFormData, HospitalFormData } from '../../types/providers';
import { providersApi } from '../../services/providers';
import DoctorForm from '../../components/features/doctors/DoctorForm';
import DoctorDetail from '../../components/features/doctors/DoctorDetail';
import HospitalForm from '../../components/features/hospitals/HospitalForm';
import HospitalDetail from '../../components/features/hospitals/HospitalDetail';
import { DoctorTable, HospitalTable } from '../../components/tables';
import { SearchFilterBar } from '../../components/common';


type TabType = 'doctors' | 'hospitals';

const ProvidersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>(undefined);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);
  const [editingHospital, setEditingHospital] = useState<Hospital | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [doctorsResponse, hospitalsResponse] = await Promise.all([
        providersApi.doctors.getDoctors(),
        providersApi.hospitals.getHospitals(),
      ]);
      setDoctors(doctorsResponse.results);
      setHospitals(hospitalsResponse.results);
    } catch (err) {
      console.error('Error loading providers:', err);
      setError('Failed to load providers data');
    } finally {
      setLoading(false);
    }
  };

  // Doctor handlers
  const handleDoctorEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsFormOpen(true);
  };

  const handleDoctorView = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailsOpen(true);
  };

  const handleDoctorDelete = async (doctor: Doctor) => {
    if (window.confirm(`Are you sure you want to delete ${doctor.name}?`)) {
      try {
        await providersApi.doctors.deleteDoctor(doctor.id);
        await loadData();
      } catch (err) {
        setError('Failed to delete doctor');
        console.error('Error deleting doctor:', err);
      }
    }
  };

  const handleDoctorSubmit = async (data: DoctorFormData) => {
    setLoading(true);
    try {
      if (editingDoctor) {
        await providersApi.doctors.updateDoctor(editingDoctor.id, data);
      } else {
        await providersApi.doctors.createDoctor(data);
      }
      await loadData();
      setIsFormOpen(false);
      setEditingDoctor(undefined);
    } catch (err) {
      setError('Failed to save doctor');
      console.error('Error saving doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hospital handlers
  const handleHospitalEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setIsFormOpen(true);
  };

  const handleHospitalView = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setIsDetailsOpen(true);
  };

  const handleHospitalDelete = async (hospital: Hospital) => {
    if (window.confirm(`Are you sure you want to delete ${hospital.name}?`)) {
      try {
        await providersApi.hospitals.deleteHospital(hospital.id);
        await loadData();
      } catch (err) {
        setError('Failed to delete hospital');
        console.error('Error deleting hospital:', err);
      }
    }
  };

  const handleHospitalSubmit = async (data: HospitalFormData) => {
    setLoading(true);
    try {
      if (editingHospital) {
        await providersApi.hospitals.updateHospital(editingHospital.id, data);
      } else {
        await providersApi.hospitals.createHospital(data);
      }
      await loadData();
      setIsFormOpen(false);
      setEditingHospital(undefined);
    } catch (err) {
      setError('Failed to save hospital');
      console.error('Error saving hospital:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = () => {
    if (activeTab === 'doctors') {
      setEditingDoctor(undefined);
    } else {
      setEditingHospital(undefined);
    }
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDoctor(undefined);
    setEditingHospital(undefined);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedDoctor(undefined);
    setSelectedHospital(undefined);
  };

  const refreshData = () => {
    loadData();
  };

  // Sort function
  const sortData = <T,>(data: T[], field: string, direction: 'asc' | 'desc'): T[] => {
    if (!field) return data;
    
    return [...data].sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const allFilteredDoctors = sortData(
    doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  const allFilteredHospitals = sortData(
    hospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  // Pagination logic
  const totalPages = Math.ceil(allFilteredDoctors.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  
  const filteredDoctors = allFilteredDoctors.slice(startIndex, endIndex);
  const filteredHospitals = allFilteredHospitals.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);


  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header with Statistics */}
      <div className="px-6 py-1" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Statistics Row */}
        <div className="flex items-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" style={{ color: '#d1d5db' }} />
            <span className="text-sm" style={{ color: '#9ca3af' }}>Total Doctors</span>
            <span className="text-lg font-semibold" style={{ color: '#ffffff' }}>{doctors.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: '#10b981' }} />
            <span className="text-sm" style={{ color: '#9ca3af' }}>Total Hospitals</span>
            <span className="text-lg font-semibold" style={{ color: '#10b981' }}>{hospitals.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
            <span className="text-sm" style={{ color: '#9ca3af' }}>Active Providers</span>
            <span className="text-lg font-semibold" style={{ color: '#10b981' }}>
              {doctors.filter(d => d.status === 'ACTIVE').length + hospitals.filter(h => h.status === 'ACTIVE').length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs with Actions */}
      <div className="border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('doctors')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
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
                Doctors
              </button>
              <button
                onClick={() => setActiveTab('hospitals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
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
                Hospitals
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
                onClick={handleAddProvider}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                }}
                title={`Add ${activeTab === 'doctors' ? 'Doctor' : 'Hospital'}`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4" style={{ backgroundColor: '#2a2a2a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder={`Search ${activeTab}...`}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
              onExport={() => console.log(`Export ${activeTab}`)}
              showExport={false}
            />
            
            <button 
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors" 
              style={{ 
                backgroundColor: '#3b3b3b', 
                color: '#9ca3af',
                borderColor: '#4a4a4a'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = '#4a4a4a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = '#3b3b3b';
              }}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
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
        {activeTab === 'doctors' && (
          <DoctorTable
            doctors={filteredDoctors}
            allFilteredDoctors={allFilteredDoctors}
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onDoctorView={handleDoctorView}
            onDoctorEdit={handleDoctorEdit}
            onDoctorDelete={handleDoctorDelete}
            onPageChange={setCurrentPage}
            loading={loading}
            error={error}
            onRetry={loadData}
          />
        )}

        {activeTab === 'hospitals' && (
          <HospitalTable
            hospitals={filteredHospitals}
            allFilteredHospitals={allFilteredHospitals}
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onHospitalView={handleHospitalView}
            onHospitalEdit={handleHospitalEdit}
            onHospitalDelete={handleHospitalDelete}
            onPageChange={setCurrentPage}
            loading={loading}
            error={error}
            onRetry={loadData}
          />
        )}
      </div>

      {/* Modals */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {activeTab === 'doctors' ? (
              <DoctorForm
                doctor={editingDoctor}
                hospitals={hospitals}
                onSubmit={handleDoctorSubmit}
                onCancel={handleFormClose}
                loading={loading}
              />
            ) : (
              <HospitalForm
                hospital={editingHospital}
                hospitals={hospitals}
                onSubmit={handleHospitalSubmit}
                onCancel={handleFormClose}
                loading={loading}
              />
            )}
          </div>
        </div>
      )}

      {isDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {activeTab === 'doctors' && selectedDoctor ? (
              <DoctorDetail
                doctor={selectedDoctor}
                onEdit={() => {
                  setIsDetailsOpen(false);
                  handleDoctorEdit(selectedDoctor);
                }}
                onDelete={() => {
                  setIsDetailsOpen(false);
                  handleDoctorDelete(selectedDoctor);
                }}
                onBack={handleDetailsClose}
              />
            ) : activeTab === 'hospitals' && selectedHospital ? (
              <HospitalDetail
                hospital={selectedHospital}
                hospitals={hospitals}
                onEdit={() => {
                  setIsDetailsOpen(false);
                  handleHospitalEdit(selectedHospital);
                }}
                onDelete={() => {
                  setIsDetailsOpen(false);
                  handleHospitalDelete(selectedHospital);
                }}
                onBack={handleDetailsClose}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvidersPage;