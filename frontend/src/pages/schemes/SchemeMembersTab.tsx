import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import type { Scheme } from '../../types/schemes';

interface SchemeMembersTabProps {
  scheme: Scheme;
}

interface Member {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_joined: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  family_members?: FamilyMember[];
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  date_of_birth: string;
}

export const SchemeMembersTab: React.FC<SchemeMembersTabProps> = ({ scheme }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockMembers: Member[] = [
        {
          id: '1',
          member_id: 'MEM001',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '+256 700 123 456',
          date_joined: '2024-01-15',
          status: 'ACTIVE',
          family_members: [
            {
              id: '1',
              first_name: 'Jane',
              last_name: 'Doe',
              relationship: 'Spouse',
              date_of_birth: '1985-03-15'
            },
            {
              id: '2',
              first_name: 'Junior',
              last_name: 'Doe',
              relationship: 'Child',
              date_of_birth: '2010-07-22'
            }
          ]
        },
        {
          id: '2',
          member_id: 'MEM002',
          first_name: 'Alice',
          last_name: 'Smith',
          email: 'alice.smith@example.com',
          phone: '+256 700 234 567',
          date_joined: '2024-02-01',
          status: 'ACTIVE',
          family_members: []
        },
        {
          id: '3',
          member_id: 'MEM003',
          first_name: 'Bob',
          last_name: 'Johnson',
          email: 'bob.johnson@example.com',
          phone: '+256 700 345 678',
          date_joined: '2024-01-20',
          status: 'SUSPENDED',
          family_members: []
        }
      ];
      setMembers(mockMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.member_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-900';
      case 'INACTIVE':
        return 'text-red-400 bg-red-900';
      case 'SUSPENDED':
        return 'text-amber-400 bg-amber-900';
      default:
        return 'text-gray-400 bg-gray-900';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
  };

  const handleCloseMemberDetails = () => {
    setShowMemberDetails(false);
    setSelectedMember(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
            Scheme Members
          </h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Manage members enrolled in this scheme
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMembers}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3b3b3b';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
            title="Refresh Members"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
            style={{ 
              backgroundColor: '#1f1f1f', 
              color: '#ffffff', 
              borderColor: '#4a4a4a' 
            }}
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border transition-colors"
          style={{ 
            backgroundColor: '#1f1f1f', 
            color: '#ffffff', 
            borderColor: '#4a4a4a' 
          }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Members List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No Members Found</h3>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              {searchTerm ? 'No members match your search criteria.' : 'No members are enrolled in this scheme.'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#4a4a4a' }}>
            {filteredMembers.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
                      <User className="w-6 h-6" style={{ color: '#d1d5db' }} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
                          {member.first_name} {member.last_name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                        <span className="text-sm font-mono" style={{ color: '#9ca3af' }}>
                          {member.member_id}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>{member.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>Joined {formatDate(member.date_joined)}</span>
                        </div>
                      </div>

                      {member.family_members && member.family_members.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#d1d5db' }}>
                            {member.family_members.length} family member{member.family_members.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewMember(member)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#9ca3af' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b3b3b';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#9ca3af' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b3b3b';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                      title="More Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      {showMemberDetails && selectedMember && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: '#4a4a4a' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
                  <User className="w-5 h-5" style={{ color: '#d1d5db' }} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                    {selectedMember.first_name} {selectedMember.last_name}
                  </h2>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>
                    {selectedMember.member_id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseMemberDetails}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4" style={{ color: '#ffffff' }}>Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                        Email
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                        <p className="text-sm" style={{ color: '#ffffff' }}>{selectedMember.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                        Phone
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                        <p className="text-sm" style={{ color: '#ffffff' }}>{selectedMember.phone}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                        Date Joined
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                        <p className="text-sm" style={{ color: '#ffffff' }}>{formatDate(selectedMember.date_joined)}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                        Status
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMember.status)}`}>
                          {selectedMember.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Family Members */}
                {selectedMember.family_members && selectedMember.family_members.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4" style={{ color: '#ffffff' }}>Family Members</h3>
                    <div className="space-y-3">
                      {selectedMember.family_members.map((familyMember) => (
                        <div key={familyMember.id} className="p-4 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium" style={{ color: '#ffffff' }}>
                                {familyMember.first_name} {familyMember.last_name}
                              </h4>
                              <p className="text-sm" style={{ color: '#9ca3af' }}>
                                {familyMember.relationship} • Born {formatDate(familyMember.date_of_birth)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
