import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import type { Member } from '../../types/members';
import { MembersList } from './MembersList';
import { BulkUploadModal, Tooltip } from '../../components/common';
import { useBulkUpload } from '../../hooks';
import { MEMBER_BULK_UPLOAD_CONFIG } from '../../components/common/BulkUploadConfigs';
import { membersApi } from '../../services/members';
import { COLORS } from '../../constants/colors';

interface MemberStatistics {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  suspendedMembers: number;
  selfMembers: number;
  spouseMembers: number;
  childMembers: number;
}

const MembersPage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [statistics, setStatistics] = useState<MemberStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Bulk upload functionality
  const bulkUpload = useBulkUpload({
    onUpload: async (data) => {
      try {
        // Process bulk upload - in real implementation, you'd call a bulk API endpoint
        console.log('Bulk uploading members:', data);
        
        // For now, simulate individual API calls
        const results = await Promise.allSettled(
          data.map(member => {
            // Map the bulk upload data to MemberFormData
            const memberFormData: any = {
              company: member.company || '',
              scheme: member.scheme || '',
              name: member.name || '',
              gender: member.gender || 'MALE',
              relationship: member.relationship || 'SELF',
              card_number: member.card_number || '',
              national_id: member.national_id || '',
              date_of_birth: member.date_of_birth || '',
              address: member.address || '',
              phone_number: member.phone_number || '',
              email: member.email || '',
              parent: member.parent || undefined
            };
            return membersApi.createMember(memberFormData);
          })
        );
        
        const errors = results
          .map((result, index) => {
            if (result.status === 'rejected') {
              return {
                row: index + 1,
                field: 'general',
                message: result.reason?.message || 'Upload failed'
              };
            }
            return null;
          })
          .filter((error): error is { row: number; field: string; message: string } => error !== null);
        
        return {
          success: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined
        };
      } catch (error) {
        console.error('Bulk upload error:', error);
        return { success: false, errors: [] };
      }
    },
    onSuccess: () => {
      console.log('Bulk upload successful');
      loadStatistics();
      setRefreshTrigger(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Bulk upload error:', error);
    }
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      // Mock statistics - in real app, you'd fetch from API
      setStatistics({
        totalMembers: 1250,
        activeMembers: 1180,
        inactiveMembers: 45,
        suspendedMembers: 25,
        selfMembers: 420,
        spouseMembers: 380,
        childMembers: 450
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setIsDetailsOpen(true);
  };

  const handleMemberEdit = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleMemberDelete = (member: Member) => {
    console.log('Member deleted:', member);
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingMember(null);
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedMember(null);
  };

  const refreshData = () => {
    loadStatistics();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: COLORS.background.primary }}>
      {/* Tabs with Actions */}
      <div className="border-b" style={{ backgroundColor: COLORS.background.secondary, borderColor: COLORS.border.primary }}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors border-b-2`}
                style={{
                  borderBottomColor: COLORS.text.tertiary,
                  color: COLORS.text.secondary
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Members</span>
                  {statistics && (
                    <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: COLORS.background.quaternary, color: COLORS.text.tertiary }}>
                      {statistics.totalMembers}
                    </span>
                  )}
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Tooltip content="Refresh">
                <button 
                  className="p-2 rounded-lg transition-colors" 
                  style={{ color: COLORS.text.tertiary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.text.primary;
                    e.currentTarget.style.backgroundColor = COLORS.background.quaternary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.text.tertiary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={refreshData}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content="Export">
                <button 
                  className="p-2 rounded-lg transition-colors" 
                  style={{ color: COLORS.text.tertiary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.text.primary;
                    e.currentTarget.style.backgroundColor = COLORS.background.quaternary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.text.tertiary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Download className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content="Bulk Upload Members">
                <button
                  onClick={bulkUpload.openModal}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: COLORS.text.tertiary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.text.primary;
                    e.currentTarget.style.backgroundColor = COLORS.background.quaternary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.text.tertiary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Upload className="w-4 h-4" />
                </button>
              </Tooltip>

              <Tooltip content="Add Member">
                <button
                  onClick={handleAddMember}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: COLORS.background.quaternary, color: COLORS.text.primary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.background.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.background.quaternary;
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <MembersList
          onMemberSelect={handleMemberSelect}
          onMemberEdit={handleMemberEdit}
          onMemberDelete={handleMemberDelete}
          refreshTrigger={refreshTrigger}
        />
      </div>

            {/* Modals - Placeholder for future forms and details */}
            {isFormOpen && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xs"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                onClick={handleFormClose}
              >
                <div 
                  className="p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl border"
                  style={{ 
                    backgroundColor: COLORS.background.tertiary,
                    borderColor: COLORS.border.secondary
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 
                    className="text-lg font-semibold mb-4"
                    style={{ color: COLORS.text.primary }}
                  >
                    {editingMember ? 'Edit Member' : 'Add Member'}
                  </h3>
                  <p 
                    className="mb-4"
                    style={{ color: COLORS.text.tertiary }}
                  >
                    Member form will be implemented here
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleFormClose}
                      className="px-4 py-2 rounded transition-colors"
                      style={{ 
                        backgroundColor: COLORS.background.quaternary, 
                        color: COLORS.text.primary 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.background.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.background.quaternary;
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFormSave}
                      className="px-4 py-2 rounded transition-colors"
                      style={{ 
                        backgroundColor: COLORS.action.primary, 
                        color: COLORS.text.primary 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.action.primary;
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isDetailsOpen && selectedMember && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xs"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                onClick={handleDetailsClose}
              >
                <div 
                  className="p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl border"
                  style={{ 
                    backgroundColor: COLORS.background.tertiary,
                    borderColor: COLORS.border.secondary
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 
                    className="text-lg font-semibold mb-4"
                    style={{ color: COLORS.text.primary }}
                  >
                    Member Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span style={{ color: COLORS.text.tertiary }}>Name:</span> {selectedMember.name}</p>
                    <p><span style={{ color: COLORS.text.tertiary }}>Card Number:</span> {selectedMember.card_number}</p>
                    <p><span style={{ color: COLORS.text.tertiary }}>Gender:</span> {selectedMember.gender}</p>
                    <p><span style={{ color: COLORS.text.tertiary }}>Relationship:</span> {selectedMember.relationship}</p>
                    <p><span style={{ color: COLORS.text.tertiary }}>Status:</span> {selectedMember.status}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleDetailsClose}
                      className="px-4 py-2 rounded transition-colors"
                      style={{ 
                        backgroundColor: COLORS.background.quaternary, 
                        color: COLORS.text.primary 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.background.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.background.quaternary;
                      }}
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleMemberEdit(selectedMember)}
                      className="px-4 py-2 rounded transition-colors"
                      style={{ 
                        backgroundColor: COLORS.action.primary, 
                        color: COLORS.text.primary 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.action.primary;
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUpload.isModalOpen}
        onClose={bulkUpload.closeModal}
        onUpload={bulkUpload.handleUpload}
        {...MEMBER_BULK_UPLOAD_CONFIG}
      />
    </div>
  );
};

export default MembersPage;
