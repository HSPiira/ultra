import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { membersApi } from '../../services/members';
import { companiesApi } from '../../services/companies';
import { schemesApi } from '../../services/schemes';
import type { Member, MemberFormData } from '../../types/members';
import type { Company } from '../../types/companies';
import type { Scheme } from '../../types/schemes';
import { Tooltip } from '../../components/common';

interface MemberFormProps {
  member?: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({
  member,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<MemberFormData>({
    company: '',
    scheme: '',
    name: '',
    national_id: '',
    gender: 'MALE',
    relationship: 'SELF',
    parent: undefined,
    date_of_birth: '',
    card_number: '',
    address: '',
    phone_number: '',
    email: ''
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [parentMembers, setParentMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);
  const [loadingCardNumber, setLoadingCardNumber] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
      if (member) {
        setFormData({
          company: member.company,
          scheme: member.scheme,
          name: member.name,
          national_id: member.national_id || '',
          gender: member.gender,
          relationship: member.relationship,
          parent: member.parent,
          date_of_birth: member.date_of_birth || '',
          card_number: member.card_number,
          address: member.address || '',
          phone_number: member.phone_number || '',
          email: member.email || ''
        });
        // Load schemes and parents based on member's company
        if (member.company) {
          loadSchemes(member.company);
          if (member.relationship !== 'SELF') {
            loadParentMembers(member.company);
          }
        }
      } else {
        setFormData({
          company: '',
          scheme: '',
          name: '',
          national_id: '',
          gender: 'MALE',
          relationship: 'SELF',
          parent: undefined,
          date_of_birth: '',
          card_number: '',
          address: '',
          phone_number: '',
          email: ''
        });
        setSchemes([]);
        setParentMembers([]);
      }
      setErrors({});
    }
  }, [isOpen, member]);

  // Load schemes when company changes
  useEffect(() => {
    if (formData.company) {
      loadSchemes(formData.company);
      // Reset scheme when company changes
      if (!member || member.company !== formData.company) {
        setFormData(prev => ({ ...prev, scheme: '' }));
      }
    } else {
      setSchemes([]);
    }
  }, [formData.company]);

  // Load parent members when company or relationship changes
  useEffect(() => {
    if (formData.company && (formData.relationship === 'SPOUSE' || formData.relationship === 'CHILD')) {
      loadParentMembers(formData.company);
    } else {
      setParentMembers([]);
      // Clear parent if relationship is SELF
      if (formData.relationship === 'SELF') {
        setFormData(prev => ({ ...prev, parent: undefined }));
      }
    }
  }, [formData.company, formData.relationship]);

  // Fetch next card number when scheme, relationship, or parent changes
  useEffect(() => {
    const fetchNextCardNumber = async () => {
      if (!member && formData.scheme && formData.relationship) {
        // For dependants, we need a parent selected
        if (formData.relationship !== 'SELF' && !formData.parent) {
          setFormData(prev => ({ ...prev, card_number: '' }));
          setLoadingCardNumber(false);
          return;
        }

        setLoadingCardNumber(true);
        try {
          const nextCard = await membersApi.getNextCardNumber(
            formData.scheme,
            formData.relationship,
            formData.parent
          );
          setFormData(prev => ({ ...prev, card_number: nextCard }));
        } catch (error) {
          console.error('Error fetching next card number:', error);
          setFormData(prev => ({ ...prev, card_number: '' }));
        } finally {
          setLoadingCardNumber(false);
        }
      } else if (!member && !formData.scheme) {
        // Clear card number if scheme is deselected
        setFormData(prev => ({ ...prev, card_number: '' }));
        setLoadingCardNumber(false);
      }
    };

    fetchNextCardNumber();
  }, [formData.scheme, formData.relationship, formData.parent, member]);

  const loadCompanies = async () => {
    try {
      // Only load active companies for form dropdowns
      const data = await companiesApi.getCompanies({ status: 'ACTIVE' });
      setCompanies(data);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const loadSchemes = async (companyId: string) => {
    try {
      setLoadingSchemes(true);
      const data = await schemesApi.getSchemes({ company: companyId, status: 'ACTIVE' });
      setSchemes(data);
    } catch (err) {
      console.error('Error loading schemes:', err);
      setSchemes([]);
    } finally {
      setLoadingSchemes(false);
    }
  };

  const loadParentMembers = async (companyId: string) => {
    try {
      setLoadingParents(true);
      // Get members with relationship=SELF for the selected company
      const response = await membersApi.getMembersByCompany(companyId);
      const selfMembers = response.results.filter(m => m.relationship === 'SELF' && m.id !== member?.id);
      setParentMembers(selfMembers);
    } catch (err) {
      console.error('Error loading parent members:', err);
      setParentMembers([]);
    } finally {
      setLoadingParents(false);
    }
  };

  const handleInputChange = (field: keyof MemberFormData, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company) {
      newErrors.company = 'Company is required';
    }

    if (!formData.scheme) {
      newErrors.scheme = 'Scheme is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Card number is optional - will be auto-generated if not provided

    if (formData.relationship !== 'SELF' && !formData.parent) {
      newErrors.parent = 'Parent member is required for dependants';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone_number && formData.phone_number.trim()) {
      const cleanPhone = formData.phone_number.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        newErrors.phone_number = 'Phone number must be at least 10 digits';
      }
    }

    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let savedMember: Member;
      
      // Prepare form data, removing empty optional fields
      const submitData = {
        company: formData.company,
        scheme: formData.scheme,
        name: formData.name.trim(),
        gender: formData.gender,
        relationship: formData.relationship,
        // Don't include card_number - it will be auto-generated by backend
        // The displayed card number is just for preview
        ...(formData.national_id && { national_id: formData.national_id.trim() }),
        ...(formData.date_of_birth && { date_of_birth: formData.date_of_birth }),
        ...(formData.address && { address: formData.address.trim() }),
        ...(formData.phone_number && { phone_number: formData.phone_number.trim() }),
        ...(formData.email && { email: formData.email.trim() }),
        ...(formData.parent && formData.relationship !== 'SELF' && { parent: formData.parent })
      };
      
      if (member) {
        // Update existing member
        savedMember = await membersApi.updateMember(member.id, submitData);
      } else {
        // Create new member
        savedMember = await membersApi.createMember(submitData);
      }
      
      onSave(savedMember);
      onClose();
    } catch (err: any) {
      console.error('Error saving member:', err);
      // Handle API validation errors
      if (err.response?.data) {
        const apiErrors = err.response.data;
        const fieldErrors: Record<string, string> = {};
        
        Object.keys(apiErrors).forEach(field => {
          if (Array.isArray(apiErrors[field])) {
            fieldErrors[field] = apiErrors[field][0];
          } else {
            fieldErrors[field] = apiErrors[field];
          }
        });
        
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-xs"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    >
      <div className="rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" style={{ backgroundColor: '#2a2a2a' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
              <User className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {member ? 'Edit Member' : 'Add New Member'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {member ? 'Update member information' : 'Create a new member profile'}
              </p>
            </div>
          </div>
          <Tooltip content="Close form">
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#9ca3af' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#404040';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Company *
                  </label>
                  <select
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      errors.company ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: errors.company ? '#ef4444' : '#404040'
                    }}
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-400">{errors.company}</p>
                  )}
                </div>

                {/* Scheme */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Scheme *
                  </label>
                  <select
                    value={formData.scheme}
                    onChange={(e) => handleInputChange('scheme', e.target.value)}
                    disabled={!formData.company || loadingSchemes}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      errors.scheme ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: !formData.company ? '#2a2a2a' : '#1f1f1f',
                      color: !formData.company ? '#6b7280' : '#ffffff',
                      borderColor: errors.scheme ? '#ef4444' : '#404040',
                      cursor: !formData.company ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">
                      {loadingSchemes ? 'Loading schemes...' : formData.company ? 'Select a scheme' : 'Select company first'}
                    </option>
                    {schemes.map((scheme) => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.scheme_name}
                      </option>
                    ))}
                  </select>
                  {errors.scheme && (
                    <p className="mt-1 text-sm text-red-400">{errors.scheme}</p>
                  )}
                </div>

                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: errors.name ? '#ef4444' : '#404040'
                    }}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value as 'MALE' | 'FEMALE')}
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: '#404040'
                    }}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Relationship *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => handleInputChange('relationship', e.target.value as 'SELF' | 'SPOUSE' | 'CHILD')}
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: '#404040'
                    }}
                  >
                    <option value="SELF">Self (Principal)</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="CHILD">Child</option>
                  </select>
                </div>

                {/* Parent Member (shown only for SPOUSE/CHILD) */}
                {(formData.relationship === 'SPOUSE' || formData.relationship === 'CHILD') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                      Parent Member (Principal) *
                    </label>
                    <select
                      value={formData.parent || ''}
                      onChange={(e) => handleInputChange('parent', e.target.value || undefined)}
                      disabled={!formData.company || loadingParents}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                        errors.parent ? 'border-red-500' : ''
                      }`}
                      style={{
                        backgroundColor: !formData.company ? '#2a2a2a' : '#1f1f1f',
                        color: !formData.company ? '#6b7280' : '#ffffff',
                        borderColor: errors.parent ? '#ef4444' : '#404040',
                        cursor: !formData.company ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="">
                        {loadingParents ? 'Loading members...' : formData.company ? 'Select parent member' : 'Select company first'}
                      </option>
                      {parentMembers.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name} ({parent.card_number})
                        </option>
                      ))}
                    </select>
                    {errors.parent && (
                      <p className="mt-1 text-sm text-red-400">{errors.parent}</p>
                    )}
                  </div>
                )}

                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={loadingCardNumber ? 'Loading...' : (formData.card_number || '')}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#2a2a2a',
                      color: loadingCardNumber ? '#9ca3af' : (formData.scheme && formData.card_number ? '#ffffff' : '#6b7280'),
                      borderColor: errors.card_number ? '#ef4444' : '#404040',
                      cursor: 'not-allowed'
                    }}
                    placeholder={formData.scheme ? "Card number will be auto-generated" : "Select a scheme to see card number"}
                  />
                  {errors.card_number && (
                    <p className="mt-1 text-sm text-red-400">{errors.card_number}</p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: '#9ca3af' }}>
                    {loadingCardNumber 
                      ? "Calculating next card number..."
                      : formData.scheme 
                        ? formData.card_number 
                          ? "This is the exact card number that will be assigned (non-editable)"
                          : "Card number will appear once relationship is selected"
                        : "Card number will appear when scheme is selected"
                    }
                  </p>
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    National ID
                  </label>
                  <input
                    type="text"
                    value={formData.national_id}
                    onChange={(e) => handleInputChange('national_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: '#404040'
                    }}
                    placeholder="Enter national ID"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      errors.date_of_birth ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: errors.date_of_birth ? '#ef4444' : '#404040'
                    }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-400">{errors.date_of_birth}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      errors.phone_number ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: errors.phone_number ? '#ef4444' : '#404040'
                    }}
                    placeholder="Enter phone number"
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-400">{errors.phone_number}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: errors.email ? '#ef4444' : '#404040'
                    }}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#1f1f1f',
                      color: '#ffffff',
                      borderColor: '#404040'
                    }}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0" style={{ backgroundColor: '#1f1f1f', borderColor: '#404040' }}>
          <Tooltip content="Cancel and close form">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors border text-sm"
              style={{ 
                backgroundColor: 'transparent',
                color: '#d1d5db',
                borderColor: '#404040'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#404040';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#d1d5db';
              }}
            >
              Cancel
            </button>
          </Tooltip>
          <Tooltip content={member ? 'Update member information' : 'Save new member'}>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm"
              style={{ 
                backgroundColor: '#3b3b3b',
                color: '#ffffff'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#4a4a4a';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#3b3b3b';
                }
              }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Save className="w-3 h-3" />
              )}
              {member ? 'Update' : 'Save'}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

