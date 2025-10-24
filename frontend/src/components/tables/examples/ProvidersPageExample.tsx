import { useState, useEffect } from 'react';
import { DataTable, getStatusTextColor } from '../index';
import type { TableColumn } from '../index';
import type { Doctor, Hospital } from '../../../types/providers';
import { doctorApi, hospitalApi } from '../../../services/providers';
import { Eye, Edit, Trash2, Plus, Search, Filter, Download } from 'lucide-react';

export function ProvidersPageExample() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'hospitals'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  // Doctor table state
  const [doctorSortField, setDoctorSortField] = useState<keyof Doctor>('name');
  const [doctorSortDirection, setDoctorSortDirection] = useState<'asc' | 'desc'>('asc');

  // Hospital table state
  const [hospitalSortField, setHospitalSortField] = useState<keyof Hospital>('name');
  const [hospitalSortDirection, setHospitalSortDirection] = useState<'asc' | 'desc'>('asc');

  const loadData = async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      const [doctorsResponse, hospitalsResponse] = await Promise.all([
        doctorApi.getDoctors(),
        hospitalApi.getHospitals()
      ]);
      
      setDoctors(doctorsResponse.results);
      setHospitals(hospitalsResponse.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleDoctorSort = (key: keyof Doctor) => {
    if (doctorSortField === key) {
      setDoctorSortDirection(doctorSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setDoctorSortField(key);
      setDoctorSortDirection('asc');
    }
  };

  const handleHospitalSort = (key: keyof Hospital) => {
    if (hospitalSortField === key) {
      setHospitalSortDirection(hospitalSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setHospitalSortField(key);
      setHospitalSortDirection('asc');
    }
  };

  const handleDoctorClick = (doctor: Doctor) => {
    console.log('View doctor:', doctor);
  };

  const handleDoctorEdit = (doctor: Doctor) => {
    console.log('Edit doctor:', doctor);
  };

  const handleDoctorDelete = (doctor: Doctor) => {
    console.log('Delete doctor:', doctor);
  };

  const handleHospitalClick = (hospital: Hospital) => {
    console.log('View hospital:', hospital);
  };

  const handleHospitalEdit = (hospital: Hospital) => {
    console.log('Edit hospital:', hospital);
  };

  const handleHospitalDelete = (hospital: Hospital) => {
    console.log('Delete hospital:', hospital);
  };

  const doctorColumns: TableColumn<Doctor>[] = [
    {
      key: 'name',
      label: 'Doctor',
      width: 'w-1/4',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <div 
          className={`font-semibold text-sm truncate text-left ${getStatusTextColor(doctor.status)}`}
          title={String(value)}
        >
          {String(value)}
        </div>
      )
    },
    {
      key: 'specialization',
      label: 'Specialization',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span 
          className={`text-sm truncate block text-left ${getStatusTextColor(doctor.status)}`}
          title={String(value)}
        >
          {String(value)}
        </span>
      )
    },
    {
      key: 'license_number',
      label: 'License',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span 
          className={`text-sm font-mono truncate block text-left ${getStatusTextColor(doctor.status)}`}
          title={String(value)}
        >
          {String(value)}
        </span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      width: 'w-1/5',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span 
          className={`text-sm truncate block text-left ${getStatusTextColor(doctor.status)}`}
          title={String(value)}
        >
          {String(value)}
        </span>
      )
    },
    {
      key: 'phone_number',
      label: 'Phone',
      width: 'w-24',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span 
          className={`text-sm truncate block text-left ${getStatusTextColor(doctor.status)}`}
          title={String(value)}
        >
          {formatPhoneNumber(String(value))}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-20',
      sortable: true,
      align: 'left',
      render: (_, doctor) => (
        <span className={`text-xs font-medium text-left ${getStatusTextColor(doctor.status, true)}`}>
          {doctor.status === 'ACTIVE' ? 'Active' : doctor.status}
        </span>
      )
    },
    {
      key: 'actions' as keyof Doctor,
      label: 'Actions',
      width: 'w-20',
      align: 'right',
      render: (_, doctor) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDoctorClick(doctor);
            }}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors relative group/btn"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              View Details
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDoctorEdit(doctor);
            }}
            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors relative group/btn"
            title="Edit Doctor"
          >
            <Edit className="w-4 h-4" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Edit Doctor
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDoctorDelete(doctor);
            }}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors relative group/btn"
            title="Delete Doctor"
          >
            <Trash2 className="w-4 h-4" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Delete Doctor
            </div>
          </button>
        </div>
      )
    }
  ];

  const hospitalColumns: TableColumn<Hospital>[] = [
    {
      key: 'name',
      label: 'Hospital',
      width: 'w-1/4',
      sortable: true,
      align: 'left',
      render: (value, hospital) => (
        <div 
          className={`font-semibold text-sm truncate text-left ${getStatusTextColor(hospital.status)}`}
          title={String(value)}
        >
          {String(value)}
        </div>
      )
    },
    {
      key: 'address',
      label: 'Address',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, hospital) => (
        <span 
          className={`text-sm truncate block text-left ${getStatusTextColor(hospital.status)}`}
          title={String(value)}
        >
          {String(value)}
        </span>
      )
    },
    {
      key: 'contact_person',
      label: 'Contact Person',
      width: 'w-1/6',
      sortable: true,
      align: 'left',
      render: (value, hospital) => (
        <span 
          className={`text-sm truncate block text-left ${getStatusTextColor(hospital.status)}`}
          title={String(value)}
        >
          {String(value)}
        </span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      width: 'w-1/5',
      sortable: true,
      align: 'left',
      render: (value, hospital) => (
        <span 
          className={`text-sm truncate block text-left ${getStatusTextColor(hospital.status)}`}
          title={String(value)}
        >
          {String(value)}
        </span>
      )
    },
    {
      key: 'phone_number',
      label: 'Phone',
      width: 'w-24',
      sortable: true,
      align: 'left',
      render: (value, hospital) => (
        <span 
          className={`text-sm truncate block text-left ${getStatusTextColor(hospital.status)}`}
          title={String(value)}
        >
          {formatPhoneNumber(String(value))}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-20',
      sortable: true,
      align: 'left',
      render: (_, hospital) => (
        <span className={`text-xs font-medium text-left ${getStatusTextColor(hospital.status, true)}`}>
          {hospital.status === 'ACTIVE' ? 'Active' : hospital.status}
        </span>
      )
    },
    {
      key: 'actions' as keyof Hospital,
      label: 'Actions',
      width: 'w-20',
      align: 'right',
      render: (_, hospital) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleHospitalClick(hospital);
            }}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors relative group/btn"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              View Details
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleHospitalEdit(hospital);
            }}
            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors relative group/btn"
            title="Edit Hospital"
          >
            <Edit className="w-4 h-4" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Edit Hospital
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleHospitalDelete(hospital);
            }}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors relative group/btn"
            title="Delete Hospital"
          >
            <Trash2 className="w-4 h-4" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Delete Hospital
            </div>
          </button>
        </div>
      )
    }
  ];

  const activeDoctors = doctors.filter(d => d.status === 'ACTIVE').length;
  const totalDoctors = doctors.length;
  const activeHospitals = hospitals.filter(h => h.status === 'ACTIVE').length;
  const totalHospitals = hospitals.length;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Providers</h1>
            <p className="text-gray-400 text-sm mt-1">Manage doctors and hospitals</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add {activeTab === 'doctors' ? 'Doctor' : 'Hospital'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="px-6 py-4 border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Doctors</p>
                <p className="text-2xl font-bold text-white">{totalDoctors}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Doctors</p>
                <p className="text-2xl font-bold text-green-400">{activeDoctors}</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Hospitals</p>
                <p className="text-2xl font-bold text-white">{totalHospitals}</p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Hospitals</p>
                <p className="text-2xl font-bold text-green-400">{activeHospitals}</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'doctors'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Doctors ({totalDoctors})
          </button>
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'hospitals'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Hospitals ({totalHospitals})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              className="p-2 rounded-lg transition-colors flex items-center gap-2"
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
                    <div className="w-5 h-5">⚠</div>
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
              <DataTable
                data={doctors}
                columns={doctorColumns}
                onRowClick={handleDoctorClick}
                sortField={doctorSortField}
                sortDirection={doctorSortDirection}
                onSort={handleDoctorSort}
                searchable={false} // Using external search
                pagination={true}
                itemsPerPage={10}
                showItemsPerPage={true}
                loading={loading}
                emptyMessage="No doctors found"
                statusField="status"
              />
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
                    <div className="w-5 h-5">⚠</div>
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
              <DataTable
                data={hospitals}
                columns={hospitalColumns}
                onRowClick={handleHospitalClick}
                sortField={hospitalSortField}
                sortDirection={hospitalSortDirection}
                onSort={handleHospitalSort}
                searchable={false} // Using external search
                pagination={true}
                itemsPerPage={10}
                showItemsPerPage={true}
                loading={loading}
                emptyMessage="No hospitals found"
                statusField="status"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
