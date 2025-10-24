import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus,
  RefreshCw,
  Download
} from 'lucide-react';
import type { Member } from '../../types/members';
import { MembersList } from './MembersList';

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
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Tabs with Actions */}
      <div className="border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
        <div className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors border-b-2`}
                style={{
                  borderBottomColor: '#9ca3af',
                  color: '#d1d5db'
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Members</span>
                  {statistics && (
                    <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#3b3b3b', color: '#9ca3af' }}>
                      {statistics.totalMembers}
                    </span>
                  )}
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3">
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
                title="Refresh"
                onClick={refreshData}
              >
                <RefreshCw className="w-5 h-5" />
              </button>

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
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={handleAddMember}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#3b3b3b', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                }}
                title="Add Member"
              >
                <Plus className="w-4 h-4" />
              </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingMember ? 'Edit Member' : 'Add Member'}
            </h3>
            <p className="text-gray-400 mb-4">
              Member form will be implemented here
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleFormClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailsOpen && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Member Details
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">Name:</span> {selectedMember.name}</p>
              <p><span className="text-gray-400">Card Number:</span> {selectedMember.card_number}</p>
              <p><span className="text-gray-400">Gender:</span> {selectedMember.gender}</p>
              <p><span className="text-gray-400">Relationship:</span> {selectedMember.relationship}</p>
              <p><span className="text-gray-400">Status:</span> {selectedMember.status}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDetailsClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => handleMemberEdit(selectedMember)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
