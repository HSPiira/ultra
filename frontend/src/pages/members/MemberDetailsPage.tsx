import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Edit, Trash2 } from 'lucide-react';
import { membersApi } from '../../services/members';
import type { Member } from '../../types/members';
import { MemberOverviewTab } from './MemberOverviewTab';
import { MemberClaimsTab } from './MemberClaimsTab';
import { useThemeStyles } from '../../hooks';

type MemberDetailsTab = 'overview' | 'claims';

export const MemberDetailsPage: React.FC = () => {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const { colors, getPageStyles } = useThemeStyles();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MemberDetailsTab>('overview');

  useEffect(() => {
    if (id) {
      loadMember();
    }
  }, [id]);

  // Handle tab from URL
  useEffect(() => {
    if (tab && isValidTab(tab)) {
      setActiveTab(tab as MemberDetailsTab);
    } else if (tab && !isValidTab(tab)) {
      // Invalid tab, redirect to default tab
      navigate(`/members/${id}`, { replace: true });
    }
  }, [tab, id, navigate]);

  const isValidTab = (tabName: string): tabName is MemberDetailsTab => {
    return ['overview', 'claims'].includes(tabName);
  };

  const loadMember = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const loadedMember = await membersApi.getMember(id);
      setMember(loadedMember);
    } catch (error) {
      console.error('Error loading member:', error);
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/members');
  };

  const handleTabChange = (newTab: MemberDetailsTab) => {
    setActiveTab(newTab);
    navigate(`/members/${id}/${newTab}`, { replace: true });
  };

  const handleEdit = () => {
    navigate(`/members/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!member || !window.confirm(`Are you sure you want to delete ${member.name}?`)) {
      return;
    }
    
    try {
      await membersApi.deleteMember(member.id);
      navigate('/members');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={getPageStyles()}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.action.primary }}></div>
          <p style={{ color: colors.text.secondary }}>Loading member...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="h-full flex items-center justify-center" style={getPageStyles()}>
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4" style={{ color: colors.text.tertiary }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>Member not found</h3>
          <p className="mb-4" style={{ color: colors.text.secondary }}>
            The member you're looking for doesn't exist or has been removed.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: colors.background.tertiary, color: colors.text.primary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.tertiary;
            }}
          >
            Back to Members
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return colors.status.active;
      case 'INACTIVE':
        return colors.status.inactive;
      case 'SUSPENDED':
        return colors.status.suspended;
      default:
        return colors.text.tertiary;
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

  return (
    <div className="h-full flex flex-col" style={getPageStyles()}>
      {/* Header */}
      <div className="border-b" style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: colors.background.secondary, color: colors.text.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.background.tertiary }}
                >
                  <User className="w-6 h-6" style={{ color: colors.text.primary }} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-3 flex-wrap" style={{ color: colors.text.primary }}>
                    <span>{member.name}</span>
                    <span style={{ color: colors.text.tertiary }}>:-</span>
                    <span className="text-sm font-normal" style={{ color: colors.text.secondary }}>
                      {member.card_number}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: getStatusColor(member.status) + '20',
                        color: getStatusColor(member.status)
                      }}
                    >
                      {member.status}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: getRelationshipColor(member.relationship) + '20',
                        color: getRelationshipColor(member.relationship)
                      }}
                    >
                      {member.relationship}
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                style={{ backgroundColor: colors.background.secondary, color: colors.text.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                }}
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                style={{ backgroundColor: colors.status.error + '20', color: colors.status.error }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.status.error + '30';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.status.error + '20';
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}>
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'claims', label: 'Claims' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as MemberDetailsTab)}
                className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                style={{
                  borderBottomColor: activeTab === tab.id ? colors.border.accent : 'transparent',
                  color: activeTab === tab.id ? colors.text.primary : colors.text.secondary
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = colors.text.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = colors.text.secondary;
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'overview' && <MemberOverviewTab member={member} onMemberUpdate={loadMember} />}
        {activeTab === 'claims' && <MemberClaimsTab member={member} />}
      </div>
    </div>
  );
};

