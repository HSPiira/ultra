import { useState, useEffect } from 'react';
import { DataTable, getStatusTextColor } from '../../components/tables';
import type { TableColumn } from '../../components/tables';
import type { Doctor, Hospital } from '../../types/providers';
import { doctorApi, hospitalApi } from '../../services/providers';
import { Eye, Edit, Trash2, Plus, Search, Filter, Download, Code, Palette, Settings } from 'lucide-react';

export function TableComponentsDemo() {
  const [activeDemo, setActiveDemo] = useState<'basic' | 'advanced' | 'custom' | 'comparison'>('basic');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Table state
  const [sortField, setSortField] = useState<keyof Doctor>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const handleSort = (key: keyof Doctor) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (item: Doctor) => {
    console.log('Row clicked:', item);
    alert(`Clicked on: ${item.name}`);
  };

  // Basic demo columns
  const basicColumns: TableColumn<Doctor>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <div className={`font-semibold ${getStatusTextColor(doctor.status)}`}>
          {String(value)}
        </div>
      )
    },
    {
      key: 'specialization',
      label: 'Specialization',
      sortable: true,
      align: 'left',
      render: (value, doctor) => (
        <span className={getStatusTextColor(doctor.status)}>
          {String(value)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      align: 'left',
      render: (_, doctor) => (
        <span className={getStatusTextColor(doctor.status, true)}>
          {doctor.status === 'ACTIVE' ? 'Active' : doctor.status}
        </span>
      )
    }
  ];

  // Advanced demo columns
  const advancedColumns: TableColumn<Doctor>[] = [
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
              handleRowClick(doctor);
            }}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Edit:', doctor);
            }}
            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Delete:', doctor);
            }}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const renderDemo = () => {
    switch (activeDemo) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Basic Table</h3>
              <p className="text-gray-400 text-sm mb-4">
                Simple table with sorting and status-based coloring
              </p>
              <DataTable
                data={doctors.slice(0, 5)} // Show only first 5 for demo
                columns={basicColumns}
                onRowClick={handleRowClick}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                searchable={true}
                pagination={false}
                loading={loading}
                emptyMessage="No doctors found"
                statusField="status"
              />
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Advanced Table</h3>
              <p className="text-gray-400 text-sm mb-4">
                Full-featured table with all options: sorting, searching, pagination, actions
              </p>
              <DataTable
                data={doctors}
                columns={advancedColumns}
                onRowClick={handleRowClick}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                searchable={true}
                searchPlaceholder="Search doctors..."
                pagination={true}
                itemsPerPage={5}
                showItemsPerPage={true}
                loading={loading}
                emptyMessage="No doctors found"
                statusField="status"
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Custom Styling</h3>
              <p className="text-gray-400 text-sm mb-4">
                Table with custom styling and hospital data
              </p>
              <DataTable
                data={hospitals}
                columns={[
                  {
                    key: 'name',
                    label: 'Hospital Name',
                    sortable: true,
                    align: 'left',
                    render: (value, hospital) => (
                      <div className={`font-bold text-lg ${getStatusTextColor(hospital.status)}`}>
                        {String(value)}
                      </div>
                    )
                  },
                  {
                    key: 'address',
                    label: 'Address',
                    sortable: true,
                    align: 'left',
                    render: (value, hospital) => (
                      <span className={`text-sm ${getStatusTextColor(hospital.status)}`}>
                        {String(value)}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    sortable: true,
                    align: 'center',
                    render: (_, hospital) => (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusTextColor(hospital.status, true)}`}>
                        {hospital.status === 'ACTIVE' ? 'Active' : hospital.status}
                      </span>
                    )
                  }
                ]}
                onRowClick={(hospital) => alert(`Hospital: ${hospital.name}`)}
                searchable={true}
                pagination={true}
                itemsPerPage={3}
                loading={loading}
                emptyMessage="No hospitals found"
                statusField="status"
                className="border-2 border-blue-500 rounded-xl"
              />
            </div>
          </div>
        );

      case 'comparison':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Side-by-Side Comparison</h3>
              <p className="text-gray-400 text-sm mb-4">
                Compare doctors and hospitals tables
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Doctors</h4>
                  <DataTable
                    data={doctors.slice(0, 3)}
                    columns={basicColumns}
                    onRowClick={handleRowClick}
                    searchable={false}
                    pagination={false}
                    loading={loading}
                    emptyMessage="No doctors found"
                    statusField="status"
                  />
                </div>
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Hospitals</h4>
                  <DataTable
                    data={hospitals.slice(0, 3)}
                    columns={[
                      {
                        key: 'name',
                        label: 'Name',
                        sortable: true,
                        align: 'left',
                        render: (value, hospital) => (
                          <div className={`font-semibold ${getStatusTextColor(hospital.status)}`}>
                            {String(value)}
                          </div>
                        )
                      },
                      {
                        key: 'address',
                        label: 'Address',
                        sortable: true,
                        align: 'left',
                        render: (value, hospital) => (
                          <span className={getStatusTextColor(hospital.status)}>
                            {String(value)}
                          </span>
                        )
                      },
                      {
                        key: 'status',
                        label: 'Status',
                        sortable: true,
                        align: 'left',
                        render: (_, hospital) => (
                          <span className={getStatusTextColor(hospital.status, true)}>
                            {hospital.status === 'ACTIVE' ? 'Active' : hospital.status}
                          </span>
                        )
                      }
                    ]}
                    onRowClick={(hospital) => alert(`Hospital: ${hospital.name}`)}
                    searchable={false}
                    pagination={false}
                    loading={loading}
                    emptyMessage="No hospitals found"
                    statusField="status"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Table Components Demo</h1>
            <p className="text-gray-400 text-sm mt-1">Explore the reusable table components</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Reload Data
            </button>
          </div>
        </div>
      </div>

      {/* Demo Tabs */}
      <div className="px-6 py-4 border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveDemo('basic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeDemo === 'basic'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Code className="w-4 h-4" />
            Basic
          </button>
          <button
            onClick={() => setActiveDemo('advanced')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeDemo === 'advanced'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Advanced
          </button>
          <button
            onClick={() => setActiveDemo('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeDemo === 'custom'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Palette className="w-4 h-4" />
            Custom
          </button>
          <button
            onClick={() => setActiveDemo('comparison')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeDemo === 'comparison'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            Comparison
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-4" style={{ backgroundColor: '#1a1a1a' }}>
        {error ? (
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
          renderDemo()
        )}
      </div>
    </div>
  );
}
