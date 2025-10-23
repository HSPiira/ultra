import React from 'react';
import { Plus, Users, Mail, Phone, Calendar, User } from 'lucide-react';
import type { Company } from '../../types/companies';

interface CompanyMembersTabProps {
  company: Company;
}

export const CompanyMembersTab: React.FC<CompanyMembersTabProps> = ({ company }) => {
  // Mock data for members - in real app, this would come from API
  const members = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+256 123 456 789',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'Software Developer',
      joinDate: '2024-01-15',
      status: 'ACTIVE'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+256 987 654 321',
      employeeId: 'EMP002',
      department: 'HR',
      position: 'HR Manager',
      joinDate: '2024-02-01',
      status: 'ACTIVE'
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      phone: '+256 555 123 456',
      employeeId: 'EMP003',
      department: 'Finance',
      position: 'Accountant',
      joinDate: '2024-01-20',
      status: 'INACTIVE'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Company Members</h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            {members.length} members total
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4a4a4a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b3b3b';
          }}
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="rounded-lg border text-center py-12" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No members found</h3>
          <p className="mb-4" style={{ color: '#9ca3af' }}>
            This company doesn't have any members yet.
          </p>
          <button
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4a4a4a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
            }}
          >
            Add First Member
          </button>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: '#374151' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b hover:bg-gray-800 transition-colors"
                    style={{ borderColor: '#374151' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
                          <User className="w-4 h-4" style={{ color: '#d1d5db' }} />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#ffffff' }}>
                            {member.firstName} {member.lastName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" style={{ color: '#9ca3af' }} />
                            <a 
                              href={`mailto:${member.email}`}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {member.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="w-3 h-3" style={{ color: '#9ca3af' }} />
                            <a 
                              href={`tel:${member.phone}`}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {member.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono" style={{ color: '#ffffff' }}>
                        {member.employeeId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: '#d1d5db' }}>{member.department}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: '#d1d5db' }}>{member.position}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" style={{ color: '#9ca3af' }} />
                        <span className="text-sm" style={{ color: '#d1d5db' }}>
                          {formatDate(member.joinDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'ACTIVE' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
