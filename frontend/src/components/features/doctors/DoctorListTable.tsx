import React from 'react';

// Doctor interface
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  license_number: string;
  email: string;
  phone_number: string;
  status: string;
}

// Mock dataset
const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialization: 'Cardiology',
    license_number: 'MD123456',
    email: 'sarah.johnson@email.com',
    phone_number: '+1-555-0123',
    status: 'Active'
  },
  {
    id: '2',
    name: 'Dr. Michael Brown',
    specialization: 'Neurology',
    license_number: 'MD789012',
    email: 'michael.brown@email.com',
    phone_number: '+1-555-0456',
    status: 'Red'
  },
  {
    id: '3',
    name: 'Dr. Emily Davis',
    specialization: 'Pediatrics',
    license_number: 'MD345678',
    email: 'emily.davis@email.com',
    phone_number: '+1-555-0789',
    status: 'Suspended'
  },
  {
    id: '4',
    name: 'Dr. Robert Wilson',
    specialization: 'Orthopedics',
    license_number: 'MD901234',
    email: 'robert.wilson@email.com',
    phone_number: '+1-555-0321',
    status: 'Inactive'
  },
  {
    id: '5',
    name: 'Dr. Lisa Anderson',
    specialization: 'Dermatology',
    license_number: 'MD567890',
    email: 'lisa.anderson@email.com',
    phone_number: '+1-555-0654',
    status: 'Pending'
  }
];

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

// Helper function to format phone number
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const DoctorListTable: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Doctor List</h1>
        
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-700 px-6 py-4">
            <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">
              <div className="text-left">Doctor</div>
              <div className="text-left">Specialization</div>
              <div className="text-left">License</div>
              <div className="text-left">Email</div>
              <div className="text-right">Phone</div>
              <div className="text-left">Status</div>
            </div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-700">
            {mockDoctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="px-6 py-4 hover:bg-gray-750 transition-colors"
              >
                <div className="grid grid-cols-6 gap-4 items-center">
                  {/* Doctor Name */}
                  <div className={`text-sm font-medium ${getTextColor(doctor.status)}`}>
                    {doctor.name}
                  </div>
                  
                  {/* Specialization */}
                  <div className={`text-sm ${getTextColor(doctor.status)}`}>
                    {doctor.specialization}
                  </div>
                  
                  {/* License Number */}
                  <div className={`text-sm font-mono text-left ${getTextColor(doctor.status)}`}>
                    {doctor.license_number}
                  </div>
                  
                  {/* Email */}
                  <div className={`text-sm ${getTextColor(doctor.status)}`}>
                    {doctor.email}
                  </div>
                  
                  {/* Phone Number */}
                  <div className={`text-sm text-right ${getTextColor(doctor.status)}`}>
                    {formatPhoneNumber(doctor.phone_number)}
                  </div>
                  
                  {/* Status */}
                  <div className={`text-sm font-medium ${getTextColor(doctor.status, true)}`}>
                    {doctor.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Summary */}
        <div className="mt-6 text-sm text-gray-400">
          Showing {mockDoctors.length} doctors
        </div>
      </div>
    </div>
  );
};

export default DoctorListTable;
