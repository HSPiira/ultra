import { useState } from 'react';
import { DataTable, getStatusTextColor } from '../index';
import type { TableColumn } from '../index';
import type { Doctor } from '../../../types/providers';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface DoctorsTableExampleProps {
  doctors: Doctor[];
  onDoctorClick?: (doctor: Doctor) => void;
  onDoctorEdit?: (doctor: Doctor) => void;
  onDoctorDelete?: (doctor: Doctor) => void;
  loading?: boolean;
}

export function DoctorsTableExample({ 
  doctors, 
  onDoctorClick, 
  onDoctorEdit, 
  onDoctorDelete,
  loading = false 
}: DoctorsTableExampleProps) {
  const [sortField, setSortField] = useState<keyof Doctor>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const columns: TableColumn<Doctor>[] = [
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
              onDoctorClick?.(doctor);
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
              onDoctorEdit?.(doctor);
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
              onDoctorDelete?.(doctor);
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

  return (
    <DataTable
      data={doctors}
      columns={columns}
      onRowClick={onDoctorClick}
      sortField={sortField}
      sortDirection={sortDirection}
      onSort={handleSort}
      searchable={true}
      searchPlaceholder="Search doctors..."
      pagination={true}
      itemsPerPage={10}
      showItemsPerPage={true}
      loading={loading}
      emptyMessage="No doctors found"
      statusField="status"
    />
  );
}