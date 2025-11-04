import React, { useState, useEffect } from 'react';
import { User, Plus, ExternalLink } from 'lucide-react';
import type { Member } from '../../types/members';
import { membersApi } from '../../services/members';
import { useThemeStyles } from '../../hooks';
import { useNavigate } from 'react-router-dom';

interface MemberDependantsTabProps {
  member: Member;
}

export const MemberDependantsTab: React.FC<MemberDependantsTabProps> = ({ member }) => {
  const { colors } = useThemeStyles();
  const navigate = useNavigate();
  const [dependants, setDependants] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (member.relationship === 'SELF') {
      loadDependants();
    }
  }, [member.id, member.relationship]);

  const loadDependants = async () => {
    try {
      setLoading(true);
      const response = await membersApi.getDependants(member.id);
      setDependants(response.results || []);
    } catch (error) {
      console.error('Error loading dependants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDependantClick = (dependantId: string) => {
    navigate(`/members/${dependantId}`);
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'SPOUSE':
        return colors.relationship?.spouse || '#ec4899';
      case 'CHILD':
        return colors.relationship?.child || colors.status.success;
      default:
        return colors.text.tertiary;
    }
  };

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

  if (member.relationship !== 'SELF') {
    return (
      <div className="rounded-lg border p-6" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary }}>
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto mb-4" style={{ color: colors.text.tertiary }} />
          <p className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
            Dependants Only Available for Primary Members
          </p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            This member is a {member.relationship.toLowerCase()}. Dependants are only shown for primary (SELF) members.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.action.primary }}></div>
          <p style={{ color: colors.text.secondary }}>Loading dependants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
          Dependants ({dependants.length})
        </h2>
        <button
          type="button"
          className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          style={{ backgroundColor: colors.action.primary, color: '#ffffff' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <Plus className="w-4 h-4" />
          Add Dependant
        </button>
      </div>

      {dependants.length === 0 ? (
        <div className="rounded-lg border p-12" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary }}>
          <div className="text-center">
            <User className="w-12 h-12 mx-auto mb-4" style={{ color: colors.text.tertiary }} />
            <p className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
              No Dependants
            </p>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              This member has no dependants registered.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dependants.map((dependant) => (
            <button
              key={dependant.id}
              type="button"
              className="rounded-lg border p-4 cursor-pointer transition-colors text-left w-full"
              style={{ 
                backgroundColor: colors.background.secondary, 
                borderColor: colors.border.primary 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }}
              onClick={() => handleDependantClick(dependant.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.background.tertiary }}
                  >
                    <User className="w-5 h-5" style={{ color: colors.text.primary }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: colors.text.primary }}>
                      {dependant.name}
                    </p>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      {dependant.card_number}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" style={{ color: colors.text.tertiary }} />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: getRelationshipColor(dependant.relationship),
                    color: getRelationshipColor(dependant.relationship),
                    opacity: 0.2
                  }}
                >
                  {dependant.relationship}
                </span>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: getStatusColor(dependant.status),
                    color: getStatusColor(dependant.status),
                    opacity: 0.2
                  }}
                >
                  {dependant.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

