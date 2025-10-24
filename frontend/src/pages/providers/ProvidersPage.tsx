import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Building2, 
  Plus,
  RefreshCw,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { Doctor, Hospital, DoctorFormData, HospitalFormData } from '../../types/providers';
import { providersApi } from '../../services/providers';
import DoctorForm from '../../components/features/doctors/DoctorForm';
import DoctorDetail from '../../components/features/doctors/DoctorDetail';
import HospitalForm from '../../components/features/hospitals/HospitalForm';
import HospitalDetail from '../../components/features/hospitals/HospitalDetail';

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
  const filteredDoctors = sortData(
    doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  const filteredHospitals = sortData(
    hospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sortField,
    sortDirection
  );

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Helper function to get text color based on status
  const getTextColor = (status: string, isStatusField: boolean = false): string => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'active') {
      // For Active status, only the status field should be green
      return isStatusField ? 'text-green-500' : 'text-white';
    }
    
    if (normalizedStatus === 'red') {
      return 'text-red-500';
    }
    
    if (normalizedStatus === 'suspended') {
      return 'text-amber-500';
    }
    
    // For other statuses, try to use the status name as a CSS color
    // If it's a valid CSS color name, use it; otherwise, default to white
    const validColors = [
      'blue', 'purple', 'pink', 'indigo', 'cyan', 'teal', 'lime', 'yellow', 'orange', 'gray'
    ];
    
    if (validColors.includes(normalizedStatus)) {
      return `text-${normalizedStatus}-500`;
    }
    
    // Default to white for unknown statuses
    return 'text-white';
  };

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border rounded-lg transition-colors"
                style={{ 
                  backgroundColor: '#1a1a1a', 
                  borderColor: '#4a4a4a', 
                  color: '#ffffff' 
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6b7280';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4a4a4a';
                }}
              />
            </div>
            
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

          <div className="flex items-center gap-2">
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
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Loading doctors...</div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-400 mr-3">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-red-400 font-medium">Error</h3>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                    <button
                      onClick={loadData}
                      className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Table Header */}
                <div className="rounded-t-lg" style={{ backgroundColor: '#1a1a1a' }}>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th 
                          className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/4 cursor-pointer hover:text-gray-300 transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Doctor
                            <svg className={`w-3 h-3 transition-colors ${
                              sortField === 'name' ? 'text-gray-300' : 'text-gray-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d={`M14.707 ${sortField === 'name' && sortDirection === 'desc' ? '7.293' : '12.707'}a1 1 0 01-1.414 0L10 ${sortField === 'name' && sortDirection === 'desc' ? '10.586' : '9.414'}l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z`} clipRule="evenodd" />
                            </svg>
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/6 cursor-pointer hover:text-gray-300 transition-colors"
                          onClick={() => handleSort('specialization')}
                        >
                          <div className="flex items-center gap-1">
                            Specialization
                            <svg className={`w-3 h-3 transition-colors ${
                              sortField === 'specialization' ? 'text-gray-300' : 'text-gray-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d={`M14.707 ${sortField === 'specialization' && sortDirection === 'desc' ? '7.293' : '12.707'}a1 1 0 01-1.414 0L10 ${sortField === 'specialization' && sortDirection === 'desc' ? '10.586' : '9.414'}l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z`} clipRule="evenodd" />
                            </svg>
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/6 cursor-pointer hover:text-gray-300 transition-colors"
                          onClick={() => handleSort('license_number')}
                        >
                          <div className="flex items-center gap-1">
                            License
                            <svg className={`w-3 h-3 transition-colors ${
                              sortField === 'license_number' ? 'text-gray-300' : 'text-gray-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d={`M14.707 ${sortField === 'license_number' && sortDirection === 'desc' ? '7.293' : '12.707'}a1 1 0 01-1.414 0L10 ${sortField === 'license_number' && sortDirection === 'desc' ? '10.586' : '9.414'}l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z`} clipRule="evenodd" />
                            </svg>
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/5 cursor-pointer hover:text-gray-300 transition-colors"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-1">
                            Email
                            <svg className={`w-3 h-3 transition-colors ${
                              sortField === 'email' ? 'text-gray-300' : 'text-gray-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d={`M14.707 ${sortField === 'email' && sortDirection === 'desc' ? '7.293' : '12.707'}a1 1 0 01-1.414 0L10 ${sortField === 'email' && sortDirection === 'desc' ? '10.586' : '9.414'}l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z`} clipRule="evenodd" />
                            </svg>
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-24 cursor-pointer hover:text-gray-300 transition-colors"
                          onClick={() => handleSort('phone_number')}
                        >
                          <div className="flex items-center gap-1">
                            Phone
                            <svg className={`w-3 h-3 transition-colors ${
                              sortField === 'phone_number' ? 'text-gray-300' : 'text-gray-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d={`M14.707 ${sortField === 'phone_number' && sortDirection === 'desc' ? '7.293' : '12.707'}a1 1 0 01-1.414 0L10 ${sortField === 'phone_number' && sortDirection === 'desc' ? '10.586' : '9.414'}l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z`} clipRule="evenodd" />
                            </svg>
                          </div>
                        </th>
                        <th 
                          className="px-0 py-0 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-20 cursor-pointer hover:text-gray-300 transition-colors"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            <svg className={`w-3 h-3 transition-colors ${
                              sortField === 'status' ? 'text-gray-300' : 'text-gray-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d={`M14.707 ${sortField === 'status' && sortDirection === 'desc' ? '7.293' : '12.707'}a1 1 0 01-1.414 0L10 ${sortField === 'status' && sortDirection === 'desc' ? '10.586' : '9.414'}l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z`} clipRule="evenodd" />
                            </svg>
                          </div>
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Table Rows - Individual Cards */}
                <div className="space-y-0.5">
                  {filteredDoctors.map((doctor) => (
                    <div 
                      key={doctor.id} 
                      className="rounded-lg p-2 transition-colors cursor-pointer group"
                      style={{ 
                        backgroundColor: '#1f1f1f'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1f1f1f';
                      }}
                      onDoubleClick={() => handleDoctorView(doctor)}
                    >
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="px-0 py-0">
                              <div className={`font-semibold text-sm truncate text-left ${getTextColor(doctor.status)}`} title={doctor.name}>{doctor.name}</div>
                            </td>
                            <td className="px-0 py-0">
                              <span className={`text-sm truncate block text-left ${getTextColor(doctor.status)}`} title={doctor.specialization}>{doctor.specialization}</span>
                            </td>
                            <td className="px-0 py-0">
                              <span className={`text-sm font-mono truncate block text-left ${getTextColor(doctor.status)}`} title={doctor.license_number}>{doctor.license_number}</span>
                            </td>
                            <td className="px-0 py-0">
                              <span className={`text-sm truncate block text-left ${getTextColor(doctor.status)}`} title={doctor.email}>{doctor.email}</span>
                            </td>
                            <td className="px-0 py-0">
                              <span className={`text-sm truncate block text-left ${getTextColor(doctor.status)}`} title={doctor.phone_number}>{formatPhoneNumber(doctor.phone_number)}</span>
                            </td>
                            <td className="px-0 py-0 w-20">
                              <span className={`text-xs font-medium text-left ${getTextColor(doctor.status, true)}`}>
                                {doctor.status === 'ACTIVE' ? 'Active' : doctor.status}
                              </span>
                            </td>
                            <td className="px-0 py-0 w-20 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleDoctorView(doctor)}
                                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors relative group/btn"
                                >
                                  <Eye className="w-4 h-4" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    View Details
                                  </div>
                                </button>
                                <button
                                  onClick={() => handleDoctorEdit(doctor)}
                                  className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors relative group/btn"
                                >
                                  <Edit className="w-4 h-4" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    Edit Doctor
                                  </div>
                                </button>
                                <button
                                  onClick={() => handleDoctorDelete(doctor)}
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors relative group/btn"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    Delete Doctor
                                  </div>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="px-4 py-3 flex items-center justify-between rounded-b-lg" style={{ backgroundColor: '#1a1a1a' }}>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400">
                      Showing 1 to {filteredDoctors.length} of {doctors.length} entries
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                      Previous
                    </button>
                    <button className="px-2 py-1 text-sm text-white bg-gray-600 rounded">
                      1
                    </button>
                    <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                      2
                    </button>
                    <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                      3
                    </button>
                    <span className="px-1 text-gray-400">...</span>
                    <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                      {Math.ceil(doctors.length / 10)}
                    </button>
                    <button className="px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Loading hospitals...</div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-400 mr-3">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-red-400 font-medium">Error</h3>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                    <button
                      onClick={loadData}
                      className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredHospitals.map((hospital) => (
                  <div 
                    key={hospital.id} 
                    className="rounded-lg p-2 transition-colors cursor-pointer group"
                    style={{ 
                      backgroundColor: '#1f1f1f'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1f1f1f';
                    }}
                    onDoubleClick={() => handleHospitalView(hospital)}
                  >
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="px-0 py-0 w-1/4">
                            <div className={`font-semibold text-sm truncate text-left ${getTextColor(hospital.status)}`} title={hospital.name}>{hospital.name}</div>
                          </td>
                          <td className="px-0 py-0 w-1/6">
                            <span className={`text-sm truncate block text-left ${getTextColor(hospital.status)}`} title={hospital.address}>{hospital.address}</span>
                          </td>
                          <td className="px-0 py-0 w-1/6">
                            <span className={`text-sm truncate block text-left ${getTextColor(hospital.status)}`} title={hospital.contact_person}>{hospital.contact_person}</span>
                          </td>
                          <td className="px-0 py-0 w-1/5">
                            <span className={`text-sm truncate block text-left ${getTextColor(hospital.status)}`} title={hospital.email}>{hospital.email}</span>
                          </td>
                          <td className="px-0 py-0 w-24">
                            <span className={`text-sm truncate block text-right ${getTextColor(hospital.status)}`} title={hospital.phone_number}>{formatPhoneNumber(hospital.phone_number)}</span>
                          </td>
                          <td className="px-0 py-0 w-20">
                            <span className={`text-xs font-medium text-left ${getTextColor(hospital.status, true)}`}>
                              {hospital.status === 'ACTIVE' ? 'Active' : hospital.status}
                            </span>
                          </td>
                          <td className="px-0 py-0 w-20 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleHospitalView(hospital)}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors relative group/btn"
                              >
                                <Eye className="w-4 h-4" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                  View Details
                                </div>
                              </button>
                              <button
                                onClick={() => handleHospitalEdit(hospital)}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors relative group/btn"
                              >
                                <Edit className="w-4 h-4" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                  Edit Hospital
                                </div>
                              </button>
                              <button
                                onClick={() => handleHospitalDelete(hospital)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors relative group/btn"
                              >
                                <Trash2 className="w-4 h-4" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                  Delete Hospital
                                </div>
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
                
                {/* Pagination */}
                <div className="bg-gray-800 px-4 py-3 flex items-center justify-between rounded-lg border border-gray-700">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400">
                      Showing 1 to {filteredHospitals.length} of {hospitals.length} entries
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      Previous
                    </button>
                    <button className="px-3 py-1 text-sm text-white bg-green-600 rounded">
                      1
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      2
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      3
                    </button>
                    <span className="px-2 text-gray-400">...</span>
                    <button className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      {Math.ceil(hospitals.length / 10)}
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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