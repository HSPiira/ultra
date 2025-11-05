import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CreditCard,
  Building2,
  Shield,
  ExternalLink,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import type { Member } from '../../types/members';
import { useThemeStyles } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import { membersApi } from '../../services/members';

interface MemberOverviewTabProps {
  member: Member;
  onMemberUpdate?: () => void;
}

export const MemberOverviewTab: React.FC<MemberOverviewTabProps> = ({ member, onMemberUpdate }) => {
  const { colors } = useThemeStyles();
  const navigate = useNavigate();
  const [dependants, setDependants] = useState<Member[]>([]);

  useEffect(() => {
    if (member.relationship === 'SELF') {
      loadDependants();
    }
  }, [member.id, member.relationship]);

  const loadDependants = async () => {
    try {
      const response = await membersApi.getDependants(member.id);
      setDependants(response.results || []);
    } catch (error) {
      console.error('Error loading dependants:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return 'N/A';
    
    // If it's an international number (starts with +), return unchanged
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // For non-international numbers, apply US formatting if it's exactly 10 digits
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // For other formats, return the original phone string
    return phone;
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'SELF':
        return colors.relationship?.self || colors.action.primary;
      case 'SPOUSE':
        return colors.relationship?.spouse || '#ec4899';
      case 'CHILD':
        return colors.relationship?.child || colors.status.success;
      default:
        return colors.text.tertiary;
    }
  };

  const handleCompanyClick = () => {
    if (member.company) {
      navigate(`/companies/${member.company}`);
    }
  };

  const handleSchemeClick = () => {
    if (member.scheme) {
      navigate(`/schemes/${member.scheme}`);
    }
  };

  const handleParentClick = () => {
    if (member.parent) {
      navigate(`/members/${member.parent}`);
    }
  };

  const handleDependantClick = (dependantId: string) => {
    navigate(`/members/${dependantId}`);
  };

  const age = calculateAge(member.date_of_birth);

  return (
    <div className="space-y-8">
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - Member Information */}
        <div className="lg:col-span-2 lg:border-r lg:pr-6" style={{ borderColor: '#374151' }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#ffffff' }}>Member Information</h2>
          
          <div className="space-y-0">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Full Name</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{member.name}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Card Number</span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {member.card_number}
                </span>
              </div>
            </div>

            {member.national_id && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>National ID</span>
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {member.national_id}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Date of Birth</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: '#9ca3af' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {formatDate(member.date_of_birth)}
                  {age !== null && ` (${age} years old)`}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Gender</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{member.gender}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Relationship</span>
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: getRelationshipColor(member.relationship) + '20',
                  color: getRelationshipColor(member.relationship)
                }}
              >
                {member.relationship}
              </span>
            </div>

            {member.phone_number && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Phone</span>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                    {formatPhoneNumber(member.phone_number)}
                  </span>
                </div>
              </div>
            )}

            {member.email && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Email</span>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                    {member.email}
                  </span>
                </div>
              </div>
            )}

            {member.address && (
              <div className="flex justify-between items-start py-0.5">
                <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Address</span>
                <div className="flex items-center gap-2 text-right">
                  <MapPin className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                    {member.address}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Company</span>
              {member.company_detail ? (
                <button
                  type="button"
                  onClick={handleCompanyClick}
                  className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  {member.company_detail.company_name}
                  <ExternalLink className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {member.company || 'N/A'}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Scheme</span>
              {member.scheme_detail ? (
                <button
                  type="button"
                  onClick={handleSchemeClick}
                  className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  {member.scheme_detail.scheme_name}
                  <ExternalLink className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {member.scheme || 'N/A'}
                </span>
              )}
            </div>

            {member.parent_detail && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Primary Member</span>
                <button
                  type="button"
                  onClick={handleParentClick}
                  className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  {member.parent_detail.name}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Status</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Date Created</span>
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {formatDate(member.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Dependants List (for SELF members) or Info */}
        <div className="lg:col-span-3 lg:pl-6">
          {member.relationship === 'SELF' ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Dependants</h2>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm"
                  style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4a4a4a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b3b3b';
                  }}
                >
                  <User className="w-4 h-4" />
                  Add Dependant
                </button>
              </div>

              {dependants.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 mx-auto mb-4" style={{ color: '#6b7280' }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No Dependants Found</h3>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>
                    This member has no dependants registered yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-0" style={{ backgroundColor: '#1a1a1a' }}>
                  {dependants.map((dependant, index) => (
                    <div key={dependant.id}>
                      <div className="px-4 py-3 flex items-center justify-between transition-colors border-b"
                        style={{ backgroundColor: '#1a1a1a', borderBottomColor: '#4a4a4a' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1a1a1a';
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
                            <User className="w-5 h-5" style={{ color: '#d1d5db' }} />
                          </div>
                          <div className="flex-1 flex items-center gap-3 flex-wrap">
                            <h3 className="text-sm font-medium" style={{ color: '#ffffff' }}>
                              {dependant.name}
                            </h3>
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: getRelationshipColor(dependant.relationship) + '20',
                                color: getRelationshipColor(dependant.relationship)
                              }}
                            >
                              {dependant.relationship}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dependant.status)}`}>
                              {dependant.status}
                            </span>
                            <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                              <CreditCard className="w-3 h-3" />
                              <span>{dependant.card_number}</span>
                            </div>
                            {dependant.phone_number && (
                              <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                                <Phone className="w-3 h-3" />
                                <span>{formatPhoneNumber(dependant.phone_number)}</span>
                              </div>
                            )}
                            {dependant.email && (
                              <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                                <Mail className="w-3 h-3" />
                                <span>{dependant.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDependantClick(dependant.id)}
                            className="p-1 rounded transition-colors"
                            style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#4a4a4a';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b3b3b';
                              e.currentTarget.style.color = '#9ca3af';
                            }}
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded transition-colors"
                            style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#4a4a4a';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b3b3b';
                              e.currentTarget.style.color = '#9ca3af';
                            }}
                            title="Edit Dependant"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded transition-colors"
                            style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b3b3b';
                              e.currentTarget.style.color = '#9ca3af';
                            }}
                            title="Delete Dependant"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {/* Separator line */}
                      {index < dependants.length - 1 && (
                        <div className="h-px" style={{ backgroundColor: '#4a4a4a' }}></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#ffffff' }}>Member Details</h2>
              <div className="text-center py-12">
                <User className="w-16 h-16 mx-auto mb-4" style={{ color: '#6b7280' }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>
                  Dependant Member
                </h3>
                <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
                  This member is a {member.relationship.toLowerCase()}. Dependants are only shown for primary (SELF) members.
                </p>
                {member.parent_detail && (
                  <button
                    type="button"
                    onClick={handleParentClick}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg transition-colors text-sm"
                    style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4a4a4a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b3b3b';
                    }}
                  >
                    <User className="w-4 h-4" />
                    View Primary Member: {member.parent_detail.name}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
